'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { NotesList } from '@/components/notes/notes-list';
import { NoteEditor } from '@/components/notes/note-editor';
import { useAuthStore } from '@/lib/store/auth-store';

export default function HomePage() {
  const { isAuthenticated, setUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // For demo purposes, we'll auto-login with a demo user
    // In a real app, you'd check for stored authentication state
    if (!isAuthenticated) {
      const demoUser = {
        id: '1',
        email: 'demo@notesapp.com',
        name: 'Demo User',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
      };
      setUser(demoUser);
    }
  }, [isAuthenticated, setUser]);

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <NotesList />
      <NoteEditor />
    </div>
  );
}