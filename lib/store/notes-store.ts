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
  updateNoteMetadata: (id: string, updates: Partial<Note>) => void;
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
    set((state) => {
      const updatedNote = state.notes.find(note => note.id === id);
      if (!updatedNote) return state;

      // Check if content or title has actually changed
      const hasContentChanged = updates.content !== undefined && updates.content !== updatedNote.content;
      const hasTitleChanged = updates.title !== undefined && updates.title !== updatedNote.title;
      
      // Only update timestamp if content or title changed
      const shouldUpdateTimestamp = hasContentChanged || hasTitleChanged;
      
      const updatedNoteWithChanges = { 
        ...updatedNote, 
        ...updates, 
        updatedAt: shouldUpdateTimestamp ? new Date() : updatedNote.updatedAt
      };

      // Only move note to top if content or title changed
      if (shouldUpdateTimestamp) {
        const otherNotes = state.notes.filter(note => note.id !== id);
        const newNotes = [updatedNoteWithChanges, ...otherNotes];

        return {
          notes: newNotes,
          currentNote: state.currentNote?.id === id 
            ? updatedNoteWithChanges
            : state.currentNote,
        };
      } else {
        // Just update the note in place without moving it
        return {
          notes: state.notes.map((note) =>
            note.id === id ? updatedNoteWithChanges : note
          ),
          currentNote: state.currentNote?.id === id 
            ? updatedNoteWithChanges
            : state.currentNote,
        };
      }
    });
  },

  updateNoteMetadata: (id, updates) => {
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
  },

  deleteNote: (id) => {
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
      currentNote: state.currentNote?.id === id ? null : state.currentNote,
      pendingNotes: new Set([...state.pendingNotes].filter(noteId => noteId !== id)),
    }));
  },

  setCurrentNote: (note) => {
    // Clean up empty notes when switching away from current note
    const { currentNote, pendingNotes } = get();
    if (currentNote && note?.id !== currentNote.id) {
      // If switching away from a pending note that hasn't been edited, remove it
      if (pendingNotes.has(currentNote.id)) {
        set((state) => ({
          notes: state.notes.filter(n => n.id !== currentNote.id),
          pendingNotes: new Set([...state.pendingNotes].filter(id => id !== currentNote.id)),
          currentNote: note,
        }));
        return; // Don't call cleanupEmptyNotes since we already handled it
      }
      get().cleanupEmptyNotes();
    }
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
    
    // Find pending notes that are empty and not currently active
    const notesToDelete = notes.filter(note => 
      pendingNotes.has(note.id) && 
      note.title.trim() === '' && 
      note.content.trim() === '' &&
      note.id !== currentNote?.id
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

    // Only apply sorting if explicitly requested (not for default "updated" sort)
    if (filter.sortBy !== 'updated' || filter.sortOrder !== 'desc') {
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
    }

    // Pinned notes first, then maintain the existing order
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
  },
}));