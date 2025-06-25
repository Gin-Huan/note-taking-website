'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Plus,
  Search,
  Settings,
  User,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Archive,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/lib/store/auth-store';
import { useNotesStore } from '@/lib/store/notes-store';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const { addNote, isArchived, setArchived } = useNotesStore();

  // Check if we're on mobile and set initial collapsed state
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 1024; // lg breakpoint
      setIsCollapsed(isMobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleNewNote = () => {
    // Don't allow creating new notes when viewing archived notes
    if (isArchived) {
      return;
    }
    
    addNote({
      title: 'Untitled Note',
      content: '',
      tags: [],
      category: 'general',
      isPinned: false,
      isArchived: false,
      color: '#FFFFFF',
    });
  };

  const menuItems = [
    { 
      icon: FileText, 
      label: 'All Notes', 
      active: !isArchived,
      onClick: () => setArchived(false)
    },
    { 
      icon: Archive, 
      label: 'Archived', 
      active: isArchived,
      onClick: () => setArchived(true)
    },
  ];

  return (
    <div className={cn(
      'flex flex-col h-full bg-background border-r border-border transition-all duration-300',
      isCollapsed ? 'w-16' : 'w-64',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-foreground">NotesApp</h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* New Note Button */}
      <div className="p-4">
        <Button
          onClick={handleNewNote}
          className="w-full justify-start gap-2"
          size={isCollapsed ? "sm" : "default"}
          disabled={isArchived}
        >
          <Plus className="h-4 w-4" />
          {!isCollapsed && 'New Note'}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <Button
              key={item.label}
              variant={item.active ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-2",
                isCollapsed && "justify-center"
              )}
              size={isCollapsed ? "sm" : "default"}
              onClick={item.onClick}
            >
              <item.icon className="h-4 w-4" />
              {!isCollapsed && item.label}
            </Button>
          ))}
        </div>
      </ScrollArea>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start gap-3 p-3",
                isCollapsed && "justify-center p-2"
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}