import express from 'express';
import jwt from 'jsonwebtoken';
import { resolveAiLang } from '../services/geminiAiService';
import { globalChatLimiter } from '../middleware/rateLimiter';
import { sanitizeChatInput } from '../middleware/validation';
import { runMcpGlobalChat } from '../mcp/mcpChatAgent';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'nexuslearn_super_secret_key_2026';

function extractOptionalUserId(authHeader?: string): number | undefined {
  if (!authHeader) return undefined;
  const parts = authHeader.split(' ');
  const token = parts.length === 2 ? parts[1] : undefined;
  if (!token) return undefined;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded?.id ? Number(decoded.id) : undefined;
  } catch {
    return undefined;
  }
}

router.post('/global', globalChatLimiter, sanitizeChatInput, async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const userId = extractOptionalUserId(req.headers['authorization']);
    const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;

    const aiResponse = await runMcpGlobalChat(
      message,
      history || [],
      resolveAiLang(req.headers['accept-language']),
      { userId, origin }
    );

    return res.json({
      role: 'model',
      text: aiResponse.text,
      mcpToolsUsed: aiResponse.mcpToolsUsed,
      billingAction: aiResponse.billingAction,
    });
  } catch (error) {
    console.error('Error in MCP global chat:', error);
    return res.status(500).json({ message: 'Lỗi server khi xử lý chat' });
  }
});

export default router;
