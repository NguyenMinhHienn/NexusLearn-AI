<div align="center">

# 🧠 NexusLearn AI

### Intelligent Full-Stack AI Learning Platform — Transforming Raw Documents into Interactive Knowledge Graphs, Hybrid RAG Tutoring & Adaptive Courses.

[![CI Status](https://github.com/NguyenMinhHienn/NexusLearn-AI/actions/workflows/ci.yml/badge.svg)](https://github.com/NguyenMinhHienn/NexusLearn-AI/actions/workflows/ci.yml)
[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-nexus--learn--ai.vercel.app-000?style=flat-square&logo=vercel)](https://nexus-learn-ai-omega.vercel.app)
[![Tech Stack](https://img.shields.io/badge/Stack-React_19_•_Express_•_TypeScript_•_TiDB-61DAFB?style=flat-square&logo=react&logoColor=black)](.)
[![AI & MCP](https://img.shields.io/badge/AI-Gemini_2.5_•_Official_MCP_•_BM25_RAG-4285F4?style=flat-square&logo=google&logoColor=white)](.)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981?style=flat-square)](./LICENSE)

<br />

<img src="frontend/public/logo.jpg" alt="NexusLearn AI Logo" width="110" style="border-radius: 20px" />

<br />

**Upload PDF / Markdown / YouTube → AI builds Interactive Knowledge Maps, 3-Tier Lessons, Leitner Flashcards, Quizzes & Live-Streaming RAG Tutoring.**

[Live Demo](https://nexus-learn-ai-omega.vercel.app) · [Key Features](#-features) · [Architecture](#-architecture) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [Testing](#-automated-testing--ci)

</div>

---

> **⚡ Instant Recruiter / Reviewer Access**: Visit the [Live Demo Login Page](https://nexus-learn-ai-omega.vercel.app/login) and click **"1-Click Recruiter Demo"** to explore a pre-populated workspace (Interactive Knowledge Map, 3-Level System Design Course, Multi-Level Quizzes, Persisted Leitner Flashcards, Streaming RAG Tutor, and MCP + Stripe Sandbox Billing) with zero sign-up required.
>
> *Note: Subscription & Stripe billing flows run strictly in **Stripe Test / Sandbox Mode** for full-stack portfolio demonstration — no real commercial payments are processed.*

---

## 👤 Author

**Nguyen Minh Hien** — Creator, Product Designer & Full-Stack Engineer

---

## ✨ Features

### 🗺️ Interactive Knowledge Graph (`@xyflow/react`)
Extracts structured concepts across **3 mastery tiers** (`Basic` → `Intermediate` → `Advanced`) and renders a zoomable, pannable node-edge dependency graph so learners visualize how topics connect.

### 🔎 Hybrid BM25 Chunk RAG + Real-Time SSE Streaming Tutor
- **Sliding-Window Chunking**: Uploaded PDFs, Markdown files, and YouTube transcripts (up to 200,000 characters) are segmented into overlapping `1,200`-character passages (`200`-character overlap) stored in `document_chunks`.
- **Okapi BM25 Retrieval**: Document chat queries rank verbatim source excerpts (`k1 = 1.5, b = 0.75`, Unicode + Vietnamese accent-insensitive matching & phrase boosting) alongside high-level concept outlines.
- **Server-Sent Events (`text/event-stream`)**: Streams Gemini tokens live to the browser in real time with source excerpt grounding indicators.

### 🃏 Persisted 3D Flashcards with Leitner Box Progression
Generates key-term decks stored in MySQL (`flashcards` table) for cross-device sync, complete with keyboard-driven 3D flip physics and 5-stage **Leitner Box** mastery tracking (`Box #1–#5`).

### 🎯 Multi-Level Adaptive Quizzes & Smart Review Room
Auto-generates multiple-choice assessments per difficulty tier with detailed answer explanations, accuracy analytics, and a multi-document **Smart Review Room** for cross-material synthesis.

### 💳 Agentic SaaS Billing (Official Model Context Protocol + Stripe)
- **Official MCP Server (`@modelcontextprotocol/sdk`)**: Exposes typed resources (`nexuslearn://billing/plans`) and 4 tools (`list_subscription_plans`, `get_user_billing_status`, `create_upgrade_checkout`, `open_billing_portal`) over both `InMemoryTransport` (in-app Gemini 2.5 agent) and `StdioServerTransport` (`npm run mcp:billing`).
- **Idempotent Stripe Ledger**: Dual fulfillment via `express.raw()` **HMAC-SHA256 Signed Webhooks** and server-to-server session verification, guarded by `UNIQUE(stripe_session_id)` + `INSERT IGNORE` on `payment_transactions` so user quotas are never credited twice.

### 📊 Analytics Dashboard & Pre-Flight Token Governance
- **Real SQL Telemetry**: 84-day GitHub-style learning activity heatmap, active streak counter, quiz accuracy, and 5-axis skill radar via Recharts.
- **Unit-Economics Guardrails**: Pre-flight token estimation (`estimateTextTokens` + `OUTPUT_RESERVE`) blocks over-quota calls before invoking Gemini, paired with automated daily quota sweeps and orphaned-job recovery.

### 🔐 Defense-in-Depth Auth & Security
- **JWT (7-day sliding renewal)** with fail-fast `JWT_SECRET` enforcement in production + **Google OAuth 2.0 (GIS)** one-click sign-in.
- **Helmet** security headers, strict **CORS** origin whitelisting, XSS HTML stripping, parameterized `mysql2` queries, and route-scoped **rate limiters**.

---

## 🏗️ Architecture

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                               PRODUCTION STACK                                │
├────────────────────┬──────────────────────────────┬───────────────────────────┤
│                    │                              │                           │
│  ┌──────────────┐  │  ┌────────────────────────┐  │  ┌─────────────────────┐  │
│  │    Vercel    │  │  │   Render Web Service   │  │  │   TiDB Serverless   │  │
│  │  (Edge CDN)  │──┼─▶│  Node.js + Express TS  │──┼─▶│  MySQL 8.0 (TLS)    │  │
│  │   Frontend   │  │  │  REST + SSE Streaming  │  │  │  11 Normalized Tbls │  │
│  └──────────────┘  │  └──────┬──────────┬──────┘  │  └─────────────────────┘  │
│                    │         │          │         │                           │
│  • React 19 + Vite │         ▼          ▼         │  • users & quotas         │
│  • 3D Scroll UI    │  ┌────────────┐ ┌─────────┐  │  • documents & chunks     │
│  • React Flow      │  │ Gemini 2.5 │ │ Official│  │  • concepts & graph edges │
│  • Recharts        │  │  Flash +   │◀│   MCP   │  │  • quizzes & flashcards   │
│  • i18next (VI/EN) │  │  BM25 RAG  │ │ Server  │  │  • user_activity          │
│                    │  └────────────┘ └────┬────┘  │  • payment_transactions   │
│                    │                      ▼       │    (UNIQUE idempotent)    │
│                    │               ┌────────────┐ │                           │
│                    │               │   Stripe   │ │                           │
│                    │               │  Checkout  │ │                           │
│                    │               │ & Webhooks │ │                           │
│                    │               └────────────┘ │                           │
└────────────────────┴──────────────────────────────┴───────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|:--|:--|
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS 3, Framer Motion, Lenis Smooth Scroll, React Flow (`@xyflow/react`), Recharts, i18next (`vi` / `en`), Axios |
| **Backend** | Node.js 20, Express 4, TypeScript, `@google/generative-ai` (Gemini 2.5), `@modelcontextprotocol/sdk` (MCP), `stripe` SDK, `google-auth-library`, `pdf-parse`, `zod` |
| **Database** | MySQL 8.0 / TiDB Cloud Serverless (`mysql2/promise`, TLS, automated idempotent startup migrations) |
| **Security & QA** | Vitest, GitHub Actions CI, Helmet, CORS Whitelist, `bcryptjs`, `jsonwebtoken`, `express-rate-limit` |

---

## 📁 Project Structure

```
NexusLearn-AI/
├── .github/workflows/ci.yml        # Automated TypeScript build & Vitest CI pipeline
├── frontend/                       # React 19 + Vite 6 SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatBot.tsx             # Global MCP-enabled AI Assistant + Checkout cards
│   │   │   ├── ChatWidget.tsx          # SSE-streaming Document Tutor with BM25 RAG
│   │   │   ├── GoogleAuthButton.tsx    # Google Identity Services OAuth 2.0 button
│   │   │   ├── ProfileModal.tsx        # User persona, security & quota modal
│   │   │   └── QuotaModal.tsx          # Token budget & tier comparison modal
│   │   ├── layouts/                    # MainLayout & split-screen AuthLayout
│   │   ├── pages/                      # LandingPage (3D scroll), Dashboard, Document,
│   │   │                               # KnowledgeMap, Flashcard, Quiz, ReviewRoom,
│   │   │                               # BillingPage, Login/Register, AdminDashboard
│   │   └── locales/                    # Full Vietnamese & English translations
│   └── vercel.json
│
├── backend/                        # Express + TypeScript API & MCP Host
│   ├── src/
│   │   ├── config/                     # MySQL TLS pool & fail-fast JWT helper
│   │   ├── mcp/
│   │   │   ├── billingMcpServer.ts     # Official MCP Server (Resources + 4 Tools)
│   │   │   └── mcpChatAgent.ts         # Gemini 2.5 <-> MCP Client multi-hop bridge
│   │   ├── middleware/                 # Auth, RBAC Admin, Rate Limiters, Sanitization
│   │   ├── routes/                     # auth, documents (REST + SSE), billing, chat, admin
│   │   └── services/
│   │       ├── ragService.ts           # Sliding-window chunker & Okapi BM25 retriever
│   │       ├── geminiAiService.ts      # Structured JSON extraction & SSE streaming
│   │       ├── billingService.ts       # Stripe Checkout, Portal & idempotent webhooks
│   │       ├── demoSeedService.ts      # 1-Click Recruiter Demo & starter course seeder
│   │       ├── quotaService.ts         # Pre-flight token estimator & daily reset
│   │       └── schemaService.ts        # Zero-downtime startup schema migrations
│   └── tests/                          # Vitest unit & MCP protocol integration tests
│
└── database/
    └── schema.sql                  # Full 11-table relational schema
```

---

## ⚡ Key API Endpoints

| Method | Endpoint | Description |
|:--|:--|:--|
| `POST` | `/api/auth/register` · `/login` · `/google` | Email/Password & Google OAuth 2.0 authentication |
| `POST` | `/api/auth/demo` | Provision & sign in to the 1-Click Recruiter Demo workspace |
| `GET` | `/api/auth/me` | Fetch current user profile, quota & sliding JWT renewal |
| `POST` | `/api/documents/upload` | Upload PDF/Text/YouTube → async Gemini analysis + BM25 chunk indexing |
| `GET` | `/api/documents/:id` | Document lessons, Knowledge Graph edges & level progress |
| `POST` | `/api/documents/:id/chat/stream` | **SSE Streaming** Document Tutor grounded via Okapi BM25 RAG |
| `GET/POST/PATCH` | `/api/documents/:id/flashcards` | Load, generate & update persisted Leitner-box flashcards |
| `POST` | `/api/chat/global` | Global AI Assistant connected to the Official MCP Billing Server |
| `POST` | `/api/billing/checkout` · `/verify-session` | Create & verify Stripe Subscription Checkout sessions |
| `POST` | `/api/billing/webhook` | Raw-body HMAC-SHA256 verified Stripe Webhook receiver |
| `GET` | `/api/admin/stats` · `/users` · `/ai-models` | Role-gated Admin telemetry, quota & Gemini model controls |

---

## 🚀 Getting Started Locally

### Prerequisites
- **Node.js** v20+
- **MySQL 8.0** (Local, XAMPP, Docker Compose, or TiDB Cloud)
- **Google Gemini API Key** ([Google AI Studio](https://aistudio.google.com/apikey))

### 1. Clone & Install
```bash
git clone https://github.com/NguyenMinhHienn/NexusLearn-AI.git
cd NexusLearn-AI

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment Variables
Copy `backend/.env.example` to `backend/.env`:
```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=studymate
JWT_SECRET=replace_with_a_strong_random_secret
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
STRIPE_SECRET_KEY=sk_test_your_stripe_sandbox_key
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173
```

*(Optional)* Create `frontend/.env` for Google Sign-In:
```env
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

### 3. Start Database & Dev Servers
```bash
# Option A: Start MySQL via Docker
docker-compose up -d

# Run Backend (http://localhost:3001) — tables auto-migrate on startup
cd backend && npm run dev

# Run Frontend (http://localhost:5173)
cd frontend && npm run dev
```

---

## 🧪 Automated Testing & CI

Backend business logic, security guards, BM25 RAG retrieval, and the Official MCP Server protocol are verified via **Vitest** and run automatically on every push via **GitHub Actions** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)):

```bash
cd backend
npm test          # Execute Vitest unit & MCP integration suite
npm run build     # Strict TypeScript compilation check

cd ../frontend
npm run build     # TypeScript project references + Vite production bundle
```

---

## 🌐 Cloud Deployment Reference

| Service | Role | Required Environment Variables |
|:--|:--|:--|
| **Vercel** | Frontend SPA (Edge CDN) | `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID` |
| **Render** | Backend Node.js API & MCP Host | `NODE_ENV=production`, `JWT_SECRET`, `GEMINI_API_KEY`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL=true`, `GOOGLE_CLIENT_ID`, `STRIPE_SECRET_KEY`, `FRONTEND_URL`, `ALLOWED_ORIGINS` |
| **TiDB Cloud** | Serverless MySQL 8.0 (TLS) | Auto-migrated on boot by `schemaService.ts` |

---

## 📄 License

Released under the [MIT License](./LICENSE) · © 2025–2026 **Nguyen Minh Hien**.
