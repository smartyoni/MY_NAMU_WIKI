import React from 'react';
import { useDocuments } from '../../context/DocumentContextFirebase';
import './Breadcrumb.css';

const Breadcrumb: React.FC = () => {
  const { 
    categories, 
    folders, 
    documents, 
    uiState, 
    selectCategory, 
    selectFolder, 
    selectDocument 
  } = useDocuments();

  const selectedCategory = categories.find(cat => cat.id === uiState.selectedCategoryId);
  const selectedFolder = folders.find(folder => folder.id === uiState.selectedFolderId);
  const selectedDocument = documents.find(doc => doc.id === uiState.selectedDocumentId);

  const handleCategoryClick = () => {
    selectCategory(selectedCategory?.id || null);
    selectFolder(null);
    selectDocument(null);
  };

  const handleFolderClick = () => {
    if (selectedFolder) {
      selectFolder(selectedFolder.id);
      selectDocument(null);
    }
  };

  const handleHomeClick = () => {
    selectCategory(null);
    selectFolder(null);
    selectDocument(null);
  };

  return (
    <nav className="breadcrumb">
      <button className="breadcrumb-item breadcrumb-home" onClick={handleHomeClick}>
        🏠
      </button>
      
      {selectedCategory && (
        <>
          <span className="breadcrumb-separator">›</span>
          <button 
            className="breadcrumb-item breadcrumb-category" 
            onClick={handleCategoryClick}
          >
            {selectedCategory.name}
          </button>
        </>
      )}
      
      {selectedFolder && (
        <>
          <span className="breadcrumb-separator">›</span>
          <button 
            className="breadcrumb-item breadcrumb-folder" 
            onClick={handleFolderClick}
          >
            📁 {selectedFolder.name}
          </button>
        </>
      )}
      
      {selectedDocument && (
        <>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-item breadcrumb-document">
            📄 {selectedDocument.title}
          </span>
        </>
      )}
    </nav>
  );
};

export default Breadcrumb;