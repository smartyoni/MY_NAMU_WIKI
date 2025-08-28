import React from 'react';
import { useDocuments } from '../../context/DocumentContextFirebase';
import './MobileFavoritesBar.css';

const MobileFavoritesBar: React.FC = () => {
  const { documents, folders, categories, selectDocument, selectFolder, selectCategory } = useDocuments();

  // 즐겨찾기 문서들 가져오기 (생성순으로 정렬, 5개만)
  const favoriteDocuments = documents
    .filter(doc => doc.isFavorite === true)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) // 생성 시간 순
    .slice(0, 5); // 최대 5개

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