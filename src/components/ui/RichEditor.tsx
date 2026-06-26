'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { useEffect } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function RichEditor({ value, onChange, placeholder }: Props) {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
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

  const btn = (action: () => void, active: boolean, label: string) => (
    <button
      type="button"
      onClick={action}
      className="px-2 py-1 text-xs rounded transition-colors"
      style={{
        background: active ? '#2a4f2d' : '#f5f5f5',
        color: active ? '#fff' : '#383838',
        fontWeight: 500,
      }}
    >
      {label}
    </button>
  )

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex gap-1 px-3 py-2 border-b border-gray-100 flex-wrap" style={{ background: '#fafafa' }}>
        {btn(() => editor.chain().focus().toggleBold().run(), editor.isActive('bold'), 'B')}
        {btn(() => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'), 'I')}
        {btn(() => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'), 'U')}
        <div className="w-px bg-gray-200 mx-1" />
        {btn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }), 'H2')}
        {btn(() => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }), 'H3')}
        <div className="w-px bg-gray-200 mx-1" />
        {btn(() => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'), '• Seznam')}
        {btn(() => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'), '1. Seznam')}
        <div className="w-px bg-gray-200 mx-1" />
        {btn(() => editor.chain().focus().setHardBreak().run(), false, '↵ Odřádkovat')}
      </div>
      <EditorContent
        editor={editor}
        className="px-3 py-2 min-h-[200px] text-sm"
        style={{ color: '#374151' }}
      />
    </div>
  )
}