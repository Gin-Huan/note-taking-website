'use client';

import { create } from 'zustand';
import { Note, NotesFilter } from '@/lib/types/note';
import { apiClient } from '@/lib/api/client';

interface NotesState {
  notes: Note[];
  currentNote: Note | null;
  filter: NotesFilter;
  isLoading: boolean;
  isLoadingMore: boolean; // New state for loading more notes
  pendingNotes: Set<string>; // Track notes that haven't been edited yet
  cleanupTimeouts: Map<string, NodeJS.Timeout>; // Track cleanup timeouts
  isArchived: boolean; // Track if we're viewing archived notes
  error: string | null;
  saveMessage: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  
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
  scheduleEmptyNoteCleanup: (noteId: string) => void;
  cancelEmptyNoteCleanup: (noteId: string) => void;
  setArchived: (isArchived: boolean) => void;
  
  // API Actions
  fetchNotes: (page?: number, limit?: number, isArchived?: boolean) => Promise<void>;
  loadMoreNotes: () => Promise<void>; // New function for lazy loading
  createNoteAPI: (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>, originalId?: string) => Promise<void>;
  updateNoteAPI: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNoteAPI: (id: string) => Promise<void>;
  setError: (error: string | null) => void;
  
  // Save Message Actions
  setSaveMessage: (message: string | null) => void;
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
  isLoadingMore: false, // New state for loading more notes
  pendingNotes: new Set(),
  cleanupTimeouts: new Map(),
  isArchived: false,
  error: null,
  saveMessage: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },

  setNotes: (notes) => set({ notes }),

  setError: (error) => set({ error }),

  // API Methods
  fetchNotes: async (page = 1, limit = 10, isArchived?: boolean) => {
    const state = get();
    const archivedParam = isArchived !== undefined ? isArchived : state.isArchived;
    
    // Set loading state based on whether this is initial load or loading more
    const isInitialLoad = page === 1;
    set({ 
      [isInitialLoad ? 'isLoading' : 'isLoadingMore']: true, 
      error: null 
    });
    
    try {
      const response = await apiClient.getNotes(page, limit, archivedParam);
      // Transform the API response to match our Note interface
      const notes = response.data?.notes || [];
      const transformedNotes = notes.map((note: any) => ({
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
      }));
      
      set((state) => {
        // If it's the first page, replace notes. Otherwise, append them
        const updatedNotes = isInitialLoad ? transformedNotes : [...state.notes, ...transformedNotes];
        
        return {
          notes: updatedNotes,
          [isInitialLoad ? 'isLoading' : 'isLoadingMore']: false,
          pagination: {
            page: response.data?.page || 1,
            limit: response.data?.limit || 100,
            total: response.data?.total || 0,
            totalPages: response.data?.totalPages || 0,
          }
        };
      });
    } catch (error) {
      console.error('Failed to fetch notes:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch notes',
        isLoading: false,
        isLoadingMore: false
      });
    }
  },

  createNoteAPI: async (noteData, originalId?: string) => {
    set({ isLoading: true, error: null, saveMessage: '' });
    try {
      const response = await apiClient.createNote(noteData);
      const newNote = {
        ...response.data,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt),
      };
      
      set((state) => {
        // Remove the original draft note and add the server-created note
        const notesWithoutDraft = state.notes.filter(note => note.id !== originalId);
        
        return {
          saveMessage: 'Note saved successfully!',
          notes: [newNote, ...notesWithoutDraft],
          currentNote: newNote,
          pendingNotes: new Set(Array.from(state.pendingNotes).filter(noteId => noteId !== originalId)),
          isLoading: false,
        };
      });
    } catch (error) {
      console.error('Failed to create note:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create note',
        isLoading: false 
      });
    }
  },

  updateNoteAPI: async (id, updates) => {
    set({ error: null, saveMessage: '' });
    try {
      const response = await apiClient.updateNote(id, updates);
      const updatedNote = {
        ...response.data,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt),
      };
      
      set((state) => {
        // If the note is being archived/unarchived, remove it from the current list
        // since it should appear in the other list (archived or active)
        if (updates.isArchived !== undefined && updates.isArchived !== state.notes.find(n => n.id === id)?.isArchived) {
          return {
            notes: state.notes.filter(note => note.id !== id),
            currentNote: state.currentNote?.id === id ? null : state.currentNote,
          };
        }
        
        // Otherwise, update the note in place
        const otherNotes = state.notes.filter(note => note.id !== id);
        return {
          saveMessage: 'Note saved successfully!',
          notes: [updatedNote, ...otherNotes],
          currentNote: state.currentNote?.id === id ? updatedNote : state.currentNote,
        };
      });
    } catch (error) {
      console.error('Failed to update note:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update note' });
    }
  },

  deleteNoteAPI: async (id) => {
    set({ error: null });
    try {
      await apiClient.deleteNote(id);
      set((state) => ({
        notes: state.notes.filter((note) => note.id !== id),
        currentNote: state.currentNote?.id === id ? null : state.currentNote,
        pendingNotes: new Set(Array.from(state.pendingNotes).filter(noteId => noteId !== id)),
      }));
    } catch (error) {
      console.error('Failed to delete note:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete note' });
    }
  },

  addNote: (noteData) => {
    const state = get();
    
    // Check if there's already a pending note
    if (state.pendingNotes.size > 0) {
      // Find the first pending note
      const existingPendingNote = state.notes.find(note => state.pendingNotes.has(note.id));
      
      if (existingPendingNote) {
        // Check if the existing pending note is completely empty
        const isCompletelyEmpty = existingPendingNote.title.trim() === '' && 
                                 existingPendingNote.content.trim() === '' && 
                                 existingPendingNote.tags.length === 0;
        
        if (isCompletelyEmpty) {
          // Remove the empty pending note and create a new one
          set((state) => ({
            notes: state.notes.filter(note => note.id !== existingPendingNote.id),
            pendingNotes: new Set(Array.from(state.pendingNotes).filter(id => id !== existingPendingNote.id)),
          }));
        } else {
          // Set the existing pending note as current and return it
          set({ currentNote: existingPendingNote });
          return existingPendingNote;
        }
      }
    }
    
    // No pending note exists, create a new one
    const newNote: Note = {
      ...noteData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    set((state) => ({ 
      notes: [newNote, ...state.notes],
      currentNote: newNote,
      pendingNotes: new Set([...Array.from(state.pendingNotes), newNote.id]),
    }));
    
    // Schedule cleanup for empty notes
    if (newNote.title.trim() === '' && newNote.content.trim() === '' && newNote.tags.length === 0) {
      get().scheduleEmptyNoteCleanup(newNote.id);
    }
    
    return newNote;
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

      const now = new Date();
      
      const updatedNoteWithChanges = { 
        ...updatedNote, 
        ...updates, 
        updatedAt: shouldUpdateTimestamp ? now : updatedNote.updatedAt
      };

      console.log('updatedNoteWithChanges', updatedNoteWithChanges);

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
    set((state) => {
      const currentNote = state.notes.find(note => note.id === id);
      
      // If the note is being archived/unarchived, remove it from the current list
      // since it should appear in the other list (archived or active)
      if (updates.isArchived !== undefined && updates.isArchived !== currentNote?.isArchived) {
        return {
          notes: state.notes.filter(note => note.id !== id),
          currentNote: state.currentNote?.id === id ? null : state.currentNote,
        };
      }
      
      // Otherwise, update the note in place
      return {
        notes: state.notes.map((note) =>
          note.id === id 
            ? { ...note, ...updates, updatedAt: new Date() }
            : note
        ),
        currentNote: state.currentNote?.id === id 
          ? { ...state.currentNote, ...updates, updatedAt: new Date() }
          : state.currentNote,
      };
    });
  },

  deleteNote: (id) => {
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
      currentNote: state.currentNote?.id === id ? null : state.currentNote,
      pendingNotes: new Set(Array.from(state.pendingNotes).filter(noteId => noteId !== id)),
    }));
  },

  setCurrentNote: (note) => {
    const { currentNote, pendingNotes } = get();
    if (currentNote && note?.id !== currentNote.id) {
      // If switching away from a pending note that hasn't been edited, check if it's empty
      if (pendingNotes.has(currentNote.id)) {
        const isCompletelyEmpty = currentNote.content.trim() === '' && 
                                 currentNote.tags.length === 0;
        
        if (isCompletelyEmpty) {
          set((state) => ({
            notes: state.notes.filter(n => n.id !== currentNote.id),
            pendingNotes: new Set(Array.from(state.pendingNotes).filter(id => id !== currentNote.id)),
            currentNote: note,
          }));
          return; // Don't call cleanupEmptyNotes since we already handled it
        }
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
    // Mark the note as edited to prevent it from being cleaned up
    // This ensures draft notes stay in pendingNotes until they're actually saved via API
  },

  cleanupEmptyNotes: () => {
    const { notes, pendingNotes, currentNote } = get();
    
    // Find pending notes that are completely empty and not currently active
    const notesToDelete = notes.filter(note => 
      pendingNotes.has(note.id) && 
      note.content.trim() === '' &&
      note.tags.length === 0 &&
      note.id !== currentNote?.id // Don't delete the currently active note
    );

    if (notesToDelete.length > 0) {
      const idsToDelete = notesToDelete.map(note => note.id);
      set((state) => ({
        notes: state.notes.filter(note => !idsToDelete.includes(note.id)),
        pendingNotes: new Set(Array.from(state.pendingNotes).filter(id => !idsToDelete.includes(id))),
      }));
    }
  },

  scheduleEmptyNoteCleanup: (noteId) => {
    // Schedule cleanup of empty note after 30 seconds of inactivity
    setTimeout(() => {
      const state = get();
      const note = state.notes.find(n => n.id === noteId);
      
      // Only clean up if the note is still pending, completely empty, and not currently active
      if (note && 
          state.pendingNotes.has(noteId) && 
          note.title.trim() === '' && 
          note.content.trim() === '' && 
          note.tags.length === 0 &&
          state.currentNote?.id !== noteId) {
        
        set((state) => ({
          notes: state.notes.filter(n => n.id !== noteId),
          pendingNotes: new Set(Array.from(state.pendingNotes).filter(id => id !== noteId)),
        }));
      }
    }, 30000); // 30 seconds
  },

  cancelEmptyNoteCleanup: (noteId) => {
    const state = get();
    const timeout = state.cleanupTimeouts.get(noteId);
    if (timeout) {
      clearTimeout(timeout);
      set((state) => {
        const newTimeouts = new Map();
        for (const [key, value] of Array.from(state.cleanupTimeouts.entries())) {
          if (key !== noteId) {
            newTimeouts.set(key, value);
          }
        }
        return { cleanupTimeouts: newTimeouts };
      });
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

  setArchived: (isArchived) => {
    set({ 
      isArchived, 
      currentNote: null,
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      }
    }); // Reset current note and pagination when switching views
    // Fetch notes for the new archived state
    get().fetchNotes(1, 10, isArchived);
  },

  loadMoreNotes: async () => {
    const state = get();
    const nextPage = state.pagination.page + 1;
    
    // Don't load more if already loading or if we've reached the last page
    if (state.isLoadingMore || nextPage > state.pagination.totalPages) {
      return;
    }
    
    await get().fetchNotes(nextPage, state.pagination.limit, state.isArchived);
  },

  // Save Message Actions
  setSaveMessage: (message) => set({ saveMessage: message }),
}));