# Lumina 1.0 | AI-Driven Neural Backend

Lumina 1.0 is a high-performance AI ecosystem designed for real-time natural language synthesis, document analysis (RAG), and generative architectural imaging. It utilizes a modular Node.js architecture with integrated vector embeddings and PDF/Docx parsing capabilities.

## 🚀 Core Features

* **Neural Chat Interface:** Real-time message exchange with persistent history.
* **Architect Mode:** Generative image synthesis using the Flux/Stable Diffusion engine via Hugging Face.
* **RAG System (Retrieval-Augmented Generation):** Deep analysis of PDF, DOCX, and TXT files using local vector indexing.
* **Protocol Management:** Create, rename, and delete chat threads (Protocols).
* **Multi-Sector Access:** Support for Room-based collaboration and private sectors.

---

## 🛠 Tech Stack

* **Runtime:** Node.js (v18+)
* **Framework:** Express.js
* **Database:** MongoDB (Mongoose ODM)
* **Parsing:** `pdf2json` (PDF), `mammoth` (Word), `multer` (File handling)
* **AI Integration:** Hugging Face Inference API
* **Vector Engine:** Similarity-based chunk indexing for document context.

---

## 📂 Project Structure

```text
├── config/             # Database and Environment configuration
├── controllers/        # Business logic (chat, user)
├── middleware/         # Multer, Auth, and Error handling
├── models/             # Mongoose schemas (Message, User, Room)
├── routes/             # API Endpoint definitions
├── services/           # Neural logic (hf.service, rag.service, vector.service)
└── utils/              # Parsers and Helper functions
```
---

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://huggingface.co/spaces/BatoolAmina/Lumina-Backend
cd Lumina-Backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a .env file in the root directory and add:
```bash
PORT=5000
MONGO_URI=your_mongodb_connection_string
HF_TOKEN=your_hugging_face_api_token
JWT_SECRET=your_secure_jwt_secret
```

### 4. Start the Neural Engine
Development Mode (with nodemon)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```


**FRONTEND** is at https://lumina-chatbot-app-by-batool.vercel.app