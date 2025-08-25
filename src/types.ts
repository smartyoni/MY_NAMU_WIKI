export interface Category {
  id: string;
  name: string;
  color: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Folder {
  id: string;
  categoryId: string;
  name: string;
  order: number;
  isExpanded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WikiDocument {
  id: string;
  folderId: string;
  title: string;
  content: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  lastModified: Date;
  userId: string;
  tags?: string[];
}

export interface UIState {
  selectedCategoryId: string | null;
  selectedFolderId: string | null;
  selectedDocumentId: string | null;
  expandedFolders: Set<string>;
  isLoading: boolean;
}