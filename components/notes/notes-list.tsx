'use client';

import { useEffect, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Pin, MoreVertical, Trash2, Edit3 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotesStore } from '@/lib/store/notes-store';
import { sampleNotes } from '@/lib/utils/sample-notes';
import { Note } from '@/lib/types/note';
import { cn } from '@/lib/utils';

export function NotesList() {
  const {
    notes,
    currentNote,
    filter,
    pendingNotes,
    setNotes,
    setCurrentNote,
    setFilter,
    getFilteredNotes,
    updateNoteMetadata,
    deleteNote,
  } = useNotesStore();

  // Initialize with sample notes if empty
  useEffect(() => {
    if (notes.length === 0) {
      setNotes(sampleNotes);
      setCurrentNote(sampleNotes[0]);
    }
  }, [notes.length, setNotes, setCurrentNote]);

  const filteredNotes = useMemo(() => getFilteredNotes(), [notes, filter, pendingNotes]);

  const handleNoteSelect = (note: Note) => {
    setCurrentNote(note);
  };

  const handlePinToggle = (note: Note) => {
    updateNoteMetadata(note.id, { isPinned: !note.isPinned });
  };

  const handleDelete = (note: Note) => {
    deleteNote(note.id);
  };

  const categories = useMemo(() => {
    const cats = ['all', ...new Set(notes.map(note => note.category))];
    return cats;
  }, [notes]);

  return (
    <div className="flex flex-col h-full w-80 border-r border-border bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={filter.search}
              onChange={(e) => setFilter({ search: e.target.value })}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
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
                      isPending && 'border-dashed border-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/10'
                    )}
                  >
                    {/* Pending indicator */}
                    {isPending && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                    )}
                    
                    <div className="flex items-start justify-between mb-2">
                      <h3 className={cn(
                        "font-medium line-clamp-1 flex-1",
                        isPending ? 'text-muted-foreground italic' : 'text-foreground'
                      )}>
                        {note.title}
                      </h3>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {note.isPinned && (
                          <Pin className="h-4 w-4 text-primary" />
                        )}
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
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handlePinToggle(note);
                            }}>
                              <Pin className="mr-2 h-4 w-4" />
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