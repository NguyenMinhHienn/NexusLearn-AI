import pool from '../config/db';
import { RowDataPacket } from 'mysql2';

/** Max source characters indexed into chunks (~70 pages of dense PDF text). */
export const MAX_INDEX_CHARS = 200_000;
export const DEFAULT_CHUNK_SIZE = 1_200;
export const DEFAULT_CHUNK_OVERLAP = 200;

export interface DocumentChunk {
  id?: number;
  chunk_index: number;
  content: string;
}

export interface ScoredChunk extends DocumentChunk {
  score: number;
}

/**
 * Splits a long document into overlapping chunks along natural paragraph or
 * sentence boundaries so semantic meaning is preserved across chunk borders.
 */
export function chunkDocumentText(
  rawText: string,
  maxChunkChars = DEFAULT_CHUNK_SIZE,
  overlapChars = DEFAULT_CHUNK_OVERLAP
): string[] {
  const cleaned = (rawText || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_INDEX_CHARS);

  if (!cleaned) return [];
  if (cleaned.length <= maxChunkChars) return [cleaned];

  const safeOverlap = Math.max(0, Math.min(overlapChars, Math.floor(maxChunkChars / 2)));
  const chunks: string[] = [];
  let start = 0;

  while (start < cleaned.length) {
    let end = Math.min(start + maxChunkChars, cleaned.length);

    if (end < cleaned.length) {
      // Prefer breaking at paragraph newline, sentence punctuation, or whitespace
      const windowSlice = cleaned.slice(start, end);
      const minBreakOffset = Math.floor(maxChunkChars * 0.55);

      const lastParagraph = windowSlice.lastIndexOf('\n\n');
      const lastNewline = windowSlice.lastIndexOf('\n');
      const lastSentence = Math.max(
        windowSlice.lastIndexOf('. '),
        windowSlice.lastIndexOf('? '),
        windowSlice.lastIndexOf('! ')
      );
      const lastSpace = windowSlice.lastIndexOf(' ');

      if (lastParagraph >= minBreakOffset) {
        end = start + lastParagraph;
      } else if (lastSentence >= minBreakOffset) {
        end = start + lastSentence + 1;
      } else if (lastNewline >= minBreakOffset) {
        end = start + lastNewline;
      } else if (lastSpace >= minBreakOffset) {
        end = start + lastSpace;
      }
    }

    const piece = cleaned.slice(start, end).trim();
    if (piece) {
      chunks.push(piece);
    }

    if (end >= cleaned.length) break;
    start = Math.max(start + 1, end - safeOverlap);
  }

  return chunks;
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'are', 'was', 'were', 'have', 'has',
  'what', 'when', 'where', 'which', 'how', 'why', 'who', 'can', 'will', 'into', 'about',
  'của', 'và', 'các', 'những', 'trong', 'cho', 'với', 'được', 'một', 'như', 'này', 'khi',
  'là', 'có', 'không', 'từ', 'theo', 'về', 'thì', 'mà', 'để', 'hay', 'hoặc', 'tại',
]);

/** Fold Vietnamese/Latin accents for accent-insensitive fallback matching. */
export function stripAccents(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/** Unicode-aware tokenizer supporting Vietnamese & English technical terms. */
export function tokenizeForSearch(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const matches = lower.match(/[\p{L}\p{N}_-]+/gu) || [];
  return matches.filter(tok => tok.length >= 2 && !STOP_WORDS.has(tok));
}

/**
 * Ranks document chunks against a user query using Okapi BM25 (k1 = 1.5, b = 0.75)
 * enhanced with accent-folded matching and exact phrase boosting.
 */
export function scoreChunksBM25(
  chunks: DocumentChunk[],
  query: string,
  topK = 5
): ScoredChunk[] {
  if (!chunks.length) return [];
  const queryTokens = tokenizeForSearch(query);
  if (!queryTokens.length) {
    return chunks.slice(0, topK).map(c => ({ ...c, score: 0 }));
  }

  const uniqueQueryTokens = Array.from(new Set(queryTokens));
  const foldedQueryTokens = Array.from(new Set(uniqueQueryTokens.map(stripAccents)));
  const normalizedPhrase = stripAccents(query.trim().toLowerCase());

  const k1 = 1.5;
  const b = 0.75;
  const N = chunks.length;

  const docData = chunks.map(chunk => {
    const tokens = tokenizeForSearch(chunk.content);
    const tf = new Map<string, number>();
    const foldedTf = new Map<string, number>();

    for (const tok of tokens) {
      tf.set(tok, (tf.get(tok) || 0) + 1);
      const folded = stripAccents(tok);
      foldedTf.set(folded, (foldedTf.get(folded) || 0) + 1);
    }

    return {
      chunk,
      len: Math.max(1, tokens.length),
      tf,
      foldedTf,
      foldedRaw: stripAccents(chunk.content.toLowerCase()),
    };
  });

  const avgDl = docData.reduce((sum, d) => sum + d.len, 0) / N;

  // Document frequencies
  const df = new Map<string, number>();
  const foldedDf = new Map<string, number>();
  for (const term of uniqueQueryTokens) {
    let count = 0;
    for (const d of docData) if (d.tf.has(term)) count++;
    df.set(term, count);
  }
  for (const term of foldedQueryTokens) {
    let count = 0;
    for (const d of docData) if (d.foldedTf.has(term)) count++;
    foldedDf.set(term, count);
  }

  const scored: ScoredChunk[] = docData.map(d => {
    let score = 0;

    for (const term of uniqueQueryTokens) {
      const f = d.tf.get(term) || 0;
      if (f > 0) {
        const n = df.get(term) || 0;
        const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
        const denom = f + k1 * (1 - b + b * (d.len / avgDl));
        score += idf * ((f * (k1 + 1)) / denom);
      } else {
        // Accent-insensitive partial credit (0.65x weight)
        const folded = stripAccents(term);
        const ff = d.foldedTf.get(folded) || 0;
        if (ff > 0) {
          const fn = foldedDf.get(folded) || 0;
          const idf = Math.log(1 + (N - fn + 0.5) / (fn + 0.5));
          const denom = ff + k1 * (1 - b + b * (d.len / avgDl));
          score += 0.65 * idf * ((ff * (k1 + 1)) / denom);
        }
      }
    }

    // Exact multi-word phrase boost
    if (normalizedPhrase.length >= 5 && uniqueQueryTokens.length >= 2 && d.foldedRaw.includes(normalizedPhrase)) {
      score += 2.0;
    }

    return { ...d.chunk, score };
  });

  const positiveMatches = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score || a.chunk_index - b.chunk_index);

  if (positiveMatches.length > 0) {
    return positiveMatches.slice(0, topK);
  }

  // Fallback for broad questions like "Tóm tắt toàn bộ tài liệu này giúp tôi"
  return chunks.slice(0, Math.min(3, topK)).map(c => ({ ...c, score: 0 }));
}

/** Persists overlapping chunks for a newly uploaded document. */
export async function storeDocumentChunks(documentId: number, extractedText: string): Promise<number> {
  const chunks = chunkDocumentText(extractedText);
  if (chunks.length === 0) return 0;

  await pool.query('DELETE FROM document_chunks WHERE document_id = ?', [documentId]);

  const BATCH_SIZE = 50;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const slice = chunks.slice(i, i + BATCH_SIZE);
    const placeholders = slice.map(() => '(?, ?, ?)').join(', ');
    const params: any[] = [];
    slice.forEach((content, idx) => {
      params.push(documentId, i + idx, content);
    });
    await pool.query(
      `INSERT INTO document_chunks (document_id, chunk_index, content) VALUES ${placeholders}`,
      params
    );
  }

  return chunks.length;
}

/**
 * Builds a Hybrid RAG context combining high-level concept summaries with the
 * Top-K verbatim passages retrieved via Okapi BM25 from `document_chunks`.
 */
export async function buildHybridDocumentContext(
  documentId: number | string,
  userQuery: string,
  topK = 5
): Promise<{ contextText: string; retrievedChunksCount: number }> {
  const [concepts] = await pool.query<RowDataPacket[]>(
    'SELECT name, summary FROM concepts WHERE document_id = ? ORDER BY id',
    [documentId]
  );
  const [chunkRows] = await pool.query<RowDataPacket[]>(
    'SELECT id, chunk_index, content FROM document_chunks WHERE document_id = ? ORDER BY chunk_index ASC',
    [documentId]
  );

  const conceptOverview = concepts
    .map(c => `- [${c.name}]: ${c.summary}`)
    .join('\n\n');

  if (chunkRows.length === 0) {
    return {
      contextText: conceptOverview,
      retrievedChunksCount: 0,
    };
  }

  const ranked = scoreChunksBM25(
    chunkRows.map(r => ({ id: r.id, chunk_index: Number(r.chunk_index), content: String(r.content) })),
    userQuery,
    topK
  );

  const verbatimSection = ranked
    .map(r => `[Excerpt #${r.chunk_index + 1}]:\n${r.content}`)
    .join('\n\n---\n\n');

  const combined = [
    verbatimSection ? `=== RELEVANT SOURCE EXCERPTS (BM25 RAG) ===\n${verbatimSection}` : '',
    conceptOverview ? `=== HIGH-LEVEL CONCEPT OUTLINE ===\n${conceptOverview}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    contextText: combined,
    retrievedChunksCount: ranked.length,
  };
}

