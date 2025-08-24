import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

interface WikiDocument {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  tags?: string[];
  category?: string;
}

interface DocumentContextType {
  documents: WikiDocument[];
  currentDocument: WikiDocument | null;
  loading: boolean;
  error: string | null;
  
  // 문서 관리
  createDocument: (title: string, content: string) => Promise<string>;
  updateDocument: (id: string, updates: Partial<WikiDocument>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  selectDocument: (document: WikiDocument | null) => void;
  searchDocuments: (searchTerm: string) => Promise<WikiDocument[]>;
  
  
  // 유틸리티
  getDocumentByTitle: (title: string) => WikiDocument | null;
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
  const [documents, setDocuments] = useState<WikiDocument[]>([]);
  const [currentDocument, setCurrentDocument] = useState<WikiDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Firebase에서 문서 목록 실시간 구독
  useEffect(() => {
    const documentsRef = collection(db, 'users', userId, 'documents');
    const q = query(documentsRef, orderBy('updatedAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: WikiDocument[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        docs.push({
          id: doc.id,
          title: data.title,
          content: data.content,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          userId: data.userId,
          tags: data.tags || [],
          category: data.category || 'general'
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

  const createDocument = async (title: string, content: string): Promise<string> => {
    try {
      setLoading(true);
      const now = new Date();
      const id = `doc-${Date.now()}`;
      
      const newDoc: WikiDocument = {
        id,
        title,
        content,
        createdAt: now,
        updatedAt: now,
        userId,
        tags: [],
        category: 'general'
      };
      
      const docRef = doc(db, 'users', userId, 'documents', id);
      await setDoc(docRef, {
        title: newDoc.title,
        content: newDoc.content,
        createdAt: now,
        updatedAt: now,
        userId: newDoc.userId,
        tags: newDoc.tags,
        category: newDoc.category
      });
      
      return id;
    } catch (err) {
      console.error('Error creating document:', err);
      setError('문서 생성 중 오류가 발생했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateDocument = async (id: string, updates: Partial<WikiDocument>): Promise<void> => {
    try {
      const docRef = doc(db, 'users', userId, 'documents', id);
      await setDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      }, { merge: true });
      
      // 현재 문서가 업데이트되는 문서라면 로컬 상태도 업데이트
      if (currentDocument && currentDocument.id === id) {
        setCurrentDocument(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
      }
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
      
      if (currentDocument && currentDocument.id === id) {
        setCurrentDocument(null);
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('문서 삭제 중 오류가 발생했습니다.');
      throw err;
    }
  };

  const selectDocument = (document: WikiDocument | null) => {
    setCurrentDocument(document);
  };

  const searchDocuments = async (searchTerm: string): Promise<WikiDocument[]> => {
    return documents.filter(doc => 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };


  const getDocumentByTitle = (title: string): WikiDocument | null => {
    return documents.find(doc => doc.title === title) || null;
  };

  const value: DocumentContextType = {
    documents,
    currentDocument,
    loading,
    error,
    createDocument,
    updateDocument,
    deleteDocument,
    selectDocument,
    searchDocuments,
    getDocumentByTitle
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
};