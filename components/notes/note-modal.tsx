'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Eye, 
  Edit3, 
  Save, 
  Tag, 
  Palette,
  Pin,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNotesStore } from '@/lib/store/notes-store';
import { MarkdownPreview } from './markdown-preview';
import { MarkdownEditorComponent } from './markdown-editor';
import { cn } from '@/lib/utils';

const NOTE_COLORS = [
  '#FFFFFF', // White
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

const CATEGORIES = [
  'general',
  'work',
  'personal',
  'ideas',
  'learning',
  'projects',
];

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string | null;
}

export function NoteModal({ isOpen, onClose, noteId }: NoteModalProps) {
  const { 
    notes, 
    updateNote, 
    updateNoteMetadata, 
    markNoteAsEdited, 
    pendingNotes, 
    updateNoteAPI, 
    createNoteAPI, 
    error,
    isLoading,
  } = useNotesStore();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState('general');
  const [color, setColor] = useState('#3B82F6');
  const [isPinned, setIsPinned] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [activeTab, setActiveTab] = useState('edit');
  const [isPinLoading, setIsPinLoading] = useState(false);

  // Find the note by ID - make it reactive to notes changes
  const note = useMemo(() => {
    return noteId ? notes.find(n => n.id === noteId) : null;
  }, [noteId, notes]);

  // Update local state when note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags);
      setCategory(note.category);
      setColor(note.color);
      setIsPinned(note.isPinned);
    }
  }, [note]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (note) {
      updateNote(note.id, { title: newTitle });
      markNoteAsEdited(note.id);
    }
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    if (note) {
      updateNote(note.id, { content: value });
      markNoteAsEdited(note.id);
    }
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    if (note) {
      updateNote(note.id, { category: value });
      markNoteAsEdited(note.id);
    }
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    if (note) {
      updateNote(note.id, { color: newColor });
      markNoteAsEdited(note.id);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      if (note) {
        updateNote(note.id, { tags: newTags });
        markNoteAsEdited(note.id);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    if (note) {
      updateNote(note.id, { tags: newTags });
      markNoteAsEdited(note.id);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const markAsEdited = () => {
    if (note) {
      markNoteAsEdited(note.id);
    }
  };

  const handleSave = useCallback(async () => {
    if (!note) return;
    
    const noteData = {
      title: title || 'Untitled Note',
      content,
      tags,
      category,
      color,
      isPinned,
      isArchived: note.isArchived || false,
    };

    try {
      if (pendingNotes.has(note.id)) {
        // This is a new note, create it via API
        await createNoteAPI(noteData, note.id);
      } else {
        // This is an existing note, update it via API
        await updateNoteAPI(note.id, noteData);
      }
      
      onClose(); // Close modal after successful save
    } catch (error) {
      console.error('Failed to save note:', error);
      // Fallback to local update if API fails
      updateNote(note.id, noteData);
    }
  }, [note, title, content, tags, category, color, isPinned, pendingNotes, createNoteAPI, updateNoteAPI, updateNote, onClose]);

  const handlePinToggle = async () => {
    if (!note) return;
    
    const newPinStatus = !isPinned;
    setIsPinned(newPinStatus);
    
    // If this is a draft note, just mark as edited (will be saved when user clicks Save)
    if (pendingNotes.has(note.id)) {
      markAsEdited();
      return;
    }
    
    // For existing notes, immediately update via API
    setIsPinLoading(true);
    try {
      await updateNoteAPI(note.id, { isPinned: newPinStatus });
    } catch (error) {
      console.error('Failed to update pin status:', error);
      // Revert local state if API fails
      setIsPinned(!newPinStatus);
    } finally {
      setIsPinLoading(false);
    }
  };

  if (!note) {
    return null;
  }

  const isPending = pendingNotes.has(note.id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              {isPending ? 'New Note' : 'Edit Note'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 p-4 border-b border-border">
            {isPending && (
              <div className="mb-3 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ✏️ This is a new note. Click the Save button to save it.
                </p>
              </div>
            )}
            
            {error && (
              <div className="mb-3">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}
            
            <div className="flex items-center justify-between mb-4">
              <Input
                placeholder="Note title..."
                value={title}
                onChange={handleTitleChange}
                className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0"
              />
              <div className="flex items-center gap-2">
                <Button
                  variant={isPinned ? "default" : "outline"}
                  size="sm"
                  onClick={handlePinToggle}
                  disabled={isPinLoading}
                  className={cn(
                    isPinned && "bg-amber-500 hover:bg-amber-600 text-white border-amber-500",
                    isPinLoading && "opacity-50"
                  )}
                >
                  <Pin className={cn("h-4 w-4", isPinned && "fill-current", isPinLoading && "animate-spin")} />
                </Button>
                <Button 
                  onClick={handleSave} 
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  disabled={isLoading}
                >
                  <Save className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                  {isLoading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-24 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Palette className="h-3 w-3 mr-1" />
                    Color
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3">
                  <div className="grid grid-cols-4 gap-2">
                    {NOTE_COLORS.map((noteColor) => (
                      <button
                        key={noteColor}
                        onClick={() => handleColorChange(noteColor)}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-all",
                          color === noteColor 
                            ? "border-foreground scale-110" 
                            : "border-transparent hover:scale-105"
                        )}
                        style={{ backgroundColor: noteColor }}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Tags */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    Tags ({tags.length})
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add tag..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1"
                      />
                      <Button onClick={handleAddTag} size="sm">
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
                <TabsTrigger value="edit" className="gap-2">
                  <Edit3 className="h-4 w-4" />
                  Edit
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="flex-1 mt-0 overflow-hidden">
                <MarkdownEditorComponent
                  content={content}
                  onChange={handleContentChange}
                  placeholder="Start writing your note... You can use Markdown formatting and tables!"
                  className="h-full"
                />
              </TabsContent>
              <TabsContent value="preview" className="flex-1 mt-0 overflow-auto">
                <MarkdownPreview content={content} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 