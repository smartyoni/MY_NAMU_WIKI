import React, { useState, useEffect } from 'react';
import Header from './components/Layout/Header';
import BookmarkBar from './components/BookmarkBar/BookmarkBar';
import ThreeColumnLayout from './components/Layout/ThreeColumnLayout';
import CategoryPanel from './components/CategoryPanel';
import FolderPanel from './components/FolderPanel';
import DocumentPanel from './components/DocumentPanel';
import FloatingButton from './components/FloatingButton/FloatingButton';
import QuickMemoFolderButton from './components/FloatingButton/QuickMemoFolderButton';
import { DocumentProvider, useDocuments } from './context/DocumentContextFirebase';
import './App.css';

function AppContent() {
  const [isMobile, setIsMobile] = useState(false);
  const { createQuickMemo, navigateToQuickMemoFolder } = useDocuments();

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
      <FloatingButton onClick={handleQuickMemo} />
      <QuickMemoFolderButton onClick={handleQuickMemoFolder} />
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