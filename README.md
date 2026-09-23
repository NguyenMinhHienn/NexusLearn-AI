# NexusLearn AI (formerly StudyMate)

![NexusLearn Hero](frontend/public/logo.jpg)

> **TUYEN BO VE BAN QUYEN VA TINH DOC BAN (STATEMENT OF ORIGINALITY)**
> 
> Day la san pham va chat xam DOC QUYEN cua toi. Toan bo y tuong khoi tao, quy trinh thiet ke, flow tinh nang va kien truc cua he thong nay da duoc toi len ke hoach va thai nghen tu giua nam 2025. 
> 
> Gan day, co su xuat hien cua mot trang web mang ten **"getstudymate"** co giao dien, ten goi va luong tinh nang giong het mot cach bat thuong voi nhung gi toi da va dang xay dung. Toi xin dinh chinh va khang dinh manh me: **NexusLearn AI (Ten goc: StudyMate) la du an nguyen ban 100% cua toi. Toi KHONG an cap y tuong, KHONG sao chep chat xam tu bat ky ca nhan hay to chuc nao.** Du an nay duoc tai dinh vi thuong hieu thanh **NexusLearn** de khang dinh vi the doc ton va cat dut moi su nham lan voi cac san pham "trung lap y tuong" ngoai kia.

---

## Tam Nhin va Tinh Nang Noi Bat

NexusLearn AI khong chi la mot cong cu tom tat van ban. Day la mot he sinh thai E-learning thong minh giup **he thong hoa tri thuc** bang cong nghe AI tien tien (Google Gemini 2.5 Flash), voi giao dien chuan SaaS Vercel/Linear cao cap.

- **So Do Tu Duy (Knowledge Map):** Tu dong boc tach tai lieu va ve ra So do tu duy dang node-graph tuong tac 360 do. Giup nguoi hoc nhin thau cau truc kien thuc.
- **He Thong Bai Giang va Flashcards:** Tu dong tao the ghi nho va chia nho bai giang theo cap do (Co ban den Nang cao).
- **Quiz va Danh Gia Nang Luc:** Tu dong sinh bo cau hoi trac nghiem sau moi bai hoc de cung co kien thuc.
- **Tro Ly AI (Global ChatBot):** Chatbot toan he thong ho tro giai dap moi thac mac hoc tap chung.
- **Gia Su Ao AI (Document Tutor):** Tich hop sau vao tung tai lieu, hieu ro ngu canh cua bai giang de giai thich can ke tung khai niem kho.
- **Giao Dien Dang Cap:** Ho tro Dark Mode / Light Mode sieu muot ma voi hieu ung Glassmorphism hien dai.

---

## Cong Nghe Su Dung

- **Frontend:** React (Vite), Tailwind CSS, Framer Motion, Lucide Icons, React Flow (cho Node Graph).
- **Backend:** Node.js, Express, TypeScript.
- **AI Engine:** Google Gemini 2.5 Flash API.
- **Phan Tich Du Lieu:** Xu ly PDF va trich xuat noi dung bang pdf-parse va custom scraping.

---

## Huong Dan Cai Dat va Khoi Chay

Du an duoc chia lam 2 phan doc lap: `backend` va `frontend`. De chay du an tren may cua ban (Localhost), hay lam theo cac buoc sau:

### Yeu Cau Cau Hinh
- Cai dat **Node.js** (Khuyen nghi phien ban v18.x tro len).
- Co API Key cua Google Gemini.

### 1. Khoi chay Backend (May Chu)

1. Mo Terminal va di chuyen vao thu muc `backend`:
   ```bash
   cd backend
   ```
2. Cai dat cac thu vien can thiet:
   ```bash
   npm install
   ```
3. Cau hinh bien moi truong:
   - Tao mot file ten la `.env` o trong thu muc `backend` (Ngang hang voi package.json).
   - Them noi dung sau vao file `.env`:
     ```env
     PORT=3001
     JWT_SECRET=your_super_secret_jwt_key
     GEMINI_API_KEY=your_gemini_api_key_here
     ```
4. Chay server:
   ```bash
   npm run dev
   ```
   Server backend se chay tai dia chi: http://localhost:3001

### 2. Khoi chay Frontend (Giao Dien)

1. Mo mot Terminal moi (Giu nguyen Terminal backend dang chay) va di chuyen vao thu muc `frontend`:
   ```bash
   cd frontend
   ```
2. Cai dat cac thu vien:
   ```bash
   npm install
   ```
3. Chay giao dien nguoi dung:
   ```bash
   npm run dev
   ```
   Website se duoc mo ra tai dia chi: http://localhost:5173 (hoac cong duoc hien thi tren terminal).

---

### Bat Dau Trai Nghiem
Truy cap vao trinh duyet bang duong dan cua Frontend, bam **Bat dau mien phi**, tai len mot file tai lieu bai giang (PDF) va de NexusLearn pho dien suc manh phan tich cua no!

> (c) 2026 NexusLearn AI. All rights reserved.