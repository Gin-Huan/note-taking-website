'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Pin, MoreVertical, Trash2, Edit3, RefreshCw, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotesStore } from '@/lib/store/notes-store';
import { Note } from '@/lib/types/note';
import { cn, getLocalTimezoneLabel } from '@/lib/utils';

export function NotesList() {
  const {
    notes,
    currentNote,
    filter,
    pendingNotes,
    isLoading,
    error,
    pagination,
    fetchNotes,
    setCurrentNote,
    setFilter,
    getFilteredNotes,
    updateNoteMetadata,
    updateNoteAPI,
    deleteNoteAPI,
  } = useNotesStore();

  const [pinLoadingStates, setPinLoadingStates] = useState<Set<string>>(new Set());

  // Fetch notes from API on component mount
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const filteredNotes = useMemo(() => getFilteredNotes(), [notes, filter, pendingNotes]);

  const handleNoteSelect = (note: Note) => {
    setCurrentNote(note);
  };

  const handlePinToggle = async (note: Note) => {
    setPinLoadingStates(prev => new Set(prev).add(note.id));
    try {
      // Update via API to persist the pin/unpin status
      await updateNoteAPI(note.id, { isPinned: !note.isPinned });
    } catch (error) {
      console.error('Failed to update pin status:', error);
      // Fallback to local update if API fails
      updateNoteMetadata(note.id, { isPinned: !note.isPinned });
    } finally {
      setPinLoadingStates(prev => {
        const newSet = new Set(prev);
        newSet.delete(note.id);
        return newSet;
      });
    }
  };

  const handleDelete = (note: Note) => {
    deleteNoteAPI(note.id);
  };

  const handleRefresh = () => {
    fetchNotes(pagination.page, pagination.limit);
  };

  const categories = useMemo(() => {
    const cats = ['all', ...Array.from(new Set(notes.map(note => note.category)))];
    return cats;
  }, [notes]);

  if (isLoading && notes.length === 0) {
    return (
      <div className="flex flex-col h-full w-80 border-r border-border bg-background">
        <div className="p-4 border-b border-border">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                disabled
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select disabled>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
              </Select>
              <Select disabled>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading notes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-80 border-r border-border bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-background">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={filter.search}
                onChange={(e) => setFilter({ search: e.target.value })}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex gap-2 flex-1">
              <Select
                value={filter.category}
                onValueChange={(value) => setFilter({ category: value })}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={`${filter.sortBy}-${filter.sortOrder}`}
                onValueChange={(value) => {
                  const [sortBy, sortOrder] = value.split('-') as [typeof filter.sortBy, typeof filter.sortOrder];
                  setFilter({ sortBy, sortOrder });
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated-desc">Recently Updated</SelectItem>
                  <SelectItem value="created-desc">Recently Created</SelectItem>
                  <SelectItem value="title-asc">Title A-Z</SelectItem>
                  <SelectItem value="title-desc">Title Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground ml-4">
              {pagination.total} notes
            </div>
          </div>
        </div>
      </div>

      {/* Notes List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredNotes.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No notes found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotes.map((note) => {
                const isPending = pendingNotes.has(note.id);
                return (
                  <div
                    key={note.id}
                    onClick={() => handleNoteSelect(note)}
                    className={cn(
                      'p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md group relative',
                      currentNote?.id === note.id
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/50',
                      isPending && 'border-dashed border-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/10',
                      note.isPinned && 'border-amber-300 bg-amber-50/30 dark:bg-amber-900/10 shadow-sm'
                    )}
                  >
                    {/* Pending indicator */}
                    {isPending && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                    )}
                    
                    {/* Pin indicator */}
                    {note.isPinned && (
                      <div className="absolute top-2 left-2 animate-pulse">
                        <Pin className="h-4 w-4 text-amber-600 dark:text-amber-400 fill-current" />
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between mb-2">
                      <h3 className={cn(
                        "font-medium line-clamp-1 flex-1",
                        isPending ? 'text-muted-foreground italic' : 'text-foreground',
                        note.isPinned && 'font-semibold'
                      )}>
                        {note.title}
                      </h3>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePinToggle(note);
                              }}
                              disabled={pinLoadingStates.has(note.id)}
                            >
                              <Pin className={cn("mr-2 h-4 w-4", pinLoadingStates.has(note.id) && "animate-spin")} />
                              {note.isPinned ? 'Unpin' : 'Pin'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              setCurrentNote(note);
                            }}>
                              <Edit3 className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(note);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <p className={cn(
                      "text-sm line-clamp-2 mb-3",
                      isPending ? 'text-muted-foreground/70' : 'text-muted-foreground'
                    )}>
                      {note.content.replace(/[#*`\n]/g, '').slice(0, 100) || (isPending ? 'Start typing to save this note...' : 'No content yet...')}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {note.isPinned && (
                          <Badge variant="default" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-700">
                            <Pin className="h-3 w-3 mr-1 fill-current" />
                            Pinned
                          </Badge>
                        )}
                        {note.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {note.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{note.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {isPending ? 'Just created' : formatDistanceToNow(note.updatedAt, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}