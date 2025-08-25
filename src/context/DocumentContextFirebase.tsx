import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Category, Folder, WikiDocument, UIState } from '../types';


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
  const [comments, setComments] = useState<DocumentComment[]>([]);
  const [uiState, setUiState] = useState<UIState>({
    selectedCategoryId: null,
    selectedFolderId: null,
    selectedDocumentId: null,
    expandedFolders: new Set(),
    isLoading: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          tags: data.tags || []
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
    if (id === 'general') {
      throw new Error('기본 카테고리는 삭제할 수 없습니다.');
    }
    
    try {
      const categoryFolders = folders.filter(folder => folder.categoryId === id);
      for (const folder of categoryFolders) {
        await deleteFolder(folder.id);
      }
      
      const categoryRef = doc(db, 'users', userId, 'categories', id);
      await deleteDoc(categoryRef);
      
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('카테고리 삭제 중 오류가 발생했습니다.');
      throw err;
    }
  };

  const reorderCategory = async (categoryId: string, direction: 'up' | 'down'): Promise<void> => {
    try {
      const category = categories.find(cat => cat.id === categoryId);
      if (!category) return;
      
      const currentOrder = category.order;
      const targetOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
      const targetCategory = categories.find(cat => cat.order === targetOrder);
      
      if (targetCategory) {
        await updateCategory(categoryId, { order: targetOrder });
        await updateCategory(targetCategory.id, { order: currentOrder });
      }
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
      const folderDocuments = documents.filter(doc => doc.folderId === id);
      for (const document of folderDocuments) {
        await deleteDocument(document.id);
      }
      
      const folderRef = doc(db, 'users', userId, 'folders', id);
      await deleteDoc(folderRef);
      
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
      
      const folderDocuments = documents.filter(doc => doc.folderId === document.folderId);
      const currentOrder = document.order;
      const targetOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
      const targetDocument = folderDocuments.find(doc => doc.order === targetOrder);
      
      if (targetDocument) {
        await updateDocument(documentId, { order: targetOrder });
        await updateDocument(targetDocument.id, { order: currentOrder });
      }
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
    searchDocuments
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
};

export type { Category, Folder };