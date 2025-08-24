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
    selectDocument
  } = useDocuments();

  const [content, setContent] = useState(`== Personal Wiki에 오신 것을 환영합니다! ==

**Firebase 연동 완료!** 🔥

== 주요 기능 ==
* **클라우드 저장** - Firebase Firestore
* **실시간 동기화** - 다기기 동기화
* **위키 문법** 지원 (굵게, 기울임, 취소선, 제목)
* **실시간 미리보기** 제공
* **접기/펼치기** 블록: {{{fold:예시|숨겨진 내용이 여기에 들어갑니다}}}
* **실행취소/다시실행** (Ctrl+Z/Ctrl+Y)
* **문법 버튼** 툴바로 쉬운 편집

== 사용 방법 ==
1. 좌측에서 **새 문서** 생성
2. **편집** 버튼으로 내용 수정
3. **자동 클라우드 저장** ☁️
4. **어디서든 접근 가능**

Firebase와 연결되었습니다! 🚀`);

  const [currentDoc, setCurrentDoc] = useState<any>(() => {
    // 새로고침 후에도 현재 문서 상태 유지
    const saved = localStorage.getItem('current-document');
    return saved ? JSON.parse(saved) : null;
  });
  const [isCreating, setIsCreating] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('general');
  const [isEditMode, setIsEditMode] = useState(() => {
    // 새로고침 후에도 편집 모드 상태 유지
    return localStorage.getItem('edit-mode') === 'true';
  });

  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  
  // 카테고리/폴더 관리 상태
  const [categories, setCategories] = useState<Array<{id: string, name: string, color: string}>>(() => {
    const saved = localStorage.getItem('wiki-categories');
    return saved ? JSON.parse(saved) : [
      { id: 'general', name: '일반', color: '#6c757d' },
      { id: 'personal', name: '개인', color: '#28a745' },
      { id: 'work', name: '업무', color: '#007bff' }
    ];
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all'); // 'all' 또는 카테고리 ID
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6c757d');

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  // Undo/Redo 상태 관리
  const [history, setHistory] = useState<string[]>([content]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // 새로고침 시 content 복원
  React.useEffect(() => {
    if (currentDoc && currentDoc.content !== content) {
      setContent(currentDoc.content);
    }
  }, [currentDoc]);

  // 헤더의 새 문서 버튼을 위한 전역 함수 등록
  React.useEffect(() => {
    window.setIsCreating = (value: boolean) => {
      console.log('전역 setIsCreating 호출됨 (Firebase):', value);
      setIsCreating(value);
    };
    
    return () => {
      delete window.setIsCreating;
    };
  }, []);

  // 카테고리 변경시 localStorage에 저장
  React.useEffect(() => {
    localStorage.setItem('wiki-categories', JSON.stringify(categories));
  }, [categories]);

  // 툴바 버튼 스타일
  const toolbarButtonStyle = {
    padding: '4px 8px',
    fontSize: '12px',
    background: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '3px',
    cursor: 'pointer',
    minWidth: '28px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
  };

  const handleCreateDocument = async () => {
    if (!newDocTitle.trim()) return;
    
    try {
      const newContent = `== ${newDocTitle} ==\n\n새 문서입니다. 내용을 작성해주세요.`;
      const id = await createDocument(newDocTitle, newContent);
      
      // 문서 생성 후 카테고리 정보 업데이트
      await updateDocument(id, { category: newDocCategory });
      
      const newDoc = {
        id,
        title: newDocTitle,
        content: newContent,
        category: newDocCategory,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'default-user'
      };
      
      setCurrentDoc(newDoc);
      setContent(newContent);
      setNewDocTitle('');
      setNewDocCategory('general');
      setIsCreating(false);
      setIsEditMode(true);
      
      // 히스토리 초기화
      setHistory([newContent]);
      setHistoryIndex(0);
    } catch (err) {
      console.error('Error creating document:', err);
    }
  };

  // 제목 수정 시작
  const handleStartEditTitle = () => {
    if (currentDoc) {
      setEditingTitle(currentDoc.title);
      setIsEditingTitle(true);
    }
  };

  // 제목 수정 취소
  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    setEditingTitle('');
  };

  // 제목 수정 저장
  const handleSaveTitle = async () => {
    if (!currentDoc || !editingTitle.trim()) return;
    
    try {
      await updateDocument(currentDoc.id, { title: editingTitle.trim() });
      
      const updatedDoc = {
        ...currentDoc,
        title: editingTitle.trim(),
        updatedAt: new Date()
      };
      
      setCurrentDoc(updatedDoc);
      setIsEditingTitle(false);
      setEditingTitle('');
    } catch (err) {
      console.error('Error updating document title:', err);
    }
  };

  // Enter 키로 제목 저장, Escape로 취소
  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      handleCancelEditTitle();
    }
  };

  // 카테고리/폴더 관리 함수들
  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const newCategory = {
      id: `category-${Date.now()}`,
      name: newCategoryName.trim(),
      color: newCategoryColor
    };
    
    setCategories(prev => [...prev, newCategory]);
    setNewCategoryName('');
    setNewCategoryColor('#6c757d');
    setIsCreatingCategory(false);
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (categoryId === 'general') {
      alert('기본 카테고리는 삭제할 수 없습니다.');
      return;
    }
    
    if (window.confirm('이 카테고리를 삭제하시겠습니까? 카테고리 내 모든 문서는 "일반" 카테고리로 이동됩니다.')) {
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      
      // 해당 카테고리의 문서들을 "일반" 카테고리로 이동
      // Firebase에서 문서 업데이트 필요 (나중에 구현)
      
      if (selectedCategory === categoryId) {
        setSelectedCategory('all');
      }
    }
  };

  // 선택된 카테고리에 따라 문서 필터링
  const getFilteredDocuments = () => {
    if (selectedCategory === 'all') {
      return documents;
    }
    return documents.filter(doc => doc.category === selectedCategory);
  };

  const handleSelectDocument = (doc: any) => {
    setCurrentDoc(doc);
    setContent(doc.content);
    setIsEditMode(false);
    selectDocument(doc);
    
    // localStorage에 현재 상태 저장
    localStorage.setItem('current-document', JSON.stringify(doc));
    localStorage.setItem('edit-mode', 'false');
    
    // 히스토리 초기화
    setHistory([doc.content]);
    setHistoryIndex(0);

    if (isSidebarVisible) {
      toggleSidebar();
    }
  };

  const handleEditDocument = () => {
    setIsEditMode(true);
    localStorage.setItem('edit-mode', 'true');
  };

  const handleSaveAndView = async () => {
    if (currentDoc) {
      try {
        await updateDocument(currentDoc.id, { content });
        // 로컬 상태도 즉시 업데이트
        const updatedDoc = { ...currentDoc, content };
        setCurrentDoc(updatedDoc);
        setIsEditMode(false);
        
        // localStorage도 업데이트
        localStorage.setItem('current-document', JSON.stringify(updatedDoc));
        localStorage.setItem('edit-mode', 'false');
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
          // localStorage 정리
          localStorage.removeItem('current-document');
          localStorage.removeItem('edit-mode');
        }
      } catch (err) {
        console.error('Error deleting document:', err);
      }
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    
    // Undo 히스토리 추가
    if (newContent !== history[historyIndex]) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newContent);
      
      if (newHistory.length > 50) {
        newHistory.shift();
      } else {
        setHistoryIndex(historyIndex + 1);
      }
      
      setHistory(newHistory);
    }
  };

  // Undo/Redo 함수들
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousContent = history[newIndex];
      setContent(previousContent);
      setHistoryIndex(newIndex);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextContent = history[newIndex];
      setContent(nextContent);
      setHistoryIndex(newIndex);
    }
  };

  // 키보드 단축키 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey) {
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault();
        handleRedo();
      }
    }
  };

  // 텍스트 삽입/제거 토글 함수
  const insertText = (before: string, after: string, placeholder: string) => {
    const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const beforeStart = start - before.length;
    const afterEnd = end + after.length;
    
    const textBefore = content.substring(Math.max(0, beforeStart), start);
    const textAfter = content.substring(end, Math.min(content.length, afterEnd));
    
    const hasMarkup = textBefore === before && textAfter === after;
    
    let newContent: string;
    let newSelectionStart: number;
    let newSelectionEnd: number;
    
    if (hasMarkup && selectedText) {
      newContent = content.substring(0, beforeStart) + selectedText + content.substring(afterEnd);
      newSelectionStart = beforeStart;
      newSelectionEnd = beforeStart + selectedText.length;
    } else {
      const textToInsert = selectedText || placeholder;
      newContent = content.substring(0, start) + before + textToInsert + after + content.substring(end);
      newSelectionStart = start + before.length;
      newSelectionEnd = newSelectionStart + textToInsert.length;
    }
    
    setContent(newContent);
    handleContentChange(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newSelectionStart, newSelectionEnd);
    }, 0);
  };

  // Wiki 텍스트 파싱
  const parseWikiText = (text: string): string => {
    let html = text;
    
    html = html.replace(/\n/g, '<br>');
    html = html.replace(/==\s*(.+?)\s*==/g, '<h2>$1</h2>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/''(.+?)''/g, '<em>$1</em>');
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
    
    // 접기 블록 처리
    html = html.replace(/\{\{\{fold:([^|]+)\|([^}]+)\}\}\}\}/g, (_, title, content) => {
      return `<details style="border: 1px solid #dee2e6; border-radius: 4px; margin: 10px 0; padding: 0;"><summary style="background: #f8f9fa; padding: 8px 12px; cursor: pointer; font-weight: 500; border-radius: 3px 3px 0 0;">${title.trim()}</summary><div style="padding: 12px;">${content.trim()}</div></details>`;
    });
    
    html = html.replace(/(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #007bff; text-decoration: underline;">$1</a>');
    html = html.replace(/^\*\s(.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    return html;
  };

  const scrollToTop = () => {
    const contentArea = document.querySelector('.document-content');
    const previewArea = document.querySelector('.preview-content');
    
    if (contentArea) {
      contentArea.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (previewArea) {
      previewArea.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
          
          {/* 카테고리 필터 */}
          <div style={{ marginBottom: '15px' }}>
            <div
              onClick={() => setSelectedCategory('all')}
              style={{
                padding: '6px 10px',
                margin: '2px 0',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                backgroundColor: selectedCategory === 'all' ? '#e3f2fd' : 'transparent',
                border: selectedCategory === 'all' ? '1px solid #2196f3' : '1px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📂 모든 문서 ({documents.length})
            </div>
            
            {categories.map(category => {
              const categoryDocs = documents.filter(doc => doc.category === category.id);
              return (
                <div key={category.id} style={{ position: 'relative' }}>
                  <div
                    onClick={() => setSelectedCategory(category.id)}
                    style={{
                      padding: '6px 10px',
                      margin: '2px 0',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      backgroundColor: selectedCategory === category.id ? '#e3f2fd' : 'transparent',
                      border: selectedCategory === category.id ? '1px solid #2196f3' : '1px solid transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <div 
                      style={{ 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        backgroundColor: category.color 
                      }}
                    />
                    {category.name} ({categoryDocs.length})
                  </div>
                  {category.id !== 'general' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(category.id);
                      }}
                      style={{
                        position: 'absolute',
                        right: '5px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#dc3545',
                        cursor: 'pointer',
                        fontSize: '12px',
                        opacity: 0.7
                      }}
                      title="카테고리 삭제"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* 선택된 카테고리의 문서들 */}
          {getFilteredDocuments().length > 0 ? (
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ 
                fontSize: '12px', 
                color: '#6c757d', 
                margin: '0 0 8px 0',
                textTransform: 'uppercase' 
              }}>
                {selectedCategory === 'all' 
                  ? '모든 문서' 
                  : categories.find(c => c.id === selectedCategory)?.name || '문서'}
              </h4>
              {getFilteredDocuments().map((doc) => (
                <div 
                  key={doc.id} 
                  className="document-item"
                  onClick={() => handleSelectDocument(doc)}
                  style={{ cursor: 'pointer' }}
                >
                  {doc.title}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#6c757d', fontSize: '12px', fontStyle: 'italic', margin: '10px 0' }}>
              {selectedCategory === 'all' 
                ? '아직 문서가 없습니다.' 
                : '이 카테고리에 문서가 없습니다.'}
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
                    setNewDocCategory('general');
                  }
                }}
                placeholder="문서 제목"
                className="new-doc-input"
                autoFocus
              />
              <select
                value={newDocCategory}
                onChange={(e) => setNewDocCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  fontSize: '14px',
                  marginBottom: '8px'
                }}
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
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
                    setNewDocCategory('general');
                  }}
                  className="new-doc-btn cancel"
                >
                  취소
                </button>
              </div>
            </div>
          ) : null}
          
          {/* 새 카테고리 생성 */}
          {isCreatingCategory ? (
            <div style={{ marginTop: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>새 카테고리</h4>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateCategory();
                  if (e.key === 'Escape') setIsCreatingCategory(false);
                }}
                placeholder="카테고리 이름"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #dee2e6',
                  borderRadius: '3px',
                  fontSize: '13px',
                  marginBottom: '8px'
                }}
                autoFocus
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', color: '#6c757d' }}>색상:</label>
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  style={{ width: '30px', height: '20px', border: 'none', borderRadius: '3px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={handleCreateCategory}
                  style={{
                    flex: 1,
                    padding: '6px',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  생성
                </button>
                <button
                  onClick={() => setIsCreatingCategory(false)}
                  style={{
                    flex: 1,
                    padding: '6px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
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
              onClick={() => setIsCreatingCategory(true)}
              style={{
                width: '100%',
                padding: '8px',
                background: '#6f42c1',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              + 새 카테고리
            </button>
          )}
        </div>
        
        {/* 메인 콘텐츠 영역 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {currentDoc ? (
            isEditMode ? (
              // 편집 모드
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="mobile-view-switcher">
                  <button onClick={() => setMobileView('editor')} className={mobileView === 'editor' ? 'active' : ''}>편집</button>
                  <button onClick={() => setMobileView('preview')} className={mobileView === 'preview' ? 'active' : ''}>미리보기</button>
                </div>
                <div style={{ flex: 1, display: 'flex' }} className="editor-preview-container">
                  {/* 편집기 */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }} className={`editor-pane ${mobileView !== 'editor' ? 'hidden-mobile' : ''}`}>
                    <div className="editor-header">
                      <span style={{ fontSize: '12px', color: '#6c757d' }}>편집 모드</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {isEditingTitle ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={handleTitleKeyDown}
                              style={{
                                padding: '6px 10px',
                                fontSize: '14px',
                                border: '2px solid #007bff',
                                borderRadius: '4px',
                                outline: 'none',
                                minWidth: '200px'
                              }}
                              autoFocus
                              placeholder="문서 제목을 입력하세요"
                            />
                            <button
                              onClick={handleSaveTitle}
                              style={{
                                padding: '6px 10px',
                                fontSize: '12px',
                                background: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer'
                              }}
                            >
                              저장
                            </button>
                            <button
                              onClick={handleCancelEditTitle}
                              style={{
                                padding: '6px 10px',
                                fontSize: '12px',
                                background: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer'
                              }}
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <div 
                            className="editor-header-title"
                            onClick={handleStartEditTitle}
                            style={{
                              cursor: 'pointer',
                              padding: '6px 10px',
                              borderRadius: '4px',
                              transition: 'background-color 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            title="제목을 클릭하여 수정"
                          >
                            📄 {currentDoc.title}
                            <span style={{ fontSize: '11px', color: '#6c757d' }}>✏️</span>
                          </div>
                        )}
                        <button
                          onClick={() => handleDeleteDocument(currentDoc.id)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                          title="문서 삭제"
                        >
                          🗑️ 삭제
                        </button>
                        <button
                          onClick={handleSaveAndView}
                          className="editor-header-btn"
                        >
                          저장하고 보기
                        </button>
                      </div>
                    </div>
                    
                    {/* 위키 문법 버튼 툴바 */}
                    <div className="editor-toolbar">
                      <span style={{ fontSize: '11px', color: '#6c757d', marginRight: '8px' }}>실행취소:</span>
                      <button
                        onClick={handleUndo}
                        disabled={historyIndex <= 0}
                        style={{...toolbarButtonStyle, opacity: historyIndex <= 0 ? 0.5 : 1, cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer'}}
                        title="실행취소 (Ctrl+Z)"
                      >
                        ↶
                      </button>
                      <button
                        onClick={handleRedo}
                        disabled={historyIndex >= history.length - 1}
                        style={{...toolbarButtonStyle, opacity: historyIndex >= history.length - 1 ? 0.5 : 1, cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer'}}
                        title="다시실행 (Ctrl+Y)"
                      >
                        ↷
                      </button>
                      <div style={{ width: '1px', height: '20px', background: '#dee2e6', margin: '0 8px' }}></div>
                      <span style={{ fontSize: '11px', color: '#6c757d', marginRight: '8px' }}>문법:</span>
                      <button onClick={() => insertText('**', '**', '굵은 텍스트')} style={toolbarButtonStyle} title="굵게"><b>B</b></button>
                      <button onClick={() => insertText('*', '*', '기울인 텍스트')} style={toolbarButtonStyle} title="기울임"><i>I</i></button>
                      <button onClick={() => insertText('~~', '~~', '취소선 텍스트')} style={toolbarButtonStyle} title="취소선"><s>S</s></button>
                      <button onClick={() => insertText('== ', ' ==', '제목')} style={toolbarButtonStyle} title="제목">H</button>
                    </div>
                    
                    <textarea
                      className="editor-textarea"
                      value={content}
                      onChange={(e) => handleContentChange(e.target.value)}
                      onKeyDown={handleKeyDown}
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
                      placeholder="위키 문서를 작성하세요... (텍스트 전용)"
                    />
                  </div>
                  
                  {/* 미리보기 */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderLeft: '1px solid #dee2e6' }} className={`preview-pane ${mobileView !== 'preview' ? 'hidden-mobile' : ''}`}>
                    <div className="preview-header">
                      <span style={{ fontSize: '12px', color: '#6c757d' }}>미리보기</span>
                    </div>
                    <div 
                      className="preview-content"
                      style={{
                        flex: 1,
                        overflow: 'auto',
                        overflowY: 'scroll',
                        lineHeight: '1.6',
                        fontSize: '14px',
                        maxHeight: 'calc(100vh - 140px)',
                        position: 'relative'
                      }}
                    >
                      <div style={{ padding: '20px', paddingBottom: '60px' }}>
                        <div dangerouslySetInnerHTML={{ __html: parseWikiText(content) }} />
                        
                        <div style={{ textAlign: 'center', marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #dee2e6'}}>
                          <button onClick={scrollToTop} className="scroll-top-btn">
                            ⬆️ 위로
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // 읽기 모드
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="editor-header">
                  <span style={{ fontSize: '12px', color: '#6c757d' }}>읽기 모드</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isEditingTitle ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={handleTitleKeyDown}
                          style={{
                            padding: '6px 10px',
                            fontSize: '14px',
                            border: '2px solid #007bff',
                            borderRadius: '4px',
                            outline: 'none',
                            minWidth: '200px'
                          }}
                          autoFocus
                          placeholder="문서 제목을 입력하세요"
                        />
                        <button
                          onClick={handleSaveTitle}
                          style={{
                            padding: '6px 10px',
                            fontSize: '12px',
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer'
                          }}
                        >
                          저장
                        </button>
                        <button
                          onClick={handleCancelEditTitle}
                          style={{
                            padding: '6px 10px',
                            fontSize: '12px',
                            background: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer'
                          }}
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <div 
                        className="editor-header-title"
                        onClick={handleStartEditTitle}
                        style={{
                          cursor: 'pointer',
                          padding: '6px 10px',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        title="제목을 클릭하여 수정"
                      >
                        📄 {currentDoc.title}
                        <span style={{ fontSize: '11px', color: '#6c757d' }}>✏️</span>
                      </div>
                    )}
                    <button
                      onClick={handleEditDocument}
                      className="editor-header-btn edit"
                    >
                      편집
                    </button>
                  </div>
                </div>
                <div 
                  className="document-content"
                  style={{
                    flex: 1,
                    overflow: 'auto',
                    overflowY: 'scroll',
                    lineHeight: '1.6',
                    fontSize: '14px',
                    maxHeight: 'calc(100vh - 100px)',
                    position: 'relative'
                  }}
                >
                  <div style={{ padding: '20px', paddingBottom: '60px' }}>
                    <div dangerouslySetInnerHTML={{ __html: parseWikiText(currentDoc.content) }} />
                    
                    <div style={{ textAlign: 'center', marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #dee2e6'}}>
                      <button onClick={scrollToTop} className="scroll-top-btn">
                        ⬆️ 위로
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : (
            // 기본 화면
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '12px', background: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
                <span style={{ fontSize: '12px', color: '#6c757d' }}>☁️ Firebase 연결됨</span>
              </div>
              <div 
                style={{
                  flex: 1,
                  overflow: 'auto',
                  overflowY: 'scroll',
                  lineHeight: '1.6',
                  fontSize: '14px',
                  maxHeight: 'calc(100vh - 100px)'
                }}
              >
                <div style={{ padding: '20px' }}>
                  <div dangerouslySetInnerHTML={{ __html: parseWikiText(content) }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <button onClick={() => { setIsCreating(true); if (!isSidebarVisible) { toggleSidebar(); } }} className="fab">
        새 문서
      </button>
    </div>
  );
}

export default AppFirebase;