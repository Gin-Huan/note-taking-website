'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Pin, MoreVertical, Trash2, RefreshCw, AlertCircle, Archive, RotateCcw, CheckCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotesStore } from '@/lib/store/notes-store';
import { Note } from '@/lib/types/note';
import { cn } from '@/lib/utils';
import { useIntersectionObserver } from '@/hooks/use-debounce';

interface NotesListProps {
  onNoteClick?: (noteId: string) => void;
}

export function NotesList({ onNoteClick }: NotesListProps) {
  const {
    notes,
    currentNote,
    filter,
    pendingNotes,
    isLoading,
    isLoadingMore,
    error,
    pagination,
    isArchived,
    fetchNotes,
    loadMoreNotes,
    setCurrentNote,
    setFilter,
    getFilteredNotes,
    updateNoteMetadata,
    updateNoteAPI,
    deleteNoteAPI,
    saveMessage,
    setSaveMessage,
    setError,
  } = useNotesStore();

  const [pinLoadingStates, setPinLoadingStates] = useState<Set<string>>(new Set());
  const [archiveLoadingStates, setArchiveLoadingStates] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const filteredNotes = useMemo(() => getFilteredNotes(), [notes, filter, pendingNotes]);

  // Intersection observer for lazy loading
  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && pagination.page < pagination.totalPages) {
      loadMoreNotes();
    }
  }, [isLoadingMore, pagination.page, pagination.totalPages, loadMoreNotes]);

  const observer = useIntersectionObserver(handleLoadMore, {
    rootMargin: '100px',
  });

  // Observe the load more element
  useEffect(() => {
    if (loadMoreRef.current && observer) {
      observer.observe(loadMoreRef.current);
    }
  }, [observer, filteredNotes.length]);

  // Fetch notes from API on component mount
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Clear save message after 3 seconds
  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveMessage, setSaveMessage]);

  // Clear error message after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  const handleNoteSelect = (note: Note) => {
    if (onNoteClick) {
      // Mobile: use the callback to open modal
      onNoteClick(note.id);
    } else {
      // Desktop: set current note in store
      setCurrentNote(note);
    }
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
    setNoteToDelete(note);
    setDeleteDialogOpen(true);
  };

  const handleArchiveToggle = async (note: Note) => {
    setArchiveLoadingStates(prev => new Set(prev).add(note.id));
    try {
      // Update via API to persist the archive/unarchive status
      await updateNoteAPI(note.id, { isArchived: !note.isArchived });
      
      // Clear current note if it's the one being archived
      if (currentNote?.id === note.id) {
        setCurrentNote(null);
      }
      
      // Refresh the notes list to show the updated state
      // This ensures the note appears in the correct list (archived or active)
      fetchNotes(pagination.page, pagination.limit, isArchived);
    } catch (error) {
      console.error('Failed to update archive status:', error);
      // Fallback to local update if API fails
      updateNoteMetadata(note.id, { isArchived: !note.isArchived });
    } finally {
      setArchiveLoadingStates(prev => {
        const newSet = new Set(prev);
        newSet.delete(note.id);
        return newSet;
      });
    }
  };

  const confirmDelete = () => {
    if (noteToDelete) {
      deleteNoteAPI(noteToDelete.id);
    }
    setDeleteDialogOpen(false);
    setNoteToDelete(null);
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setNoteToDelete(null);
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
      <div className="flex flex-col h-full w-full lg:w-80 border-r border-border bg-background">
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
    <div className="flex flex-col h-full w-full lg:w-80 border-r border-border bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-background">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isArchived ? "Search archived notes..." : "Search notes..."}
                value={filter.search}
                onChange={(e) => setFilter({ search: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {saveMessage && (
            <Alert variant="default" className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <CheckCircle className="h-4 w-4 text-sm text-green-800 dark:text-green-200" />
              <AlertDescription>{saveMessage}</AlertDescription>
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
                  <SelectItem value="title-asc">Title A-Z</SelectItem>
                  <SelectItem value="title-desc">Title Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground ml-4 hidden lg:block">
              {pagination.total} {isArchived ? 'archived' : ''} notes
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
              <p className="text-lg font-medium mb-2">
                {isArchived ? 'No archived notes found' : 'No notes found'}
              </p>
              <p className="text-sm">
                {isArchived 
                  ? 'Archived notes will appear here when you archive them'
                  : 'Try adjusting your search or filters'
                }
              </p>
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
                        : 'hover:border-primary/50',
                      isPending && 'border-dashed border-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/10',
                      note.isPinned && 'bg-amber-50/30 dark:bg-amber-900/10 shadow-sm'
                    )}
                    style={{
                      backgroundColor: !isPending && currentNote?.id !== note.id 
                        ? note.color 
                        : undefined
                    }}
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
                      {!isPending && <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                            {!isArchived ? (
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleArchiveToggle(note);
                                }}
                                disabled={archiveLoadingStates.has(note.id)}
                              >
                                <Archive className={cn("mr-2 h-4 w-4", archiveLoadingStates.has(note.id) && "animate-spin")} />
                                Archive
                              </DropdownMenuItem>
                            ) : (
                              <>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleArchiveToggle(note);
                                  }}
                                  disabled={archiveLoadingStates.has(note.id)}
                                >
                                  <RotateCcw className={cn("mr-2 h-4 w-4", archiveLoadingStates.has(note.id) && "animate-spin")} />
                                  Unarchive
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
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>}
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
                        {isPending ? 'Just created' : formatDistanceToNow((note.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                );
              })}
              
              {/* Loading indicator for lazy loading */}
              {pagination.page < pagination.totalPages && (
                <div 
                  ref={loadMoreRef}
                  className="flex items-center justify-center py-4"
                >
                  {isLoadingMore ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Loading more notes...</span>
                    </div>
                  ) : (
                    <div className="h-4" /> // Invisible element for intersection observer
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? 'Deleting...' : 'Delete Note'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}