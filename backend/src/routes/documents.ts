import { Router, Request, Response } from 'express';
import pool from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import multer from 'multer';
// @ts-ignore
import pdfParse from 'pdf-parse';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { mockAnalyzeDocument } from '../services/mockAiService';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Upload Document
router.post('/upload', authenticateToken, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { title, textContent } = req.body;
    let extractedText = textContent || '';
    let originalFilename = 'Pasted Text';

    if (req.file) {
      originalFilename = req.file.originalname;
      if (req.file.mimetype === 'application/pdf') {
        const data = await pdfParse(req.file.buffer);
        extractedText = data.text;
      } else {
        // Tesseract OCR mock cho image (sẽ cài thật sau nếu cần)
        extractedText = 'Nội dung trích xuất từ ảnh...';
      }
    }

    if (!extractedText.trim()) {
      return res.status(400).json({ message: 'Không tìm thấy nội dung để phân tích' });
    }

    // 1. Lưu Document
    const [docResult] = await pool.query<ResultSetHeader>(
      'INSERT INTO documents (user_id, title, original_filename, status) VALUES (?, ?, ?, ?)',
      [userId, title, originalFilename, 'processing']
    );
    const documentId = docResult.insertId;

    // 2. Gọi AI Phân tích (Bất đồng bộ)
    // Trong thực tế sẽ gửi vào Message Queue (như BullMQ). Ở đây gọi thẳng mock.
    mockAnalyzeDocument(documentId, extractedText).catch(console.error);

    res.status(202).json({
      message: 'Tài liệu đang được phân tích',
      documentId
    });

  } catch (error) {
    console.error('Lỗi upload:', error);
    res.status(500).json({ message: 'Lỗi server khi upload' });
  }
});

// Lấy danh sách Documents
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const [documents] = await pool.query<RowDataPacket[]>(
      `SELECT d.*, 
        (SELECT COUNT(*) FROM concepts c WHERE c.document_id = d.id) as concepts_count
       FROM documents d WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy chi tiết Document & Concepts
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const docId = req.params.id;
    const userId = req.user?.id;

    const [docs] = await pool.query<RowDataPacket[]>('SELECT * FROM documents WHERE id = ? AND user_id = ?', [docId, userId]);
    if (docs.length === 0) return res.status(404).json({ message: 'Không tìm thấy tài liệu' });

    const [concepts] = await pool.query<RowDataPacket[]>('SELECT * FROM concepts WHERE document_id = ?', [docId]);

    // Trả về kèm mock status học tập
    const conceptsWithStatus = concepts.map(c => ({
      ...c,
      status: 'not_started' // Sẽ join với bảng user_concept_progress trong thực tế
    }));

    res.json({
      document: docs[0],
      concepts: conceptsWithStatus
    });

  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy câu hỏi Quiz
router.get('/:id/quiz', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const docId = req.params.id;
    const [questions] = await pool.query<RowDataPacket[]>('SELECT * FROM quiz_questions WHERE document_id = ?', [docId]);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

export default router;
