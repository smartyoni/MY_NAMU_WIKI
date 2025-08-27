import React, { useState, useEffect } from 'react';
import Header from './components/Layout/Header';
import BookmarkBar from './components/BookmarkBar/BookmarkBar';
import ThreeColumnLayout from './components/Layout/ThreeColumnLayout';
import CategoryPanel from './components/CategoryPanel';
import FolderPanel from './components/FolderPanel';
import DocumentPanel from './components/DocumentPanel';
import { DocumentProvider } from './context/DocumentContextFirebase';
import './App.css';

function App() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  return (
    <DocumentProvider userId="default-user">
      <div className="app">
        <BookmarkBar />
        <Header />
        <ThreeColumnLayout
          categoryPanel={<CategoryPanel />}
          folderPanel={<FolderPanel />}
          documentPanel={<DocumentPanel />}
          isMobile={isMobile}
        />
      </div>
    </DocumentProvider>
  );
}

export default App;