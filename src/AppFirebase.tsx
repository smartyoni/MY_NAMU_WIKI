import React, { useState } from 'react';
import Header from './components/Layout/Header';
import { useDocuments } from './context/DocumentContextFirebase';
import './App.css';

function AppFirebase() {
  const {
    documents,
    loading,
    error,
    createDocument,
    updateDocument,
    deleteDocument,
    selectDocument,
  } = useDocuments();

  const [content, setContent] = useState('텍스트를 입력하세요.');
  const [currentDoc, setCurrentDoc] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  // 헤더의 새 문서 버튼을 위한 전역 함수 등록
  React.useEffect(() => {
    window.setIsCreating = (value: boolean) => {
      setIsCreating(value);
    };
    
    return () => {
      delete window.setIsCreating;
    };
  }, []);

  const handleCreateDocument = async () => {
    if (!newDocTitle.trim()) return;
    
    try {
      const newContent = `새 문서입니다. 내용을 작성해주세요.`;
      const id = await createDocument(newDocTitle, newContent);
      
      const newDoc = {
        id,
        title: newDocTitle,
        content: newContent,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'default-user'
      };
      
      setCurrentDoc(newDoc);
      setContent(newContent);
      setNewDocTitle('');
      setIsCreating(false);
      setIsEditMode(true);
    } catch (err) {
      console.error('Error creating document:', err);
    }
  };

  const handleSelectDocument = (doc: any) => {
    setCurrentDoc(doc);
    setContent(doc.content);
    setIsEditMode(false);
    selectDocument(doc);

    if (isSidebarVisible) {
      toggleSidebar();
    }
  };

  const handleEditDocument = () => {
    setIsEditMode(true);
  };

  const handleSaveDocument = async () => {
    if (currentDoc) {
      try {
        await updateDocument(currentDoc.id, { content });
        const updatedDoc = { ...currentDoc, content };
        setCurrentDoc(updatedDoc);
        setIsEditMode(false);
      } catch (err) {
        console.error('Error saving document:', err);
      }
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (window.confirm('정말로 이 문서를 삭제하시겠습니까?')) {
      try {
        await deleteDocument(docId);
        if (currentDoc && currentDoc.id === docId) {
          setCurrentDoc(null);
          setIsEditMode(false);
        }
      } catch (err) {
        console.error('Error deleting document:', err);
      }
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  if (loading) {
    return (
      <div className="app">
        <Header toggleSidebar={toggleSidebar} />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div>🔥 Firebase 연결 중...</div>
            <div style={{ marginTop: '10px', fontSize: '14px', color: '#6c757d' }}>잠시만 기다려주세요</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <Header toggleSidebar={toggleSidebar} />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <div style={{ textAlign: 'center', color: '#dc3545' }}>
            <div>❌ 오류 발생</div>
            <div style={{ marginTop: '10px', fontSize: '14px' }}>{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header toggleSidebar={toggleSidebar} />
      <div className="app-body">
        <div className={`sidebar ${isSidebarVisible ? 'sidebar-visible' : ''}`}>
          <h3>📁 문서 폴더</h3>
          
          <div style={{ marginBottom: '15px' }}>
            {documents.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => handleSelectDocument(doc)}
                  className={`document-item ${currentDoc?.id === doc.id ? 'active' : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  {doc.title}
                </div>
            ))}
          </div>

          {isCreating ? (
            <div>
              <input
                type="text"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateDocument();
                  if (e.key === 'Escape') {
                    setIsCreating(false);
                    setNewDocTitle('');
                  }
                }}
                placeholder="문서 제목"
                className="new-doc-input"
                autoFocus
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleCreateDocument}
                  className="new-doc-btn confirm"
                >
                  생성
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewDocTitle('');
                  }}
                  className="new-doc-btn cancel"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              style={{
                width: '100%',
                padding: '8px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              + 새 문서
            </button>
          )}
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {currentDoc ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px', background: '#f8f9fa', borderBottom: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#212529' }}>📄 {currentDoc.title}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {isEditMode ? (
                  <button
                    onClick={handleSaveDocument}
                    style={{
                      padding: '8px 16px',
                      fontSize: '14px',
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    💾 저장
                  </button>
                ) : (
                  <button
                    onClick={handleEditDocument}
                    style={{
                      padding: '8px 16px',
                      fontSize: '14px',
                      background: '#ffc107',
                      color: '#212529',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    ✏️ 편집
                  </button>
                )}
                <button
                  onClick={() => handleDeleteDocument(currentDoc.id)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  🗑️ 삭제
                </button>
              </div>
            </div>
            {isEditMode ? (
              <textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                style={{
                  flex: 1,
                  padding: '20px',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'Courier New, monospace',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  resize: 'none'
                }}
                placeholder="내용을 입력하세요..."
              />
            ) : (
              <div
                style={{
                  flex: 1,
                  padding: '20px',
                  lineHeight: '1.8',
                  fontSize: '15px',
                  backgroundColor: 'white',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {content}
              </div>
            )}
          </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa' }}>
              <div style={{ textAlign: 'center', color: '#6c757d' }}>
                <h2>My Wiki</h2>
                <p>왼쪽에서 문서를 선택하거나 새 문서를 만들어보세요.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AppFirebase;
