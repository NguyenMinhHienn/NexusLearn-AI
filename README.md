# NexusLearn AI (formerly StudyMate) 🚀

![NexusLearn Hero](frontend/public/logo.jpg)

> **⚠️ TUYÊN BỐ VỀ BẢN QUYỀN VÀ TÍNH ĐỘC BẢN (STATEMENT OF ORIGINALITY) ⚠️**
> 
> Đây là sản phẩm và chất xám ĐỘC QUYỀN của tôi. Toàn bộ ý tưởng khởi tạo, quy trình thiết kế, flow tính năng và kiến trúc của hệ thống này đã được tôi lên kế hoạch và thai nghén từ giữa năm 2025. 
> 
> Gần đây, có sự xuất hiện của một trang web mang tên **"getstudymate"** có giao diện, tên gọi và luồng tính năng giống hệt một cách bất thường với những gì tôi đã và đang xây dựng. Tôi xin đính chính và khẳng định mạnh mẽ: **NexusLearn AI (Tên gốc: StudyMate) là dự án nguyên bản 100% của tôi. Tôi KHÔNG ăn cắp ý tưởng, KHÔNG sao chép chất xám từ bất kỳ cá nhân hay tổ chức nào.** Dự án này được tái định vị thương hiệu thành **NexusLearn** để khẳng định vị thế độc tôn và cắt đứt mọi sự nhầm lẫn với các sản phẩm "trùng lặp ý tưởng" ngoài kia.

---

## 🌟 Tầm Nhìn & Tính Năng Nổi Bật

NexusLearn AI không chỉ là một công cụ tóm tắt văn bản. Đây là một hệ sinh thái E-learning thông minh giúp **hệ thống hóa tri thức** bằng công nghệ AI tiên tiến (Google Gemini 2.5 Flash), với giao diện chuẩn SaaS Vercel/Linear cao cấp.

- 🧠 **Sơ Đồ Tư Duy (Knowledge Map):** Tự động bóc tách tài liệu và vẽ ra Sơ đồ tư duy dạng node-graph tương tác 360 độ. Giúp người học nhìn thấu cấu trúc kiến thức.
- 📚 **Hệ Thống Bài Giảng & Flashcards:** Tự động tạo thẻ ghi nhớ và chia nhỏ bài giảng theo cấp độ (Cơ bản đến Nâng cao).
- 🎯 **Quiz & Đánh Giá Năng Lực:** Tự động sinh bộ câu hỏi trắc nghiệm sau mỗi bài học để củng cố kiến thức.
- 🤖 **Trợ Lý AI (Global ChatBot):** Chatbot toàn hệ thống hỗ trợ giải đáp mọi thắc mắc học tập chung.
- 🎓 **Gia Sư Ảo AI (Document Tutor):** Tích hợp sâu vào từng tài liệu, hiểu rõ ngữ cảnh của bài giảng để giải thích cặn kẽ từng khái niệm khó.
- 🌌 **Giao Diện Đẳng Cấp:** Hỗ trợ Dark Mode / Light Mode siêu mượt mà với hiệu ứng Glassmorphism hiện đại.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend:** React (Vite), Tailwind CSS, Framer Motion, Lucide Icons, React Flow (cho Node Graph).
- **Backend:** Node.js, Express, TypeScript.
- **AI Engine:** Google Gemini 2.5 Flash API.
- **Phân Tích Dữ Liệu:** Xử lý PDF và trích xuất nội dung bằng `pdf-parse` & custom scraping.

---

## ⚙️ Hướng Dẫn Cài Đặt & Khởi Chạy

Dự án được chia làm 2 phần độc lập: `backend` và `frontend`. Để chạy dự án trên máy của bạn (Localhost), hãy làm theo các bước sau:

### Yêu Cầu Cấu Hình
- Cài đặt **Node.js** (Khuyến nghị phiên bản v18.x trở lên).
- Có API Key của Google Gemini.

### 1. Khởi chạy Backend (Máy Chủ)

1. Mở Terminal và di chuyển vào thư mục `backend`:
   ```bash
   cd backend
   ```
2. Cài đặt các thư viện cần thiết:
   ```bash
   npm install
   ```
3. Cấu hình biến môi trường:
   - Tạo một file tên là `.env` ở trong thư mục `backend` (Ngang hàng với package.json).
   - Thêm nội dung sau vào file `.env`:
     ```env
     PORT=3001
     JWT_SECRET=your_super_secret_jwt_key
     GEMINI_API_KEY=điền_api_key_gemini_của_bạn_vào_đây
     ```
4. Chạy server:
   ```bash
   npm run dev
   ```
   *Server backend sẽ chạy tại địa chỉ: `http://localhost:3001`*

### 2. Khởi chạy Frontend (Giao Diện)

1. Mở một Terminal mới (Giữ nguyên Terminal backend đang chạy) và di chuyển vào thư mục `frontend`:
   ```bash
   cd frontend
   ```
2. Cài đặt các thư viện:
   ```bash
   npm install
   ```
3. Chạy giao diện người dùng:
   ```bash
   npm run dev
   ```
   *Website sẽ được mở ra tại địa chỉ: `http://localhost:5173` (hoặc cổng được hiển thị trên terminal).*

---

### 🚀 Bắt Đầu Trải Nghiệm
Truy cập vào trình duyệt bằng đường dẫn của Frontend, bấm **Bắt đầu miễn phí**, tải lên một file tài liệu bài giảng (PDF) và để NexusLearn phô diễn sức mạnh phân tích của nó!

> *© 2026 NexusLearn AI. All rights reserved.*