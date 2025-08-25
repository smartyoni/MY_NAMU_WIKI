import React, { useState } from 'react';
import Header from './components/Layout/Header';
import './App.css';

function App() {
  const [content, setContent] = useState('텍스트를 입력하세요.');

  // LocalStorage에서 문서 불러오기
  const [documents, setDocuments] = useState<Array<{id: string, title: string, content: string}>>(() => {
    const saved = localStorage.getItem('wiki-documents');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentDoc, setCurrentDoc] = useState<{id: string, title: string, content: string} | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 모바일 환경 감지
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 앱 시작시 마지막에 본 문서 로드
  React.useEffect(() => {
    const lastViewedDocId = localStorage.getItem('last-viewed-doc-id');
    if (lastViewedDocId && documents.length > 0) {
      const lastDoc = documents.find(doc => doc.id === lastViewedDocId);
      if (lastDoc) {
        setCurrentDoc(lastDoc);
        setContent(lastDoc.content);
      }
    }
  }, [documents]);

  // 모바일에서 사이드바 외부 클릭시 닫기
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && isSidebarVisible) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && !sidebar.contains(event.target as Node)) {
          setIsSidebarVisible(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isSidebarVisible]);

  // 헤더의 새 문서 버튼을 위한 전역 함수 등록
  React.useEffect(() => {
    window.setIsCreating = (value: boolean) => {
      setIsCreating(value);
    };
    
    return () => {
      delete window.setIsCreating;
    };
  }, []);

  // 문서 목록이 변경될 때마다 LocalStorage에 저장
  React.useEffect(() => {
    localStorage.setItem('wiki-documents', JSON.stringify(documents));
    setLastSaved(new Date());
  }, [documents]);

  const handleCreateDocument = () => {
    if (!newDocTitle.trim()) return;
    
    const newDoc = {
      id: `doc-${Date.now()}`,
      title: newDocTitle,
      content: `새 문서입니다. 내용을 작성해주세요.`
    };
    
    setDocuments(prev => [newDoc, ...prev]);
    setCurrentDoc(newDoc);
setContent(newDoc.content);
    setNewDocTitle('');
    setIsCreating(false);
    setIsEditMode(true); // 새 문서는 편집 모드로 시작
    
    // 마지막에 본 문서 ID 저장
    localStorage.setItem('last-viewed-doc-id', newDoc.id);
  };

  const handleSelectDocument = (doc: {id: string, title: string, content: string}) => {
    setCurrentDoc(doc);
    setContent(doc.content);
    setIsEditMode(false); // 문서 선택시는 읽기 모드
    
    // 마지막에 본 문서 ID 저장
    localStorage.setItem('last-viewed-doc-id', doc.id);
  };

  const handleEditDocument = () => {
    setIsEditMode(true);
  };

  const handleSaveDocument = () => {
    setIsEditMode(false);
    if (currentDoc) {
        setDocuments(prev => prev.map(doc => 
          doc.id === currentDoc.id ? { ...doc, content: content } : doc
        ));
        setCurrentDoc(prev => prev ? { ...prev, content: content } : null);
      }
  };

  const handleDeleteDocument = (docId: string) => {
    if (window.confirm('정말로 이 문서를 삭제하시겠습니까?')) {
      setDocuments(prev => prev.filter(doc => doc.id !== docId));
      // 현재 보고 있는 문서가 삭제되면 선택 해제
      if (currentDoc && currentDoc.id === docId) {
        setCurrentDoc(null);
        setIsEditMode(false);
      }
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    
    if (currentDoc) {
      // 현재 문서 내용 실시간 업데이트
      setCurrentDoc(prev => prev ? { ...prev, content: newContent } : null);
       setDocuments(prev => prev.map(doc => 
        doc.id === currentDoc.id ? { ...doc, content: newContent } : doc
      ));
    }
  };

  return (
    <div className="app">
      <Header toggleSidebar={() => setIsSidebarVisible(true)} />
      <div className="app-body">
        <div 
          className={`sidebar ${(isMobile && isSidebarVisible) || !isMobile ? 'sidebar-visible' : ''}`}
          style={!isMobile ? { width: '250px', background: '#f8f9fa', padding: '20px' } : {}}
        >
          <h3>내 문서 ({documents.length})</h3>
          
          {documents.length > 0 ? (
            <div style={{ marginBottom: '20px' }}>
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    background: currentDoc?.id === doc.id ? '#007bff' : 'white',
                    borderRadius: '4px',
                    border: '1px solid #dee2e6',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    onClick={() => handleSelectDocument(doc)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      color: currentDoc?.id === doc.id ? 'white' : '#495057',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {doc.title}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // 문서 선택 이벤트 방지
                      handleDeleteDocument(doc.id);
                    }}
                    style={{
                      padding: '6px 8px',
                      background: 'transparent',
                      color: currentDoc?.id === doc.id ? 'white' : '#dc3545',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      borderLeft: currentDoc?.id === doc.id ? '1px solid rgba(255,255,255,0.3)' : '1px solid #dee2e6'
                    }}
                    title="문서 삭제"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#6c757d', fontSize: '14px', fontStyle: 'italic', marginBottom: '20px' }}>
              아직 문서가 없습니다.<br />
              첫 문서를 만들어보세요!
            </p>
          )}

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
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  fontSize: '14px',
                  marginBottom: '8px'
                }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleCreateDocument}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  생성
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewDocTitle('');
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
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
                padding: '12px', 
                background: '#28a745', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              + 새 문서
            </button>
          )}
          
          {isMobile && (
            <button
              onClick={() => setIsSidebarVisible(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'transparent',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#6c757d'
              }}
            >
              ✕
            </button>
          )}
        </div>
        
        {isMobile && (
          <>
            <button
              onClick={() => setIsSidebarVisible(true)}
              style={{
                position: 'fixed',
                top: '70px',
                left: '15px',
                width: '50px',
                height: '50px',
                borderRadius: '25px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                zIndex: 999,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              ☰
            </button>
            
            {!currentDoc && (
              <button
                onClick={() => setIsCreating(true)}
                className="fab"
                style={{
                  position: 'fixed',
                  bottom: '20px',
                  right: '20px',
                  width: 'auto',
                  height: 'auto',
                  padding: '16px 24px',
                  borderRadius: '30px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  zIndex: 999,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}
              >
                + 새 문서
              </button>
            )}
          </>
        )}
        
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
                    whiteSpace: 'pre-wrap' // This will respect newlines and spaces
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

export default App;