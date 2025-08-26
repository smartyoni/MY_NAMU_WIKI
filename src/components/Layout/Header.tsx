import React, { useState, useEffect } from 'react';
import { useDocuments } from '../../context/DocumentContextFirebase';
import './Header.css';

interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const { searchDocuments, selectDocument, selectFolder, selectCategory, folders, categories } = useDocuments();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  const handleDocumentSelect = (document: any) => {
    const folder = folders.find(f => f.id === document.folderId);
    const category = folder ? categories.find(c => c.id === folder.categoryId) : null;
    
    if (category && folder) {
      selectCategory(category.id);
      selectFolder(folder.id);
      selectDocument(document.id);
    }
    clearSearch();
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
      </div>
      <div className="header-center">
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
        </div>
      </div>
      <div className="header-right">
        <span className="production-mode">3단 계층 구조</span>
      </div>
    </header>
  );
};

export default Header;