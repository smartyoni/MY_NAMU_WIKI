import React, { useState, useEffect } from 'react';
import { useDocuments } from '../../context/DocumentContextFirebase';
import './Header.css';

interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favoriteDocuments, setFavoriteDocuments] = useState<any[]>([]);
  const { searchDocuments, selectDocument, selectFolder, selectCategory, folders, categories, createQuickMemo, documents } = useDocuments();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const favorites = documents
      .filter(doc => doc.isFavorite === true)
      .sort((a, b) => {
        const orderA = a.favoriteOrder || Number.MAX_SAFE_INTEGER;
        const orderB = b.favoriteOrder || Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
      });
    setFavoriteDocuments(favorites);
  }, [documents]);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    
    if (term.length >= 2) {
      try {
        const results = await searchDocuments(term);
        setSearchResults(results);
        setShowResults(true);
      } catch (error) {
        console.error('검색 실패:', error);
      }
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
  };

  const toggleFavorites = () => {
    setShowFavorites(!showFavorites);
    if (showResults) {
      setShowResults(false);
    }
  };

  const closeFavorites = () => {
    setShowFavorites(false);
  };

  const handleDocumentSelect = async (document: any) => {
    const folder = folders.find(f => f.id === document.folderId);
    const category = folder ? categories.find(c => c.id === folder.categoryId) : null;
    
    if (category && folder) {
      await selectCategory(category.id);
      selectFolder(folder.id);
      selectDocument(document.id);
    }
    clearSearch();
    closeFavorites();
  };

  const handleQuickMemo = async () => {
    try {
      await createQuickMemo('');
      // 모바일에서 에디터로 자동 스크롤 및 포커스 (약간의 지연 후)
      setTimeout(() => {
        const editorTextarea = document.querySelector('.editor textarea') as HTMLTextAreaElement;
        if (editorTextarea) {
          editorTextarea.focus();
          // 템플릿 텍스트 끝으로 커서 이동
          editorTextarea.setSelectionRange(editorTextarea.value.length, editorTextarea.value.length);
          // 모바일에서 스크롤
          editorTextarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    } catch (error) {
      console.error('빠른메모 생성 실패:', error);
    }
  };

  const formatDateTime = (date: Date) => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dayOfWeek = days[date.getDay()];
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}.${month}.${day}(${dayOfWeek}) ${hours}:${minutes}:${seconds}`;
  };

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="logo">📚 Personal Wiki</h1>
        <span className="datetime">{formatDateTime(currentTime)}</span>
        <div className="search-container">
          <input 
            type="text" 
            className="search-input" 
            placeholder="문서 검색..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="search-clear-btn" 
              onClick={clearSearch}
            >
              ×
            </button>
          )}
          <button 
            className="favorites-btn" 
            onClick={toggleFavorites}
            title="즐겨찾기 목록"
          >
            ⭐
          </button>
          {showResults && searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((doc) => (
                <div 
                  key={doc.id} 
                  className="search-result-item"
                  onClick={() => handleDocumentSelect(doc)}
                >
                  <div className="search-result-title">{doc.title}</div>
                  <div className="search-result-path">
                    {(() => {
                      const folder = folders.find(f => f.id === doc.folderId);
                      const category = folder ? categories.find(c => c.id === folder.categoryId) : null;
                      return category && folder ? `${category.name} > ${folder.name}` : '';
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}
          {showFavorites && (
            <div className="search-results">
              {favoriteDocuments.length > 0 ? (
                favoriteDocuments.map((doc) => (
                  <div 
                    key={doc.id} 
                    className="search-result-item"
                    onClick={() => handleDocumentSelect(doc)}
                  >
                    <div className="search-result-title">⭐ {doc.title}</div>
                    <div className="search-result-path">
                      {(() => {
                        const folder = folders.find(f => f.id === doc.folderId);
                        const category = folder ? categories.find(c => c.id === folder.categoryId) : null;
                        return category && folder ? `${category.name} > ${folder.name}` : '';
                      })()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="search-result-item no-results">
                  즐겨찾기한 문서가 없습니다.
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* 즐겨찾기 바 */}
        <div className="favorites-bar">
          {favoriteDocuments.slice(0, 8).map((doc) => (
            <button
              key={doc.id}
              className="favorite-item"
              onClick={() => handleDocumentSelect(doc)}
              onContextMenu={(e) => {
                e.preventDefault();
                // TODO: 편집 기능 추가
                console.log('우클릭:', doc.title);
              }}
              title={`${doc.title} - 클릭하여 열기, 우클릭하여 편집`}
            >
              {doc.title.slice(0, 5)}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Header;