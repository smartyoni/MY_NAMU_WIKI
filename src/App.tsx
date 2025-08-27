import React, { useState, useEffect } from 'react';
import Header from './components/Layout/Header';
import BookmarkBar from './components/BookmarkBar/BookmarkBar';
import ThreeColumnLayout from './components/Layout/ThreeColumnLayout';
import CategoryPanel from './components/CategoryPanel';
import FolderPanel from './components/FolderPanel';
import DocumentPanel from './components/DocumentPanel';
import FloatingButton from './components/FloatingButton/FloatingButton';
import QuickMemoFolderButton from './components/FloatingButton/QuickMemoFolderButton';
import SaveButton from './components/FloatingButton/SaveButton';
import DeleteButton from './components/FloatingButton/DeleteButton';
import { DocumentProvider, useDocuments } from './context/DocumentContextFirebase';
import './App.css';

function AppContent() {
  const [isMobile, setIsMobile] = useState(false);
  const { 
    createQuickMemo, 
    navigateToQuickMemoFolder, 
    updateDocument, 
    deleteDocument, 
    uiState, 
    documents 
  } = useDocuments();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleQuickMemo = async () => {
    try {
      await createQuickMemo('');
    } catch (error) {
      console.error('빠른메모 생성 실패:', error);
    }
  };

  const handleQuickMemoFolder = async () => {
    try {
      await navigateToQuickMemoFolder();
    } catch (error) {
      console.error('빠른메모 폴더 이동 실패:', error);
    }
  };

  const handleSave = async () => {
    const selectedDocument = documents.find(doc => doc.id === uiState.selectedDocumentId);
    if (!selectedDocument) return;

    try {
      // DocumentPanel에서 현재 편집 중인 내용을 가져와야 하는데,
      // 일단은 현재 문서의 내용을 저장하는 것으로 처리
      await updateDocument(selectedDocument.id, { 
        updatedAt: new Date()
      });
      console.log('문서 저장 완료');
    } catch (error) {
      console.error('문서 저장 실패:', error);
    }
  };

  const handleDelete = async () => {
    const selectedDocument = documents.find(doc => doc.id === uiState.selectedDocumentId);
    if (!selectedDocument) return;

    const confirmed = window.confirm(`"${selectedDocument.title}" 문서를 삭제하시겠습니까?`);
    if (!confirmed) return;

    try {
      await deleteDocument(selectedDocument.id);
      console.log('문서 삭제 완료');
    } catch (error) {
      console.error('문서 삭제 실패:', error);
    }
  };

  // 현재 선택된 문서가 있는지 확인
  const selectedDocument = documents.find(doc => doc.id === uiState.selectedDocumentId);
  const hasSelectedDocument = !!selectedDocument;

  return (
    <div className="app">
      <BookmarkBar />
      <Header />
      <ThreeColumnLayout
        categoryPanel={<CategoryPanel />}
        folderPanel={<FolderPanel />}
        documentPanel={<DocumentPanel />}
        isMobile={isMobile}
      />
      {/* 번개와 폴더 버튼은 항상 표시 */}
      <FloatingButton onClick={handleQuickMemo} />
      <QuickMemoFolderButton onClick={handleQuickMemoFolder} />
      
      {/* 저장/삭제 버튼은 모바일에서만 표시 */}
      {hasSelectedDocument && isMobile && (
        <>
          <SaveButton onClick={handleSave} />
          <DeleteButton onClick={handleDelete} />
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <DocumentProvider userId="default-user">
      <AppContent />
    </DocumentProvider>
  );
}

export default App;