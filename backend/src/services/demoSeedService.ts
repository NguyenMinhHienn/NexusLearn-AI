import bcrypt from 'bcryptjs';
import pool from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { syncUserQuota } from './quotaService';
import { signAuthToken } from '../config/jwt';

export const DEMO_EMAIL = 'demo@nexuslearn.ai';
const SAMPLE_DOC_TITLE = 'System Design & Modern AI Architecture (RAG, MCP & Cloud Scale)';

const SAMPLE_CHUNKS = [
  `[Architecture Overview] Modern full-stack AI applications combine stateless REST/SSE APIs (Node.js + Express + TypeScript) with global CDN edge frontends (React + Vite on Vercel) and distributed SQL databases (TiDB Serverless MySQL 8.0 over TLS). Stateless JWT authentication paired with OAuth 2.0 (Google Identity Services) allows horizontal scaling across multiple backend instances without sticky session affinity.`,
  `[Security & Rate Limiting] Defense-in-depth requires HTTP security headers via Helmet (CSP, HSTS, X-Frame-Options), strict CORS origin whitelisting, parameterized SQL queries to prevent SQL injection, and tiered token-bucket / window rate limiters (e.g. 20 requests/15m on /api/auth, 20 requests/min on AI chat endpoints, and 5 uploads/10m). In production, secrets like JWT_SECRET must fail fast at boot if missing.`,
  `[Hybrid BM25 & RAG Pipeline] Naive LLM wrappers truncate PDFs or stuff only short summaries into prompts, losing granular details on later pages. A Hybrid Retrieval-Augmented Generation (RAG) pipeline splits long documents into overlapping 1,200-character chunks (200-character sliding window) and ranks passages at query time using Okapi BM25 (k1 = 1.5, b = 0.75) with phrase boosting alongside high-level concept outlines.`,
  `[Model Context Protocol (MCP)] Introduced as an open standard for agentic tool interoperability, MCP decouples AI hosts/models from domain tools and resources. Using @modelcontextprotocol/sdk, a server exposes typed tools (Zod schemas) and URI resources (e.g. nexuslearn://billing/plans) over Stdio or InMemoryTransport, enabling Gemini 2.5 to dynamically discover tools via listTools() and invoke multi-step actions safely.`,
  `[Idempotent Stripe Webhooks & Ledger] Payment and subscription systems must tolerate network retries and duplicate deliveries. Webhook endpoints verify Stripe's HMAC-SHA256 signature against the raw request buffer (express.raw) before JSON parsing, and persist events into an idempotent payment_transactions table guarded by UNIQUE(stripe_session_id) with INSERT IGNORE so user quotas are never credited twice.`,
  `[Streaming UX & Cost Governance] Real-time Server-Sent Events (SSE) stream LLM tokens to the browser as they are generated, cutting perceived latency (TTFT) from 6 seconds to under 600ms. Pre-flight token estimation (prompt overhead + context + output reserve) and disabling unnecessary hidden reasoning tokens on structured extraction keep unit economics predictable at scale.`,
];

const SAMPLE_CONCEPTS: Array<{ name: string; level: 'basic' | 'intermediate' | 'advanced'; summary: string }> = [
  {
    name: '1. Kiến trúc Cloud-Native & Stateless Auth (JWT + OAuth 2.0)',
    level: 'basic',
    summary: `### Tách biệt Frontend Edge & Stateless API\nHệ thống hiện đại tách rời **SPA trên CDN (Vercel)** và **API Server (Render Node.js)** kết nối tới **TiDB Serverless (MySQL 8.0 TLS)**.\n\n- **Stateless JWT**: Server không lưu session trong RAM, giúp dễ dàng nhân bản ngang (*horizontal scaling*).\n- **Google OAuth 2.0 (GIS)**: Xác thực chữ ký ID Token trực tiếp với Google Public Keys qua \`google-auth-library\`.\n\n\`\`\`ts\nconst ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });\n\`\`\``,
  },
  {
    name: '2. Bảo mật đa lớp (Defense-in-Depth & Fail-Fast Secrets)',
    level: 'basic',
    summary: `### Các chốt chặn bảo mật bắt buộc ở Production\n- **Helmet & CORS Whitelist**: Chặn XSS, Clickjacking, MIME-sniffing và giới hạn domain gọi API.\n- **Tiered Rate Limiting**: Áp ngưỡng riêng cho từng nhóm endpoint nhạy cảm (\`/auth\`, \`/upload\`, \`/chat\`).\n- **Fail-Fast Configuration**: Tuyệt đối không dùng fallback secret tĩnh khi \`NODE_ENV=production\`; nếu thiếu \`JWT_SECRET\`, tiến trình phải dừng ngay lúc khởi động.`,
  },
  {
    name: '3. Hybrid RAG: Chunking trượt & Truy xuất Okapi BM25',
    level: 'intermediate',
    summary: `### Giải quyết bài toán tài liệu dài hàng chục trang\nThay vì chỉ nhét bản tóm tắt ngắn vào prompt, **Hybrid RAG** kết hợp bức tranh tổng quan (*Concepts*) với đoạn trích nguyên văn (*Document Chunks*):\n\n- **Sliding-Window Chunking**: Cắt văn bản thành các đoạn \`1.200 ký tự\` với phần gối đầu \`200 ký tự\` để không đứt gãy ngữ nghĩa.\n- **Okapi BM25 Ranking**: Chấm điểm độ khớp từ khóa + cụm từ chính xác (*k1 = 1.5, b = 0.75*) để lấy Top-5 đoạn gốc sát câu hỏi nhất.`,
  },
  {
    name: '4. Model Context Protocol (MCP) & Agentic Tool Calling',
    level: 'intermediate',
    summary: `### Chuẩn giao tiếp mở cho AI Agent hiện đại\n**MCP (\`@modelcontextprotocol/sdk\`)** tách biệt hoàn toàn tầng suy luận của LLM khỏi tầng nghiệp vụ:\n\n- **Dynamic Discovery**: Agent gọi \`mcpClient.listTools()\` để tự khám phá công cụ thay vì gắn chết cấu hình.\n- **Multi-Hop Execution**: Gemini 2.5 tự quyết định khi nào cần đọc quota thực tế, so sánh gói cước hoặc sinh phiên **Stripe Checkout** ngay trong hội thoại.`,
  },
  {
    name: '5. Idempotent Billing Ledger & HMAC-SHA256 Webhooks',
    level: 'advanced',
    summary: `### Thiết kế hệ thống thanh toán chống cộng trùng (Idempotency)\nTrong môi trường phân tán, cả trình duyệt (*redirect verify*) và **Stripe Webhook** đều có thể báo giao dịch thành công cùng lúc:\n\n- **Raw Payload Signature**: Xác thực chữ ký \`stripe-signature\` (HMAC-SHA256) trên \`Buffer\` nguyên bản trước \`express.json()\`.\n- **Database-Level Idempotency**: Dùng ràng buộc \`UNIQUE(stripe_session_id)\` kết hợp \`INSERT IGNORE\` để đảm bảo mỗi hóa đơn chỉ nâng cấp hạn mức đúng **1 lần duy nhất**.`,
  },
  {
    name: '6. Tối ưu Chi phí Token & Phản hồi thời gian thực (SSE)',
    level: 'advanced',
    summary: `### Cân bằng giữa Trải nghiệm người dùng & Unit Economics\n- **Pre-flight Quota Estimation**: Ước lượng chi phí token của ngữ cảnh + lịch sử chat trước khi gọi LLM để bảo vệ ngân sách hệ thống.\n- **Server-Sent Events (SSE)**: Truyền từng cụm từ (*token delta*) ngay khi Gemini sinh ra qua luồng \`text/event-stream\`, giảm thời gian chờ cảm nhận (*Time-To-First-Token*) từ vài giây xuống dưới \`600ms\`.`,
  },
];

const SAMPLE_RELATIONSHIPS: Array<[number, number, string]> = [
  [0, 1, 'bảo vệ bởi'],
  [0, 2, 'lưu trữ & truy xuất'],
  [1, 4, 'xác thực chữ ký'],
  [2, 3, 'cung cấp ngữ cảnh'],
  [3, 4, 'kích hoạt giao dịch'],
  [2, 5, 'truyền tải qua SSE'],
];

const SAMPLE_QUIZZES: Array<{
  level: 'basic' | 'intermediate' | 'advanced';
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}> = [
  {
    level: 'basic',
    question: 'Vì sao kiến trúc Stateless JWT giúp hệ thống Backend dễ mở rộng theo chiều ngang (Horizontal Scaling)?',
    options: [
      'Vì JWT tự động mã hóa toàn bộ cơ sở dữ liệu MySQL',
      'Vì Server không cần lưu trạng thái phiên đăng nhập trong RAM riêng lẻ của từng máy chủ',
      'Vì JWT không bao giờ hết hạn nên không cần kiểm tra lại',
      'Vì trình duyệt không cần gửi header Authorization trong mỗi request',
    ],
    correct_answer: 1,
    explanation: 'Với Stateless JWT, mọi instance Backend đều có thể xác thực request độc lập thông qua chữ ký số mà không phụ thuộc bộ nhớ RAM nội bộ của một máy chủ cố định.',
  },
  {
    level: 'basic',
    question: 'Hành vi chuẩn nhất của ứng dụng Production khi phát hiện biến môi trường JWT_SECRET bị bỏ trống là gì?',
    options: [
      'Tự động dùng một chuỗi mặc định có sẵn trong mã nguồn để web vẫn chạy',
      'Tắt hoàn toàn bước kiểm tra mật khẩu',
      'Báo lỗi nghiêm trọng và dừng khởi động ngay lập tức (Fail-Fast)',
      'Chuyển toàn bộ tài khoản về quyền Admin',
    ],
    correct_answer: 2,
    explanation: 'Fail-Fast ngăn chặn việc vô tình chạy hệ thống thật với khóa mặc định công khai trên mã nguồn mở — vốn cho phép kẻ tấn công tự ký giả mạo bất kỳ token nào.',
  },
  {
    level: 'intermediate',
    question: 'Trong pipeline Hybrid RAG, việc giữ khoảng gối đầu (Overlap ~200 ký tự) khi chia nhỏ tài liệu (Chunking) có tác dụng chính là gì?',
    options: [
      'Làm tăng gấp đôi dung lượng ổ cứng để dự phòng',
      'Tránh làm đứt gãy câu văn hoặc ý nghĩa ngữ cảnh nằm ngay tại ranh giới cắt đoạn',
      'Thay thế hoàn toàn nhu cầu sử dụng cơ sở dữ liệu',
      'Giúp trình duyệt tải trang Landing Page nhanh hơn',
    ],
    correct_answer: 1,
    explanation: 'Sliding-window overlap đảm bảo một mệnh đề quan trọng nằm giữa hai đoạn liên tiếp vẫn giữ nguyên vẹn ngữ cảnh khi thuật toán BM25 truy xuất.',
  },
  {
    level: 'intermediate',
    question: 'Ưu điểm kiến trúc lớn nhất khi tích hợp công cụ cho AI thông qua chuẩn Model Context Protocol (MCP) là gì?',
    options: [
      'AI Host có thể tự động khám phá danh sách tool/schema động và tách rời hoàn toàn khỏi logic nghiệp vụ',
      'Không cần kết nối Internet khi gọi Gemini API',
      'Tự động viết lại giao diện CSS của trang web',
      'Bỏ qua mọi bước kiểm tra quyền truy cập của người dùng',
    ],
    correct_answer: 0,
    explanation: 'MCP chuẩn hóa giao diện Resources & Tools (qua JSON Schema / Zod), giúp mô hình AI gọi listTools() và callTool() theo chuẩn chung mà không bị khóa chặt vào một framework duy nhất.',
  },
  {
    level: 'advanced',
    question: 'Tại sao endpoint nhận Stripe Webhook bắt buộc phải đặt với middleware express.raw() TRƯỚC express.json()?',
    options: [
      'Để tiết kiệm băng thông mạng cho trình duyệt',
      'Vì phép kiểm tra chữ ký HMAC-SHA256 của Stripe yêu cầu đối chiếu từng byte nguyên bản của raw body',
      'Vì Stripe gửi dữ liệu dưới định dạng file ảnh nhị phân',
      'Vì Express không hỗ trợ đọc JSON lớn hơn 1KB',
    ],
    correct_answer: 1,
    explanation: 'Nếu express.json() parse trước rồi nối chuỗi lại, khoảng trắng/thứ tự key có thể thay đổi làm sai lệch mã băm HMAC-SHA256 khiến verify chữ ký thất bại.',
  },
  {
    level: 'advanced',
    question: 'Cơ chế nào đảm bảo user KHÔNG bị cộng trùng hạn mức token dù cả trình duyệt lẫn Webhook đều gửi thông báo thanh toán cùng lúc?',
    options: [
      'Dùng hàm setTimeout chờ 10 giây trên trình duyệt',
      'Khóa UNIQUE(stripe_session_id) kết hợp câu lệnh INSERT IGNORE trên bảng giao dịch',
      'Xóa lịch sử thanh toán ngay sau mỗi lần đăng nhập',
      'Lưu trạng thái thanh toán duy nhất trong localStorage',
    ],
    correct_answer: 1,
    explanation: 'Ràng buộc UNIQUE ở tầng cơ sở dữ liệu kết hợp INSERT IGNORE đảm bảo chỉ đúng tiến trình đầu tiên ghi nhận giao dịch hợp lệ (affectedRows = 1) mới kích hoạt cộng quota.',
  },
];

const SAMPLE_FLASHCARDS: Array<{ term: string; definition: string; known?: boolean; box?: number }> = [
  {
    term: 'Stateless JWT Auth',
    definition: 'Cơ chế xác thực không lưu session trên RAM máy chủ; thông tin định danh được ký số giúp mở rộng ngang dễ dàng.',
    known: true,
    box: 2,
  },
  {
    term: 'Fail-Fast Secret Check',
    definition: 'Nguyên tắc buộc server dừng khởi động ngay ở môi trường Production nếu thiếu khóa mật (như JWT_SECRET) thay vì dùng khóa mặc định.',
    known: true,
    box: 2,
  },
  {
    term: 'Sliding-Window Chunking',
    definition: 'Kỹ thuật cắt tài liệu dài thành các đoạn ~1.200 ký tự có phần gối đầu (~200 ký tự) để giữ trọn ngữ cảnh giữa các đoạn.',
    known: false,
    box: 1,
  },
  {
    term: 'Okapi BM25',
    definition: 'Thuật toán xếp hạng văn bản xác suất dựa trên tần suất từ khóa (TF), độ hiếm từ (IDF) và chuẩn hóa độ dài đoạn văn.',
    known: false,
    box: 1,
  },
  {
    term: 'Model Context Protocol (MCP)',
    definition: 'Giao thức mở chuẩn hóa cách AI Agent tự khám phá và thực thi Tools / Resources từ các dịch vụ nghiệp vụ độc lập.',
    known: true,
    box: 3,
  },
  {
    term: 'HMAC-SHA256 Webhook Verification',
    definition: 'Xác thực chữ ký mật mã trên raw payload để đảm bảo sự kiện thanh toán thực sự do Stripe gửi đến và không bị chỉnh sửa.',
    known: false,
    box: 1,
  },
  {
    term: 'Idempotent Transaction Ledger',
    definition: 'Sổ cái giao dịch dùng khóa UNIQUE(stripe_session_id) đảm bảo xử lý lặp lại cùng một sự kiện vẫn chỉ thay đổi dữ liệu đúng một lần.',
    known: false,
    box: 1,
  },
  {
    term: 'Server-Sent Events (SSE)',
    definition: 'Luồng HTTP một chiều (text/event-stream) truyền từng từ AI sinh ra về trình duyệt ngay lập tức, giảm mạnh độ trễ cảm nhận.',
    known: false,
    box: 1,
  },
];

/**
 * Seeds a complete, analyzed interactive showcase course for a user if they
 * currently have 0 documents. Costs 0 AI tokens and runs in < 50ms.
 */
export async function seedStarterDocumentForUser(
  userId: number,
  options: { seedSampleActivity?: boolean } = {}
): Promise<number | null> {
  const [[countRow]] = await pool.query<RowDataPacket[]>(
    'SELECT COUNT(*) as cnt FROM documents WHERE user_id = ?',
    [userId]
  );
  if (Number(countRow?.cnt) > 0) {
    return null;
  }

  const [docRes] = await pool.query<ResultSetHeader>(
    'INSERT INTO documents (user_id, title, original_filename, status) VALUES (?, ?, ?, ?)',
    [userId, SAMPLE_DOC_TITLE, 'System_Design_AI_Architecture_Guide.pdf', 'analyzed']
  );
  const documentId = docRes.insertId;

  // 1. Insert RAG chunks
  for (let i = 0; i < SAMPLE_CHUNKS.length; i++) {
    await pool.query(
      'INSERT INTO document_chunks (document_id, chunk_index, content) VALUES (?, ?, ?)',
      [documentId, i, SAMPLE_CHUNKS[i]]
    );
  }

  // 2. Insert 3-level concepts
  const conceptIds: number[] = [];
  for (const c of SAMPLE_CONCEPTS) {
    const [cRes] = await pool.query<ResultSetHeader>(
      'INSERT INTO concepts (document_id, name, level, summary) VALUES (?, ?, ?, ?)',
      [documentId, c.name, c.level, c.summary]
    );
    conceptIds.push(cRes.insertId);
  }

  // 3. Insert Knowledge Map relationships
  for (const [srcIdx, tgtIdx, label] of SAMPLE_RELATIONSHIPS) {
    if (conceptIds[srcIdx] && conceptIds[tgtIdx]) {
      await pool.query(
        'INSERT INTO concept_relationships (source_concept_id, target_concept_id, label) VALUES (?, ?, ?)',
        [conceptIds[srcIdx], conceptIds[tgtIdx], label]
      );
    }
  }

  // 4. Insert multi-level Quizzes
  for (const q of SAMPLE_QUIZZES) {
    await pool.query(
      'INSERT INTO quiz_questions (document_id, question, options, correct_answer, explanation, level) VALUES (?, ?, ?, ?, ?, ?)',
      [documentId, q.question, JSON.stringify(q.options), q.correct_answer, q.explanation, q.level]
    );
  }

  // 5. Insert persisted Flashcards
  for (const card of SAMPLE_FLASHCARDS) {
    await pool.query(
      'INSERT INTO flashcards (document_id, term, definition, known, box) VALUES (?, ?, ?, ?, ?)',
      [documentId, card.term, card.definition, Boolean(card.known), card.box || 1]
    );
  }

  if (options.seedSampleActivity) {
    await pool.query(
      `INSERT IGNORE INTO user_level_progress (user_id, document_id, level, is_completed, completed_at)
       VALUES (?, ?, 'basic', TRUE, NOW())`,
      [userId, documentId]
    );

    // Populate realistic recent learning activity so Dashboard Heatmap, Streak & Radar chart shine immediately
    const activitySchedule: Array<{ daysAgo: number; type: string; score?: number; total?: number }> = [
      { daysAgo: 6, type: 'upload' },
      { daysAgo: 5, type: 'flashcard' },
      { daysAgo: 4, type: 'quiz', score: 5, total: 6 },
      { daysAgo: 3, type: 'chat' },
      { daysAgo: 2, type: 'level_complete' },
      { daysAgo: 1, type: 'review' },
      { daysAgo: 0, type: 'quiz', score: 6, total: 6 },
    ];

    for (const item of activitySchedule) {
      await pool.query(
        `INSERT INTO user_activity (user_id, document_id, activity_type, score, total, created_at)
         VALUES (?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY))`,
        [userId, documentId, item.type, item.score ?? null, item.total ?? null, item.daysAgo]
      );
    }
  } else {
    await pool.query(
      'INSERT INTO user_activity (user_id, document_id, activity_type) VALUES (?, ?, ?)',
      [userId, documentId, 'upload']
    );
  }

  return documentId;
}

/**
 * Provisions or refreshes the 1-Click Recruiter Demo account so Hiring Managers
 * and Tech Leads can inspect all features (Dashboard Analytics, React Flow Mindmap,
 * RAG Streaming Tutor, Quizzes, Persistent Flashcards, and MCP Billing) in one click.
 */
export async function ensureRecruiterDemoAccount() {
  const [existing] = await pool.query<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [DEMO_EMAIL]);

  let userId: number;
  const demoName = 'Recruiter Demo (Guest)';

  if (existing.length > 0) {
    userId = existing[0].id;
    // Ensure generous available tokens so live recruiter testing never hits an unexpected wall
    if (Number(existing[0].token_quota) - Number(existing[0].tokens_used) < 15000) {
      await pool.query(
        'UPDATE users SET token_quota = GREATEST(token_quota, 50000), tokens_used = 4200, last_quota_reset = NOW() WHERE id = ?',
        [userId]
      );
    }
  } else {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(`demo_recruiter_${Date.now()}`, salt);
    const [ins] = await pool.query<ResultSetHeader>(
      `INSERT INTO users (name, email, password, occupation, learning_goal, plan_tier, role, token_quota, tokens_used)
       VALUES (?, ?, ?, ?, ?, 'free', 'user', 50000, 4200)`,
      [
        demoName,
        DEMO_EMAIL,
        passwordHash,
        'Tech Lead / Recruiter',
        'Evaluate NexusLearn AI Full-Stack & MCP Architecture',
      ]
    );
    userId = ins.insertId;
  }

  await seedStarterDocumentForUser(userId, { seedSampleActivity: true });

  const synced = await syncUserQuota(userId);
  const user = synced || {
    id: userId,
    email: DEMO_EMAIL,
    name: demoName,
    role: 'user',
    token_quota: 50000,
    tokens_used: 4200,
  };

  const token = signAuthToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  return { user, token };
}

