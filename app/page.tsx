'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { NotesList } from '@/components/notes/notes-list';
import { NoteEditor } from '@/components/notes/note-editor';
import { useAuthStore } from '@/lib/store/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const router = useRouter();

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
      <NotesList />
      <NoteEditor />
    </div>
  );
}