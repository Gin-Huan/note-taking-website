'use client';

import { useRef } from 'react';
import MarkdownEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export function MarkdownEditorComponent({ content, onChange, placeholder, className }: MarkdownEditorProps) {
  const mdEditor = useRef<MarkdownEditor>(null);

  const handleEditorChange = ({ text }: { text: string; html: string }) => {
    onChange(text);
  };

  return (
    <div className={className}>
      <MarkdownEditor
        ref={mdEditor}
        value={content}
        style={{ height: '100%' }}
        onChange={handleEditorChange}
        placeholder={placeholder}
        config={{
          view: { menu: true, md: true, html: false },
          canView: { menu: true, md: true, html: false, fullScreen: false },
          htmlClass: 'custom-html-style',
          markdownClass: 'custom-markdown-style',
          logger: { interval: 3000 },
          shortcuts: true,
          scrollAuto: false,
        }}
        plugins={[
          'header',
          'font-bold',
          'font-italic',
          'font-underline',
          'font-strikethrough',
          'list-unordered',
          'list-ordered',
          'block-quote',
          'block-code',
          'block-code-block',
          'table',
          'link',
          'image',
          'clear',
          'logger',
          'mode-toggle',
          'full-screen'
        ]}
      />
    </div>
  );
} 