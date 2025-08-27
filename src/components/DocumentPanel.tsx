import React, { useState, useEffect, useRef } from 'react';
import { useDocuments } from '../context/DocumentContextFirebase';
import EditorToolbar from './EditorToolbar';
import ConfirmModal from './ConfirmModal';
import './DocumentPanel.css';

interface DocumentPanelProps {
  className?: string;
}

interface HeaderInfo {
  level: number;
  text: string;
  id: string;
  number: string;
}

const DocumentPanel: React.FC<DocumentPanelProps> = ({ className = '' }) => {
  const { 
    uiState,
    updateDocument,
    deleteDocument,
    reorderDocument,
    getSelectedDocument,
    toggleFavorite
  } = useDocuments();

  const [isEditMode, setIsEditMode] = useState(false);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [showTOC, setShowTOC] = useState(false);
  const [headers, setHeaders] = useState<HeaderInfo[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentViewerRef = useRef<HTMLDivElement>(null);

  const selectedDocument = getSelectedDocument();

  useEffect(() => {
    if (selectedDocument) {
      setContent(selectedDocument.content);
      setTitle(selectedDocument.title);
      
      // 빠른메모이고 내용이 비어있으면 편집모드로 시작
      const isQuickMemo = selectedDocument.title.startsWith('메모 ');
      const isEmpty = !selectedDocument.content || selectedDocument.content.trim() === '';
      
      if (isQuickMemo && isEmpty) {
        setIsEditMode(true);
      } else {
        setIsEditMode(false);
      }
    } else {
      setContent('');
      setTitle('');
      setIsEditMode(false);
    }
  }, [selectedDocument]);

  // 내용이 변경될 때마다 헤더 추출
  useEffect(() => {
    const extractedHeaders = extractHeaders(content);
    setHeaders(extractedHeaders);
  }, [content]);


  const handleSave = async () => {
    if (!selectedDocument) return;
    
    try {
      const updateData: any = {
        title: title.trim(),
        content: content
      };
      
      // 즐겨찾기 정보가 있다면 보존
      if (selectedDocument.isFavorite === true) {
        updateData.isFavorite = selectedDocument.isFavorite;
        if (selectedDocument.favoriteOrder !== undefined) {
          updateData.favoriteOrder = selectedDocument.favoriteOrder;
        }
      }
      
      await updateDocument(selectedDocument.id, updateData);
      setIsEditMode(false);
    } catch (error) {
      console.error('문서 저장 실패:', error);
    }
  };

  const handleCancel = () => {
    if (selectedDocument) {
      setContent(selectedDocument.content);
      setTitle(selectedDocument.title);
    }
    setIsEditMode(false);
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleDelete = () => {
    if (!selectedDocument) return;
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDocument) return;
    
    try {
      await deleteDocument(selectedDocument.id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('문서 삭제 실패:', error);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleTitleSave = async () => {
    if (!selectedDocument || !title.trim()) return;
    
    try {
      await updateDocument(selectedDocument.id, { title: title.trim() });
    } catch (error) {
      console.error('제목 수정 실패:', error);
    }
  };

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error('복사 실패:', error);
    }
  };

  const handleGoToBottom = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      textarea.scrollTop = textarea.scrollHeight;
    }
  };

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedDocument) return;
    
    try {
      await toggleFavorite(selectedDocument.id);
    } catch (error) {
      console.error('즐겨찾기 토글 실패:', error);
    }
  };

  // 헤더 추출 및 넘버링 함수
  const extractHeaders = (text: string): HeaderInfo[] => {
    if (!text) return [];
    
    const lines = text.split('\n');
    const headerList: HeaderInfo[] = [];
    const numberStack = [0, 0, 0]; // H1, H2, H3 카운터
    
    lines.forEach((line, index) => {
      // <summary>로 시작하는 줄에서 헤딩 찾기
      if (line.trim().startsWith('<summary>')) {
        const summaryContent = line.replace(/<\/?summary>/g, '').trim();
        if (summaryContent.startsWith('#')) {
          let level = 0;
          let text = '';
          
          if (summaryContent.startsWith('### ')) {
            level = 3;
            text = summaryContent.slice(4).trim();
            numberStack[2]++;
          } else if (summaryContent.startsWith('## ')) {
            level = 2;
            text = summaryContent.slice(3).trim();
            numberStack[1]++;
            numberStack[2] = 0;
          } else if (summaryContent.startsWith('# ')) {
            level = 1;
            text = summaryContent.slice(2).trim();
            numberStack[0]++;
            numberStack[1] = 0;
            numberStack[2] = 0;
          }
          
          if (level > 0) {
            const id = `header-${index}-${text.replace(/\s+/g, '-').toLowerCase()}`;
            const number = level === 1 ? `${numberStack[0]}.` : 
                          level === 2 ? `${numberStack[0]}.${numberStack[1]}` :
                          `${numberStack[0]}.${numberStack[1]}.${numberStack[2]}`;
            
            headerList.push({
              level,
              text,
              id,
              number
            });
          }
        }
      }
      // 일반 헤딩 처리
      else if (line.startsWith('# ')) {
        numberStack[0]++;
        numberStack[1] = 0;
        numberStack[2] = 0;
        const text = line.slice(2).trim();
        const id = `header-${index}-${text.replace(/\s+/g, '-').toLowerCase()}`;
        headerList.push({
          level: 1,
          text,
          id,
          number: `${numberStack[0]}.`
        });
      } else if (line.startsWith('## ')) {
        numberStack[1]++;
        numberStack[2] = 0;
        const text = line.slice(3).trim();
        const id = `header-${index}-${text.replace(/\s+/g, '-').toLowerCase()}`;
        headerList.push({
          level: 2,
          text,
          id,
          number: `${numberStack[0]}.${numberStack[1]}`
        });
      } else if (line.startsWith('### ')) {
        numberStack[2]++;
        const text = line.slice(4).trim();
        const id = `header-${index}-${text.replace(/\s+/g, '-').toLowerCase()}`;
        headerList.push({
          level: 3,
          text,
          id,
          number: `${numberStack[0]}.${numberStack[1]}.${numberStack[2]}`
        });
      }
    });
    
    return headerList;
  };

  // 목차 스크롤 함수
  const scrollToHeader = (headerId: string) => {
    const element = document.getElementById(headerId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const renderMarkdown = (text: string) => {
    if (!text) return '내용이 없습니다.';
    
    const lines = text.split('\n');
    const result: React.ReactNode[] = [];
    const numberStack = [0, 0, 0]; // H1, H2, H3 카운터
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      let element: React.ReactNode = null;
      
      // <details> 블록 처리
      if (line.trim().startsWith('<details>')) {
        console.log('Found details block at line', i);
        let summaryText = '';
        i++; // <details> 라인 건너뛰기
        
        // 빈 줄들 건너뛰면서 <summary> 찾기
        while (i < lines.length && lines[i].trim() === '') {
          console.log('Skipping empty line:', i);
          i++;
        }
        
        // <summary> 찾기
        if (i < lines.length) {
          console.log('Next line after skipping:', `"${lines[i]}"`, 'starts with summary:', lines[i].trim().startsWith('<summary>'));
          if (lines[i].trim().startsWith('<summary>')) {
            summaryText = lines[i].replace(/<\/?summary>/g, '').trim();
            console.log('Found summary:', summaryText);
            i++; // <summary> 라인 건너뛰기
          }
        }
        
        // </details>까지 내용 수집
        const detailsLines: string[] = [];
        while (i < lines.length && !lines[i].trim().startsWith('</details>')) {
          console.log('Adding content line:', lines[i]);
          detailsLines.push(lines[i]);
          i++;
        }
        console.log('Details content lines:', detailsLines.length);
        
        // </details> 태그 확인
        if (i < lines.length && lines[i].trim().startsWith('</details>')) {
          console.log('Found closing </details> tag');
        } else {
          console.log('No closing </details> tag found - reached end of text');
        }
        
        // 내부 마크다운 렌더링
        const innerContent = renderMarkdown(detailsLines.join('\n'));
        
        // summary 텍스트도 마크다운 헤딩으로 렌더링
        let summaryElement;
        if (summaryText.startsWith('### ')) {
          const text = summaryText.slice(4).trim();
          summaryElement = <h3 className="md-h3">{processInlineMarkdown(text)}</h3>;
        } else if (summaryText.startsWith('## ')) {
          const text = summaryText.slice(3).trim();
          summaryElement = <h2 className="md-h2">{processInlineMarkdown(text)}</h2>;
        } else if (summaryText.startsWith('# ')) {
          const text = summaryText.slice(2).trim();
          summaryElement = <h1 className="md-h1">{processInlineMarkdown(text)}</h1>;
        } else {
          summaryElement = processInlineMarkdown(summaryText);
        }
        
        element = (
          <details key={i} className="md-details">
            <summary className="md-summary">{summaryElement}</summary>
            <div className="md-details-content">
              {innerContent}
            </div>
          </details>
        );
      }
      
      // 헤더 처리 with 자동 넘버링
      else if (line.startsWith('### ')) {
        numberStack[2]++;
        const text = line.slice(4).trim();
        const id = `header-${i}-${text.replace(/\s+/g, '-').toLowerCase()}`;
        const number = `${numberStack[0]}.${numberStack[1]}.${numberStack[2]}`;
        element = (
          <h3 key={i} id={id} className="md-h3 numbered-header">
            <span className="header-number">{number}</span>
            {processInlineMarkdown(text)}
          </h3>
        );
      } else if (line.startsWith('## ')) {
        numberStack[1]++;
        numberStack[2] = 0;
        const text = line.slice(3).trim();
        const id = `header-${i}-${text.replace(/\s+/g, '-').toLowerCase()}`;
        const number = `${numberStack[0]}.${numberStack[1]}`;
        element = (
          <h2 key={i} id={id} className="md-h2 numbered-header">
            <span className="header-number">{number}</span>
            {processInlineMarkdown(text)}
          </h2>
        );
      } else if (line.startsWith('# ')) {
        numberStack[0]++;
        numberStack[1] = 0;
        numberStack[2] = 0;
        const text = line.slice(2).trim();
        const id = `header-${i}-${text.replace(/\s+/g, '-').toLowerCase()}`;
        const number = `${numberStack[0]}.`;
        element = (
          <h1 key={i} id={id} className="md-h1 numbered-header">
            <span className="header-number">{number}</span>
            {processInlineMarkdown(text)}
          </h1>
        );
      }
      // 체크리스트 처리
      else if (line.match(/^- \[x\] /)) {
        const content = line.slice(6);
        element = (
          <div key={i} className="md-checkbox checked">
            <span className="checkbox-icon">☑</span>
            <span className="checkbox-text completed">{processInlineMarkdown(content)}</span>
          </div>
        );
      } else if (line.match(/^- \[ \] /)) {
        const content = line.slice(6);
        element = (
          <div key={i} className="md-checkbox">
            <span className="checkbox-icon">☐</span>
            <span className="checkbox-text">{processInlineMarkdown(content)}</span>
          </div>
        );
      }
      // 인용문 처리
      else if (line.startsWith('> ')) {
        element = <blockquote key={i} className="md-quote">{processInlineMarkdown(line.slice(2))}</blockquote>;
      }
      // 코드 블록 처리
      else if (line.startsWith('```')) {
        const codeLines = [];
        i++; // 시작 라인 건너뛰기
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        element = <pre key={i} className="md-code-block"><code>{codeLines.join('\n')}</code></pre>;
      }
      // 테이블 처리
      else if (line.includes('|') && i < lines.length - 1 && lines[i + 1].includes('|')) {
        // 테이블인지 확인 (다음 줄도 |를 포함해야 함)
        const tableLines = [];
        let tableIndex = i;
        
        // 테이블 라인들 수집
        while (tableIndex < lines.length && lines[tableIndex].includes('|')) {
          tableLines.push(lines[tableIndex]);
          tableIndex++;
        }
        
        if (tableLines.length >= 2) {
          const [headerLine, separatorLine, ...dataLines] = tableLines;
          
          // 헤더와 데이터 파싱
          const headers = headerLine.split('|').map(h => h.trim()).filter(h => h);
          const rows = dataLines.map(line => 
            line.split('|').map(cell => cell.trim()).filter(cell => cell || cell === '')
          ).filter(row => row.length > 0);
          
          element = (
            <table key={i} className="md-table">
              <thead>
                <tr>
                  {headers.map((header, idx) => (
                    <th key={idx} className="md-th">{processInlineMarkdown(header)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="md-td">{processInlineMarkdown(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          );
          
          // 테이블 전체를 처리했으므로 인덱스 조정
          i = tableIndex - 1;
        }
      }
      // 수평선 처리
      else if (line.trim() === '---') {
        element = <hr key={i} className="md-hr" />;
      }
      // 불릿 목록 처리
      else if (line.startsWith('- ')) {
        element = <li key={i} className="md-li">{processInlineMarkdown(line.slice(2))}</li>;
      }
      // 번호 목록 처리
      else if (line.match(/^\d+\. /)) {
        const match = line.match(/^(\d+)\. (.*)$/);
        if (match) {
          element = <li key={i} className="md-oli" value={parseInt(match[1])}>{processInlineMarkdown(match[2])}</li>;
        }
      }
      // 빈 줄
      else if (line.trim() === '') {
        element = <br key={i} />;
      }
      // 일반 텍스트
      else {
        element = <p key={i} className="md-p">{processInlineMarkdown(line)}</p>;
      }
      
      if (element) {
        result.push(element);
      }
    }
    
    return result;
  };
  
  const processInlineMarkdown = (text: string) => {
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;
    
    // URL 처리
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    let match;
    
    while ((match = urlRegex.exec(text)) !== null) {
      // URL 이전 텍스트 추가
      if (match.index > currentIndex) {
        const beforeText = text.slice(currentIndex, match.index);
        parts.push(...processTextFormatting(beforeText, parts.length));
      }
      
      // URL 링크 추가
      parts.push(
        <a 
          key={parts.length}
          href={match[0]} 
          target="_blank" 
          rel="noopener noreferrer"
          className="content-link"
        >
          {match[0]}
        </a>
      );
      
      currentIndex = match.index + match[0].length;
    }
    
    // 남은 텍스트 처리
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex);
      parts.push(...processTextFormatting(remainingText, parts.length));
    }
    
    return parts.length > 0 ? parts : text;
  };
  
  const processTextFormatting = (text: string, startKey: number) => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyCounter = startKey;
    
    // 링크 패턴 [text](url) 처리
    remaining = remaining.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      const placeholder = `__LINK_${keyCounter}__`;
      parts.push(
        <a key={keyCounter++} href={url} target="_blank" rel="noopener noreferrer" className="content-link">
          {text}
        </a>
      );
      return placeholder;
    });
    
    // 볼드 처리 **text**
    remaining = remaining.replace(/\*\*([^*]+)\*\*/g, (match, text) => {
      const placeholder = `__BOLD_${keyCounter}__`;
      parts.push(<strong key={keyCounter++} className="md-bold">{text}</strong>);
      return placeholder;
    });
    
    // 이탤릭 처리 *text*
    remaining = remaining.replace(/\*([^*]+)\*/g, (match, text) => {
      const placeholder = `__ITALIC_${keyCounter}__`;
      parts.push(<em key={keyCounter++} className="md-italic">{text}</em>);
      return placeholder;
    });
    
    // 취소선 처리 ~~text~~
    remaining = remaining.replace(/~~([^~]+)~~/g, (match, text) => {
      const placeholder = `__STRIKE_${keyCounter}__`;
      parts.push(<del key={keyCounter++} className="md-strike">{text}</del>);
      return placeholder;
    });
    
    // 인라인 코드 처리 `code`
    remaining = remaining.replace(/`([^`]+)`/g, (match, text) => {
      const placeholder = `__CODE_${keyCounter}__`;
      parts.push(<code key={keyCounter++} className="md-inline-code">{text}</code>);
      return placeholder;
    });
    
    // 플레이스홀더를 실제 컴포넌트로 교체
    const finalParts: React.ReactNode[] = [];
    const segments = remaining.split(/__\w+_\d+__/);
    const placeholders = remaining.match(/__\w+_\d+__/g) || [];
    
    segments.forEach((segment, index) => {
      if (segment) {
        finalParts.push(segment);
      }
      if (placeholders[index]) {
        const component = parts.find((_, i) => 
          placeholders[index].includes(`_${startKey + i}__`)
        );
        if (component) {
          finalParts.push(component);
        }
      }
    });
    
    return finalParts.length > 0 ? finalParts : [text];
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    
    // 실시간 자동저장은 제거하고 사용자가 명시적으로 저장할 때만 저장
  };


  if (!selectedDocument) {
    return (
      <div className={`document-panel ${className}`}>
        <div className="empty-state">
          <div className="empty-content">
            <h2>📝 My Wiki</h2>
            <p>문서를 선택하거나 새로 만들어보세요.</p>
            <div className="help-text">
              <small>
                • 카테고리를 선택하여 폴더 목록을 확인하세요<br />
                • 폴더를 클릭하여 문서 목록을 확인하세요<br />
                • 3점 메뉴에서 새 폴더나 문서를 추가할 수 있습니다
              </small>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`document-panel ${className}`}>
      <div className="document-header">
        <div className="document-title-section">
          {isEditMode ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleTitleSave();
                  e.currentTarget.blur();
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setTitle(selectedDocument.title);
                  e.currentTarget.blur();
                }
              }}
              className="title-input"
              placeholder="문서 제목"
            />
          ) : (
            <h1 className="document-title">📄 {selectedDocument.title}</h1>
          )}
        </div>
        
        <div className="document-actions">
          {isEditMode ? (
            <>
              <button 
                className="action-button save-button"
                onClick={handleSave}
                title="저장"
              >
                💾 저장
              </button>
              <button 
                className="action-button cancel-button"
                onClick={handleCancel}
                title="취소"
              >
                ❌ 취소
              </button>
              <button 
                className="action-button copy-button"
                onClick={handleCopyContent}
                title="수정 중인 내용 복사"
              >
                📋 복사
              </button>
              <button 
                className="action-button delete-button"
                onClick={handleDelete}
                title="삭제"
              >
                🗑️ 삭제
              </button>
              <div className="move-buttons">
                <button 
                  className="action-button move-button"
                  onClick={() => selectedDocument && reorderDocument(selectedDocument.id, 'up')}
                  title="위로 이동"
                >
                  ↑
                </button>
                <button 
                  className="action-button move-button"
                  onClick={() => selectedDocument && reorderDocument(selectedDocument.id, 'down')}
                  title="아래로 이동"
                >
                  ↓
                </button>
                <button 
                  className="action-button move-button"
                  onClick={handleGoToBottom}
                  title="문서 맨 아래로 이동"
                >
                  ⬇️
                </button>
              </div>
            </>
          ) : (
            <>
              <button 
                className="action-button edit-button"
                onClick={handleEdit}
                title="편집"
              >
                ✏️ 편집
              </button>
              <button 
                className="action-button copy-button"
                onClick={handleCopyContent}
                title="문서 내용 복사"
              >
                📋 복사
              </button>
              <button 
                className={`action-button favorite-button ${selectedDocument.isFavorite === true ? 'active' : ''}`}
                onClick={handleFavoriteToggle}
                title={selectedDocument.isFavorite === true ? "즐겨찾기 해제" : "즐겨찾기 추가"}
              >
                {selectedDocument.isFavorite === true ? '⭐' : '☆'}
              </button>
              <button 
                className="action-button delete-button"
                onClick={handleDelete}
                title="삭제"
              >
                🗑️ 삭제
              </button>
              {headers.length > 0 && (
                <button 
                  className={`action-button toc-button ${showTOC ? 'active' : ''}`}
                  onClick={() => setShowTOC(!showTOC)}
                  title="목차"
                >
                  📋 목차 ({headers.length})
                </button>
              )}
              <div className="move-buttons">
                <button 
                  className="action-button move-button"
                  onClick={() => selectedDocument && reorderDocument(selectedDocument.id, 'up')}
                  title="위로 이동"
                >
                  ↑
                </button>
                <button 
                  className="action-button move-button"
                  onClick={() => selectedDocument && reorderDocument(selectedDocument.id, 'down')}
                  title="아래로 이동"
                >
                  ↓
                </button>
              </div>
            </>
          )}
        </div>
        
        {isEditMode && (
          <EditorToolbar 
            textareaRef={textareaRef} 
            onTextChange={handleContentChange}
          />
        )}
      </div>

      {/* 목차 */}
      {showTOC && !isEditMode && headers.length > 0 && (
        <div className="table-of-contents">
          <div className="toc-header">
            <h4>📋 목차</h4>
            <button 
              className="toc-close-btn"
              onClick={() => setShowTOC(false)}
              title="닫기"
            >
              ×
            </button>
          </div>
          <div className="toc-list">
            {headers.map((header, index) => (
              <div
                key={index}
                className={`toc-item toc-level-${header.level}`}
                onClick={() => scrollToHeader(header.id)}
              >
                <span className="toc-number">{header.number}</span>
                <span className="toc-text">{header.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="document-content">
        {isEditMode ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            className="content-editor"
            placeholder="문서 내용을 입력하세요..."
            autoFocus
          />
        ) : (
          <div ref={contentViewerRef} className="content-viewer">
            {renderMarkdown(content)}
          </div>
        )}
      </div>

      <div className="document-footer">
        <div className="document-info">
          <small>
            생성: {selectedDocument.createdAt.toLocaleDateString('ko-KR')} | 
            수정: {selectedDocument.lastModified.toLocaleDateString('ko-KR')} {selectedDocument.lastModified.toLocaleTimeString('ko-KR')}
          </small>
        </div>
      </div>
      
      <ConfirmModal
        isOpen={showDeleteModal}
        title="문서 삭제"
        message="정말로 이 문서를 삭제하시겠습니까?"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default DocumentPanel;