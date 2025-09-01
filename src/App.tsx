import React, { useState, useEffect } from 'react';
import Header from './components/Layout/Header';
import BookmarkBar from './components/BookmarkBar/BookmarkBar';
import TextClipBar from './components/TextClipBar/TextClipBar';
import MobileFavoritesBar from './components/MobileFavoritesBar/MobileFavoritesBar';
import ThreeColumnLayout from './components/Layout/ThreeColumnLayout';
import CategoryPanel from './components/CategoryPanel';
import FolderPanel from './components/FolderPanel';
import OutlinerPanel from './components/OutlinerPanel';
import DocumentPanel from './components/DocumentPanel';
import FloatingButton from './components/FloatingButton/FloatingButton';
import QuickMemoFolderButton from './components/FloatingButton/QuickMemoFolderButton';
import { DocumentProvider, useDocuments } from './context/DocumentContextFirebase';
import './App.css';

function AppContent() {
  const [isMobile, setIsMobile] = useState(false);
  const { 
    createQuickMemo, 
    navigateToQuickMemoFolder 
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


  return (
    <div className="app">
      <BookmarkBar />
      <TextClipBar />
      <Header />
      <ThreeColumnLayout
        categoryPanel={<CategoryPanel />}
        folderPanel={<FolderPanel />}
        documentPanel={<DocumentPanel />}
        isMobile={isMobile}
      />
      {/* 모바일 즐겨찾기 바 */}
      <MobileFavoritesBar />
      
      {/* 번개와 폴더 버튼은 항상 표시 */}
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