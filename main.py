import os
import uuid
import sqlite3
import warnings
from datetime import datetime
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_chroma import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.llms import Ollama
from langchain.chains import RetrievalQA
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import PromptTemplate
import fitz  # PyMuPDF

# Suppress warnings
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)

# === Configuration ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
STORAGE_DIR = os.path.join(BASE_DIR, "storage")
DB_FILE = os.path.join(BASE_DIR, "documents.db")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(STORAGE_DIR, exist_ok=True)

# === FastAPI App ===
app = FastAPI(title="PDF Insight AI", version="1.5")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Database Initialization ===
def init_db():
    with sqlite3.connect(DB_FILE) as conn:
        conn.execute('''CREATE TABLE IF NOT EXISTS documents
                        (id TEXT PRIMARY KEY, filename TEXT, upload_date TEXT)''')

init_db()

# === Pydantic Models ===
class QuestionRequest(BaseModel):
    query: str
    document_id: str

class UploadResponse(BaseModel):
    message: str
    document_id: str
    filename: str

class AnswerResponse(BaseModel):
    answer: str

class DocumentResponse(BaseModel):
    id: str
    filename: str
    upload_date: str

# === Utility Functions ===
def extract_text_from_pdf(path: str) -> str:
    doc = fitz.open(path)
    return "\n".join([page.get_text() for page in doc])

def save_document_metadata(filename: str) -> str:
    doc_id = str(uuid.uuid4())
    with sqlite3.connect(DB_FILE) as conn:
        conn.execute("INSERT INTO documents VALUES (?, ?, ?)",
                     (doc_id, filename, datetime.now().isoformat()))
    return doc_id

def get_index_path(doc_id: str) -> str:
    return os.path.join(STORAGE_DIR, doc_id)

# Custom prompt template for better answers
PROMPT_TEMPLATE = """
You are an expert at analyzing PDF documents. Use the following context to answer the user's question.
If the question cannot be answered based on the context, politely say you don't know. Do not make up answers.
Provide clear, concise responses with bullet points when appropriate.

Context: {context}

Question: {question}

Helpful Answer:
"""

CUSTOM_PROMPT = PromptTemplate(
    template=PROMPT_TEMPLATE,
    input_variables=["context", "question"]
)

# Text splitter for better chunking
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len
)

# === API Endpoints ===
@app.post("/upload", response_model=UploadResponse)
async def upload_pdf(pdf: UploadFile = File(...)):
    if not pdf.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    # Generate unique filename to prevent conflicts
    unique_id = uuid.uuid4().hex
    filename = f"{unique_id}_{pdf.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    try:
        # Save PDF file
        with open(file_path, "wb") as f:
            f.write(await pdf.read())
        
        # Process PDF
        text = extract_text_from_pdf(file_path)
        doc_id = save_document_metadata(pdf.filename)

        # Split text into chunks
        chunks = text_splitter.split_text(text)
        
        # Save chunks to separate files
        for i, chunk in enumerate(chunks):
            chunk_path = os.path.join(UPLOAD_DIR, f"{doc_id}_chunk{i}.txt")
            with open(chunk_path, "w", encoding="utf-8") as f:
                f.write(chunk)

        # Load all chunks
        documents = []
        for i in range(len(chunks)):
            loader = TextLoader(os.path.join(UPLOAD_DIR, f"{doc_id}_chunk{i}.txt"))
            documents.extend(loader.load())

        # Create vector store
        embedding = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        
        # ChromaDB automatically persists when directory is specified
        Chroma.from_documents(
            documents=documents, 
            embedding=embedding, 
            persist_directory=get_index_path(doc_id)
        )

        return UploadResponse(
            message=f"'{pdf.filename}' uploaded successfully. Ask me anything about it!",
            document_id=doc_id,
            filename=pdf.filename
        )
    except Exception as e:
        # Cleanup on error
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask", response_model=AnswerResponse)
async def ask_question(request: QuestionRequest):
    index_path = get_index_path(request.document_id)
    if not os.path.exists(index_path):
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        embedding = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        vectordb = Chroma(persist_directory=index_path, embedding_function=embedding)
        
        # Dynamically determine the max k value
        collection_count = vectordb._collection.count()
        k_value = min(4, collection_count) if collection_count > 0 else 1
        
        retriever = vectordb.as_retriever(search_kwargs={"k": k_value})
        
        # Use the latest Ollama import
        llm = Ollama(model="mistral", temperature=0.2)
        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            retriever=retriever,
            chain_type="stuff",
            chain_type_kwargs={"prompt": CUSTOM_PROMPT},
            return_source_documents=False
        )
        
        result = qa_chain.invoke({"query": request.query})
        return AnswerResponse(answer=result["result"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ... [rest of endpoints unchanged] ...

@app.get("/documents", response_model=list[DocumentResponse])
def list_documents():
    with sqlite3.connect(DB_FILE) as conn:
        result = conn.execute("SELECT id, filename, upload_date FROM documents").fetchall()
        return [DocumentResponse(id=row[0], filename=row[1], upload_date=row[2]) for row in result]

@app.get("/documents/{document_id}", response_model=DocumentResponse)
def get_document(document_id: str):
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, filename, upload_date FROM documents WHERE id=?", (document_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Document not found")
        return DocumentResponse(id=row[0], filename=row[1], upload_date=row[2])

@app.get("/")
def root():
    return {"message": "PDF Insight AI API v1.4"}