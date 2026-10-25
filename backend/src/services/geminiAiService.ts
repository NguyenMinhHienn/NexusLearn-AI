import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';
import { jsonrepair } from 'jsonrepair';
import pool from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { addTokenUsage } from './quotaService';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

const DEFAULT_MODEL = 'gemini-2.5-flash';

/**
 * Read the active AI model from system_settings.
 * Cached for 60s so we don't hit the DB on every single AI call.
 */
let _modelCache: { name: string; ts: number } | null = null;
const MODEL_CACHE_TTL = 60_000; // 60 seconds

export async function getActiveModel(): Promise<string> {
  if (_modelCache && Date.now() - _modelCache.ts < MODEL_CACHE_TTL) {
    return _modelCache.name;
  }
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'ai_model'"
    );
    const name = rows[0]?.setting_value || DEFAULT_MODEL;
    _modelCache = { name, ts: Date.now() };
    return name;
  } catch {
    return _modelCache?.name || DEFAULT_MODEL;
  }
}

/** Clear the model cache (called when admin changes the model). */
export function clearModelCache() {
  _modelCache = null;
}

/** Expose the API key status and genAI instance for admin routes. */
export { apiKey, genAI };

export type AiLang = 'vi' | 'en';

/** Normalise an Accept-Language / query value into a supported AI language. */
export const resolveAiLang = (value?: string | string[] | null): AiLang => {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw.toLowerCase().startsWith('en') ? 'en' : 'vi';
};

const langDirective = (lang: AiLang) =>
  lang === 'en'
    ? '\n\nIMPORTANT: Always respond in ENGLISH, regardless of the language of the source material.'
    : '\n\nQUAN TRỌNG: Luôn trả lời bằng TIẾNG VIỆT.';

/**
 * Gemini 2.5 "thinks" before answering by default; those hidden thought tokens are billed
 * and were the bulk of the cost. Our tasks are structured extraction, so thinking is turned off.
 */
const NO_THINKING = { thinkingConfig: { thinkingBudget: 0 } } as any;

/** Max characters of source text sent for analysis (~10k tokens). Longer docs are trimmed to the core. */
export const MAX_ANALYZE_CHARS = 30000;

/** Only the most recent turns are sent as chat history to keep each question cheap. */
export const MAX_HISTORY_TURNS = 10;
const trimHistory = <T extends { role: string }>(history: T[]) => {
  const recent = history.slice(-MAX_HISTORY_TURNS);
  // Gemini requires the history to start with a user turn
  while (recent.length && recent[0].role !== 'user') recent.shift();
  return recent;
};

export const geminiAnalyzeDocument = async (documentId: number, documentText: string, userId: number, lang: AiLang = 'vi') => {
  try {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in .env file');
    }

    const schema: Schema = {
      type: SchemaType.OBJECT,
      properties: {
        concepts: {
          type: SchemaType.ARRAY,
          description: "Mảng chứa đúng 6-9 bài học (mỗi level 2-3 bài)",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING, description: "Tên bài học lớn (gom nhóm kiến thức)" },
              level: { type: SchemaType.STRING, description: "Chỉ được phép là: 'basic', 'intermediate', hoặc 'advanced'" },
              summary: { type: SchemaType.STRING, description: "Nội dung bài học NGẮN GỌN, trình bày bằng Markdown (có tiêu đề, in đậm, gạch đầu dòng, 1 code ví dụ). Khoảng 250-350 từ mỗi bài học. BẮT BUỘC dùng ký tự '\\n' để xuống dòng cho dễ đọc." }
            },
            required: ["name", "level", "summary"]
          }
        },
        relationships: {
          type: SchemaType.ARRAY,
          description: "Mảng chứa 4-6 mối liên hệ giữa các bài học",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              source: { type: SchemaType.STRING },
              target: { type: SchemaType.STRING },
              label: { type: SchemaType.STRING }
            },
            required: ["source", "target", "label"]
          }
        },
        quiz: {
          type: SchemaType.ARRAY,
          description: "Mảng chứa đúng 6-9 câu hỏi trắc nghiệm (mỗi level 2-3 câu). Không bao giờ được để mảng rỗng.",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              level: { type: SchemaType.STRING, description: "Chỉ được phép là: 'basic', 'intermediate', hoặc 'advanced'" },
              question: { type: SchemaType.STRING, description: "Câu hỏi trắc nghiệm" },
              options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Mảng chứa 4 đáp án (A, B, C, D)" },
              correct_answer: { type: SchemaType.INTEGER, description: "Vị trí của đáp án đúng (từ 0 đến 3)" },
              explanation: { type: SchemaType.STRING, description: "Giải thích chi tiết tại sao đáp án đó đúng" }
            },
            required: ["level", "question", "options", "correct_answer", "explanation"]
          }
        }
      },
      required: ["concepts", "relationships", "quiz"]
    };

    const activeModelName = await getActiveModel();

    const model = genAI.getGenerativeModel({
      model: activeModelName,
      systemInstruction: "Bạn là một trợ lý giáo dục tạo khóa học E-learning chuyên nghiệp. Hãy phân tích tài liệu đầu vào một cách thật chi tiết, sâu sắc, và toàn diện. Chia kiến thức thành 3 chặng (Nền tảng, Nâng cao, Chuyên sâu). Mỗi chặng cần có nội dung giảng giải cặn kẽ, ví dụ minh họa rõ ràng để người học dễ hiểu nhất. Đừng tóm tắt quá sơ sài.",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
        maxOutputTokens: 8192,
        ...NO_THINKING
      }
    });
    const truncatedText = documentText.length > MAX_ANALYZE_CHARS
      ? documentText.substring(0, MAX_ANALYZE_CHARS) + '...'
      : documentText;

    const prompt = `
Bạn là một chuyên gia giáo dục thiết kế lộ trình học tập từ tài liệu. Dưới đây là nội dung tài liệu.
Nhiệm vụ của bạn là phân tích tài liệu và tạo ra một khóa học E-learning hoàn chỉnh.

Lưu ý quan trọng BẮT BUỘC tuân thủ:
- TÀI LIỆU CÓ THỂ RẤT DÀI, HÃY CHỌN LỌC KIẾN THỨC CỐT LÕI NHẤT ĐỂ PHÂN TÍCH.
- BẮT BUỘC PHẢI CÓ ĐỦ CẢ 3 LEVEL: "basic", "intermediate", "advanced" trong cả bài học và trắc nghiệm.
- TẠO CHỈ 1-2 BÀI HỌC (concepts) cho MỖI LEVEL. Tổng cộng khoảng 3-5 bài học để tối ưu tốc độ.
- TẠO CHỈ 1-2 CÂU HỎI TRẮC NGHIỆM cho MỖI LEVEL. Tổng cộng khoảng 3-5 câu hỏi. 
- BẮT BUỘC viết 'summary' CHẤT LƯỢNG nhưng RÚT GỌN, khoảng 100-150 từ cho mỗi bài học. Trình bày bằng markdown. BẮT BUỘC sử dụng ký tự xuống dòng (\\n) để phân tách.
- TUYỆT ĐỐI KHÔNG SỬ DỤNG DẤU NGOẶC KÉP (") bên trong phần summary và quiz (để không làm hỏng cấu trúc JSON). Nếu cần, hãy dùng dấu nháy đơn (') hoặc dấu backtick (\`).
- Đảm bảo tạo ra 3-5 mối quan hệ (relationships).
${lang === 'en' ? '- WRITE ALL OUTPUT (lesson names, summaries, relationship labels, quiz questions, options and explanations) IN ENGLISH.' : '- Viết toàn bộ nội dung đầu ra bằng tiếng Việt.'}

Nội dung tài liệu:
${truncatedText}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let data;
    try {
      text = text.replace(/\\u[0-9a-fA-F]{0,3}$/, '');
      text = text.replace(/\\$/, '');

      const repaired = jsonrepair(text);
      data = JSON.parse(repaired);

      if (data.concepts && Array.isArray(data.concepts)) {
        data.concepts.forEach((c: any) => {
          if (c.summary) c.summary = c.summary.replace(/\\n/g, '\n');
        });
      }
      if (data.quiz && Array.isArray(data.quiz)) {
        data.quiz.forEach((q: any) => {
          if (q.question) q.question = q.question.replace(/\\n/g, '\n');
          if (q.explanation) q.explanation = q.explanation.replace(/\\n/g, '\n');
        });
      }
    } catch (parseError) {
      console.error('Actual jsonrepair/parse error:', parseError);
      console.error('Lỗi parse JSON. Raw text:', text.substring(0, 500) + '...');
      throw new Error('Dữ liệu AI trả về không phải là JSON hợp lệ và không thể tự động sửa.');
    }

    const conceptNameToId: Record<string, number> = {};
    if (data.concepts && Array.isArray(data.concepts)) {
      for (const concept of data.concepts) {
        const validLevels = ['basic', 'intermediate', 'advanced'];
        const level = validLevels.includes(concept.level) ? concept.level : 'basic';

        const [res] = await pool.query<ResultSetHeader>(
          'INSERT INTO concepts (document_id, name, level, summary) VALUES (?, ?, ?, ?)',
          [documentId, concept.name || 'Khái niệm', level, concept.summary || '']
        );
        conceptNameToId[concept.name] = res.insertId;
      }
    }
    if (data.relationships && Array.isArray(data.relationships)) {
      for (const rel of data.relationships) {
        const sourceId = conceptNameToId[rel.source];
        const targetId = conceptNameToId[rel.target];

        if (sourceId && targetId) {
          await pool.query(
            'INSERT INTO concept_relationships (source_concept_id, target_concept_id, label) VALUES (?, ?, ?)',
            [sourceId, targetId, rel.label || 'liên quan']
          );
        }
      }
    }
    if (data.quiz && Array.isArray(data.quiz)) {
      const validLevels = ['basic', 'intermediate', 'advanced'];
      for (const q of data.quiz) {
        const correctIndex = Number.isInteger(q.correct_answer) ? q.correct_answer : 0;
        const optionsStr = JSON.stringify(q.options || []);
        const level = validLevels.includes(q.level) ? q.level : 'basic';

        await pool.query(
          'INSERT INTO quiz_questions (document_id, question, options, correct_answer, explanation, level) VALUES (?, ?, ?, ?, ?, ?)',
          [documentId, q.question || 'Câu hỏi', optionsStr, correctIndex, q.explanation || '', level]
        );
      }
    }
    
    // Deduct actual tokens used
    const tokensUsed = response.usageMetadata?.totalTokenCount || 1500;
    await addTokenUsage(userId, tokensUsed);
    
    await pool.query('UPDATE documents SET status = ? WHERE id = ?', ['analyzed', documentId]);

  } catch (error) {
    console.error('Lỗi khi gọi Gemini AI:', error);
    await pool.query('UPDATE documents SET status = ? WHERE id = ?', ['failed', documentId]);
  }
};

export const geminiChatWithDocument = async (documentContext: string, userMessage: string, chatHistory: { role: string, text: string }[] = [], lang: AiLang = 'vi') => {
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
  
  const activeModelName = await getActiveModel();
  
  const model = genAI.getGenerativeModel({
    model: activeModelName,
    systemInstruction: `Bạn là Gia Sư Ảo AI (Virtual Tutor) chuyên nghiệp của ứng dụng NexusLearn.
Nhiệm vụ của bạn:
1. Giải đáp thắc mắc của học sinh chủ yếu dựa trên TÀI LIỆU được cung cấp bên dưới.
2. Trả lời thân thiện, dễ hiểu, cặn kẽ bằng ví dụ thực tế.
3. BẮT BUỘC SỬ DỤNG Markdown và emoji để bài giảng sinh động.
4. YÊU CẦU ĐẶC BIỆT: Phải luôn giữ thái độ cực kỳ lịch sự và chuẩn mực của một người thầy/cô giáo. Dù học sinh có nói tục, chửi thề, trêu chọc hay hỏi những câu không liên quan, bạn BẮT BUỘC phải giữ thái độ điềm tĩnh, lịch sự từ chối trả lời những nội dung độc hại đó, và khéo léo hướng học sinh quay lại bài học. Tuyệt đối không bao giờ được tức giận hay hùa theo.${langDirective(lang)}`,
    generationConfig: NO_THINKING,
  });

  const history = trimHistory(chatHistory).map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  const chat = model.startChat({ history });

  const prompt = `--- BỐI CẢNH TÀI LIỆU (Chỉ dùng để tham khảo trả lời) ---\n${documentContext}\n\n--- CÂU HỎI CỦA HỌC SINH ---\n${userMessage}`;
  const result = await chat.sendMessage(prompt);
  const response = await result.response;
  const tokensUsed = response.usageMetadata?.totalTokenCount || 50;
  return { text: response.text(), tokensUsed };
};

export const geminiGenerateFlashcards = async (documentContext: string, lang: AiLang = 'vi') => {
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
  
  const schema: Schema = {
    type: SchemaType.ARRAY,
    description: "Mảng chứa 10-15 thẻ ghi nhớ (flashcards)",
    items: {
      type: SchemaType.OBJECT,
      properties: {
        term: { type: SchemaType.STRING, description: "Thuật ngữ, khái niệm ngắn gọn" },
        definition: { type: SchemaType.STRING, description: "Định nghĩa hoặc giải thích dễ hiểu, khoảng 1-2 câu" }
      },
      required: ["term", "definition"]
    }
  };

  const activeModelName = await getActiveModel();

  const model = genAI.getGenerativeModel({
    model: activeModelName,
    systemInstruction: "Bạn là chuyên gia giáo dục. Nhiệm vụ của bạn là đọc toàn bộ nội dung tài liệu và trích xuất ra 10-15 THUẬT NGỮ (hoặc khái niệm cốt lõi) quan trọng nhất kèm theo ĐỊNH NGHĨA ngắn gọn, dễ hiểu để làm bộ thẻ ghi nhớ (Flashcards). Trả về mảng JSON chuẩn." + langDirective(lang),
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
      ...NO_THINKING
    }
  });

  const result = await model.generateContent(`Trích xuất flashcards từ tài liệu sau:\n\n${documentContext}`);
  const response = await result.response;
  let text = response.text();
  const tokensUsed = response.usageMetadata?.totalTokenCount || 200;
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  try {
    return { data: JSON.parse(jsonrepair(text)), tokensUsed };
  } catch (error) {
    console.error('Error parsing flashcards JSON:', error);
    return { data: [], tokensUsed };
  }
};

export const geminiGlobalChat = async (message: string, history: { role: 'user' | 'model', text: string }[], lang: AiLang = 'vi') => {
  try {
    const activeModelName = await getActiveModel();
    const model = genAI.getGenerativeModel({ 
      model: activeModelName,
      systemInstruction: `Bạn là Trợ lý ảo AI của NexusLearn - một nền tảng E-learning tiên tiến.
Hãy hỗ trợ người dùng một cách chuyên nghiệp, ngắn gọn và lịch sự.${langDirective(lang)}`,
      generationConfig: NO_THINKING,
    });

    const chatSession = model.startChat({
      history: trimHistory(history).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }))
    });

    const result = await chatSession.sendMessage([{ text: message }]);
    const response = await result.response;
    return { text: response.text() };
  } catch (error) {
    console.error('Lỗi khi gọi Gemini Global Chat:', error);
    throw error;
  }
};

export const geminiReviewChat = async (
  message: string, 
  history: { role: 'user' | 'model', text: string }[], 
  documentContexts: { title: string, content: string }[],
  lang: AiLang = 'vi'
) => {
  try {
    const contextBlock = documentContexts.map(d => 
      `=== TÀI LIỆU: "${d.title}" ===\n${d.content}`
    ).join('\n\n');

    const activeModelName = await getActiveModel();
    const model = genAI.getGenerativeModel({ 
      model: activeModelName,
      systemInstruction: `Bạn là Gia Sư Ôn Tập Thông Minh (Smart Review Tutor) của NexusLearn.

NGUYÊN TẮC BẮT BUỘC:
1. Bạn CHỈ ĐƯỢC trả lời dựa trên nội dung các TÀI LIỆU bên dưới. KHÔNG ĐƯỢC bịa thêm kiến thức ngoài.
2. Nếu câu hỏi KHÔNG liên quan đến nội dung tài liệu, hãy lịch sự từ chối và gợi ý người dùng hỏi về nội dung trong tài liệu.
3. Khi trả lời, hãy TRÍCH DẪN hoặc tham chiếu đến phần nào trong tài liệu để tăng độ tin cậy.
4. Sử dụng Markdown và emoji cho câu trả lời sinh động.
5. ${lang === 'en' ? 'Respond in English unless the user explicitly asks otherwise.' : 'Trả lời bằng tiếng Việt trừ khi người dùng yêu cầu khác.'}
6. Luôn giữ thái độ lịch sự, chuẩn mực của một người thầy/cô giáo.

--- NỘI DUNG TÀI LIỆU ---
${contextBlock}
--- HẾT NỘI DUNG TÀI LIỆU ---`,
      generationConfig: NO_THINKING,
    });

    const chatSession = model.startChat({
      history: trimHistory(history).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }))
    });

    const result = await chatSession.sendMessage([{ text: message }]);
    const response = await result.response;
    const tokensUsed = response.usageMetadata?.totalTokenCount || 50;
    return { text: response.text(), tokensUsed };
  } catch (error) {
    console.error('Lỗi khi gọi Gemini Review Chat:', error);
    throw error;
  }
};

