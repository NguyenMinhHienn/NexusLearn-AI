import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';
import { jsonrepair } from 'jsonrepair';
import pool from '../config/db';
import { ResultSetHeader } from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export const geminiAnalyzeDocument = async (documentId: number, documentText: string) => {
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

    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: "Bạn là một trợ lý giáo dục tạo khóa học E-learning. Hãy TÓM TẮT ĐẠI Ý thật ngắn gọn, tuyệt đối không viết dài dòng. Nếu bạn viết quá dài, hệ thống sẽ bị sập. Chỉ tập trung vào những khái niệm cốt lõi nhất.",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
        maxOutputTokens: 8192
      }
    });
    const MAX_TEXT_LENGTH = 500000;
    const truncatedText = documentText.length > MAX_TEXT_LENGTH
      ? documentText.substring(0, MAX_TEXT_LENGTH) + '...'
      : documentText;

    const prompt = `
Bạn là một chuyên gia giáo dục thiết kế lộ trình học tập từ tài liệu. Dưới đây là nội dung tài liệu.
Nhiệm vụ của bạn là phân tích tài liệu và tạo ra một khóa học E-learning hoàn chỉnh.

Lưu ý quan trọng BẮT BUỘC tuân thủ:
- TÀI LIỆU CÓ THỂ RẤT DÀI, HÃY PHÂN TÍCH TOÀN BỘ NỘI DUNG TỪ ĐẦU ĐẾN CUỐI VÀ KHÔNG ĐƯỢC BỎ SÓT.
- BẮT BUỘC PHẢI CÓ ĐỦ CẢ 3 LEVEL: "basic", "intermediate", "advanced" trong cả bài học và trắc nghiệm.
- TẠO ĐÚNG 2 BÀI HỌC (concepts) cho MỖI LEVEL. Tổng cộng đúng 6 bài học.
- TẠO ĐÚNG 2 CÂU HỎI TRẮC NGHIỆM cho MỖI LEVEL. Tổng cộng đúng 6 câu hỏi. Các câu hỏi phải nâng dần độ khó: Basic (Dễ, cơ bản) -> Intermediate (Trung bình) -> Advanced (Khó, suy luận, mở rộng kiến thức).
- BẮT BUỘC viết 'summary' CHẤT LƯỢNG CAO, khoảng 250-350 từ cho mỗi bài học (để đủ chi tiết như lần trước). BẮT BUỘC sử dụng ký tự xuống dòng (\\n) để phân tách các đoạn văn.
- TRUYỆT ĐỐI KHÔNG SỬ DỤNG DẤU NGOẶC KÉP (") bên trong phần summary (để không làm hỏng cấu trúc JSON). Nếu cần, hãy dùng dấu nháy đơn (') hoặc dấu backtick (\`). TRUYỆT ĐỐI KHÔNG VIẾT QUÁ DÀI. Lấy các ý chính yếu nhất xuyên suốt tài liệu.
- Đảm bảo tạo ra 4-6 mối quan hệ (relationships) giữa các bài học để liên kết kiến thức.

Nội dung tài liệu (Hãy đọc toàn bộ):
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
    await pool.query('UPDATE documents SET status = ? WHERE id = ?', ['analyzed', documentId]);

  } catch (error) {
    console.error('Lỗi khi gọi Gemini AI:', error);
    await pool.query('UPDATE documents SET status = ? WHERE id = ?', ['failed', documentId]);
  }
};
