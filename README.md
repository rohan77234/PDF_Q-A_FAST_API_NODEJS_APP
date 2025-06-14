## Overview

PDF Insight AI is a full-stack application that allows users to upload PDF documents and ask questions about their content. The application uses natural language processing to analyze PDFs and provide accurate answers to user queries. It features a modern UI with smooth animations, drag-and-drop functionality, and a conversational interface.

![Application Screenshot](screenshot.png)

## Key Features

- **PDF Upload**: Drag-and-drop or click-to-upload PDF documents
- **Natural Language Queries**: Ask questions about uploaded documents
- **Conversational Interface**: Chat-style interaction with AI assistant
- **Document Management**: Switch between multiple uploaded documents
- **Responsive Design**: Works on desktop and mobile devices
- **Dynamic Backgrounds**: Smooth gradient transitions for visual appeal
- **Real-time Feedback**: Processing indicators and error messages

## Technology Stack

### Backend
- **Framework**: FastAPI
- **NLP Processing**: LangChain, Ollama (Mistral model)
- **Vector Database**: ChromaDB
- **Text Embeddings**: HuggingFace (all-MiniLM-L6-v2)
- **PDF Processing**: PyMuPDF
- **Database**: SQLite
- **Other**: Python 3.10+

### Frontend
- **Framework**: React.js
- **UI Library**: React Icons
- **HTTP Client**: Axios
- **Styling**: CSS3 with modern features (flexbox, grid, animations)

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 16+
- Ollama installed and running (with Mistral model: `ollama pull mistral`)
- SQLite (usually included with Python)

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/rohan77234/PDF_Q-A_FAST_API_NODEJS_APP
   cd pdf-insight-ai/backend
   ```

2. Create and activate virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   venv\Scripts\activate    # Windows
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create necessary directories:
   ```bash
   mkdir uploads storage
   ```

5. Start the backend server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser at: `http://localhost:3000`

## API Documentation

### Base URL
`http://localhost:8000`

### Endpoints

#### 1. Upload PDF
- **Endpoint**: `POST /upload`
- **Description**: Upload a PDF file for processing
- **Request**:
  ```http
  POST /upload
  Content-Type: multipart/form-data
  ```
- **Parameters**:
  - `pdf` (file): PDF file to upload
- **Response** (Success 200):
  ```json
  {
    "message": "'filename.pdf' uploaded successfully. Ask me anything about it!",
    "document_id": "uuid-string",
    "filename": "filename.pdf"
  }
  ```

#### 2. Ask Question
- **Endpoint**: `POST /ask`
- **Description**: Ask a question about an uploaded document
- **Request**:
  ```http
  POST /ask
  Content-Type: application/json
  ```
  ```json
  {
    "query": "What is this document about?",
    "document_id": "uuid-string"
  }
  ```
- **Response** (Success 200):
  ```json
  {
    "answer": "The document discusses..."
  }
  ```

#### 3. List Documents
- **Endpoint**: `GET /documents`
- **Description**: List all uploaded documents
- **Response** (Success 200):
  ```json
  [
    {
      "id": "uuid-string",
      "filename": "filename.pdf",
      "upload_date": "2023-10-15T12:34:56.789"
    }
  ]
  ```

#### 4. Get Document Details
- **Endpoint**: `GET /documents/{document_id}`
- **Description**: Get metadata for a specific document
- **Response** (Success 200):
  ```json
  {
    "id": "uuid-string",
    "filename": "filename.pdf",
    "upload_date": "2023-10-15T12:34:56.789"
  }
  ```

## Application Architecture

### System Overview
```
Frontend (React) → Backend (FastAPI) → NLP Processing (LangChain/Ollama)
                         │
                         ↓
                     ChromaDB (Vector Store)
                         │
                         ↓
                     SQLite (Metadata)
```

### Workflow
1. **PDF Upload**:
   - User uploads PDF through frontend
   - Backend saves PDF, extracts text, and splits into chunks
   - Text chunks are converted to embeddings and stored in ChromaDB
   - Document metadata is stored in SQLite

2. **Question Answering**:
   - User submits question about a document
   - Backend retrieves relevant text chunks using semantic search
   - Mistral LLM generates answer based on context
   - Answer is returned to frontend and displayed

3. **Document Management**:
   - User can view list of uploaded documents
   - User can switch between documents for Q&A

### Key Components
- **Text Processing**: PyMuPDF for PDF text extraction
- **Embeddings**: HuggingFace sentence transformers
- **Vector Storage**: ChromaDB for efficient similarity search
- **LLM Inference**: Ollama with Mistral model for answer generation
- **State Management**: React hooks for UI state
- **API Communication**: Axios for frontend-backend interaction

## Edge Cases and Known Limitations

### Handled Edge Cases
1. **Empty PDFs**: 
   - Detection: Checks if extracted text is empty
   - Response: "The uploaded PDF appears to be empty or contains no text"

2. **Image-based PDFs**:
   - Limitation: Cannot extract text from scanned documents
   - Response: "This PDF appears to be image-based. Please upload a text-based PDF"

3. **Large PDFs**:
   - Chunking: Splits documents into 1000-character chunks
   - Timeout: 30-second timeout for processing
   - Response: "Processing is taking longer than expected. Please try a smaller document"

4. **Unanswerable Questions**:
   - Detection: When context doesn't contain relevant information
   - Response: "I don't have enough information to answer that question based on this document"

5. **Unsupported File Types**:
   - Validation: Accepts only .pdf files
   - Response: "Only PDF files are supported"

### Current Limitations
1. **Image-based PDFs**: Cannot process scanned documents (OCR not implemented)
2. **Large Documents**: PDFs >50 pages may have performance issues
3. **Complex Layouts**: Tables and complex formatting may not be preserved
4. **Language Support**: Primarily optimized for English content
5. **Security**: No user authentication in current implementation

## Future Improvements

1. **OCR Integration**: Add support for scanned documents using Tesseract OCR
2. **Document Summarization**: Generate automatic summaries of uploaded documents
3. **User Authentication**: Add login system to persist documents per user
4. **Cloud Storage**: Integrate AWS S3 for document storage
5. **Enhanced UI**:
   - Document preview functionality
   - Searchable question history
   - Export conversation as PDF
6. **Performance Optimization**:
   - Background processing with Celery
   - Caching frequent questions
   - Batch processing of documents
7. **Multi-language Support**: Add language detection and translation capabilities

