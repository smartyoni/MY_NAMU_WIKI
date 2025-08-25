import React, { useState } from 'react';
import Header from './components/Layout/Header';
import { useDocuments } from './context/DocumentContextFirebase';
import './App.css';

function AppFirebase() {
  const {
    documents,
    categories,
    comments,
    loading,
    error,
    createDocument,
    updateDocument,
    deleteDocument,
    selectDocument,
    createCategory,
    updateCategory,
    deleteCategory,
    createComment,
    updateComment,
    deleteComment,
    getCommentsByDocument
  } = useDocuments();

  const [content, setContent] = useState(`# Personal Wiki에 오신 것을 환영합니다! 👋

**Firebase 연동 완료!** 🔥

## 주요 기능
- **클라우드 저장** - Firebase Firestore
- **실시간 동기화** - 다기기 동기화
- **마크다운 문법** 지원 (굵게, *기울임*, ~~취소선~~, 제목)
- **실시간 미리보기** 제공
- **체크리스트** 지원: 
  - [x] 완료된 작업
  - [ ] 진행 중인 작업
- **실행취소/다시실행** (Ctrl+Z/Ctrl+Y)
- **문법 버튼** 툴바로 쉬운 편집

## 사용 방법
1. 좌측에서 **새 문서** 생성
2. **편집** 버튼으로 내용 수정
3. **자동 클라우드 저장** ☁️
4. **어디서든 접근 가능**

> Firebase와 연결되었습니다! 🚀

### 마크다운 문법 예시
\`\`\`javascript
// 코드 블록도 지원합니다
console.log("Hello, World!");
\`\`\`

[링크 예시](https://github.com)`);

  const [currentDoc, setCurrentDoc] = useState<any>(() => {
    // 새로고침 후에도 현재 문서 상태 유지
    const saved = localStorage.getItem('current-document');
    return saved ? JSON.parse(saved) : null;
  });
  const [isCreating, setIsCreating] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('general');
  const [isEditMode, setIsEditMode] = useState(() => {
    // 새로고침 후에도 편집 모드 상태 유지
    return localStorage.getItem('edit-mode') === 'true';
  });

  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  const [desktopView, setDesktopView] = useState<'split' | 'editor' | 'preview'>('split');
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  
  // UI 상태 관리
  const [selectedCategory, setSelectedCategory] = useState<string>('all'); // 'all' 또는 카테고리 ID
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['all'])); // 펼쳐진 카테고리들
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6c757d');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [categoryMenuOpen, setCategoryMenuOpen] = useState<string | null>(null);
  const [documentMenuOpen, setDocumentMenuOpen] = useState<string | null>(null);
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [editingDocumentTitle, setEditingDocumentTitle] = useState('');
  const [tocOpen, setTocOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  
  // 댓글 관련 상태
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  
  // 내보내기 관련 상태
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  // Undo/Redo 상태 관리
  const [history, setHistory] = useState<string[]>([content]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // 새로고침 시 content 복원
  React.useEffect(() => {
    if (currentDoc && currentDoc.content !== content) {
      setContent(currentDoc.content);
    }
  }, [currentDoc]);

  // 헤더의 새 문서 버튼을 위한 전역 함수 등록
  React.useEffect(() => {
    window.setIsCreating = (value: boolean) => {
      console.log('전역 setIsCreating 호출됨 (Firebase):', value);
      setIsCreating(value);
    };
    
    return () => {
      delete window.setIsCreating;
    };
  }, []);

  // 모달 외부 클릭 감지
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // 카테고리 메뉴 외부 클릭 시 닫기
      if (categoryMenuOpen && !target.closest('.category-menu-container')) {
        setCategoryMenuOpen(null);
      }
      
      // 문서 메뉴 외부 클릭 시 닫기
      if (documentMenuOpen && !target.closest('.document-menu-container')) {
        setDocumentMenuOpen(null);
      }
      
      // TOC 외부 클릭 시 닫기
      if (tocOpen && !target.closest('.toc-container')) {
        setTocOpen(false);
      }
      
      // 댓글 외부 클릭 시 닫기
      if (commentsOpen && !target.closest('.comments-container')) {
        setCommentsOpen(false);
      }
      
      // 내보내기 메뉴 외부 클릭 시 닫기
      if (exportMenuOpen && !target.closest('.export-menu-container')) {
        setExportMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [categoryMenuOpen, documentMenuOpen, tocOpen, commentsOpen, exportMenuOpen]);


  // 툴바 버튼 스타일
  const toolbarButtonStyle = {
    padding: '4px 8px',
    fontSize: '12px',
    background: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '3px',
    cursor: 'pointer',
    minWidth: '28px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
  };

  const handleCreateDocument = async () => {
    if (!newDocTitle.trim()) return;
    
    try {
      const newContent = `# ${newDocTitle}\n\n새 문서입니다. **마크다운** 문법을 사용하여 내용을 작성해주세요.\n\n## 섹션 1\n- 리스트 항목\n- [ ] 할 일\n\n> 인용문 예시`;
      const id = await createDocument(newDocTitle, newContent);
      
      // 선택된 카테고리 또는 newDocCategory로 문서 생성
      const targetCategory = selectedCategory && selectedCategory !== 'all' ? selectedCategory : newDocCategory;
      await updateDocument(id, { category: targetCategory });
      
      const newDoc = {
        id,
        title: newDocTitle,
        content: newContent,
        category: targetCategory,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'default-user'
      };
      
      setCurrentDoc(newDoc);
      setContent(newContent);
      setNewDocTitle('');
      setNewDocCategory('general');
      setIsCreating(false);
      setIsEditMode(true);
      
      // 생성된 문서의 카테고리를 자동으로 펼치기
      if (targetCategory !== 'all') {
        setExpandedCategories(prev => new Set([...prev, targetCategory]));
      }
      
      // 히스토리 초기화
      setHistory([newContent]);
      setHistoryIndex(0);
    } catch (err) {
      console.error('Error creating document:', err);
    }
  };

  // 제목 수정 시작
  const handleStartEditTitle = () => {
    if (currentDoc) {
      setEditingTitle(currentDoc.title);
      setIsEditingTitle(true);
    }
  };

  // 제목 수정 취소
  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    setEditingTitle('');
  };

  // 제목 수정 저장
  const handleSaveTitle = async () => {
    if (!currentDoc || !editingTitle.trim()) return;
    
    try {
      await updateDocument(currentDoc.id, { title: editingTitle.trim() });
      
      const updatedDoc = {
        ...currentDoc,
        title: editingTitle.trim(),
        updatedAt: new Date()
      };
      
      setCurrentDoc(updatedDoc);
      setIsEditingTitle(false);
      setEditingTitle('');
    } catch (err) {
      console.error('Error updating document title:', err);
    }
  };

  // Enter 키로 제목 저장, Escape로 취소
  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      handleCancelEditTitle();
    }
  };

  // 카테고리/폴더 관리 함수들
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      await createCategory(newCategoryName.trim(), newCategoryColor);
      setNewCategoryName('');
      setNewCategoryColor('#6c757d');
      setIsCreatingCategory(false);
    } catch (err) {
      console.error('Error creating category:', err);
    }
  };

  // 카테고리 이름 수정 시작
  const handleStartEditCategory = (categoryId: string, currentName: string) => {
    setEditingCategoryId(categoryId);
    setEditingCategoryName(currentName);
    setCategoryMenuOpen(null);
  };

  // 카테고리 이름 수정 취소
  const handleCancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryName('');
  };

  // 카테고리 이름 수정 저장
  const handleSaveCategory = async (categoryId: string) => {
    if (!editingCategoryName.trim()) {
      console.log('카테고리 이름이 비어있음');
      return;
    }

    try {
      console.log('카테고리 이름 수정:', categoryId, '→', editingCategoryName.trim());
      await updateCategory(categoryId, { name: editingCategoryName.trim() });
      setEditingCategoryId(null);
      setEditingCategoryName('');
      console.log('카테고리 이름 수정 완료');
    } catch (err) {
      console.error('Error updating category:', err);
      alert('카테고리 이름 변경 중 오류가 발생했습니다.');
    }
  };

  // 카테고리 이름 수정 키 이벤트
  const handleCategoryKeyDown = (e: React.KeyboardEvent, categoryId: string) => {
    if (e.key === 'Enter') {
      handleSaveCategory(categoryId);
    } else if (e.key === 'Escape') {
      handleCancelEditCategory();
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (categoryId === 'general') {
      alert('기본 카테고리는 삭제할 수 없습니다.');
      return;
    }
    
    const categoryName = categories.find(cat => cat.id === categoryId)?.name || '알 수 없음';
    
    if (window.confirm(`"${categoryName}" 카테고리를 삭제하시겠습니까? 카테고리 내 모든 문서는 "일반" 카테고리로 이동됩니다.`)) {
      try {
        console.log('카테고리 삭제 시작:', categoryId, categoryName);
        await deleteCategory(categoryId);
        
        if (selectedCategory === categoryId) {
          setSelectedCategory('all');
        }
        console.log('카테고리 삭제 완료:', categoryId);
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('카테고리 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 문서 관리 함수들
  const handleStartEditDocument = (documentId: string, currentTitle: string) => {
    setEditingDocumentId(documentId);
    setEditingDocumentTitle(currentTitle);
    setDocumentMenuOpen(null);
  };

  const handleCancelEditDocument = () => {
    setEditingDocumentId(null);
    setEditingDocumentTitle('');
  };

  const handleSaveDocumentTitle = async (documentId: string) => {
    if (!editingDocumentTitle.trim()) {
      console.log('문서 제목이 비어있음');
      return;
    }

    try {
      console.log('문서 제목 수정:', documentId, '→', editingDocumentTitle.trim());
      await updateDocument(documentId, { title: editingDocumentTitle.trim() });
      setEditingDocumentId(null);
      setEditingDocumentTitle('');
      console.log('문서 제목 수정 완료');
    } catch (err) {
      console.error('Error updating document title:', err);
      alert('문서 제목 변경 중 오류가 발생했습니다.');
    }
  };

  const handleDocumentKeyDown = (e: React.KeyboardEvent, documentId: string) => {
    if (e.key === 'Enter') {
      handleSaveDocumentTitle(documentId);
    } else if (e.key === 'Escape') {
      handleCancelEditDocument();
    }
  };

  const handleDeleteDocumentFromMenu = async (documentId: string, documentTitle: string) => {
    if (window.confirm(`"${documentTitle}" 문서를 삭제하시겠습니까?`)) {
      try {
        console.log('문서 삭제 시작:', documentId, documentTitle);
        await deleteDocument(documentId);
        console.log('문서 삭제 완료:', documentId);
      } catch (error) {
        console.error('Error deleting document:', error);
        alert('문서 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleDuplicateDocument = async (doc: any) => {
    try {
      console.log('문서 복사 시작:', doc.title);
      const newTitle = `${doc.title} (복사본)`;
      const newContent = doc.content;
      const id = await createDocument(newTitle, newContent);
      
      // 같은 카테고리로 설정
      await updateDocument(id, { category: doc.category });
      
      console.log('문서 복사 완료:', newTitle);
      alert(`"${newTitle}" 문서가 생성되었습니다.`);
    } catch (error) {
      console.error('Error duplicating document:', error);
      alert('문서 복사 중 오류가 발생했습니다.');
    }
  };

  // 댓글 관리 함수들
  const handleCreateComment = async () => {
    if (!currentDoc || !newCommentContent.trim()) return;
    
    try {
      console.log('댓글 생성 시작:', currentDoc.id);
      await createComment(currentDoc.id, newCommentContent);
      setNewCommentContent('');
      console.log('댓글 생성 완료');
    } catch (error) {
      console.error('Error creating comment:', error);
      alert('댓글 생성 중 오류가 발생했습니다.');
    }
  };

  const handleStartEditComment = (commentId: string, content: string) => {
    setEditingCommentId(commentId);
    setEditingCommentContent(content);
  };

  const handleSaveComment = async () => {
    if (!editingCommentId || !editingCommentContent.trim()) return;
    
    try {
      console.log('댓글 수정 시작:', editingCommentId);
      await updateComment(editingCommentId, editingCommentContent);
      setEditingCommentId(null);
      setEditingCommentContent('');
      console.log('댓글 수정 완료');
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('댓글 수정 중 오류가 발생했습니다.');
    }
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentContent('');
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('댓글을 삭제하시겠습니까?')) {
      try {
        console.log('댓글 삭제 시작:', commentId);
        await deleteComment(commentId);
        console.log('댓글 삭제 완료');
      } catch (error) {
        console.error('Error deleting comment:', error);
        alert('댓글 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 내보내기 관련 함수들
  const handleExportAsText = () => {
    if (!currentDoc) return;
    
    // 마크다운을 일반 텍스트로 변환
    const textContent = currentDoc.content
      .replace(/#{1,6}\s+(.+)/g, '$1') // 헤더 제거
      .replace(/\*\*(.+?)\*\*/g, '$1') // 굵게 제거
      .replace(/\*(.+?)\*/g, '$1') // 기울임 제거
      .replace(/~~(.+?)~~/g, '$1') // 취소선 제거
      .replace(/`(.+?)`/g, '$1') // 인라인 코드 제거
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 링크 제거
      .replace(/^[-*+]\s+/gm, '• ') // 불릿 리스트 변환
      .replace(/^\d+\.\s+/gm, '') // 번호 리스트 제거
      .replace(/^>\s+/gm, '') // 인용문 제거
      .replace(/```[\s\S]*?```/g, '') // 코드 블록 제거
      .replace(/---/g, ''); // 구분선 제거
    
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDoc.title}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setExportMenuOpen(false);
    console.log('텍스트 파일 내보내기 완료:', currentDoc.title);
  };

  const handleExportAsMarkdown = () => {
    if (!currentDoc) return;
    
    const blob = new Blob([currentDoc.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDoc.title}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setExportMenuOpen(false);
    console.log('마크다운 파일 내보내기 완료:', currentDoc.title);
  };

  const handleExportAsPDF = () => {
    if (!currentDoc) return;
    
    // 새 창에서 PDF 인쇄 대화상자 열기
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const htmlContent = parseMarkdown(currentDoc.content);
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${currentDoc.title}</title>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px 20px;
              color: #333;
            }
            h1, h2, h3 { color: #2c3e50; margin-top: 30px; }
            h1 { border-bottom: 2px solid #3498db; padding-bottom: 10px; }
            h2 { border-bottom: 1px solid #bdc3c7; padding-bottom: 5px; }
            pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }
            code { background: #f8f9fa; padding: 2px 4px; border-radius: 3px; }
            blockquote { 
              border-left: 4px solid #3498db; 
              margin: 20px 0; 
              padding: 10px 20px; 
              background: #ecf0f1; 
            }
            table { border-collapse: collapse; width: 100%; margin: 20px 0; }
            th, td { border: 1px solid #bdc3c7; padding: 12px; text-align: left; }
            th { background: #ecf0f1; font-weight: 600; }
            ul, ol { padding-left: 30px; }
            li { margin: 5px 0; }
            @media print {
              body { margin: 0; padding: 20px; }
              h1 { page-break-before: avoid; }
            }
          </style>
        </head>
        <body>
          <h1>${currentDoc.title}</h1>
          <hr>
          ${htmlContent}
          <br><br>
          <small style="color: #7f8c8d;">Generated from Personal Wiki • ${new Date().toLocaleDateString()}</small>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // 페이지가 로드된 후 인쇄 대화상자 열기
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
    
    setExportMenuOpen(false);
    console.log('PDF 내보내기 대화상자 열기:', currentDoc.title);
  };

  const handleShareLink = async () => {
    if (!currentDoc) return;
    
    // 현재 페이지 URL + 문서 ID를 공유 링크로 생성
    const shareUrl = `${window.location.origin}${window.location.pathname}?doc=${currentDoc.id}`;
    
    try {
      if (navigator.share) {
        // Web Share API 지원 시
        await navigator.share({
          title: currentDoc.title,
          text: `"${currentDoc.title}" 문서를 공유합니다.`,
          url: shareUrl
        });
        console.log('공유 완료');
      } else {
        // 클립보드에 복사
        await navigator.clipboard.writeText(shareUrl);
        alert('링크가 클립보드에 복사되었습니다!');
        console.log('링크 복사 완료:', shareUrl);
      }
    } catch (error) {
      console.error('공유 실패:', error);
      // 폴백: 수동 복사
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('링크가 클립보드에 복사되었습니다!');
    }
    
    setExportMenuOpen(false);
  };

  // 카테고리 펼침/접기 토글
  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // 카테고리 순서 이동
  const moveCategoryUp = async (categoryId: string) => {
    const currentIndex = categories.findIndex(cat => cat.id === categoryId);
    if (currentIndex <= 0) {
      console.log('카테고리를 위로 이동할 수 없음:', categoryId, 'currentIndex:', currentIndex);
      return; // 이미 맨 위거나 찾을 수 없음
    }
    
    try {
      const currentCategory = categories[currentIndex];
      const previousCategory = categories[currentIndex - 1];
      
      console.log('카테고리 위로 이동:', currentCategory.name, '↔', previousCategory.name);
      
      // 순서 교체
      await updateCategory(currentCategory.id, { order: previousCategory.order });
      await updateCategory(previousCategory.id, { order: currentCategory.order });
      
      console.log('카테고리 위로 이동 완료');
    } catch (error) {
      console.error('Error moving category up:', error);
      alert('카테고리 순서 변경 중 오류가 발생했습니다.');
    }
  };

  const moveCategoryDown = async (categoryId: string) => {
    const currentIndex = categories.findIndex(cat => cat.id === categoryId);
    if (currentIndex >= categories.length - 1 || currentIndex === -1) {
      console.log('카테고리를 아래로 이동할 수 없음:', categoryId, 'currentIndex:', currentIndex, 'total:', categories.length);
      return; // 이미 맨 아래거나 찾을 수 없음
    }
    
    try {
      const currentCategory = categories[currentIndex];
      const nextCategory = categories[currentIndex + 1];
      
      console.log('카테고리 아래로 이동:', currentCategory.name, '↔', nextCategory.name);
      
      // 순서 교체
      await updateCategory(currentCategory.id, { order: nextCategory.order });
      await updateCategory(nextCategory.id, { order: currentCategory.order });
      
      console.log('카테고리 아래로 이동 완료');
    } catch (error) {
      console.error('Error moving category down:', error);
      alert('카테고리 순서 변경 중 오류가 발생했습니다.');
    }
  };


  const handleSelectDocument = (doc: any) => {
    setCurrentDoc(doc);
    setContent(doc.content);
    setIsEditMode(false);
    selectDocument(doc);
    
    // localStorage에 현재 상태 저장
    localStorage.setItem('current-document', JSON.stringify(doc));
    localStorage.setItem('edit-mode', 'false');
    
    // 히스토리 초기화
    setHistory([doc.content]);
    setHistoryIndex(0);

    if (isSidebarVisible) {
      toggleSidebar();
    }
  };

  const handleEditDocument = () => {
    setIsEditMode(true);
    localStorage.setItem('edit-mode', 'true');
  };

  const handleSaveAndView = async () => {
    if (currentDoc) {
      try {
        await updateDocument(currentDoc.id, { content });
        // 로컬 상태도 즉시 업데이트
        const updatedDoc = { ...currentDoc, content };
        setCurrentDoc(updatedDoc);
        setIsEditMode(false);
        
        // localStorage도 업데이트
        localStorage.setItem('current-document', JSON.stringify(updatedDoc));
        localStorage.setItem('edit-mode', 'false');
      } catch (err) {
        console.error('Error saving document:', err);
      }
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (window.confirm('정말로 이 문서를 삭제하시겠습니까?')) {
      try {
        await deleteDocument(docId);
        if (currentDoc && currentDoc.id === docId) {
          setCurrentDoc(null);
          setIsEditMode(false);
          // localStorage 정리
          localStorage.removeItem('current-document');
          localStorage.removeItem('edit-mode');
        }
      } catch (err) {
        console.error('Error deleting document:', err);
      }
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    
    // Undo 히스토리 추가
    if (newContent !== history[historyIndex]) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newContent);
      
      if (newHistory.length > 50) {
        newHistory.shift();
      } else {
        setHistoryIndex(historyIndex + 1);
      }
      
      setHistory(newHistory);
    }
  };

  // Undo/Redo 함수들
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousContent = history[newIndex];
      setContent(previousContent);
      setHistoryIndex(newIndex);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextContent = history[newIndex];
      setContent(nextContent);
      setHistoryIndex(newIndex);
    }
  };

  // 키보드 단축키 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey) {
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault();
        handleRedo();
      }
    }
  };

  // 텍스트 삽입/제거 토글 함수
  const insertText = (before: string, after: string, placeholder: string) => {
    const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const beforeStart = start - before.length;
    const afterEnd = end + after.length;
    
    const textBefore = content.substring(Math.max(0, beforeStart), start);
    const textAfter = content.substring(end, Math.min(content.length, afterEnd));
    
    const hasMarkup = textBefore === before && textAfter === after;
    
    let newContent: string;
    let newSelectionStart: number;
    let newSelectionEnd: number;
    
    if (hasMarkup && selectedText) {
      newContent = content.substring(0, beforeStart) + selectedText + content.substring(afterEnd);
      newSelectionStart = beforeStart;
      newSelectionEnd = beforeStart + selectedText.length;
    } else {
      const textToInsert = selectedText || placeholder;
      newContent = content.substring(0, start) + before + textToInsert + after + content.substring(end);
      newSelectionStart = start + before.length;
      newSelectionEnd = newSelectionStart + textToInsert.length;
    }
    
    setContent(newContent);
    handleContentChange(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newSelectionStart, newSelectionEnd);
    }, 0);
  };

  // 아웃라인 구조 생성 (확장된 버전)
  const generateOutlineStructure = (text: string) => {
    interface OutlineItem {
      id: string;
      title: string;
      level: number;
      number: string;
      content?: string;
      children: OutlineItem[];
      startPos: number;
    }

    const outline: OutlineItem[] = [];
    const lines = text.split('\n');
    let h1Count = 0;
    let h2CountPerH1: {[key: number]: number} = {};
    let currentH1: OutlineItem | null = null;

    lines.forEach((line, index) => {
      const h1Match = line.match(/^#\s+(.+)$/);
      const h2Match = line.match(/^##\s+(.+)$/);

      if (h1Match) {
        h1Count++;
        h2CountPerH1[h1Count] = 0;
        const id = `heading-h1-${h1Count}`;
        
        currentH1 = {
          id,
          title: h1Match[1].trim(),
          level: 1,
          number: `${h1Count}`,
          content: '',
          children: [],
          startPos: index
        };
        outline.push(currentH1);
        
      } else if (h2Match && currentH1) {
        h2CountPerH1[h1Count]++;
        const id = `heading-h2-${h1Count}-${h2CountPerH1[h1Count]}`;
        
        const h2Item: OutlineItem = {
          id,
          title: h2Match[1].trim(),
          level: 2,
          number: `${h1Count}.${h2CountPerH1[h1Count]}`,
          content: '',
          children: [],
          startPos: index
        };
        currentH1.children.push(h2Item);
        
      } else if (line.trim() && currentH1) {
        // 일반 내용 라인
        if (currentH1.children.length > 0) {
          // 마지막 H2에 내용 추가
          const lastH2 = currentH1.children[currentH1.children.length - 1];
          lastH2.content = (lastH2.content || '') + line + '\n';
        } else {
          // H1에 직접 내용 추가
          currentH1.content = (currentH1.content || '') + line + '\n';
        }
      }
    });

    return outline;
  };

  // 기존 목차 (호환성 유지)
  const generateTOC = (text: string) => {
    const outline = generateOutlineStructure(text);
    const toc: Array<{id: string, title: string, level: number, number: string}> = [];

    const flattenOutline = (items: any[]) => {
      items.forEach(item => {
        toc.push({
          id: item.id,
          title: item.title,
          level: item.level,
          number: item.number
        });
        if (item.children) {
          flattenOutline(item.children);
        }
      });
    };

    flattenOutline(outline);
    return toc;
  };

  // 마크다운 텍스트 파싱 (앵커 ID 포함)
  const parseMarkdown = (text: string): string => {
    let html = text;
    let h1Count = 0;
    let h2Count = 0;
    let h3Count = 0;
    let currentH1 = 0;
    let currentH2 = 0;
    
    // 줄바꿈을 <br>로 변환 (코드 블록 제외)
    html = html.replace(/\n/g, '<br>');
    
    // 코드 블록 (```)
    html = html.replace(/```([a-z]*)<br>([\s\S]*?)```/g, (_, lang, code) => {
      const codeContent = code.replace(/<br>/g, '\n').trim();
      return `<pre style="background: #f8f9fa; padding: 12px; border-radius: 4px; margin: 10px 0; overflow-x: auto;"><code${lang ? ` class="language-${lang}"` : ''}>${codeContent}</code></pre>`;
    });
    
    // 인라인 코드 (`)
    html = html.replace(/`([^`]+)`/g, '<code style="background: #f8f9fa; padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>');
    
    // 제목들 (H1, H2, H3)
    html = html.replace(/^# (.+?)(?:<br>|$)/gm, (_, title) => {
      h1Count++;
      currentH1 = h1Count;
      h2Count = 0;
      h3Count = 0;
      const id = `heading-h1-${h1Count}`;
      return `<h1 id="${id}" style="scroll-margin-top: 80px; margin: 20px 0 10px 0;">${title.trim()}</h1>`;
    });
    
    html = html.replace(/^## (.+?)(?:<br>|$)/gm, (_, title) => {
      h2Count++;
      currentH2 = h2Count;
      h3Count = 0;
      const id = `heading-h2-${currentH1}-${h2Count}`;
      return `<h2 id="${id}" style="scroll-margin-top: 80px; margin: 18px 0 8px 0;">${title.trim()}</h2>`;
    });
    
    html = html.replace(/^### (.+?)(?:<br>|$)/gm, (_, title) => {
      h3Count++;
      const id = `heading-h3-${currentH1}-${currentH2}-${h3Count}`;
      return `<h3 id="${id}" style="scroll-margin-top: 80px; margin: 16px 0 6px 0;">${title.trim()}</h3>`;
    });
    
    // 텍스트 서식
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>'); // 굵은 기울임
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'); // 굵게
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>'); // 기울임
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>'); // 취소선
    
    // 인용문
    html = html.replace(/^&gt; (.+?)(?:<br>|$)/gm, '<blockquote style="border-left: 4px solid #dee2e6; margin: 10px 0; padding: 10px 15px; background: #f8f9fa;">$1</blockquote>');
    
    // 링크
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #007bff; text-decoration: underline;">$1</a>');
    
    // 자동 링크
    html = html.replace(/(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #007bff; text-decoration: underline;">$1</a>');
    
    // 불릿 리스트
    html = html.replace(/^- (.+?)(?=<br>|$)/gm, '<li>$1</li>');
    html = html.replace(/^• (.+?)(?=<br>|$)/gm, '<li>$1</li>');
    html = html.replace(/^\\* (.+?)(?=<br>|$)/gm, '<li>$1</li>');
    
    // 번호 리스트
    html = html.replace(/^\d+\. (.+?)(?=<br>|$)/gm, '<li>$1</li>');
    
    // 리스트를 ul/ol로 감싸기
    html = html.replace(/(<li>.*?<\/li>)/gs, (match) => {
      return `<ul style="margin: 10px 0; padding-left: 20px;">${match}</ul>`;
    });
    
    // 체크박스
    html = html.replace(/- \[ \] (.+?)(?=<br>|$)/gm, '<div style="margin: 5px 0;"><input type="checkbox" disabled style="margin-right: 8px;"> $1</div>');
    html = html.replace(/- \[x\] (.+?)(?=<br>|$)/gm, '<div style="margin: 5px 0;"><input type="checkbox" checked disabled style="margin-right: 8px;"> $1</div>');
    
    // 표 (간단한 구현)
    html = html.replace(/\|(.+?)\|<br>/g, (match) => {
      const cells = match.slice(1, -4).split('|').map(cell => `<td style="border: 1px solid #dee2e6; padding: 8px;">${cell.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    });
    html = html.replace(/(<tr>.*?<\/tr>)+/g, '<table style="border-collapse: collapse; margin: 10px 0; width: 100%;">$&</table>');
    
    // 구분선
    html = html.replace(/^---<br>|^---$/gm, '<hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">');
    
    return html;
  };

  const scrollToTop = () => {
    const contentArea = document.querySelector('.document-content');
    const previewArea = document.querySelector('.preview-content');
    
    if (contentArea) {
      contentArea.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (previewArea) {
      previewArea.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 목차 항목 클릭 시 해당 섹션으로 스크롤
  const scrollToHeading = (headingId: string) => {
    const element = document.getElementById(headingId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTocOpen(false);
    }
  };

  // 아웃라인 섹션 접기/펼치기
  const toggleSection = (sectionId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // 스크롤 이동 방지
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };


  if (loading) {
    return (
      <div className="app">
        <Header toggleSidebar={toggleSidebar} />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div>🔥 Firebase 연결 중...</div>
            <div style={{ marginTop: '10px', fontSize: '14px', color: '#6c757d' }}>잠시만 기다려주세요</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <Header toggleSidebar={toggleSidebar} />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <div style={{ textAlign: 'center', color: '#dc3545' }}>
            <div>❌ 오류 발생</div>
            <div style={{ marginTop: '10px', fontSize: '14px' }}>{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header toggleSidebar={toggleSidebar} />
      <div className="app-body">
        <div className={`sidebar ${isSidebarVisible ? 'sidebar-visible' : ''}`}>
          <h3>📁 문서 폴더</h3>
          
          {/* 트리 구조 카테고리 뷰 */}
          <div style={{ marginBottom: '15px' }}>
            {/* 카테고리별 트리 구조 */}
            {categories.map(category => {
              const categoryDocs = documents.filter(doc => doc.category === category.id);
              const isExpanded = expandedCategories.has(category.id);
              const isEditing = editingCategoryId === category.id;
              
              return (
                <React.Fragment key={category.id}>
                  <div style={{ marginBottom: '8px', position: 'relative' }}>
                    <div style={{ position: 'relative' }}>
                      {isEditing ? (
                      // 카테고리 이름 수정 모드
                      <div
                        style={{
                          padding: '6px 10px',
                          margin: '2px 0',
                          borderRadius: '4px',
                          fontSize: '13px',
                          backgroundColor: '#f8f9fa',
                          border: '2px solid #007bff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <span style={{ fontSize: '12px', width: '12px' }}>
                          {isExpanded ? '▼' : '▶'}
                        </span>
                        <div 
                          style={{ 
                            width: '12px', 
                            height: '12px', 
                            borderRadius: '50%', 
                            backgroundColor: category.color,
                            flexShrink: 0
                          }}
                        />
                        <input
                          type="text"
                          value={editingCategoryName}
                          onChange={(e) => setEditingCategoryName(e.target.value)}
                          onKeyDown={(e) => handleCategoryKeyDown(e, category.id)}
                          style={{
                            flex: 1,
                            padding: '2px 6px',
                            fontSize: '13px',
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            minWidth: '60px'
                          }}
                          autoFocus
                          placeholder="카테고리 이름"
                        />
                        <span style={{ fontSize: '11px', color: '#6c757d', flexShrink: 0 }}>
                          ({categoryDocs.length})
                        </span>
                        <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                          <button
                            onClick={() => handleSaveCategory(category.id)}
                            style={{
                              padding: '2px 6px',
                              fontSize: '10px',
                              background: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '2px',
                              cursor: 'pointer'
                            }}
                            title="저장"
                          >
                            ✓
                          </button>
                          <button
                            onClick={handleCancelEditCategory}
                            style={{
                              padding: '2px 6px',
                              fontSize: '10px',
                              background: '#6c757d',
                              color: 'white',
                              border: 'none',
                              borderRadius: '2px',
                              cursor: 'pointer'
                            }}
                            title="취소"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ) : (
                      // 카테고리 일반 표시 모드
                      <div
                        style={{
                          padding: '6px 10px',
                          margin: '2px 0',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          backgroundColor: selectedCategory === category.id ? '#e3f2fd' : 'transparent',
                          border: selectedCategory === category.id ? '2px solid #2196f3' : '1px solid transparent',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <span 
                          onClick={() => toggleCategoryExpansion(category.id)}
                          style={{ fontSize: '12px', width: '12px', cursor: 'pointer' }}
                        >
                          {isExpanded ? '▼' : '▶'}
                        </span>
                        <div 
                          style={{ 
                            width: '12px', 
                            height: '12px', 
                            borderRadius: '50%', 
                            backgroundColor: category.color 
                          }}
                        />
                        <span
                          onClick={() => setSelectedCategory(category.id)}
                          style={{
                            flex: 1,
                            cursor: 'pointer',
                            padding: '2px 4px',
                            borderRadius: '3px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedCategory === category.id ? '#e3f2fd' : 'transparent'}
                          title="클릭하여 선택"
                        >
                          {category.name} ({categoryDocs.length})
                        </span>
                        
                        {/* 3점 메뉴 버튼 - 같은 라인에 위치 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('3점 메뉴 클릭됨:', category.id, 'currentOpen:', categoryMenuOpen);
                            setCategoryMenuOpen(categoryMenuOpen === category.id ? null : category.id);
                          }}
                          style={{
                            background: categoryMenuOpen === category.id ? '#e9ecef' : 'none',
                            border: '1px solid ' + (categoryMenuOpen === category.id ? '#6c757d' : 'transparent'),
                            color: '#6c757d',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            opacity: 1,
                            padding: '6px 8px',
                            borderRadius: '4px',
                            lineHeight: '1',
                            flexShrink: 0,
                            minWidth: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            zIndex: 100
                          }}
                          title="카테고리 메뉴"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#e9ecef';
                            e.currentTarget.style.borderColor = '#6c757d';
                          }}
                          onMouseLeave={(e) => {
                            if (categoryMenuOpen !== category.id) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.borderColor = 'transparent';
                            }
                          }}
                        >
                          ⋮
                        </button>
                      </div>
                    )}
                    
                  </div>
                  
                  
                  {/* 드롭다운 메뉴 */}
                  {!isEditing && categoryMenuOpen === category.id && (
                    <div
                      className="category-menu-container category-dropdown-menu"
                      style={{
                        position: 'absolute',
                        right: '0px',
                        top: '100%',
                        background: 'white',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 9999,
                        minWidth: '140px',
                        padding: '4px 0',
                        marginTop: '2px'
                      }}
                    >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEditCategory(category.id, category.name);
                                setCategoryMenuOpen(null);
                              }}
                              style={{
                                width: '100%',
                                padding: '6px 12px',
                                background: 'none',
                                border: 'none',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: '12px',
                                color: '#495057'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              ✏️ 이름 수정
                            </button>
                            <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #dee2e6' }} />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveCategoryUp(category.id);
                                setCategoryMenuOpen(null);
                              }}
                              style={{
                                width: '100%',
                                padding: '6px 12px',
                                background: 'none',
                                border: 'none',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: '12px',
                                color: '#495057'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              ▲ 위로 이동
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveCategoryDown(category.id);
                                setCategoryMenuOpen(null);
                              }}
                              style={{
                                width: '100%',
                                padding: '6px 12px',
                                background: 'none',
                                border: 'none',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: '12px',
                                color: '#495057'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              ▼ 아래로 이동
                            </button>
                            {category.id !== 'general' && (
                              <>
                                <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #dee2e6' }} />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCategory(category.id);
                                    setCategoryMenuOpen(null);
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '6px 12px',
                                    background: 'none',
                                    border: 'none',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    color: '#dc3545'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  🗑️ 삭제
                                </button>
                              </>
                            )}
                    </div>
                  )}
                  
                    {/* 카테고리 하위 문서 리스트 */}
                    {isExpanded && (
                      <div style={{ marginLeft: '20px' }}>
                        {categoryDocs.length > 0 ? (
                          categoryDocs.map((doc) => {
                            const isEditing = editingDocumentId === doc.id;
                            
                            return (
                              <React.Fragment key={doc.id}>
                                <div
                                  className={`document-item ${currentDoc?.id === doc.id ? 'active' : ''}`}
                                  style={{ 
                                    cursor: 'pointer',
                                    marginBottom: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    backgroundColor: currentDoc?.id === doc.id ? '#e3f2fd' : 'transparent',
                                    border: currentDoc?.id === doc.id ? '1px solid #2196f3' : (isEditing ? '2px solid #007bff' : '1px solid transparent'),
                                    position: 'relative'
                                  }}
                                >
                                  {isEditing ? (
                                    // 문서 제목 편집 모드
                                    <>
                                      <input
                                        type="text"
                                        value={editingDocumentTitle}
                                        onChange={(e) => setEditingDocumentTitle(e.target.value)}
                                        onKeyDown={(e) => handleDocumentKeyDown(e, doc.id)}
                                        style={{
                                          flex: 1,
                                          padding: '2px 6px',
                                          fontSize: '13px',
                                          border: 'none',
                                          outline: 'none',
                                          background: 'transparent',
                                          minWidth: '80px'
                                        }}
                                        autoFocus
                                        placeholder="문서 제목"
                                      />
                                      <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                                        <button
                                          onClick={() => handleSaveDocumentTitle(doc.id)}
                                          style={{
                                            padding: '2px 6px',
                                            fontSize: '10px',
                                            background: '#28a745',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '2px',
                                            cursor: 'pointer'
                                          }}
                                          title="저장"
                                        >
                                          ✓
                                        </button>
                                        <button
                                          onClick={handleCancelEditDocument}
                                          style={{
                                            padding: '2px 6px',
                                            fontSize: '10px',
                                            background: '#6c757d',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '2px',
                                            cursor: 'pointer'
                                          }}
                                          title="취소"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    </>
                                  ) : (
                                    // 문서 일반 표시 모드
                                    <>
                                      <span
                                        onClick={() => handleSelectDocument(doc)}
                                        style={{ flex: 1, cursor: 'pointer' }}
                                      >
                                        {doc.title}
                                      </span>
                                      
                                      {/* 문서용 3점 메뉴 버튼 */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          console.log('문서 3점 메뉴 클릭됨:', doc.id, 'currentOpen:', documentMenuOpen);
                                          setDocumentMenuOpen(documentMenuOpen === doc.id ? null : doc.id);
                                        }}
                                        style={{
                                          background: documentMenuOpen === doc.id ? '#e9ecef' : 'none',
                                          border: '1px solid ' + (documentMenuOpen === doc.id ? '#6c757d' : 'transparent'),
                                          color: '#6c757d',
                                          cursor: 'pointer',
                                          fontSize: '16px',
                                          fontWeight: 'bold',
                                          opacity: 1,
                                          padding: '4px 6px',
                                          borderRadius: '4px',
                                          lineHeight: '1',
                                          flexShrink: 0,
                                          minWidth: '20px',
                                          height: '20px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          position: 'relative',
                                          zIndex: 100
                                        }}
                                        title="문서 메뉴"
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = '#e9ecef';
                                          e.currentTarget.style.borderColor = '#6c757d';
                                        }}
                                        onMouseLeave={(e) => {
                                          if (documentMenuOpen !== doc.id) {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.style.borderColor = 'transparent';
                                          }
                                        }}
                                      >
                                        ⋮
                                      </button>
                                    </>
                                  )}
                                </div>

                                {/* 문서 드롭다운 메뉴 */}
                                {!isEditing && documentMenuOpen === doc.id && (
                                  <div
                                    className="document-menu-container document-dropdown-menu"
                                    style={{
                                      position: 'absolute',
                                      right: '0px',
                                      top: '100%',
                                      background: 'white',
                                      border: '1px solid #dee2e6',
                                      borderRadius: '4px',
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                      zIndex: 9999,
                                      minWidth: '140px',
                                      padding: '4px 0',
                                      marginTop: '2px',
                                      marginLeft: '20px'
                                    }}
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStartEditDocument(doc.id, doc.title);
                                      }}
                                      style={{
                                        width: '100%',
                                        padding: '6px 12px',
                                        background: 'none',
                                        border: 'none',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        color: '#495057'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                      ✏️ 이름 수정
                                    </button>
                                    <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #dee2e6' }} />
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDuplicateDocument(doc);
                                        setDocumentMenuOpen(null);
                                      }}
                                      style={{
                                        width: '100%',
                                        padding: '6px 12px',
                                        background: 'none',
                                        border: 'none',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        color: '#495057'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                      📋 복사본 만들기
                                    </button>
                                    <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #dee2e6' }} />
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteDocumentFromMenu(doc.id, doc.title);
                                        setDocumentMenuOpen(null);
                                      }}
                                      style={{
                                        width: '100%',
                                        padding: '6px 12px',
                                        background: 'none',
                                        border: 'none',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        color: '#dc3545'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                      🗑️ 삭제
                                    </button>
                                  </div>
                                )}
                              </React.Fragment>
                            );
                          })
                        ) : (
                          <p style={{ 
                            color: '#6c757d', 
                            fontSize: '11px', 
                            fontStyle: 'italic', 
                            margin: '4px 0', 
                            padding: '4px 8px' 
                          }}>
                            이 카테고리에 문서가 없습니다.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {isCreating ? (
            <div>
              {/* 선택된 카테고리 표시 */}
              {selectedCategory && selectedCategory !== 'all' && (
                <div style={{ 
                  marginBottom: '8px', 
                  padding: '6px 10px', 
                  background: '#e3f2fd', 
                  borderRadius: '4px',
                  border: '1px solid #2196f3',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div 
                    style={{ 
                      width: '10px', 
                      height: '10px', 
                      borderRadius: '50%', 
                      backgroundColor: categories.find(cat => cat.id === selectedCategory)?.color || '#6c757d'
                    }}
                  />
                  선택된 카테고리: {categories.find(cat => cat.id === selectedCategory)?.name || '일반'}
                </div>
              )}
              <input
                type="text"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateDocument();
                  if (e.key === 'Escape') {
                    setIsCreating(false);
                    setNewDocTitle('');
                    setNewDocCategory('general');
                  }
                }}
                placeholder="문서 제목"
                className="new-doc-input"
                autoFocus
              />
              {/* 카테고리를 수동으로 변경하고 싶을 때만 선택 */}
              {(!selectedCategory || selectedCategory === 'all') && (
                <select
                  value={newDocCategory}
                  onChange={(e) => setNewDocCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    fontSize: '14px',
                    marginBottom: '8px'
                  }}
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleCreateDocument}
                  className="new-doc-btn confirm"
                >
                  생성
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewDocTitle('');
                    setNewDocCategory('general');
                  }}
                  className="new-doc-btn cancel"
                >
                  취소
                </button>
              </div>
            </div>
          ) : null}
          
          {/* 새 카테고리 생성 */}
          {isCreatingCategory ? (
            <div style={{ marginTop: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>새 카테고리</h4>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateCategory();
                  if (e.key === 'Escape') setIsCreatingCategory(false);
                }}
                placeholder="카테고리 이름"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #dee2e6',
                  borderRadius: '3px',
                  fontSize: '13px',
                  marginBottom: '8px'
                }}
                autoFocus
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', color: '#6c757d' }}>색상:</label>
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  style={{ width: '30px', height: '20px', border: 'none', borderRadius: '3px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={handleCreateCategory}
                  style={{
                    flex: 1,
                    padding: '6px',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  생성
                </button>
                <button
                  onClick={() => setIsCreatingCategory(false)}
                  style={{
                    flex: 1,
                    padding: '6px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreatingCategory(true)}
              style={{
                width: '100%',
                padding: '8px',
                background: '#6f42c1',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              + 새 카테고리
            </button>
          )}
        </div>
        
        {/* 메인 콘텐츠 영역 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {currentDoc ? (
            isEditMode ? (
              // 편집 모드
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* 통합 뷰 스위처 */}
                <div style={{ 
                  display: 'flex', 
                  gap: '4px', 
                  padding: '8px 16px', 
                  background: '#f8f9fa', 
                  borderBottom: '1px solid #dee2e6',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '12px', color: '#6c757d', marginRight: '12px' }}>편집 모드:</span>
                  
                  {/* 데스크톱 뷰 스위처 */}
                  <div className="desktop-view-switcher" style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      onClick={() => setDesktopView('split')} 
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        background: desktopView === 'split' ? '#007bff' : '#f8f9fa',
                        color: desktopView === 'split' ? 'white' : '#495057',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      분할 보기
                    </button>
                    <button 
                      onClick={() => setDesktopView('editor')} 
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        background: desktopView === 'editor' ? '#007bff' : '#f8f9fa',
                        color: desktopView === 'editor' ? 'white' : '#495057',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      편집만
                    </button>
                    <button 
                      onClick={() => setDesktopView('preview')} 
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        background: desktopView === 'preview' ? '#007bff' : '#f8f9fa',
                        color: desktopView === 'preview' ? 'white' : '#495057',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      미리보기만
                    </button>
                  </div>
                  
                  {/* 모바일 뷰 스위처 */}
                  <div className="mobile-view-switcher" style={{ display: 'none', gap: '4px' }}>
                    <button 
                      onClick={() => setMobileView('editor')} 
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        background: mobileView === 'editor' ? '#007bff' : '#f8f9fa',
                        color: mobileView === 'editor' ? 'white' : '#495057',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      편집
                    </button>
                    <button 
                      onClick={() => setMobileView('preview')} 
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        background: mobileView === 'preview' ? '#007bff' : '#f8f9fa',
                        color: mobileView === 'preview' ? 'white' : '#495057',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      미리보기
                    </button>
                  </div>
                </div>
                
                <div style={{ 
                  flex: 1, 
                  display: 'flex',
                  flexDirection: desktopView === 'split' ? 'row' : 'column'
                }} className="editor-preview-container">
                  {/* 편집기 */}
                  {(desktopView === 'split' || desktopView === 'editor' || (window.innerWidth <= 768 && mobileView === 'editor')) && (
                    <div style={{ 
                      flex: desktopView === 'split' ? 1 : 1, 
                      display: 'flex', 
                      flexDirection: 'column',
                      borderRight: desktopView === 'split' ? '1px solid #dee2e6' : 'none'
                    }} className="editor-pane">
                    <div className="editor-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        <span style={{ fontSize: '12px', color: '#6c757d' }}>편집 모드</span>
                        
                        {/* 문서명 수정과 편집 버튼을 카테고리 드롭다운 바로 옆에 배치 */}
                        {isEditingTitle ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={handleTitleKeyDown}
                              style={{
                                padding: '6px 10px',
                                fontSize: '14px',
                                border: '2px solid #007bff',
                                borderRadius: '4px',
                                outline: 'none',
                                minWidth: '200px'
                              }}
                              autoFocus
                              placeholder="문서 제목을 입력하세요"
                            />
                            <button
                              onClick={handleSaveTitle}
                              style={{
                                padding: '6px 10px',
                                fontSize: '12px',
                                background: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer'
                              }}
                            >
                              저장
                            </button>
                            <button
                              onClick={handleCancelEditTitle}
                              style={{
                                padding: '6px 10px',
                                fontSize: '12px',
                                background: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer'
                              }}
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <div 
                            className="editor-header-title"
                            onClick={handleStartEditTitle}
                            style={{
                              cursor: 'pointer',
                              padding: '6px 10px',
                              borderRadius: '4px',
                              transition: 'background-color 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            title="제목을 클릭하여 수정"
                          >
                            📄 {currentDoc.title}
                            <span style={{ fontSize: '11px', color: '#6c757d' }}>✏️</span>
                          </div>
                        )}
                        
                        <button
                          onClick={() => handleDeleteDocument(currentDoc.id)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                          title="문서 삭제"
                        >
                          🗑️ 삭제
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button
                          onClick={handleSaveAndView}
                          className="editor-header-btn"
                        >
                          저장
                        </button>
                      </div>
                    </div>
                    
                    {/* 실행취소/다시실행 툴바 */}
                    <div className="editor-toolbar">
                      <span style={{ fontSize: '11px', color: '#6c757d', marginRight: '8px' }}>실행취소:</span>
                      <button
                        onClick={handleUndo}
                        disabled={historyIndex <= 0}
                        style={{...toolbarButtonStyle, opacity: historyIndex <= 0 ? 0.5 : 1, cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer'}}
                        title="실행취소 (Ctrl+Z)"
                      >
                        ↶
                      </button>
                      <button
                        onClick={handleRedo}
                        disabled={historyIndex >= history.length - 1}
                        style={{...toolbarButtonStyle, opacity: historyIndex >= history.length - 1 ? 0.5 : 1, cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer'}}
                        title="다시실행 (Ctrl+Y)"
                      >
                        ↷
                      </button>
                    </div>
                    
                    <textarea
                      className="editor-textarea"
                      value={content}
                      onChange={(e) => handleContentChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      style={{
                        flex: 1,
                        padding: '20px',
                        border: 'none',
                        outline: 'none',
                        fontFamily: 'Courier New, monospace',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        resize: 'none'
                      }}
                      placeholder="마크다운 문서를 작성하세요..."
                    />
                    </div>
                  )}
                  
                  {/* 미리보기 */}
                  {(desktopView === 'split' || desktopView === 'preview' || (window.innerWidth <= 768 && mobileView === 'preview')) && (
                    <div style={{ 
                      flex: desktopView === 'split' ? 1 : 1, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      borderLeft: desktopView === 'split' ? '1px solid #dee2e6' : 'none'
                    }} className="preview-pane">
                    <div className="preview-header">
                      <span style={{ fontSize: '12px', color: '#6c757d' }}>미리보기</span>
                    </div>
                    <div 
                      className="preview-content"
                      style={{
                        flex: 1,
                        overflow: 'auto',
                        overflowY: 'scroll',
                        lineHeight: '1.6',
                        fontSize: '14px',
                        maxHeight: 'calc(100vh - 140px)',
                        position: 'relative'
                      }}
                    >
                      <div style={{ padding: '20px', paddingBottom: '60px' }}>
                        <div dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} />
                        
                        <div style={{ textAlign: 'center', marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #dee2e6'}}>
                          <button onClick={scrollToTop} className="scroll-top-btn">
                            ⬆️ 위로
                          </button>
                        </div>
                      </div>
                    </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // 읽기 모드
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="editor-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                    <span style={{ fontSize: '12px', color: '#6c757d' }}>읽기 모드</span>
                    {/* 카테고리 선택 드롭다운 */}
                    {currentDoc && (
                      <select
                        value={currentDoc.category || 'general'}
                        onChange={async (e) => {
                          const newCategory = e.target.value;
                          try {
                            await updateDocument(currentDoc.id, { category: newCategory });
                            const updatedDoc = { ...currentDoc, category: newCategory };
                            setCurrentDoc(updatedDoc);
                            localStorage.setItem('current-document', JSON.stringify(updatedDoc));
                          } catch (error) {
                            console.error('Error updating document category:', error);
                          }
                        }}
                        style={{
                          padding: '4px 8px',
                          fontSize: '11px',
                          border: '1px solid #dee2e6',
                          borderRadius: '3px',
                          background: 'white'
                        }}
                        title="문서 카테고리 변경"
                      >
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    )}
                    
                    {/* 문서명 수정과 편집 버튼을 카테고리 드롭다운 바로 옆에 배치 */}
                    {isEditingTitle ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={handleTitleKeyDown}
                          style={{
                            padding: '6px 10px',
                            fontSize: '14px',
                            border: '2px solid #007bff',
                            borderRadius: '4px',
                            outline: 'none',
                            minWidth: '200px'
                          }}
                          autoFocus
                          placeholder="문서 제목을 입력하세요"
                        />
                        <button
                          onClick={handleSaveTitle}
                          style={{
                            padding: '6px 10px',
                            fontSize: '12px',
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer'
                          }}
                        >
                          저장
                        </button>
                        <button
                          onClick={handleCancelEditTitle}
                          style={{
                            padding: '6px 10px',
                            fontSize: '12px',
                            background: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer'
                          }}
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <div 
                        className="editor-header-title"
                        onClick={handleStartEditTitle}
                        style={{
                          cursor: 'pointer',
                          padding: '6px 10px',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        title="제목을 클릭하여 수정"
                      >
                        📄 {currentDoc.title}
                        <span style={{ fontSize: '11px', color: '#6c757d' }}>✏️</span>
                      </div>
                    )}
                    
                    <button
                      onClick={handleEditDocument}
                      className="editor-header-btn edit"
                    >
                      편집
                    </button>
                    
                    {/* 내보내기 버튼 */}
                    <div className="export-menu-container" style={{ position: 'relative' }}>
                      <button
                        onClick={() => setExportMenuOpen(!exportMenuOpen)}
                        className="editor-header-btn"
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        📤 내보내기
                      </button>
                      
                      {/* 내보내기 드롭다운 메뉴 */}
                      {exportMenuOpen && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            right: '0px',
                            background: 'white',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            zIndex: 1000,
                            minWidth: '160px',
                            marginTop: '4px'
                          }}
                        >
                          <button
                            onClick={handleExportAsText}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              background: 'none',
                              border: 'none',
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontSize: '13px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            📄 텍스트 파일 (.txt)
                          </button>
                          <button
                            onClick={handleExportAsMarkdown}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              background: 'none',
                              border: 'none',
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontSize: '13px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            📝 마크다운 (.md)
                          </button>
                          <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #dee2e6' }} />
                          <button
                            onClick={handleExportAsPDF}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              background: 'none',
                              border: 'none',
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontSize: '13px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            📄 PDF 파일
                          </button>
                          <button
                            onClick={handleShareLink}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              background: 'none',
                              border: 'none',
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontSize: '13px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            🔗 링크 복사
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div 
                  className="document-content"
                  style={{
                    flex: 1,
                    overflow: 'auto',
                    overflowY: 'scroll',
                    lineHeight: '1.6',
                    fontSize: '14px',
                    maxHeight: 'calc(100vh - 100px)',
                    position: 'relative'
                  }}
                >
                  <div style={{ padding: '20px', paddingBottom: '60px' }}>
                    <div dangerouslySetInnerHTML={{ __html: parseMarkdown(currentDoc.content) }} />
                    
                    <div style={{ textAlign: 'center', marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #dee2e6'}}>
                      <button onClick={scrollToTop} className="scroll-top-btn">
                        ⬆️ 위로
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : (
            // 기본 화면
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '12px', background: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
                <span style={{ fontSize: '12px', color: '#6c757d' }}>☁️ Firebase 연결됨</span>
              </div>
              <div 
                style={{
                  flex: 1,
                  overflow: 'auto',
                  overflowY: 'scroll',
                  lineHeight: '1.6',
                  fontSize: '14px',
                  maxHeight: 'calc(100vh - 100px)'
                }}
              >
                <div style={{ padding: '20px' }}>
                  <div dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <button onClick={() => { setIsCreating(true); if (!isSidebarVisible) { toggleSidebar(); } }} className="fab">
        새 문서
      </button>
      
      {/* 플로팅 버튼들 */}
      {currentDoc && (
        <div>
          {/* 댓글 버튼 */}
          <div className="comments-container" style={{ position: 'relative' }}>
            <button 
              onClick={() => setCommentsOpen(!commentsOpen)}
              style={{
                position: 'fixed',
                right: '20px',
                bottom: '140px',
                width: '50px',
                height: '50px',
                borderRadius: '25px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                zIndex: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="댓글"
            >
              💬
            </button>
          </div>
          
          {/* 목차 버튼 */}
          <div className="toc-container" style={{ position: 'relative' }}>
            <button 
              onClick={() => setTocOpen(!tocOpen)}
              style={{
                position: 'fixed',
                right: '20px',
                bottom: '80px',
                width: '50px',
                height: '50px',
                borderRadius: '25px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                zIndex: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="아웃라인"
            >
              🌳
            </button>
          
          {/* 목차 팝업 */}
          {tocOpen && (
            <div
              style={{
                position: 'fixed',
                right: '20px',
                bottom: '140px',
                background: 'white',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 1000,
                minWidth: '280px',
                maxWidth: '400px',
                maxHeight: '400px',
                overflow: 'auto'
              }}
            >
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #dee2e6',
                background: '#f8f9fa',
                borderRadius: '8px 8px 0 0',
                fontWeight: '600',
                fontSize: '14px',
                color: '#495057'
              }}>
                🌳 아웃라인
              </div>
              <div style={{ padding: '4px 0' }}>
                {generateOutlineStructure(currentDoc.content).map((item) => (
                  <div key={item.id}>
                    {/* H1 제목 */}
                    <div
                      onClick={() => scrollToHeading(item.id)}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#212529',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: '4px',
                        margin: '2px 0'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* 접기/펼치기 버튼 */}
                      {item.children.length > 0 && (
                        <button
                          onClick={(e) => toggleSection(item.id, e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: '#6c757d',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: '2px'
                          }}
                          onMouseEnter={(e) => {
                            e.stopPropagation();
                            e.currentTarget.style.backgroundColor = '#e9ecef';
                          }}
                          onMouseLeave={(e) => {
                            e.stopPropagation();
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {collapsedSections.has(item.id) ? '▶' : '▼'}
                        </button>
                      )}
                      {item.children.length === 0 && (
                        <div style={{ width: '18px' }}></div>
                      )}
                      
                      <span style={{ 
                        minWidth: '20px', 
                        fontSize: '11px', 
                        color: '#007bff',
                        fontWeight: '600'
                      }}>
                        {item.number}
                      </span>
                      <span style={{ flex: 1 }}>{item.title}</span>
                      
                      {/* 내용 미리보기 */}
                      {item.content && (
                        <span style={{
                          fontSize: '10px',
                          color: '#6c757d',
                          maxWidth: '100px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {item.content.replace(/\n/g, ' ').substring(0, 30)}...
                        </span>
                      )}
                    </div>

                    {/* H2 자식 항목들 */}
                    {!collapsedSections.has(item.id) && item.children.map((child) => (
                      <div
                        key={child.id}
                        onClick={() => scrollToHeading(child.id)}
                        style={{
                          padding: '6px 12px',
                          paddingLeft: '44px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          color: '#6c757d',
                          fontWeight: '400',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          borderLeft: '2px solid #e9ecef',
                          marginLeft: '16px',
                          borderRadius: '0 4px 4px 0'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span style={{ 
                          minWidth: '24px', 
                          fontSize: '10px', 
                          color: '#007bff',
                          fontWeight: '500'
                        }}>
                          {child.number}
                        </span>
                        <span style={{ flex: 1 }}>{child.title}</span>
                        
                        {/* 내용 미리보기 */}
                        {child.content && (
                          <span style={{
                            fontSize: '9px',
                            color: '#adb5bd',
                            maxWidth: '80px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {child.content.replace(/\n/g, ' ').substring(0, 25)}...
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
                {generateTOC(currentDoc.content).length === 0 && (
                  <div style={{
                    padding: '16px',
                    textAlign: 'center',
                    color: '#6c757d',
                    fontSize: '12px',
                    fontStyle: 'italic'
                  }}>
                    제목이 없습니다.<br/>
                    == 제목 == 또는 === 소제목 ===을 사용해보세요.
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* 댓글 팝업 */}
          {commentsOpen && (
            <div
              style={{
                position: 'fixed',
                right: '20px',
                bottom: '200px',
                background: 'white',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 1000,
                minWidth: '350px',
                maxWidth: '400px',
                maxHeight: '500px',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #dee2e6',
                background: '#f8f9fa',
                borderRadius: '8px 8px 0 0',
                fontWeight: '600',
                fontSize: '14px',
                color: '#495057',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                💬 댓글 ({getCommentsByDocument(currentDoc.id).length})
              </div>
              
              {/* 댓글 목록 */}
              <div style={{ 
                flex: 1, 
                overflow: 'auto', 
                maxHeight: '300px',
                padding: '8px 0'
              }}>
                {getCommentsByDocument(currentDoc.id).map((comment) => (
                  <div key={comment.id} style={{
                    padding: '8px 16px',
                    borderBottom: '1px solid #f8f9fa',
                    margin: '4px 0'
                  }}>
                    {editingCommentId === comment.id ? (
                      // 댓글 편집 모드
                      <div>
                        <textarea
                          value={editingCommentContent}
                          onChange={(e) => setEditingCommentContent(e.target.value)}
                          style={{
                            width: '100%',
                            minHeight: '60px',
                            padding: '8px',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            fontSize: '13px',
                            fontFamily: 'inherit',
                            resize: 'vertical'
                          }}
                          placeholder="댓글 내용..."
                          autoFocus
                        />
                        <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                          <button
                            onClick={handleSaveComment}
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              background: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer'
                            }}
                          >
                            저장
                          </button>
                          <button
                            onClick={handleCancelEditComment}
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              background: '#6c757d',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer'
                            }}
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      // 댓글 읽기 모드
                      <div>
                        <div style={{
                          fontSize: '13px',
                          color: '#495057',
                          marginBottom: '6px',
                          lineHeight: '1.4'
                        }}>
                          {comment.content}
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '11px',
                          color: '#6c757d'
                        }}>
                          <div>
                            {comment.userName} • {comment.createdAt.toLocaleDateString()} {comment.createdAt.toLocaleTimeString()}
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleStartEditComment(comment.id, comment.content)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#007bff',
                                cursor: 'pointer',
                                fontSize: '11px'
                              }}
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#dc3545',
                                cursor: 'pointer',
                                fontSize: '11px'
                              }}
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {getCommentsByDocument(currentDoc.id).length === 0 && (
                  <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#6c757d',
                    fontSize: '12px'
                  }}>
                    아직 댓글이 없습니다.<br/>
                    첫 번째 댓글을 작성해보세요!
                  </div>
                )}
              </div>
              
              {/* 새 댓글 작성 */}
              <div style={{
                padding: '12px 16px',
                borderTop: '1px solid #dee2e6',
                background: '#f8f9fa',
                borderRadius: '0 0 8px 8px'
              }}>
                <textarea
                  value={newCommentContent}
                  onChange={(e) => setNewCommentContent(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '60px',
                    padding: '8px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                  placeholder="댓글을 작성하세요..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      e.preventDefault();
                      handleCreateComment();
                    }
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '8px'
                }}>
                  <span style={{ fontSize: '11px', color: '#6c757d' }}>
                    Ctrl + Enter로 빠른 작성
                  </span>
                  <button
                    onClick={handleCreateComment}
                    disabled={!newCommentContent.trim()}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      background: newCommentContent.trim() ? '#28a745' : '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: newCommentContent.trim() ? 'pointer' : 'not-allowed'
                    }}
                  >
                    댓글 작성
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AppFirebase;