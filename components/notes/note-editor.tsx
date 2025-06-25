'use client';

import { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
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

export function NoteEditor() {
  const { 
    currentNote, 
    updateNote, 
    updateNoteMetadata, 
    markNoteAsEdited, 
    pendingNotes, 
    updateNoteAPI, 
    createNoteAPI, 
  } = useNotesStore();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState('general');
  const [color, setColor] = useState('#FFFFFF');
  const [isPinned, setIsPinned] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [activeTab, setActiveTab] = useState('edit');
  const [isPinLoading, setIsPinLoading] = useState(false);

  // Update local state when current note changes
  useEffect(() => {
    if (currentNote) {
      setTitle(currentNote.title);
      setContent(currentNote.content);
      setTags(currentNote.tags);
      setCategory(currentNote.category);
      setColor(currentNote.color);
      setIsPinned(currentNote.isPinned);
    }
  }, [currentNote]);

  const handleSave = useCallback(async () => {
    if (!currentNote) return;
    
    const noteData = {
      title: title || 'Untitled Note',
      content,
      tags,
      category,
      color,
      isPinned,
      isArchived: currentNote.isArchived || false,
    };

    try {
      if (pendingNotes.has(currentNote.id)) {
        // This is a new note, create it via API
        await createNoteAPI(noteData, currentNote.id);
      } else {
        // This is an existing note, update it via API
        await updateNoteAPI(currentNote.id, noteData);
      }
    } catch (error) {
      console.error('Failed to save note:', error);
      // Fallback to local update if API fails
      updateNote(currentNote.id, noteData);
    }
  }, [currentNote, title, content, tags, category, color, isPinned, pendingNotes, createNoteAPI, updateNoteAPI, updateNote]);

  // Mark note as edited when user makes changes
  const markAsEdited = useCallback(() => {
    if (currentNote && pendingNotes.has(currentNote.id)) {
      markNoteAsEdited(currentNote.id);
    }
  }, [currentNote, pendingNotes, markNoteAsEdited]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (currentNote) {
      updateNote(currentNote.id, { title: newTitle });
      markNoteAsEdited(currentNote.id);
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    if (currentNote) {
      updateNote(currentNote.id, { content: newContent });
      markNoteAsEdited(currentNote.id);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      if (currentNote) {
        updateNote(currentNote.id, { tags: newTags });
        markNoteAsEdited(currentNote.id);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    if (currentNote) {
      updateNote(currentNote.id, { tags: newTags });
      markNoteAsEdited(currentNote.id);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    if (currentNote) {
      updateNote(currentNote.id, { category: newCategory });
      markNoteAsEdited(currentNote.id);
    }
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    if (currentNote) {
      updateNote(currentNote.id, { color: newColor });
      markNoteAsEdited(currentNote.id);
    }
  };

  const handlePinToggle = async () => {
    if (!currentNote) return;
    
    const newPinStatus = !isPinned;
    setIsPinned(newPinStatus);
    
    // If this is a draft note, update store immediately
    if (pendingNotes.has(currentNote.id)) {
      updateNote(currentNote.id, { isPinned: newPinStatus });
      markNoteAsEdited(currentNote.id);
      return;
    }
    
    // For existing notes, immediately update via API
    setIsPinLoading(true);
    try {
      await updateNoteAPI(currentNote.id, { isPinned: newPinStatus });
    } catch (error) {
      console.error('Failed to update pin status:', error);
      // Revert local state if API fails
      setIsPinned(!newPinStatus);
    } finally {
      setIsPinLoading(false);
    }
  };

  if (!currentNote) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Edit3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No note selected</p>
          <p className="text-sm">Select a note to start editing or create a new one</p>
        </div>
      </div>
    );
  }

  const isPending = pendingNotes.has(currentNote.id);

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border bg-background">
        {isPending && (
          <div className="mb-3 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ✏️ This is a new note. Click the Save button to save it, or it will be removed if you switch away.
            </p>
          </div>
        )}
        
        {isPinned && !isPending && (
          <div className="mb-3 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
            <p className="text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <Pin className="h-4 w-4 fill-current" />
              This note is pinned and will appear at the top of your notes list
            </p>
          </div>
        )}
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Note title..."
              value={title}
              onChange={handleTitleChange}
              className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePinToggle}
              disabled={isPinLoading}
            >
              <Pin className={cn("h-4 w-4", isPinLoading && "animate-spin")} />
            </Button>
            <Button onClick={handleSave} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 flex-wrap">
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-32">
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
              <Button variant="outline" size="sm">
                <Palette className="h-4 w-4 mr-2" />
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
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Tag className="h-4 w-4 mr-2" />
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
      </div>

      {/* Editor */}
      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit" className="gap-2">
              <Edit3 className="h-4 w-4" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>
          <TabsContent value="edit" className="h-full mt-0">
            <MarkdownEditorComponent
              content={content}
              onChange={handleContentChange}
              placeholder="Start writing your note... You can use Markdown formatting and tables!"
              className="h-full"
            />
          </TabsContent>
          <TabsContent value="preview" className="h-full mt-0">
            <MarkdownPreview content={content} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}