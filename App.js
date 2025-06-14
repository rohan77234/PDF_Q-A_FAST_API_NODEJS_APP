import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FiSend, FiPaperclip, FiX, FiFile, FiLoader } from 'react-icons/fi';
import { FaRobot, FaUserAlt } from 'react-icons/fa';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    {
      sender: 'AI',
      text: "Hello! I'm your PDF assistant. Upload a PDF to get started.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  
  // Background gradients
  const backgrounds = [
    'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    'linear-gradient(135deg, #e0f7fa 0%, #bbdefb 100%)',
    'linear-gradient(135deg, #f8f9fa 0%, #d7e3fc 100%)',
    'linear-gradient(135deg, #fff8f8 0%, #ffebee 100%)'
  ];

  // Animated background rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setBackgroundIndex((prev) => (prev + 1) % backgrounds.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [backgrounds.length]); // Fixed dependency warning

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  // Fetch documents on mount
  const fetchDocuments = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8000/documents');
      setDocuments(response.data);
      if (response.data.length > 0 && !selectedDoc) {
        setSelectedDoc(response.data[0].id);
      }
    } catch (error) {
      addAIMessage('Failed to load documents. Please try again later.');
    }
  }, [selectedDoc]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Add AI message helper
  const addAIMessage = (text) => {
    const aiMessage = {
      sender: 'AI',
      text: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, aiMessage]);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setFileInfo({ name: file.name, size: file.size });
      uploadFile(file);
    } else {
      addAIMessage('Please upload a PDF file (only .pdf format is supported).');
    }
    e.target.value = null;
  };

  // Upload file to backend
  const uploadFile = async (file) => {
    if (!file) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await axios.post(
        'http://localhost:8000/upload', 
        formData, 
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 30000
        }
      );
      
      addAIMessage(response.data.message);
      await fetchDocuments();
      setSelectedDoc(response.data.document_id);
      setFileInfo(null);
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 
                      error.message || 
                      'Failed to upload document. Please try again.';
      addAIMessage(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Send message handler
  const handleSend = async () => {
    const question = input.trim();
    if (!question || isProcessing) return;

    if (!selectedDoc) {
      addAIMessage('Please upload a PDF document first.');
      return;
    }

    // Add user message
    const userMessage = {
      sender: 'user',
      text: question,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      // Send question to backend
      const response = await axios.post('http://localhost:8000/ask', {
        query: question,
        document_id: selectedDoc
      });

      // Add AI response
      addAIMessage(response.data.answer);
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 
                      error.message || 
                      "I'm having trouble answering that. Please try again.";
      addAIMessage(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Clear selected file
  const clearFile = () => {
    setFileInfo(null);
  };

  // Open file dialog
  const openFileDialog = () => {
    fileInputRef.current.click();
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div 
      className="app" 
      style={{ background: backgrounds[backgroundIndex] }}
    >
      <div className="chat-container">
        <div className="header">
          <div className="logo">
            <FaRobot className="robot-icon" />
            <h1>PDF Insight AI</h1>
          </div>
          <div className="document-selector">
            <select 
              value={selectedDoc} 
              onChange={(e) => setSelectedDoc(e.target.value)}
              disabled={isProcessing || documents.length === 0}
            >
              <option value="">Select a document</option>
              {documents.map(doc => (
                <option key={doc.id} value={doc.id}>
                  {doc.filename}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="messages">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`message ${msg.sender.toLowerCase()}`}
            >
              <div className="avatar">
                {msg.sender === 'AI' ? <FaRobot /> : <FaUserAlt />}
              </div>
              <div className="content">
                <div className="text">{msg.text}</div>
                <div className="timestamp">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        {fileInfo && (
          <div className="file-info">
            <FiFile className="file-icon" />
            <div className="file-details">
              <div className="filename">{fileInfo.name}</div>
              <div className="filesize">{formatFileSize(fileInfo.size)}</div>
            </div>
            <button onClick={clearFile} disabled={isProcessing}>
              <FiX />
            </button>
          </div>
        )}
        
        <div className="input-area">
          <button 
            className="attachment-btn" 
            onClick={openFileDialog} 
            disabled={isProcessing}
          >
            <FiPaperclip />
            <input 
              type="file" 
              ref={fileInputRef}
              style={{ display: 'none' }} 
              onChange={handleFileChange}
              accept=".pdf"
            />
          </button>
          
          <div className="text-input-container">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask something about your PDF..."
              disabled={isProcessing}
              rows={1}
            />
            <div className="hint">Shift + Enter for new line</div>
          </div>
          
          <button 
            className="send-btn" 
            onClick={handleSend} 
            disabled={isProcessing || !input.trim()}
          >
            {isProcessing ? (
              <FiLoader className="spinner" />
            ) : (
              <FiSend />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;