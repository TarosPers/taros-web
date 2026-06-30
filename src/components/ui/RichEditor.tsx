'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { useEffect } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const COLORS = [
  { label: 'Černá', value: '#000000' },
  { label: 'Tmavě zelená', value: '#2a4f2d' },
  { label: 'Červená', value: '#dc2626' },
  { label: 'Modrá', value: '#2563eb' },
  { label: 'Oranžová', value: '#e07b0a' },
  { label: 'Šedá', value: '#6b7280' },
]

export default function RichEditor({ value, onChange, placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value])

  if (!editor) return null

  const btn = (action: () => void, active: boolean, label: string, title?: string) => (
    <button
      type="button"
      onClick={action}
      title={title}
      className="px-2 py-1 text-xs rounded transition-colors"
      style={{
        background: active ? '#2a4f2d' : '#f5f5f5',
        color: active ? '#fff' : '#383838',
        fontWeight: 500,
        minWidth: '28px',
      }}
    >
      {label}
    </button>
  )

  const separator = () => <div className="w-px bg-gray-200 mx-1" />

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex gap-1 px-3 py-2 border-b border-gray-100 flex-wrap" style={{ background: '#fafafa' }}>
        
        {/* Formátování textu */}
        {btn(() => editor.chain().focus().toggleBold().run(), editor.isActive('bold'), 'B', 'Tučné')}
        {btn(() => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'), 'I', 'Kurzíva')}
        {btn(() => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'), 'U', 'Podtržení')}
        
        {separator()}
        
        {/* Nadpisy */}
        {btn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }), 'H2')}
        {btn(() => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }), 'H3')}
        
        {separator()}
        
        {/* Zarovnání */}
        {btn(() => editor.chain().focus().setTextAlign('left').run(), editor.isActive({ textAlign: 'left' }), '⬅', 'Vlevo')}
        {btn(() => editor.chain().focus().setTextAlign('center').run(), editor.isActive({ textAlign: 'center' }), '↔', 'Na střed')}
        {btn(() => editor.chain().focus().setTextAlign('right').run(), editor.isActive({ textAlign: 'right' }), '➡', 'Vpravo')}
        
        {separator()}
        
        {/* Seznamy */}
        {btn(() => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'), '• Seznam')}
        {btn(() => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'), '1. Seznam')}
        
        {separator()}

        {/* Barva textu */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400">Barva:</span>
          {COLORS.map(({ label, value: color }) => (
            <button
              key={color}
              type="button"
              title={label}
              onClick={() => editor.chain().focus().setColor(color).run()}
              className="w-5 h-5 rounded border border-gray-300 transition-transform hover:scale-110"
              style={{ background: color }}
            />
          ))}
          <button
            type="button"
            title="Výchozí barva"
            onClick={() => editor.chain().focus().unsetColor().run()}
            className="px-2 py-0.5 text-xs rounded border border-gray-200 text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {separator()}

        {/* Tabulka */}
        {btn(
          () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
          false,
          '⊞ Tabulka',
          'Vložit tabulku'
        )}
        {editor.isActive('table') && (
          <>
            {btn(() => editor.chain().focus().addColumnAfter().run(), false, '+Sl', 'Přidat sloupec')}
            {btn(() => editor.chain().focus().addRowAfter().run(), false, '+Řd', 'Přidat řádek')}
            {btn(() => editor.chain().focus().deleteColumn().run(), false, '-Sl', 'Smazat sloupec')}
            {btn(() => editor.chain().focus().deleteRow().run(), false, '-Řd', 'Smazat řádek')}
            {btn(() => editor.chain().focus().deleteTable().run(), false, '✕ Tab', 'Smazat tabulku')}
          </>
        )}

        {separator()}

        {btn(() => editor.chain().focus().setHardBreak().run(), false, '↵', 'Odřádkovat')}
      </div>
      <EditorContent
        editor={editor}
        className="px-3 py-2 min-h-[200px] text-sm"
        style={{ color: '#374151' }}
      />
      <style>{`
        .ProseMirror table { border-collapse: collapse; width: 100%; margin: 8px 0; }
        .ProseMirror td, .ProseMirror th { border: 1px solid #d1d5db; padding: 6px 10px; min-width: 60px; }
        .ProseMirror th { background: #f3f4f6; font-weight: 600; }
        .ProseMirror p { margin: 0 0 4px; }
        .ProseMirror:focus { outline: none; }
      `}</style>
    </div>
  )
}
