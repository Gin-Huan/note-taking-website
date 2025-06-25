'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { NotesList } from '@/components/notes/notes-list';
import { NoteEditor } from '@/components/notes/note-editor';
import { NoteModal } from '@/components/notes/note-modal';
import { useNotesStore } from '@/lib/store/notes-store';
import { useAuthStore } from '@/lib/store/auth-store';
import { useRouter } from 'next/navigation';

export function MobileLayout() {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const { currentNote, setCurrentNote, pendingNotes, isArchived, notes } = useNotesStore();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [modalNoteId, setModalNoteId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      const wasMobile = isMobile;
      const newIsMobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(newIsMobile);
      
      // If switching from mobile to desktop, reset modal state
      if (wasMobile && !newIsMobile) {
        setIsModalOpen(false);
        setModalNoteId(null);
      }
      
      // If switching from desktop to mobile and there's a currentNote, 
      // preserve the note ID for the modal but clear currentNote
      if (!wasMobile && newIsMobile && currentNote) {
        setModalNoteId(currentNote.id);
        setIsModalOpen(true);
        setCurrentNote(null);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isMobile, currentNote, setCurrentNote]);

  // Handle note selection for mobile - only for new notes
  useEffect(() => {
    if (isMobile && currentNote && !modalNoteId) {
      // Open modal for any current note (pending or existing)
      setModalNoteId(currentNote.id);
      setIsModalOpen(true);
    }
  }, [currentNote, isMobile, modalNoteId]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalNoteId(null);
    // Clear currentNote when closing modal to ensure proper state cleanup
    setCurrentNote(null);
  };

  // Function to open modal for a specific note (called from NotesList)
  const handleOpenNoteModal = (noteId: string) => {
    // Find the note and set it as current
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setCurrentNote(note);
    }
    setModalNoteId(noteId);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  if (!isInitialized) {
    return null; // AuthProvider will show loading
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      {isMobile ? (
        // Mobile layout: only show notes list
        <div className="flex-1 flex flex-col">
          <NotesList onNoteClick={handleOpenNoteModal} />
        </div>
      ) : (
        // Desktop layout: show notes list and editor
        <>
          <NotesList />
          <NoteEditor />
        </>
      )}

      {/* Mobile Modal */}
      {isMobile && (
        <NoteModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          noteId={modalNoteId}
        />
      )}
    </div>
  );
} 