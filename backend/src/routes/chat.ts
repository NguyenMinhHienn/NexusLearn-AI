import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { geminiGlobalChat } from '../services/geminiAiService';

const router = express.Router();

router.post('/global', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const aiResponse = await geminiGlobalChat(message, history || []);
    
    return res.json({
      role: 'model',
      text: aiResponse.text
    });
  } catch (error) {
    console.error('Error in global chat:', error);
    return res.status(500).json({ message: 'Lỗi server khi xử lý chat' });
  }
});

export default router;
