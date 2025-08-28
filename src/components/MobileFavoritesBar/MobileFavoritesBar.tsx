import React from 'react';
import { useDocuments } from '../../context/DocumentContextFirebase';
import './MobileFavoritesBar.css';

const MobileFavoritesBar: React.FC = () => {
  const { documents, folders, categories, selectDocument, selectFolder, selectCategory } = useDocuments();

  // 즐겨찾기 문서들 가져오기
  const favoriteDocuments = documents
    .filter(doc => doc.isFavorite === true)
    .sort((a, b) => {
      const orderA = a.favoriteOrder || Number.MAX_SAFE_INTEGER;
      const orderB = b.favoriteOrder || Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    })
    .slice(0, 10); // 최대 10개

  const handleDocumentSelect = (document: any) => {
    const folder = folders.find(f => f.id === document.folderId);
    const category = folder ? categories.find(c => c.id === folder.categoryId) : null;
    
    if (category && folder) {
      selectCategory(category.id);
      selectFolder(folder.id);
      selectDocument(document.id);
    }
  };

  if (favoriteDocuments.length === 0) {
    return null; // 즐겨찾기가 없으면 숨김
  }

  return (
    <div className="mobile-favorites-bar">
      <div className="mobile-favorites-scroll">
        {favoriteDocuments.map((doc) => (
          <button
            key={doc.id}
            className="mobile-favorite-item"
            onClick={() => handleDocumentSelect(doc)}
            title={`${doc.title} - 클릭하여 열기`}
          >
            {doc.title.slice(0, 5)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileFavoritesBar;