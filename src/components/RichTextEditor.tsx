import { useEffect } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Heading2, Italic, List, ListOrdered, Quote, Redo2, Undo2 } from 'lucide-react'
import { normalizeEditorHtml } from '@/lib/rich-text'

type RichTextEditorProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel: string
  compact?: boolean
}

type EditorAction = {
  label: string
  icon: typeof Bold
  isActive?: () => boolean
  run: () => void
  disabled?: boolean
}

function RichTextEditor({ value, onChange, placeholder = '開始撰寫內容', ariaLabel, compact = false }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: normalizeEditorHtml(value),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        'aria-label': ariaLabel,
        class: 'rich-text-editable',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) return
    const nextContent = normalizeEditorHtml(value)
    if (editor.getHTML() === nextContent) return
    editor.commands.setContent(nextContent, { emitUpdate: false })
  }, [editor, value])

  const actions: EditorAction[] = editor
    ? [
        {
          label: '粗體',
          icon: Bold,
          isActive: () => editor.isActive('bold'),
          run: () => editor.chain().focus().toggleBold().run(),
        },
        {
          label: '斜體',
          icon: Italic,
          isActive: () => editor.isActive('italic'),
          run: () => editor.chain().focus().toggleItalic().run(),
        },
        {
          label: '標題',
          icon: Heading2,
          isActive: () => editor.isActive('heading', { level: 2 }),
          run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        },
        {
          label: '項目清單',
          icon: List,
          isActive: () => editor.isActive('bulletList'),
          run: () => editor.chain().focus().toggleBulletList().run(),
        },
        {
          label: '編號清單',
          icon: ListOrdered,
          isActive: () => editor.isActive('orderedList'),
          run: () => editor.chain().focus().toggleOrderedList().run(),
        },
        {
          label: '引用',
          icon: Quote,
          isActive: () => editor.isActive('blockquote'),
          run: () => editor.chain().focus().toggleBlockquote().run(),
        },
        {
          label: '復原',
          icon: Undo2,
          run: () => editor.chain().focus().undo().run(),
          disabled: !editor.can().undo(),
        },
        {
          label: '重做',
          icon: Redo2,
          run: () => editor.chain().focus().redo().run(),
          disabled: !editor.can().redo(),
        },
      ]
    : []

  return (
    <div className={`rich-text-editor${compact ? ' compact' : ''}`}>
      <div className="rich-text-toolbar" aria-label="富文字工具列">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.label}
              type="button"
              className={action.isActive?.() ? 'active' : ''}
              onClick={action.run}
              disabled={action.disabled}
              aria-label={action.label}
              title={action.label}
            >
              <Icon size={16} aria-hidden="true" />
              <span>{action.label}</span>
            </button>
          )
        })}
      </div>
      <EditorContent editor={editor} className="rich-text-content" />
    </div>
  )
}

export { RichTextEditor }
