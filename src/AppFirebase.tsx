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

  const [currentDoc, setCurrentDoc] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // Undo/Redo 상태 관리
  const [history, setHistory] = useState<string[]>([content]);
  const [historyIndex, setHistoryIndex] = useState(0);

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
      
      // 히스토리 초기화
      setHistory([newContent]);
      setHistoryIndex(0);
    } catch (err) {
      console.error('Error creating document:', err);
    }
  };

  const handleSelectDocument = (doc: any) => {
    setCurrentDoc(doc);
    setContent(doc.content);
    setIsEditMode(false);
    selectDocument(doc);
    
    // 히스토리 초기화
    setHistory([doc.content]);
    setHistoryIndex(0);
  };

  const handleEditDocument = () => {
    setIsEditMode(true);
  };

  const handleSaveAndView = async () => {
    if (currentDoc) {
      try {
        await updateDocument(currentDoc.id, { content });
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
    html = html.replace(/\{\{\{fold:([^|]+)\|([^}]+)\}\}\}/g, (_, title, content) => {
      return `<details style="border: 1px solid #dee2e6; border-radius: 4px; margin: 10px 0; padding: 0;">
        <summary style="background: #f8f9fa; padding: 8px 12px; cursor: pointer; font-weight: 500; border-radius: 3px 3px 0 0;">${title.trim()}</summary>
        <div style="padding: 12px;">${content.trim()}</div>
      </details>`;
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
        <Header />
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
        <Header />
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
      <Header />
      <div className="app-body">
        <div style={{ width: '250px', background: '#f8f9fa', padding: '20px' }}>
          <h3>내 문서 ({documents.length})</h3>
          
          {documents.length > 0 ? (
            <div style={{ marginBottom: '20px' }}>
              {documents.map((doc) => (
                <div key={doc.id} style={{ 
                  marginBottom: '8px', 
                  display: 'flex', 
                  alignItems: 'center',
                  background: currentDoc?.id === doc.id ? '#e3f2fd' : 'transparent',
                  padding: '8px',
                  borderRadius: '4px',
                  border: currentDoc?.id === doc.id ? '1px solid #2196f3' : '1px solid transparent'
                }}>
                  <div
                    style={{ 
                      flex: 1, 
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: currentDoc?.id === doc.id ? '600' : '400'
                    }}
                    onClick={() => handleSelectDocument(doc)}
                  >
                    {doc.title}
                  </div>
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    style={{
                      marginLeft: '8px',
                      padding: '2px 6px',
                      fontSize: '12px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '2px',
                      color: '#dc3545'
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
        </div>
        
        {/* 메인 콘텐츠 영역 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {currentDoc ? (
            isEditMode ? (
              // 편집 모드
              <div style={{ flex: 1, display: 'flex' }}>
                {/* 편집기 */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '12px', background: '#f8f9fa', borderBottom: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#6c757d' }}>편집 모드</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ fontSize: '12px', color: '#28a745' }}>
                        📄 {currentDoc.title} ☁️ Firebase 연결됨
                      </div>
                      <button
                        onClick={handleSaveAndView}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          background: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        저장하고 보기
                      </button>
                    </div>
                  </div>
                  
                  {/* 위키 문법 버튼 툴바 */}
                  <div style={{ 
                    padding: '8px 12px', 
                    background: '#fff', 
                    borderBottom: '1px solid #dee2e6', 
                    display: 'flex', 
                    gap: '6px', 
                    flexWrap: 'wrap',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '11px', color: '#6c757d', marginRight: '8px' }}>실행취소:</span>
                    <button
                      onClick={handleUndo}
                      disabled={historyIndex <= 0}
                      style={{
                        ...toolbarButtonStyle,
                        opacity: historyIndex <= 0 ? 0.5 : 1,
                        cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer'
                      }}
                      title="실행취소 (Ctrl+Z)"
                    >
                      ↶
                    </button>
                    <button
                      onClick={handleRedo}
                      disabled={historyIndex >= history.length - 1}
                      style={{
                        ...toolbarButtonStyle,
                        opacity: historyIndex >= history.length - 1 ? 0.5 : 1,
                        cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer'
                      }}
                      title="다시실행 (Ctrl+Y)"
                    >
                      ↷
                    </button>
                    <div style={{ width: '1px', height: '20px', background: '#dee2e6', margin: '0 8px' }}></div>
                    <span style={{ fontSize: '11px', color: '#6c757d', marginRight: '8px' }}>문법:</span>
                    <button
                      onClick={() => insertText('**', '**', '굵은 텍스트')}
                      style={toolbarButtonStyle}
                      title="굵게"
                    >
                      <b>B</b>
                    </button>
                    <button
                      onClick={() => insertText('*', '*', '기울인 텍스트')}
                      style={toolbarButtonStyle}
                      title="기울임"
                    >
                      <i>I</i>
                    </button>
                    <button
                      onClick={() => insertText('~~', '~~', '취소선 텍스트')}
                      style={toolbarButtonStyle}
                      title="취소선"
                    >
                      <s>S</s>
                    </button>
                    <button
                      onClick={() => insertText('== ', ' ==', '제목')}
                      style={toolbarButtonStyle}
                      title="제목"
                    >
                      H
                    </button>
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
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderLeft: '1px solid #dee2e6' }}>
                  <div style={{ padding: '12px', background: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
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
                      
                      <div style={{ 
                        textAlign: 'center', 
                        marginTop: '30px',
                        paddingTop: '15px',
                        borderTop: '1px solid #dee2e6'
                      }}>
                        <button
                          onClick={scrollToTop}
                          style={{
                            padding: '8px 16px',
                            fontSize: '12px',
                            background: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '15px',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          ⬆️ 위로
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // 읽기 모드
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '12px', background: '#f8f9fa', borderBottom: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#6c757d' }}>읽기 모드</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#28a745' }}>
                      📄 {currentDoc.title} ☁️ Firebase 연결됨
                    </div>
                    <button
                      onClick={handleEditDocument}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        background: '#ffc107',
                        color: 'black',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
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
                    
                    <div style={{ 
                      textAlign: 'center', 
                      marginTop: '30px',
                      paddingTop: '15px',
                      borderTop: '1px solid #dee2e6'
                    }}>
                      <button
                        onClick={scrollToTop}
                        style={{
                          padding: '8px 16px',
                          fontSize: '12px',
                          background: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '15px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
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
    </div>
  );
}

export default AppFirebase;