import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, where, deleteField } from 'firebase/firestore';
import { db } from '../firebase';
import { Category, Folder, WikiDocument, UIState, Bookmark } from '../types';


interface DocumentComment {
  id: string;
  documentId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  userName?: string;
}

interface DocumentContextType {
  // 데이터 상태
  categories: Category[];
  folders: Folder[];
  documents: WikiDocument[];
  bookmarks: Bookmark[];
  comments: DocumentComment[];
  uiState: UIState;
  loading: boolean;
  error: string | null;
  
  // 카테고리 관리
  createCategory: (name: string, color: string) => Promise<string>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategory: (categoryId: string, direction: 'up' | 'down') => Promise<void>;
  
  // 폴더 관리
  createFolder: (categoryId: string, name: string) => Promise<string>;
  updateFolder: (id: string, updates: Partial<Folder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  reorderFolder: (folderId: string, direction: 'up' | 'down') => Promise<void>;
  toggleFolder: (folderId: string) => void;
  
  // 문서 관리
  createDocument: (folderId: string, title: string, content: string) => Promise<string>;
  updateDocument: (id: string, updates: Partial<WikiDocument>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  reorderDocument: (documentId: string, direction: 'up' | 'down') => Promise<void>;
  
  // 선택 관리
  selectCategory: (categoryId: string | null) => void;
  selectFolder: (folderId: string | null) => void;
  selectDocument: (documentId: string | null) => void;
  
  // 댓글 관리
  createComment: (documentId: string, content: string) => Promise<string>;
  updateComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  getCommentsByDocument: (documentId: string) => DocumentComment[];
  
  // 유틸리티
  getFoldersByCategory: (categoryId: string) => Folder[];
  getDocumentsByFolder: (folderId: string) => WikiDocument[];
  getSelectedDocument: () => WikiDocument | null;
  searchDocuments: (searchTerm: string) => Promise<WikiDocument[]>;
  
  // 북마크 관리
  createBookmark: (title: string, url: string, color?: string) => Promise<string>;
  updateBookmark: (id: string, updates: Partial<Bookmark>) => Promise<void>;
  deleteBookmark: (id: string) => Promise<void>;
  reorderBookmark: (id: string, direction: 'up' | 'down') => Promise<void>;
  reorderBookmarks: (reorderedBookmarks: Bookmark[]) => Promise<void>;
  
  // 빠른메모
  createQuickMemo: (content: string) => Promise<string>;
  navigateToQuickMemoFolder: () => Promise<void>;
  
  // 즐겨찾기 관리
  toggleFavorite: (documentId: string) => Promise<void>;
  getFavoriteDocuments: () => WikiDocument[];
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
};

interface DocumentProviderProps {
  children: ReactNode;
  userId?: string;
}

export const DocumentProvider: React.FC<DocumentProviderProps> = ({ 
  children, 
  userId = 'default-user'
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [documents, setDocuments] = useState<WikiDocument[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [comments, setComments] = useState<DocumentComment[]>([]);
  // localStorage에서 이전 상태 복원
  const getInitialUIState = (): UIState => {
    try {
      const saved = localStorage.getItem('wiki-ui-state');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          selectedCategoryId: parsed.selectedCategoryId || null,
          selectedFolderId: parsed.selectedFolderId || null,
          selectedDocumentId: parsed.selectedDocumentId || null,
          expandedFolders: new Set(parsed.expandedFolders || []),
          isLoading: false
        };
      }
    } catch (error) {
      console.warn('UI 상태 복원 실패:', error);
    }
    
    return {
      selectedCategoryId: null,
      selectedFolderId: null,
      selectedDocumentId: null,
      expandedFolders: new Set(),
      isLoading: false
    };
  };

  const [uiState, setUiState] = useState<UIState>(getInitialUIState());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI 상태 변경 시 localStorage에 저장
  useEffect(() => {
    try {
      const stateToSave = {
        selectedCategoryId: uiState.selectedCategoryId,
        selectedFolderId: uiState.selectedFolderId,
        selectedDocumentId: uiState.selectedDocumentId,
        expandedFolders: Array.from(uiState.expandedFolders)
      };
      localStorage.setItem('wiki-ui-state', JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('UI 상태 저장 실패:', error);
    }
  }, [uiState.selectedCategoryId, uiState.selectedFolderId, uiState.selectedDocumentId, uiState.expandedFolders]);

  // Firebase에서 카테고리 목록 실시간 구독
  useEffect(() => {
    const categoriesRef = collection(db, 'users', userId, 'categories');
    const q = query(categoriesRef, orderBy('order', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cats: Category[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        cats.push({
          id: doc.id,
          name: data.name,
          color: data.color,
          order: data.order || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });
      
      if (cats.length === 0) {
        const defaultCategories: Category[] = [
          { id: 'general', name: '일반', color: '#6c757d', order: 0, createdAt: new Date(), updatedAt: new Date() },
          { id: 'personal', name: '개인', color: '#28a745', order: 1, createdAt: new Date(), updatedAt: new Date() },
          { id: 'work', name: '업무', color: '#007bff', order: 2, createdAt: new Date(), updatedAt: new Date() }
        ];
        
        defaultCategories.forEach(async (category) => {
          const categoryRef = doc(db, 'users', userId, 'categories', category.id);
          await setDoc(categoryRef, {
            name: category.name,
            color: category.color,
            order: category.order,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt
          });
        });
        
        setCategories(defaultCategories);
      } else {
        setCategories(cats);
      }
    }, (err) => {
      console.error('Error fetching categories:', err);
      setError('카테고리를 불러오는 중 오류가 발생했습니다.');
    });

    return () => unsubscribe();
  }, [userId]);

  // Firebase에서 폴더 목록 실시간 구독
  useEffect(() => {
    const foldersRef = collection(db, 'users', userId, 'folders');
    const q = query(foldersRef, orderBy('order', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const flds: Folder[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        flds.push({
          id: doc.id,
          categoryId: data.categoryId,
          name: data.name,
          order: data.order || 0,
          isExpanded: data.isExpanded || false,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });
      setFolders(flds);
    }, (err) => {
      console.error('Error fetching folders:', err);
      setError('폴더를 불러오는 중 오류가 발생했습니다.');
    });

    return () => unsubscribe();
  }, [userId]);

  // Firebase에서 문서 목록 실시간 구독
  useEffect(() => {
    const documentsRef = collection(db, 'users', userId, 'documents');
    const q = query(documentsRef, orderBy('order', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: WikiDocument[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        docs.push({
          id: doc.id,
          folderId: data.folderId,
          title: data.title,
          content: data.content,
          order: data.order || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastModified: data.lastModified?.toDate() || new Date(),
          userId: data.userId,
          tags: data.tags || [],
          isFavorite: data.isFavorite || false,
          favoriteOrder: data.favoriteOrder
        });
      });
      setDocuments(docs);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching documents:', err);
      setError('문서를 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // 데이터 로딩 완료 후 저장된 UI 상태 검증 및 복원
  useEffect(() => {
    if (!loading && categories.length > 0 && folders.length > 0 && documents.length > 0) {
      const { selectedCategoryId, selectedFolderId, selectedDocumentId } = uiState;
      
      // 선택된 카테고리가 존재하는지 확인
      if (selectedCategoryId && !categories.find(cat => cat.id === selectedCategoryId)) {
        setUiState(prev => ({ ...prev, selectedCategoryId: null, selectedFolderId: null, selectedDocumentId: null }));
        return;
      }
      
      // 선택된 폴더가 존재하는지 확인
      if (selectedFolderId && !folders.find(folder => folder.id === selectedFolderId)) {
        setUiState(prev => ({ ...prev, selectedFolderId: null, selectedDocumentId: null }));
        return;
      }
      
      // 선택된 문서가 존재하는지 확인
      if (selectedDocumentId && !documents.find(doc => doc.id === selectedDocumentId)) {
        setUiState(prev => ({ ...prev, selectedDocumentId: null }));
        return;
      }
    }
  }, [loading, categories, folders, documents, uiState.selectedCategoryId, uiState.selectedFolderId, uiState.selectedDocumentId]);

  // Firebase에서 댓글 목록 실시간 구독
  useEffect(() => {
    const commentsRef = collection(db, 'users', userId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cmts: DocumentComment[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        cmts.push({
          id: doc.id,
          documentId: data.documentId,
          content: data.content,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          userId: data.userId,
          userName: data.userName || '익명'
        });
      });
      setComments(cmts);
    }, (err) => {
      console.error('Error fetching comments:', err);
    });

    return () => unsubscribe();
  }, [userId]);

  // Firebase에서 북마크 목록 실시간 구독
  useEffect(() => {
    const bookmarksRef = collection(db, 'users', userId, 'bookmarks');
    const q = query(bookmarksRef, orderBy('order', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bks: Bookmark[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        bks.push({
          id: doc.id,
          title: data.title,
          url: data.url,
          order: data.order,
          isDefault: data.isDefault || false,
          color: data.color || '#4285f4'
        });
      });
      setBookmarks(bks);
    }, (err) => {
      console.error('Error fetching bookmarks:', err);
    });

    return () => unsubscribe();
  }, [userId]);

  // 카테고리 관리 함수들
  const createCategory = async (name: string, color: string): Promise<string> => {
    try {
      const id = `category-${Date.now()}`;
      const order = categories.length;
      const now = new Date();
      
      const categoryRef = doc(db, 'users', userId, 'categories', id);
      await setDoc(categoryRef, {
        name: name.trim(),
        color,
        order,
        createdAt: now,
        updatedAt: now
      });
      
      return id;
    } catch (err) {
      console.error('Error creating category:', err);
      setError('카테고리 생성 중 오류가 발생했습니다.');
      throw err;
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>): Promise<void> => {
    try {
      const categoryRef = doc(db, 'users', userId, 'categories', id);
      await setDoc(categoryRef, {
        ...updates,
        updatedAt: new Date()
      }, { merge: true });
    } catch (err) {
      console.error('Error updating category:', err);
      setError('카테고리 업데이트 중 오류가 발생했습니다.');
      throw err;
    }
  };

  const deleteCategory = async (id: string): Promise<void> => {
    console.log('삭제 시도하는 카테고리 ID:', id);
    
    // 사용자가 원한다면 모든 카테고리 삭제 허용
    // 단, 최소 1개의 카테고리는 남겨두기
    if (categories.length <= 1) {
      throw new Error('최소 1개의 카테고리는 유지되어야 합니다.');
    }
    
    try {
      console.log('카테고리 삭제 시작:', id);
      
      // 해당 카테고리의 모든 폴더 찾기
      const categoryFolders = folders.filter(folder => folder.categoryId === id);
      console.log('삭제할 폴더들:', categoryFolders.length);
      
      // 각 폴더와 그 안의 문서들 삭제
      for (const folder of categoryFolders) {
        console.log('폴더 삭제 중:', folder.id);
        await deleteFolder(folder.id);
      }
      
      // 카테고리 자체 삭제
      console.log('카테고리 문서 삭제 중:', id);
      const categoryRef = doc(db, 'users', userId, 'categories', id);
      await deleteDoc(categoryRef);
      
      console.log('카테고리 삭제 완료:', id);
      
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(`카테고리 삭제 중 오류가 발생했습니다: ${err}`);
      throw err;
    }
  };

  const reorderCategory = async (categoryId: string, direction: 'up' | 'down'): Promise<void> => {
    try {
      // 카테고리를 order 순으로 정렬
      const sortedCategories = [...categories].sort((a, b) => a.order - b.order);
      const currentIndex = sortedCategories.findIndex(cat => cat.id === categoryId);
      
      if (currentIndex === -1) return;
      
      let targetIndex: number;
      if (direction === 'up') {
        targetIndex = currentIndex - 1;
      } else {
        targetIndex = currentIndex + 1;
      }
      
      // 범위 확인
      if (targetIndex < 0 || targetIndex >= sortedCategories.length) return;
      
      const currentCategory = sortedCategories[currentIndex];
      const targetCategory = sortedCategories[targetIndex];
      
      // order 값 교환
      await updateCategory(currentCategory.id, { order: targetCategory.order });
      await updateCategory(targetCategory.id, { order: currentCategory.order });
      
    } catch (err) {
      console.error('Error reordering category:', err);
      throw err;
    }
  };

  // 폴더 관리 함수들
  const createFolder = async (categoryId: string, name: string): Promise<string> => {
    try {
      const id = `folder-${Date.now()}`;
      const categoryFolders = folders.filter(f => f.categoryId === categoryId);
      const order = categoryFolders.length;
      const now = new Date();
      
      const folderRef = doc(db, 'users', userId, 'folders', id);
      await setDoc(folderRef, {
        categoryId,
        name: name.trim(),
        order,
        isExpanded: false,
        createdAt: now,
        updatedAt: now
      });
      
      return id;
    } catch (err) {
      console.error('Error creating folder:', err);
      setError('폴더 생성 중 오류가 발생했습니다.');
      throw err;
    }
  };

  const updateFolder = async (id: string, updates: Partial<Folder>): Promise<void> => {
    try {
      const folderRef = doc(db, 'users', userId, 'folders', id);
      await setDoc(folderRef, {
        ...updates,
        updatedAt: new Date()
      }, { merge: true });
    } catch (err) {
      console.error('Error updating folder:', err);
      setError('폴더 업데이트 중 오류가 발생했습니다.');
      throw err;
    }
  };

  const deleteFolder = async (id: string): Promise<void> => {
    try {
      console.log('폴더 삭제 시작:', id);
      const folderDocuments = documents.filter(doc => doc.folderId === id);
      console.log('삭제할 문서들:', folderDocuments.length);
      
      for (const document of folderDocuments) {
        console.log('문서 삭제 중:', document.id);
        await deleteDocument(document.id);
      }
      
      console.log('폴더 문서 삭제 중:', id);
      const folderRef = doc(db, 'users', userId, 'folders', id);
      await deleteDoc(folderRef);
      console.log('폴더 삭제 완료:', id);
      
    } catch (err) {
      console.error('Error deleting folder:', err);
      setError('폴더 삭제 중 오류가 발생했습니다.');
      throw err;
    }
  };

  const reorderFolder = async (folderId: string, direction: 'up' | 'down'): Promise<void> => {
    try {
      const folder = folders.find(f => f.id === folderId);
      if (!folder) return;
      
      const categoryFolders = folders.filter(f => f.categoryId === folder.categoryId);
      const currentOrder = folder.order;
      const targetOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
      const targetFolder = categoryFolders.find(f => f.order === targetOrder);
      
      if (targetFolder) {
        await updateFolder(folderId, { order: targetOrder });
        await updateFolder(targetFolder.id, { order: currentOrder });
      }
    } catch (err) {
      console.error('Error reordering folder:', err);
      throw err;
    }
  };

  const toggleFolder = (folderId: string) => {
    setUiState(prev => ({
      ...prev,
      expandedFolders: new Set(
        prev.expandedFolders.has(folderId)
          ? [...prev.expandedFolders].filter(id => id !== folderId)
          : [...prev.expandedFolders, folderId]
      )
    }));
  };

  // 문서 관리 함수들
  const createDocument = async (folderId: string, title: string, content: string): Promise<string> => {
    try {
      const id = `doc-${Date.now()}`;
      const folderDocuments = documents.filter(doc => doc.folderId === folderId);
      const order = folderDocuments.length;
      const now = new Date();
      
      const docRef = doc(db, 'users', userId, 'documents', id);
      await setDoc(docRef, {
        folderId,
        title,
        content,
        order,
        createdAt: now,
        updatedAt: now,
        lastModified: now,
        userId,
        tags: []
      });
      
      return id;
    } catch (err) {
      console.error('Error creating document:', err);
      setError('문서 생성 중 오류가 발생했습니다.');
      throw err;
    }
  };

  const updateDocument = async (id: string, updates: Partial<WikiDocument>): Promise<void> => {
    try {
      const docRef = doc(db, 'users', userId, 'documents', id);
      await setDoc(docRef, {
        ...updates,
        updatedAt: new Date(),
        lastModified: new Date()
      }, { merge: true });
    } catch (err) {
      console.error('Error updating document:', err);
      setError('문서 업데이트 중 오류가 발생했습니다.');
      throw err;
    }
  };

  const deleteDocument = async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, 'users', userId, 'documents', id);
      await deleteDoc(docRef);
      
      if (uiState.selectedDocumentId === id) {
        setUiState(prev => ({ ...prev, selectedDocumentId: null }));
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('문서 삭제 중 오류가 발생했습니다.');
      throw err;
    }
  };

  const reorderDocument = async (documentId: string, direction: 'up' | 'down'): Promise<void> => {
    try {
      const document = documents.find(doc => doc.id === documentId);
      if (!document) return;
      
      // 같은 폴더의 문서들을 order 순으로 정렬
      const folderDocuments = documents
        .filter(doc => doc.folderId === document.folderId)
        .sort((a, b) => a.order - b.order);
      
      // 현재 문서의 인덱스 찾기
      const currentIndex = folderDocuments.findIndex(doc => doc.id === documentId);
      if (currentIndex === -1) return;
      
      // 이동할 위치 계산
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      // 경계 검사
      if (targetIndex < 0 || targetIndex >= folderDocuments.length) return;
      
      // 두 문서의 order 값을 교환
      const currentDoc = folderDocuments[currentIndex];
      const targetDoc = folderDocuments[targetIndex];
      
      await updateDocument(currentDoc.id, { order: targetDoc.order });
      await updateDocument(targetDoc.id, { order: currentDoc.order });
    } catch (err) {
      console.error('Error reordering document:', err);
      throw err;
    }
  };

  // 선택 관리 함수들
  const selectCategory = (categoryId: string | null) => {
    setUiState(prev => ({
      ...prev,
      selectedCategoryId: categoryId,
      selectedFolderId: null,
      selectedDocumentId: null
    }));
  };

  const selectFolder = (folderId: string | null) => {
    setUiState(prev => ({
      ...prev,
      selectedFolderId: folderId,
      selectedDocumentId: null
    }));
  };

  const selectDocument = (documentId: string | null) => {
    setUiState(prev => ({
      ...prev,
      selectedDocumentId: documentId
    }));
  };

  // 유틸리티 함수들
  const getFoldersByCategory = (categoryId: string): Folder[] => {
    return folders
      .filter(folder => folder.categoryId === categoryId)
      .sort((a, b) => a.order - b.order);
  };

  const getDocumentsByFolder = (folderId: string): WikiDocument[] => {
    return documents
      .filter(doc => doc.folderId === folderId)
      .sort((a, b) => a.order - b.order);
  };

  const getSelectedDocument = (): WikiDocument | null => {
    if (!uiState.selectedDocumentId) return null;
    return documents.find(doc => doc.id === uiState.selectedDocumentId) || null;
  };

  const searchDocuments = async (searchTerm: string): Promise<WikiDocument[]> => {
    return documents.filter(doc => 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // 북마크 관리 함수들
  const createBookmark = async (title: string, url: string, color: string = '#4285f4'): Promise<string> => {
    try {
      const id = `bookmark-${Date.now()}`;
      const order = bookmarks.length;
      const now = new Date();
      
      await setDoc(doc(db, 'users', userId, 'bookmarks', id), {
        title,
        url,
        color,
        order,
        isDefault: false,
        createdAt: now,
        updatedAt: now
      });
      
      return id;
    } catch (error) {
      console.error('북마크 생성 실패:', error);
      throw error;
    }
  };

  const updateBookmark = async (id: string, updates: Partial<Bookmark>): Promise<void> => {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };
      
      await setDoc(doc(db, 'users', userId, 'bookmarks', id), updateData, { merge: true });
    } catch (error) {
      console.error('북마크 수정 실패:', error);
      throw error;
    }
  };

  const deleteBookmark = async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'users', userId, 'bookmarks', id));
      
      // 삭제 후 순서 재정렬
      const updatedBookmarks = bookmarks
        .filter(b => b.id !== id)
        .sort((a, b) => a.order - b.order);
      
      const updatePromises = updatedBookmarks.map((bookmark, index) =>
        setDoc(doc(db, 'users', userId, 'bookmarks', bookmark.id), 
          { order: index }, { merge: true })
      );
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('북마크 삭제 실패:', error);
      throw error;
    }
  };

  const reorderBookmark = async (id: string, direction: 'up' | 'down'): Promise<void> => {
    try {
      const bookmark = bookmarks.find(b => b.id === id);
      if (!bookmark) return;

      const sortedBookmarks = [...bookmarks].sort((a, b) => a.order - b.order);
      const currentIndex = sortedBookmarks.findIndex(b => b.id === id);
      
      if (direction === 'up' && currentIndex > 0) {
        const targetBookmark = sortedBookmarks[currentIndex - 1];
        await Promise.all([
          setDoc(doc(db, 'users', userId, 'bookmarks', bookmark.id), 
            { order: targetBookmark.order }, { merge: true }),
          setDoc(doc(db, 'users', userId, 'bookmarks', targetBookmark.id), 
            { order: bookmark.order }, { merge: true })
        ]);
      } else if (direction === 'down' && currentIndex < sortedBookmarks.length - 1) {
        const targetBookmark = sortedBookmarks[currentIndex + 1];
        await Promise.all([
          setDoc(doc(db, 'users', userId, 'bookmarks', bookmark.id), 
            { order: targetBookmark.order }, { merge: true }),
          setDoc(doc(db, 'users', userId, 'bookmarks', targetBookmark.id), 
            { order: bookmark.order }, { merge: true })
        ]);
      }
    } catch (error) {
      console.error('북마크 순서 변경 실패:', error);
      throw error;
    }
  };

  const reorderBookmarks = async (reorderedBookmarks: Bookmark[]): Promise<void> => {
    try {
      // 모든 북마크의 order를 새로운 순서대로 업데이트
      const updatePromises = reorderedBookmarks.map((bookmark, index) => 
        setDoc(doc(db, 'users', userId, 'bookmarks', bookmark.id), 
          { order: index + 1 }, { merge: true })
      );
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('북마크 순서 일괄 변경 실패:', error);
      throw error;
    }
  };

  // 빠른메모 함수
  const createQuickMemo = async (content: string): Promise<string> => {
    try {
      // INBOX 카테고리 찾기 또는 생성
      let inboxCategory = categories.find(cat => cat.name === 'INBOX');
      if (!inboxCategory) {
        const inboxCategoryId = await createCategory('INBOX', '#6c757d');
        inboxCategory = { 
          id: inboxCategoryId, 
          name: 'INBOX', 
          color: '#6c757d', 
          order: categories.length,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      // 빠른메모 폴더 찾기 또는 생성
      let quickMemoFolder = folders.find(folder => 
        folder.categoryId === inboxCategory!.id && folder.name === '빠른메모'
      );
      if (!quickMemoFolder) {
        const quickMemoFolderId = await createFolder(inboxCategory.id, '빠른메모');
        quickMemoFolder = {
          id: quickMemoFolderId,
          categoryId: inboxCategory.id,
          name: '빠른메모',
          order: 0,
          isExpanded: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      // 자동 제목 생성
      const now = new Date();
      const dateString = now.toLocaleDateString('ko-KR');
      const timeString = now.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' });
      const autoTitle = `메모 ${dateString} ${timeString}`;

      // 빈 내용으로 메모 생성
      const defaultContent = content || ``;

      // 문서 생성
      const documentId = await createDocument(quickMemoFolder.id, autoTitle, defaultContent);
      
      // 자동으로 해당 문서 선택
      selectCategory(inboxCategory.id);
      selectFolder(quickMemoFolder.id);
      selectDocument(documentId);
      
      return documentId;
    } catch (error) {
      console.error('빠른메모 생성 실패:', error);
      throw error;
    }
  };

  // 빠른메모 폴더로 바로 이동
  const navigateToQuickMemoFolder = async (): Promise<void> => {
    try {
      // INBOX 카테고리 찾기 또는 생성
      let inboxCategory = categories.find(cat => cat.name === 'INBOX');
      if (!inboxCategory) {
        const inboxCategoryId = await createCategory('INBOX', '#6c757d');
        inboxCategory = { 
          id: inboxCategoryId, 
          name: 'INBOX', 
          color: '#6c757d', 
          order: categories.length,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      // 빠른메모 폴더 찾기 또는 생성
      let quickMemoFolder = folders.find(folder => 
        folder.categoryId === inboxCategory!.id && folder.name === '빠른메모'
      );
      if (!quickMemoFolder) {
        const quickMemoFolderId = await createFolder(inboxCategory.id, '빠른메모');
        quickMemoFolder = {
          id: quickMemoFolderId,
          categoryId: inboxCategory.id,
          name: '빠른메모',
          order: 0,
          isExpanded: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      // 빠른메모 폴더로 바로 이동 (카테고리 생략하고 바로 문서 목록 표시)
      selectCategory(inboxCategory.id);
      selectFolder(quickMemoFolder.id);
      selectDocument(null); // 문서는 선택하지 않고 폴더 내 문서 목록만 표시
      
    } catch (error) {
      console.error('빠른메모 폴더 이동 실패:', error);
      throw error;
    }
  };

  // 즐겨찾기 함수
  const toggleFavorite = async (documentId: string): Promise<void> => {
    try {
      const document = documents.find(doc => doc.id === documentId);
      if (!document) {
        return;
      }

      // undefined나 false를 false로, true를 true로 처리
      const currentFavoriteStatus = document.isFavorite === true;
      const isFavorite = !currentFavoriteStatus;
      let favoriteOrder = 0;

      if (isFavorite) {
        // 즐겨찾기 추가시 현재 최대 order + 1 (현재 문서 제외)
        const favoriteDocuments = documents.filter(doc => 
          doc.isFavorite === true && doc.id !== documentId
        );
        favoriteOrder = favoriteDocuments.length > 0 
          ? Math.max(...favoriteDocuments.map(doc => doc.favoriteOrder || 0)) + 1 
          : 1;
      }

      const updateData: any = {
        isFavorite
      };
      
      if (isFavorite) {
        updateData.favoriteOrder = favoriteOrder;
      } else {
        updateData.favoriteOrder = deleteField();
      }
      
      await updateDocument(documentId, updateData);
    } catch (error) {
      console.error('즐겨찾기 토글 실패:', error);
      throw error;
    }
  };

  const getFavoriteDocuments = (): WikiDocument[] => {
    return documents
      .filter(doc => doc.isFavorite === true)
      .sort((a, b) => {
        const orderA = a.favoriteOrder || Number.MAX_SAFE_INTEGER;
        const orderB = b.favoriteOrder || Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
      });
  };

  // 댓글 관리 함수들
  const createComment = async (documentId: string, content: string): Promise<string> => {
    try {
      const id = `comment-${Date.now()}`;
      const now = new Date();
      
      const commentRef = doc(db, 'users', userId, 'comments', id);
      await setDoc(commentRef, {
        documentId,
        content: content.trim(),
        createdAt: now,
        updatedAt: now,
        userId,
        userName: '사용자'
      });
      
      return id;
    } catch (err) {
      console.error('Error creating comment:', err);
      setError('댓글 생성 중 오류가 발생했습니다.');
      throw err;
    }
  };

  const updateComment = async (commentId: string, content: string): Promise<void> => {
    try {
      const commentRef = doc(db, 'users', userId, 'comments', commentId);
      await setDoc(commentRef, {
        content: content.trim(),
        updatedAt: new Date()
      }, { merge: true });
    } catch (err) {
      console.error('Error updating comment:', err);
      setError('댓글 수정 중 오류가 발생했습니다.');
      throw err;
    }
  };

  const deleteComment = async (commentId: string): Promise<void> => {
    try {
      const commentRef = doc(db, 'users', userId, 'comments', commentId);
      await deleteDoc(commentRef);
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('댓글 삭제 중 오류가 발생했습니다.');
      throw err;
    }
  };

  const getCommentsByDocument = (documentId: string): DocumentComment[] => {
    return comments.filter(comment => comment.documentId === documentId)
                  .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  };

  const value: DocumentContextType = {
    categories,
    folders,
    documents,
    bookmarks,
    comments,
    uiState,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategory,
    createFolder,
    updateFolder,
    deleteFolder,
    reorderFolder,
    toggleFolder,
    createDocument,
    updateDocument,
    deleteDocument,
    reorderDocument,
    selectCategory,
    selectFolder,
    selectDocument,
    createComment,
    updateComment,
    deleteComment,
    getCommentsByDocument,
    getFoldersByCategory,
    getDocumentsByFolder,
    getSelectedDocument,
    searchDocuments,
    createBookmark,
    updateBookmark,
    deleteBookmark,
    reorderBookmark,
    reorderBookmarks,
    createQuickMemo,
    navigateToQuickMemoFolder,
    toggleFavorite,
    getFavoriteDocuments
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
};

export type { Category, Folder };