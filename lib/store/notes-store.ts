'use client';

import { create } from 'zustand';
import { Note, NotesFilter } from '@/lib/types/note';

interface NotesState {
  notes: Note[];
  currentNote: Note | null;
  filter: NotesFilter;
  isLoading: boolean;
  pendingNotes: Set<string>; // Track notes that haven't been edited yet
  
  // Actions
  setNotes: (notes: Note[]) => void;
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  setCurrentNote: (note: Note | null) => void;
  setFilter: (filter: Partial<NotesFilter>) => void;
  getFilteredNotes: () => Note[];
  markNoteAsEdited: (id: string) => void;
  cleanupEmptyNotes: () => void;
}

const defaultFilter: NotesFilter = {
  search: '',
  category: 'all',
  tags: [],
  sortBy: 'updated',
  sortOrder: 'desc',
};

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  currentNote: null,
  filter: defaultFilter,
  isLoading: false,
  pendingNotes: new Set(),

  setNotes: (notes) => set({ notes }),

  addNote: (noteData) => {
    const newNote: Note = {
      ...noteData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({ 
      notes: [newNote, ...state.notes],
      currentNote: newNote,
      pendingNotes: new Set([...state.pendingNotes, newNote.id]),
    }));
  },

  updateNote: (id, updates) => {
    const { pendingNotes } = get();
    
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id 
          ? { ...note, ...updates, updatedAt: new Date() }
          : note
      ),
      currentNote: state.currentNote?.id === id 
        ? { ...state.currentNote, ...updates, updatedAt: new Date() }
        : state.currentNote,
    }));

    // Mark note as edited if it was pending
    if (pendingNotes.has(id)) {
      get().markNoteAsEdited(id);
    }
  },

  deleteNote: (id) => {
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
      currentNote: state.currentNote?.id === id ? null : state.currentNote,
      pendingNotes: new Set([...state.pendingNotes].filter(noteId => noteId !== id)),
    }));
  },

  setCurrentNote: (note) => {
    // Clean up empty notes when switching away
    get().cleanupEmptyNotes();
    set({ currentNote: note });
  },

  setFilter: (filterUpdates) => {
    set((state) => ({
      filter: { ...state.filter, ...filterUpdates },
    }));
  },

  markNoteAsEdited: (id) => {
    set((state) => ({
      pendingNotes: new Set([...state.pendingNotes].filter(noteId => noteId !== id)),
    }));
  },

  cleanupEmptyNotes: () => {
    const { notes, pendingNotes, currentNote } = get();
    
    // Find pending notes that are empty (no title changes and no content)
    const notesToDelete = notes.filter(note => 
      pendingNotes.has(note.id) && 
      note.title === 'Untitled Note' && 
      note.content.trim() === '' &&
      note.id !== currentNote?.id // Don't delete the currently active note
    );

    if (notesToDelete.length > 0) {
      const idsToDelete = notesToDelete.map(note => note.id);
      set((state) => ({
        notes: state.notes.filter(note => !idsToDelete.includes(note.id)),
        pendingNotes: new Set([...state.pendingNotes].filter(id => !idsToDelete.includes(id))),
      }));
    }
  },

  getFilteredNotes: () => {
    const { notes, filter } = get();
    let filtered = [...notes];

    // Search filter
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(searchLower) ||
          note.content.toLowerCase().includes(searchLower) ||
          note.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    // Category filter
    if (filter.category !== 'all') {
      filtered = filtered.filter((note) => note.category === filter.category);
    }

    // Tags filter
    if (filter.tags.length > 0) {
      filtered = filtered.filter((note) =>
        filter.tags.every((tag) => note.tags.includes(tag))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (filter.sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'created':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case 'updated':
        default:
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
          break;
      }

      if (filter.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Pinned notes first
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
  },
}));