export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
  isArchived: boolean;
  color: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface NotesFilter {
  search: string;
  category: string;
  tags: string[];
  sortBy: 'updated' | 'created' | 'title';
  sortOrder: 'asc' | 'desc';
}