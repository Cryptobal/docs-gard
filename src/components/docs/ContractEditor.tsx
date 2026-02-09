"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { ContractToken } from "./ContractTokenExtension";
import { EditorToolbar } from "./EditorToolbar";
import { useCallback, useEffect } from "react";

interface ContractEditorProps {
  content?: any;
  onChange?: (content: any) => void;
  editable?: boolean;
  placeholder?: string;
  className?: string;
  filterModules?: string[];
}

export function ContractEditor({
  content,
  onChange,
  editable = true,
  placeholder = "Escribe tu documento aquí... Usa el botón de tokens o escribe / para insertar placeholders",
  className = "",
  filterModules,
}: ContractEditorProps) {
  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      ContractToken,
    ],
    content: content || {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [],
        },
      ],
    },
    editable,
    editorProps: {
      attributes: {
        class:
          "prose prose-invert prose-sm sm:prose-base max-w-none focus:outline-none min-h-[500px] px-8 py-6",
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
  },
  [editable, placeholder]
  );

  // Update content externally
  useEffect(() => {
    if (editor && content && !editor.isFocused) {
      const currentJSON = JSON.stringify(editor.getJSON());
      const newJSON = JSON.stringify(content);
      if (currentJSON !== newJSON) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  const insertToken = useCallback(
    (token: { module: string; tokenKey: string; label: string }) => {
      if (!editor) return;
      editor
        .chain()
        .focus()
        .insertToken({
          module: token.module,
          tokenKey: token.tokenKey,
          label: token.label,
        })
        .insertContent(" ")
        .run();
    },
    [editor]
  );

  if (!editor) return null;

  return (
    <div className={`border border-border rounded-lg bg-card overflow-hidden ${className}`}>
      {editable && (
        <EditorToolbar
          editor={editor}
          onInsertToken={insertToken}
          filterModules={filterModules}
        />
      )}

      {/* Editor Content */}
      <div className="relative">
        <EditorContent editor={editor} />
      </div>

      {/* Token Styles */}
      <style jsx global>{`
        .contract-token {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          padding: 1px 8px;
          border-radius: 4px;
          background: #dbeafe;
          color: #1e40af;
          font-size: 0.85em;
          font-weight: 500;
          border: 1px solid #93c5fd;
          cursor: default;
          user-select: none;
          vertical-align: baseline;
          line-height: 1.6;
        }
        .contract-token::before {
          content: "⟨";
          opacity: 0.5;
          font-size: 0.8em;
        }
        .contract-token::after {
          content: "⟩";
          opacity: 0.5;
          font-size: 0.8em;
        }
        .ProseMirror .contract-token.ProseMirror-selectednode {
          outline: 2px solid #3b82f6;
          outline-offset: 1px;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: hsl(var(--muted-foreground));
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
        }
        .ProseMirror td,
        .ProseMirror th {
          border: 1px solid hsl(var(--border));
          padding: 8px 12px;
          position: relative;
          vertical-align: top;
        }
        .ProseMirror th {
          background: hsl(var(--muted));
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
