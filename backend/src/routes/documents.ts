import { Router, Response } from 'express';
import pool from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import multer from 'multer';
// @ts-ignore
import pdfParse from 'pdf-parse';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import {
  geminiAnalyzeDocument,
  geminiChatWithDocument,
  geminiGenerateFlashcards,
  geminiReviewChat,
  resolveAiLang,
  MAX_ANALYZE_CHARS,
  MAX_HISTORY_TURNS,
} from '../services/geminiAiService';
import { YoutubeTranscript } from 'youtube-transcript';
import {
  syncUserQuota,
  addTokenUsage,
  checkQuota,
  estimateTextTokens,
  OUTPUT_RESERVE,
  PROMPT_OVERHEAD,
  QuotaCheck,
} from '../services/quotaService';
import { logActivity } from '../services/schemaService';

const router = Router();
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_FILE_SIZE } });

const TEXT_EXTENSIONS = ['.txt', '.md', '.markdown', '.csv', '.json'];
const QUOTA_MESSAGE = 'Bạn không đủ token AI cho thao tác này. Hạn mức sẽ tự làm mới vào 0h, hoặc nâng cấp gói để dùng tiếp.';

/** Blocks the action and tells the client how much it needed vs. what is left. */
const quotaExceeded = (res: Response, check: QuotaCheck, action: 'analyze' | 'chat' | 'flashcards') =>
  res.status(403).json({
    message: QUOTA_MESSAGE,
    quota_exceeded: true,
    code: 'QUOTA_EXCEEDED',
    action,
    estimated: check.estimated,
    remaining: check.remaining,
  });

/** Estimated cost of a chat turn: context + recent history + question + answer. */
const estimateChatCost = (context: string, history: { text?: string }[] = [], message = '') =>
  PROMPT_OVERHEAD +
  estimateTextTokens(context) +
  estimateTextTokens((history || []).slice(-MAX_HISTORY_TURNS).map(h => h?.text || '').join(' ')) +
  estimateTextTokens(message) +
  OUTPUT_RESERVE.chat;

/** Returns latest usage so the client can update the token bar instantly. */
async function usagePayload(userId: number) {
  const user = await syncUserQuota(userId);
  return user
    ? { tokens_used: user.tokens_used, token_quota: user.token_quota, next_quota_reset: user.next_quota_reset }
    : undefined;
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------
router.post('/upload', authenticateToken, (req: AuthRequest, res: Response, next) => {
  upload.single('file')(req, res, (err: any) => {
    if (err?.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File vượt quá 10MB. Vui lòng chọn file nhỏ hơn.', code: 'FILE_TOO_LARGE' });
    }
    if (err) return res.status(400).json({ message: 'Không thể đọc file tải lên.' });
    next();
  });
}, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await syncUserQuota(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Cheap early exit when the user clearly cannot afford even a tiny document
    const minCheck = checkQuota(user, PROMPT_OVERHEAD + OUTPUT_RESERVE.analyze);
    if (!minCheck.ok) return quotaExceeded(res, minCheck, 'analyze');

    const { title, textContent, youtubeUrl } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập tên tài liệu.' });
    }

    let extractedText = textContent || '';
    let originalFilename = 'Pasted Text';

    if (youtubeUrl) {
      originalFilename = 'YouTube Video';
      try {
        const transcript = await YoutubeTranscript.fetchTranscript(youtubeUrl);
        extractedText = transcript.map(t => t.text).join(' ');
      } catch (err) {
        return res.status(400).json({ message: 'Không thể lấy phụ đề từ video này. Hãy đảm bảo video có phụ đề (CC).', code: 'YOUTUBE_NO_TRANSCRIPT' });
      }
    } else if (req.file) {
      originalFilename = req.file.originalname;
      const lowerName = originalFilename.toLowerCase();

      if (req.file.mimetype === 'application/pdf' || lowerName.endsWith('.pdf')) {
        try {
          const data = await pdfParse(req.file.buffer);
          extractedText = data.text;
        } catch (pdfError) {
          console.error('Lỗi khi parse PDF:', pdfError);
          return res.status(400).json({ message: 'Không thể đọc file PDF này. File có thể bị hỏng, mã hóa, hoặc không đúng định dạng chuẩn.', code: 'PDF_INVALID' });
        }
      } else if (req.file.mimetype.startsWith('text/') || TEXT_EXTENSIONS.some(ext => lowerName.endsWith(ext))) {
        extractedText = req.file.buffer.toString('utf-8');
      } else {
        return res.status(400).json({ message: 'Định dạng chưa được hỗ trợ. Vui lòng dùng PDF, TXT hoặc MD.', code: 'UNSUPPORTED_FORMAT' });
      }
    }

    if (!extractedText || !extractedText.trim()) {
      return res.status(400).json({ message: 'Không tìm thấy chữ nào trong tài liệu. Nếu đây là file PDF dạng ảnh quét (scanned image), hệ thống hiện chưa hỗ trợ nhận diện (OCR) cho định dạng này.', code: 'EMPTY_TEXT' });
    }

    // Real cost check now that we know the document size (only the first MAX_ANALYZE_CHARS are sent)
    const sentChars = Math.min(extractedText.length, MAX_ANALYZE_CHARS);
    const analyzeCheck = checkQuota(
      user,
      PROMPT_OVERHEAD + estimateTextTokens(extractedText.slice(0, sentChars)) + OUTPUT_RESERVE.analyze
    );
    if (!analyzeCheck.ok) return quotaExceeded(res, analyzeCheck, 'analyze');

    const [docResult] = await pool.query<ResultSetHeader>(
      'INSERT INTO documents (user_id, title, original_filename, status) VALUES (?, ?, ?, ?)',
      [userId, String(title).trim(), originalFilename, 'processing']
    );
    const documentId = docResult.insertId;
    logActivity(userId, 'upload', documentId);

    // Background analysis; real token usage is deducted inside when it finishes
    const lang = resolveAiLang(req.headers['accept-language']);
    geminiAnalyzeDocument(documentId, extractedText, userId, lang).catch(console.error);

    res.status(202).json({
      message: 'Tài liệu đang được phân tích',
      documentId,
      estimated: analyzeCheck.estimated,
      truncated: extractedText.length > MAX_ANALYZE_CHARS,
    });
  } catch (error) {
    console.error('Lỗi upload:', error);
    res.status(500).json({ message: 'Lỗi server khi upload' });
  }
});

// ---------------------------------------------------------------------------
// List documents
// ---------------------------------------------------------------------------
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const [documents] = await pool.query<RowDataPacket[]>(
      `SELECT d.*, 
        (SELECT COUNT(*) FROM concepts c WHERE c.document_id = d.id) as concepts_count,
        (SELECT COUNT(*) FROM quiz_questions q WHERE q.document_id = d.id) as quiz_count,
        (SELECT COUNT(*) FROM user_level_progress p WHERE p.document_id = d.id AND p.user_id = d.user_id AND p.is_completed = 1) as completed_levels,
        (SELECT MAX(a.created_at) FROM user_activity a WHERE a.document_id = d.id AND a.user_id = d.user_id) as last_activity_at
       FROM documents d WHERE user_id = ? ORDER BY COALESCE(last_activity_at, d.created_at) DESC, d.created_at DESC`,
      [userId]
    );
    res.json(documents);
  } catch (error) {
    console.error('List documents error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// ---------------------------------------------------------------------------
// Dashboard stats (all real data, no random filler)
// ---------------------------------------------------------------------------
router.get('/stats/summary', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const [[docsRow]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(id) as total_docs, SUM(status = 'analyzed') as analyzed_docs FROM documents WHERE user_id = ?`,
      [userId]
    );
    const totalDocs = Number(docsRow.total_docs) || 0;
    const analyzedDocs = Number(docsRow.analyzed_docs) || 0;

    const [[conceptsRow]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(c.id) as total FROM concepts c JOIN documents d ON c.document_id = d.id WHERE d.user_id = ?`,
      [userId]
    );
    const [[quizRow]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(q.id) as total FROM quiz_questions q JOIN documents d ON q.document_id = d.id WHERE d.user_id = ?`,
      [userId]
    );

    const [levelRows] = await pool.query<RowDataPacket[]>(
      `SELECT p.level, COUNT(*) as count FROM user_level_progress p JOIN documents d ON p.document_id = d.id
       WHERE d.user_id = ? AND p.is_completed = 1 GROUP BY p.level`,
      [userId]
    );
    const levelCounts: Record<string, number> = { basic: 0, intermediate: 0, advanced: 0 };
    levelRows.forEach(r => { levelCounts[r.level] = Number(r.count) || 0; });
    const completedLevels = levelCounts.basic + levelCounts.intermediate + levelCounts.advanced;

    // Daily activity for the last 84 days (12 weeks): explicit activity + uploads from before tracking existed
    const [dailyRows] = await pool.query<RowDataPacket[]>(
      `SELECT day, SUM(cnt) as count FROM (
         SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as day, COUNT(*) as cnt
           FROM user_activity WHERE user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 83 DAY)
           GROUP BY day
         UNION ALL
         SELECT DATE_FORMAT(d.created_at, '%Y-%m-%d') as day, COUNT(*) as cnt
           FROM documents d
           WHERE d.user_id = ? AND d.created_at >= DATE_SUB(CURDATE(), INTERVAL 83 DAY)
             AND NOT EXISTS (SELECT 1 FROM user_activity a WHERE a.document_id = d.id AND a.activity_type = 'upload')
           GROUP BY day
       ) t GROUP BY day`,
      [userId, userId]
    );
    const [[todayRow]] = await pool.query<RowDataPacket[]>(`SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') as today`);
    const today: string = todayRow.today;

    const dailyMap: Record<string, number> = {};
    dailyRows.forEach(r => { dailyMap[r.day] = Number(r.count) || 0; });

    const addDays = (iso: string, delta: number) => {
      const [y, m, d] = iso.split('-').map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d + delta));
      return dt.toISOString().slice(0, 10);
    };

    const heatmap = Array.from({ length: 84 }, (_, i) => {
      const date = addDays(today, i - 83);
      return { date, count: dailyMap[date] || 0 };
    });
    const activityData = heatmap.slice(-7);
    const weekActivity = activityData.reduce((sum, d) => sum + d.count, 0);

    // Streak: consecutive active days ending today (or yesterday if nothing yet today)
    let streak = 0;
    let cursor = dailyMap[today] ? today : addDays(today, -1);
    while (dailyMap[cursor]) {
      streak++;
      cursor = addDays(cursor, -1);
    }

    // Quiz accuracy from recorded attempts
    const [[quizAcc]] = await pool.query<RowDataPacket[]>(
      `SELECT SUM(score) as correct, SUM(total) as total FROM user_activity WHERE user_id = ? AND activity_type = 'quiz' AND total > 0`,
      [userId]
    );
    const quizAccuracy = Number(quizAcc.total) > 0 ? Math.round((Number(quizAcc.correct) / Number(quizAcc.total)) * 100) : 0;

    const activeDays14 = heatmap.slice(-14).filter(d => d.count > 0).length;
    const pct = (n: number) => (analyzedDocs > 0 ? Math.min(100, Math.round((n / analyzedDocs) * 100)) : 0);

    const skills = [
      { key: 'basic', value: pct(levelCounts.basic) },
      { key: 'intermediate', value: pct(levelCounts.intermediate) },
      { key: 'advanced', value: pct(levelCounts.advanced) },
      { key: 'quiz_accuracy', value: quizAccuracy },
      { key: 'consistency', value: Math.round((activeDays14 / 14) * 100) },
    ];

    const totalPossibleLevels = analyzedDocs * 3;

    res.json({
      totalDocs,
      analyzedDocs,
      totalConcepts: Number(conceptsRow.total) || 0,
      totalQuizzes: Number(quizRow.total) || 0,
      completedLevels,
      understoodPercent: totalPossibleLevels > 0 ? Math.round((completedLevels / totalPossibleLevels) * 100) : 0,
      needsReview: Math.max(0, totalPossibleLevels - completedLevels),
      levelCounts,
      activityData,
      heatmap,
      weekActivity,
      streak,
      quizAccuracy,
      skills,
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// ---------------------------------------------------------------------------
// Smart Review Room - chat with multiple documents
// (declared before "/:id" routes for clarity)
// ---------------------------------------------------------------------------
router.post('/review-chat', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await syncUserQuota(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { message, history, documentIds } = req.body;
    if (!message || !String(message).trim()) return res.status(400).json({ message: 'Message is required' });
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({ message: 'Vui lòng chọn ít nhất một tài liệu' });
    }

    const placeholders = documentIds.map(() => '?').join(',');
    const [docs] = await pool.query<RowDataPacket[]>(
      `SELECT id, title FROM documents WHERE id IN (${placeholders}) AND user_id = ?`,
      [...documentIds, userId]
    );
    if (docs.length === 0) return res.status(404).json({ message: 'Không tìm thấy tài liệu' });

    const documentContexts = [];
    for (const doc of docs) {
      const [concepts] = await pool.query<RowDataPacket[]>('SELECT name, summary FROM concepts WHERE document_id = ?', [doc.id]);
      const content = concepts.map(c => `[${c.name}]:\n${c.summary}`).join('\n\n');
      documentContexts.push({ title: doc.title, content });
    }

    const check = checkQuota(user, estimateChatCost(documentContexts.map(d => d.content).join('\n'), history, message));
    if (!check.ok) return quotaExceeded(res, check, 'chat');

    const aiResponse = await geminiReviewChat(message, history || [], documentContexts, resolveAiLang(req.headers['accept-language']));
    await addTokenUsage(userId, aiResponse.tokensUsed || 50);
    logActivity(userId, 'review');

    res.json({ text: aiResponse.text, usage: await usagePayload(userId) });
  } catch (error) {
    console.error('Review chat error:', error);
    res.status(500).json({ message: 'Lỗi khi chat ôn tập' });
  }
});

// ---------------------------------------------------------------------------
// Single document
// ---------------------------------------------------------------------------
async function findOwnedDocument(docId: string, userId?: number) {
  const [docs] = await pool.query<RowDataPacket[]>('SELECT * FROM documents WHERE id = ? AND user_id = ?', [docId, userId]);
  return docs[0];
}

router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const docId = req.params.id;
    const userId = req.user?.id;

    const doc = await findOwnedDocument(docId, userId);
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy tài liệu' });

    const [concepts] = await pool.query<RowDataPacket[]>('SELECT * FROM concepts WHERE document_id = ? ORDER BY id', [docId]);
    const conceptsWithStatus = concepts.map(c => ({ ...c, status: 'not_started' }));

    const [progressRows] = await pool.query<RowDataPacket[]>(
      'SELECT level, is_completed FROM user_level_progress WHERE document_id = ? AND user_id = ?',
      [docId, userId]
    );
    const levelProgress = { basic: false, intermediate: false, advanced: false };
    for (const row of progressRows) {
      levelProgress[row.level as keyof typeof levelProgress] = !!row.is_completed;
    }

    const [relationships] = await pool.query<RowDataPacket[]>(`
      SELECT r.source_concept_id as source, r.target_concept_id as target, r.label
      FROM concept_relationships r
      JOIN concepts c ON r.source_concept_id = c.id
      WHERE c.document_id = ?
    `, [docId]);

    const finalRelationships: any[] = [...relationships];
    if (finalRelationships.length === 0 && conceptsWithStatus.length > 1) {
      for (let i = 0; i < conceptsWithStatus.length - 1; i++) {
        finalRelationships.push({
          source: (conceptsWithStatus[i] as any).id,
          target: (conceptsWithStatus[i + 1] as any).id,
          label: '→'
        });
      }
    }

    res.json({ document: doc, concepts: conceptsWithStatus, relationships: finalRelationships, levelProgress });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.patch('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { title } = req.body;
    if (!title || !String(title).trim()) return res.status(400).json({ message: 'Tên tài liệu không hợp lệ' });

    const doc = await findOwnedDocument(req.params.id, req.user?.id);
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy tài liệu' });

    await pool.query('UPDATE documents SET title = ? WHERE id = ?', [String(title).trim().slice(0, 255), req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.get('/:id/quiz', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const docId = req.params.id;
    const doc = await findOwnedDocument(docId, req.user?.id);
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy tài liệu' });

    const [questions] = await pool.query<RowDataPacket[]>('SELECT * FROM quiz_questions WHERE document_id = ? ORDER BY id', [docId]);
    const parsedQuestions = questions.map(q => ({
      ...q,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
    }));
    res.json(parsedQuestions);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.post('/:id/quiz/attempt', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const doc = await findOwnedDocument(req.params.id, req.user?.id);
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy tài liệu' });

    const score = Math.max(0, Number(req.body.score) || 0);
    const total = Math.max(0, Number(req.body.total) || 0);
    logActivity(req.user?.id, 'quiz', req.params.id, { score: Math.min(score, total), total });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.post('/:id/chat', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const docId = req.params.id;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await syncUserQuota(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { message, history } = req.body;
    if (!message || !String(message).trim()) return res.status(400).json({ message: 'Message is required' });

    const doc = await findOwnedDocument(docId, userId);
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy tài liệu' });

    const [concepts] = await pool.query<RowDataPacket[]>('SELECT name, summary FROM concepts WHERE document_id = ?', [docId]);
    const contextStr = concepts.map(c => `[${c.name}]:\n${c.summary}`).join('\n\n');

    const check = checkQuota(user, estimateChatCost(contextStr, history, message));
    if (!check.ok) return quotaExceeded(res, check, 'chat');

    const aiResponse = await geminiChatWithDocument(contextStr, message, history || [], resolveAiLang(req.headers['accept-language']));
    await addTokenUsage(userId, aiResponse.tokensUsed || 50);
    logActivity(userId, 'chat', docId);

    res.json({ text: aiResponse.text, usage: await usagePayload(userId) });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Lỗi khi chat với AI' });
  }
});

router.post('/:id/flashcards/generate', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const docId = req.params.id;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await syncUserQuota(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const doc = await findOwnedDocument(docId, userId);
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    if (doc.status !== 'analyzed') return res.status(400).json({ message: 'Tài liệu chưa phân tích xong.', code: 'NOT_READY' });

    const [concepts] = await pool.query<RowDataPacket[]>('SELECT name, summary FROM concepts WHERE document_id = ?', [docId]);
    const contextStr = concepts.map(c => `[${c.name}]:\n${c.summary}`).join('\n\n');

    const check = checkQuota(user, PROMPT_OVERHEAD + estimateTextTokens(contextStr) + OUTPUT_RESERVE.flashcards);
    if (!check.ok) return quotaExceeded(res, check, 'flashcards');

    const flashcardResult = await geminiGenerateFlashcards(contextStr, resolveAiLang(req.headers['accept-language']));
    await addTokenUsage(userId, flashcardResult.tokensUsed || 200);
    logActivity(userId, 'flashcard', docId);

    res.json({ cards: flashcardResult.data, usage: await usagePayload(userId) });
  } catch (error) {
    console.error('Flashcard error:', error);
    res.status(500).json({ message: 'Lỗi khi tạo flashcard' });
  }
});

router.post('/:id/levels/:level/complete', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id, level } = req.params;
    const userId = req.user?.id;
    const validLevels = ['basic', 'intermediate', 'advanced'];
    if (!validLevels.includes(level)) return res.status(400).json({ message: 'Invalid level' });

    const doc = await findOwnedDocument(id, userId);
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy tài liệu' });

    await pool.query(
      `INSERT INTO user_level_progress (user_id, document_id, level, is_completed, completed_at)
       VALUES (?, ?, ?, TRUE, NOW())
       ON DUPLICATE KEY UPDATE is_completed = TRUE, completed_at = COALESCE(completed_at, NOW())`,
      [userId, id, level]
    );
    logActivity(userId, 'level_complete', id);

    res.json({ success: true });
  } catch (error) {
    console.error('Complete level error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const doc = await findOwnedDocument(req.params.id, req.user?.id);
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy tài liệu hoặc không có quyền' });

    await pool.query('DELETE FROM user_activity WHERE document_id = ?', [req.params.id]);
    await pool.query('DELETE FROM documents WHERE id = ?', [req.params.id]);
    res.json({ message: 'Đã xóa tài liệu thành công' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Lỗi server khi xóa tài liệu' });
  }
});

export default router;
