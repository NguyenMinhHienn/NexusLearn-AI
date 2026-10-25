<div align="center">

# 🧠 NexusLearn AI

### Hệ sinh thái E-learning thông minh biến tài liệu thô thành trải nghiệm học tập tương tác, được vận hành bởi Google Gemini AI.

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-nexuslearn.vercel.app-000?style=for-the-badge&logo=vercel)](https://nexus-learn-ai-omega.vercel.app)
[![Tech Stack](https://img.shields.io/badge/Stack-React_•_Express_•_MySQL-61DAFB?style=for-the-badge&logo=react&logoColor=white)](.)
[![AI Engine](https://img.shields.io/badge/AI-Google_Gemini_2.5-4285F4?style=for-the-badge&logo=google&logoColor=white)](.)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](.)

<br />

<img src="frontend/public/logo.jpg" alt="NexusLearn AI Logo" width="120" style="border-radius: 20px" />

<br />

**Upload any document → AI instantly builds Knowledge Maps, Flashcards, Quizzes & Personalized Learning Paths.**

[Live Demo](https://nexus-learn-ai-omega.vercel.app) · [Features](#-features) · [Architecture](#-architecture) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started)

</div>

---

## 👤 Author

**Nguyen Minh Hien** — Creator, Designer & Full-Stack Developer

> *Independently designed, built, and deployed from concept to production.*

---

## ✨ Features

### 🗺️ AI-Powered Knowledge Map
Automatically extracts concepts from any document and builds an **interactive node-graph mind map** with relationship labels, zoom, pan, and 360° navigation. Powered by React Flow.

### 📚 Smart Lessons & Flashcards
AI generates structured lessons across **3 difficulty levels** (Basic → Intermediate → Advanced) and creates flashcard decks optimized for spaced repetition memorization.

### 🎯 Adaptive Quiz System
Auto-creates multiple-choice quizzes after each learning level. Tracks scores, streaks, and provides detailed explanations for every answer.

### 💬 Dual AI Chat System
- **Global AI Assistant** — System-wide chatbot for general learning questions
- **Document AI Tutor** — Context-aware tutor embedded in each document, deeply understands the uploaded material

### 📊 Analytics Dashboard
Beautiful dashboard with **activity heatmap** (GitHub-style), learning streaks, progress tracking per document, and Radar/Donut/Area charts via Recharts.

### 🔐 Enterprise-Grade Auth
- JWT authentication with **7-day auto-renewal**
- **Google OAuth** one-click sign-in
- Role-based access control (User / Admin)
- Rate limiting & brute-force protection

### ⚙️ Admin Control Panel
Full admin dashboard with:
- User management (quota, reset usage, delete)
- AI model switching & monitoring (token consumption per model)
- System settings configuration
- Real-time statistics (signups, documents, token usage)

### 🌍 Internationalization & Theming
- Seamless **Vietnamese / English** switching (i18next)
- **Dark / Light mode** with system preference detection
- Premium glassmorphism UI with micro-animations

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRODUCTION STACK                         │
├─────────────────┬───────────────────┬───────────────────────────┤
│                 │                   │                           │
│   ┌─────────┐   │   ┌───────────┐   │   ┌───────────────────┐   │
│   │ Vercel  │   │   │  Render   │   │   │  TiDB Serverless  │   │
│   │  (CDN)  │──▶│   │ (Node.js) │──▶│   │    (MySQL 8.0)    │   │
│   │Frontend │   │   │  Backend  │   │   │    Cloud DB       │   │
│   └─────────┘   │   └─────┬─────┘   │   └───────────────────┘   │
│                 │         │         │                           │
│   React 19      │     Express       │   9 tables, UTF-8mb4     │
│   Vite 6        │     TypeScript    │   SSL encrypted           │
│   Tailwind CSS  │     JWT Auth      │   Auto-scaling            │
│   Framer Motion │     Helmet/CORS   │                           │
│                 │         │         │                           │
│                 │   ┌─────▼─────┐   │                           │
│                 │   │  Gemini   │   │                           │
│                 │   │ 2.5 Flash │   │                           │
│                 │   │   API     │   │                           │
│                 │   └───────────┘   │                           │
└─────────────────┴───────────────────┴───────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|:--|:--|
| **React 19** + **Vite 6** | UI framework & build tool |
| **Tailwind CSS 3** | Utility-first styling |
| **Framer Motion** | Smooth animations & page transitions |
| **React Flow** (@xyflow) | Interactive knowledge map graph |
| **Recharts** | Data visualization (charts & analytics) |
| **Lucide React** | Modern icon library |
| **i18next** | Internationalization (VI / EN) |
| **GSAP** + **tsParticles** | Landing page animations |
| **Axios** | HTTP client with interceptors |

### Backend
| Technology | Purpose |
|:--|:--|
| **Node.js** + **Express 4** | REST API server |
| **TypeScript** | Type-safe backend development |
| **MySQL 8.0** (mysql2) | Relational database |
| **Google Gemini API** | AI document analysis, chat, quiz generation |
| **JWT** (jsonwebtoken) | Stateless authentication |
| **bcryptjs** | Password hashing |
| **Helmet** + **CORS** | Security headers & origin control |
| **express-rate-limit** | Brute-force & DDoS protection |
| **Multer** | File upload handling |
| **pdf-parse** | PDF text extraction |
| **google-auth-library** | Google OAuth verification |

### Infrastructure
| Service | Role |
|:--|:--|
| **Vercel** | Frontend hosting (Global Edge CDN) |
| **Render** | Backend hosting (Node.js Web Service) |
| **TiDB Cloud** | Serverless MySQL database |
| **Google Cloud** | OAuth credentials & Gemini API |

---

## 📁 Project Structure

```
NexusLearn-AI/
├── frontend/                   # React + Vite SPA
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ChatBot.tsx         # Global AI chatbot
│   │   │   ├── ChatWidget.tsx      # Document-specific AI tutor
│   │   │   ├── ProfileModal.tsx    # User profile management
│   │   │   └── LanguageSwitcher.tsx
│   │   ├── contexts/           # React contexts
│   │   │   ├── AuthContext.tsx     # JWT auth + Google OAuth
│   │   │   └── ThemeContext.tsx    # Dark/Light mode
│   │   ├── pages/              # Route pages (14 pages)
│   │   │   ├── LandingPage.tsx     # Marketing landing page
│   │   │   ├── DashboardPage.tsx   # User analytics dashboard
│   │   │   ├── DocumentPage.tsx    # Document detail + lessons
│   │   │   ├── KnowledgeMapPage.tsx# Interactive mind map
│   │   │   ├── QuizPage.tsx        # AI-generated quizzes
│   │   │   ├── FlashcardPage.tsx   # Flashcard study mode
│   │   │   ├── ReviewRoomPage.tsx  # Multi-doc review chat
│   │   │   ├── AdminDashboard.tsx  # Admin control panel
│   │   │   └── ...
│   │   ├── locales/            # i18n translations (VI + EN)
│   │   └── styles/             # Global CSS + design tokens
│   └── vercel.json             # SPA routing config
│
├── backend/                    # Express + TypeScript API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts             # Login, register, Google OAuth, profile
│   │   │   ├── documents.ts        # CRUD, upload, AI analysis, chat
│   │   │   ├── admin.ts            # User/model/settings management
│   │   │   └── chat.ts             # Global AI chat
│   │   ├── middleware/
│   │   │   ├── auth.ts             # JWT verification
│   │   │   ├── rateLimiter.ts      # Rate limiting rules
│   │   │   └── validation.ts       # Input sanitization
│   │   ├── services/
│   │   │   ├── geminiAiService.ts  # Gemini API integration
│   │   │   ├── schemaService.ts    # Auto DB migration
│   │   │   └── quotaService.ts     # Token quota management
│   │   └── config/
│   │       └── db.ts               # MySQL pool (local + cloud + SSL)
│   └── .env.example
│
└── database/
    └── schema.sql              # Full database schema (9 tables)
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ 
- **MySQL 8.0** (XAMPP, Docker, or Cloud)
- **Google Gemini API Key** → [Get one here](https://aistudio.google.com/apikey)

### 1. Clone & Install

```bash
git clone https://github.com/NguyenMinhHienn/NexusLearn-AI.git
cd NexusLearn-AI

# Install backend
cd backend && npm install

# Install frontend
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env → fill in DB credentials, GEMINI_API_KEY, JWT_SECRET

# Frontend (optional, for Google OAuth)
cp frontend/.env.example frontend/.env
# Edit frontend/.env → fill VITE_GOOGLE_CLIENT_ID if needed
```

### 3. Initialize Database

```bash
# Using XAMPP/local MySQL
mysql -u root studymate < database/schema.sql

# Or using Docker
docker-compose up -d
docker exec -i studymate_db mysql -u root studymate < database/schema.sql
```

### 4. Run Development Servers

```bash
# From root directory
npm run dev

# Or run separately:
# Terminal 1: cd backend && npm run dev
# Terminal 2: cd frontend && npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

---

## 🌐 Production Deployment

This project is deployed using a **fully serverless, zero-cost architecture**:

| Component | Service | Cost |
|:--|:--|:--|
| Frontend | Vercel (Edge CDN) | Free |
| Backend | Render (Web Service) | Free |
| Database | TiDB Cloud (Serverless) | Free (5GB) |

See the [Deployment Guide](./docs/deployment.md) for step-by-step instructions.

---

## 📊 Database Schema

```
users ─────────────── documents ─────────── concepts
  │                      │                    │
  │                      │                    ├── concept_relationships
  │                      │                    │
  ├── user_activity      ├── quiz_questions   └── user_concept_progress
  │                      │
  └── user_level_progress
  
system_settings (global config)
```

**9 tables** • UTF-8mb4 • Foreign key cascades • Optimized indexes

---

## ⚡ API Endpoints

| Method | Endpoint | Description |
|:--|:--|:--|
| `POST` | `/api/auth/register` | Create new account |
| `POST` | `/api/auth/login` | JWT login |
| `POST` | `/api/auth/google` | Google OAuth login |
| `GET` | `/api/auth/me` | Get current user + auto-renew token |
| `POST` | `/api/documents/upload` | Upload PDF/text/YouTube |
| `GET` | `/api/documents` | List user's documents |
| `GET` | `/api/documents/:id` | Get document details + concepts |
| `POST` | `/api/documents/:id/chat` | Chat with document AI tutor |
| `GET` | `/api/documents/:id/quiz` | Get AI-generated quiz |
| `POST` | `/api/documents/review-chat` | Multi-document review chat |
| `POST` | `/api/chat/global` | Global AI assistant |
| `GET` | `/api/admin/stats` | Admin dashboard statistics |
| `GET` | `/api/admin/ai-models` | List available Gemini models |
| `PUT` | `/api/admin/ai-model` | Switch active AI model |
| `GET` | `/api/health` | Health check |

---

## 🔒 Security

- **Helmet.js** — 11+ HTTP security headers (XSS, clickjacking, MIME sniffing, HSTS)
- **CORS whitelist** — Only configured origins can access the API
- **bcrypt** — Salted password hashing (10 rounds)
- **JWT** — 7-day expiry with automatic renewal when < 2 days remaining
- **Rate limiting** — Per-route limits (auth: 20/15min, chat: 20/min, upload: 5/10min)
- **Input validation** — Server-side sanitization on all user inputs
- **SQL injection protection** — Parameterized queries via mysql2

---

## 📜 Statement of Originality

This project is the **sole intellectual property** of **Nguyen Minh Hien**. The entire concept, feature design, system architecture, and user experience flow were independently ideated and planned starting from **mid-2025**.

---

## 📄 License

This project is proprietary software created by **Nguyen Minh Hien**. All rights reserved.

> © 2025-2026 NexusLearn AI by Nguyen Minh Hien. All rights reserved.