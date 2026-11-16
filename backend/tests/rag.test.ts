import { describe, it, expect } from 'vitest';
import {
  chunkDocumentText,
  scoreChunksBM25,
  stripAccents,
  DocumentChunk,
} from '../src/services/ragService';

describe('Hybrid BM25 RAG Chunking & Retrieval Engine', () => {
  it('returns empty array for empty or whitespace-only text', () => {
    expect(chunkDocumentText('')).toEqual([]);
    expect(chunkDocumentText('   \n\n  ')).toEqual([]);
  });

  it('splits long multi-paragraph text into overlapping chunks without losing tail content', () => {
    const paragraphs = Array.from({ length: 12 }, (_, i) =>
      `Paragraph ${i + 1}: Microservices communicate asynchronously over event brokers while preserving idempotency keys across retries.`
    ).join('\n\n');

    const chunks = chunkDocumentText(paragraphs, 350, 80);
    expect(chunks.length).toBeGreaterThan(3);
    expect(chunks[0]).toContain('Paragraph 1:');
    expect(chunks[chunks.length - 1]).toContain('Paragraph 12:');
  });

  it('ranks the exact matching technical chunk #1 using Okapi BM25', () => {
    const chunks: DocumentChunk[] = [
      {
        chunk_index: 0,
        content: 'React Flow renders interactive node-based graphs with pan and zoom controls in the browser.',
      },
      {
        chunk_index: 1,
        content: 'Stripe Webhooks require express.raw buffer verification using HMAC-SHA256 signatures and UNIQUE(stripe_session_id) idempotency.',
      },
      {
        chunk_index: 2,
        content: 'CSS Grid and Flexbox simplify responsive mobile layouts across viewports.',
      },
    ];

    const results = scoreChunksBM25(chunks, 'How does Stripe webhook HMAC-SHA256 signature verification work?', 2);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].chunk_index).toBe(1);
    expect(results[0].score).toBeGreaterThan(0);
  });

  it('supports Vietnamese diacritics and accent-insensitive fallback queries', () => {
    expect(stripAccents('Hệ thống đồng bộ dữ liệu Đám Mây')).toBe('He thong dong bo du lieu Dam May');

    const chunks: DocumentChunk[] = [
      { chunk_index: 0, content: 'Thuật toán cây nhị phân tìm kiếm cân bằng đỏ đen.' },
      { chunk_index: 1, content: 'Cơ chế chống cộng trùng hạn mức bằng khóa duy nhất trong bảng giao dịch thanh toán.' },
    ];

    // Query without Vietnamese accents should still rank chunk #1 first
    const ranked = scoreChunksBM25(chunks, 'chong cong trung giao dich thanh toan', 2);
    expect(ranked[0].chunk_index).toBe(1);
    expect(ranked[0].score).toBeGreaterThan(0);
  });
});

