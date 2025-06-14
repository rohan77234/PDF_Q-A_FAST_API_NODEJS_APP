# PDF Insight AI - Fullstack PDF Q\&A Application

## 📄 Overview

PDF Insight AI is a full-stack AI-powered application that enables users to upload PDF documents and ask natural language questions about their content. The backend processes the documents using modern NLP tools, while the frontend offers a clean and responsive chat-style UI.

---

## 💡 Key Features

* ✉️ Upload PDFs and extract text content
* 🤖 Ask natural language questions about any uploaded document
* 📝 Get accurate, AI-generated answers using the Mistral model via Ollama
* 🔹 Clean chat-style interface for interaction
* 🌐 Runs entirely locally, with data privacy by design

---

## 🚀 Tech Stack

### Backend

* **Framework**: FastAPI
* **NLP**: LangChain + Ollama (Mistral)
* **Embeddings**: HuggingFace MiniLM
* **Vector Store**: ChromaDB
* **Database**: SQLite (documents metadata)
* **PDF Parsing**: PyMuPDF

### Frontend

* **Framework**: React.js
* **Styling**: App.css (CSS3, animations, flex/grid)
* **Utilities**: Axios (HTTP client), React Icons

### External Tools

* **Ollama**: For serving the Mistral language model locally

---

## 📆 Project Structure

```
pdf-insight-ai/
├── backend/
│   ├── main.py           # Backend FastAPI app
│   ├── requirements.txt  # Python dependencies
│   ├── uploads/          # Stores uploaded PDFs
│   ├── storage/          # Stores vector embeddings
│   └── documents.db      # SQLite database
└── frontend/
    ├── src/
    │   ├── App.js        # Main React app logic
    │   └── App.css       # Styling file
    └── ...               # React setup files
```

---

## ⚡ Setup Instructions

### Prerequisites

* Python 3.10+
* Node.js 16+
* Ollama installed ([Download](https://ollama.com/download))
* Mistral model pulled via `ollama pull mistral`

### 1. Clone the Repository & Setup Structure

```bash
mkdir pdf-insight-ai && cd pdf-insight-ai
mkdir backend frontend
```

### 2. Backend Setup

```bash
cd backend
# Copy `main.py` and `requirements.txt` here
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
mkdir uploads storage
uvicorn main:app --reload
```

### 3. Frontend Setup

```bash
cd ../frontend
npx create-react-app .
npm install axios react-icons
# Overwrite src/App.js and src/App.css with provided files
npm start
```

### 4. Run Ollama Server (in another terminal)

```bash
ollama serve
```

---

## 🔎 API Documentation

### Base URL

`http://localhost:8000`

### 1. Upload PDF

* **POST** `/upload`
* **Body**: `multipart/form-data`
* **Param**: `pdf` (file)
* **Response**:

```json
{
  "message": "'sample.pdf' uploaded successfully.",
  "document_id": "uuid-string",
  "filename": "sample.pdf"
}
```

### 2. Ask a Question

* **POST** `/ask`
* **Body**:

```json
{
  "query": "What is the summary?",
  "document_id": "uuid-string"
}
```

* **Response**:

```json
{
  "answer": "The document discusses..."
}
```

### 3. List Uploaded Documents

* **GET** `/documents`
* **Response**:

```json
[
  {
    "id": "uuid-string",
    "filename": "file.pdf",
    "upload_date": "2024-01-01T12:00:00"
  }
]
```

### 4. Document Details

* **GET** `/documents/{document_id}`
* **Response**:

```json
{
  "id": "uuid-string",
  "filename": "file.pdf",
  "upload_date": "2024-01-01T12:00:00"
}
```

---

## 📚 Application Architecture

### System Flow

```
Frontend (React) → Backend (FastAPI) → LangChain + Ollama (Mistral)
                           |
                          ↓
                     ChromaDB (Vectors)
                          ↓
                        SQLite
```

### Document Lifecycle

1. User uploads PDF via UI
2. Text extracted with PyMuPDF
3. Text chunked and embedded (MiniLM)
4. Stored in ChromaDB; metadata stored in SQLite
5. User asks question via frontend
6. Vector search retrieves relevant chunks
7. Mistral model generates answer via Ollama
8. Answer is sent back and shown in chat UI

---

## 🛡️ Handled Edge Cases

* Empty PDFs: Alert and skip processing
* Image-based PDFs: Not supported, alerts user
* File types: Only accepts `.pdf`
* Long PDFs: Chunked + timeout warning
* Unanswerable queries: Graceful fallback message

## ❌ Known Limitations

* No OCR for scanned documents
* No user login/authentication
* Performance degrades with very large files (>50 pages)

---

## ✨ Future Enhancements

* 📝 PDF summarization on upload
* 🔑 User accounts and authentication
* 📰 OCR for image-based PDFs
* ☁️ Cloud file storage (e.g., AWS S3)
* 🌍 Language translation and multi-language support
* ⚙️ Background processing with Celery
* 📃 Export Q\&A as PDF transcript

---

## 🚫 Uninstall Instructions

```bash
# Remove virtual environment
cd backend && deactivate && rm -rf venv

# Delete project directory
cd ../ && rm -rf pdf-insight-ai

# Remove Ollama model
ollama rm mistral
```

---

## 😊 Support / Issues

For help:

1. Check logs in backend console
2. Open GitHub Issues in this repo
3. Confirm Ollama and Mistral are correctly installed

---

**Enjoy exploring your PDFs with AI-powered Q\&A!**
