import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { getErrorMessage } from '@/lib/api'
import { editableHtmlFromStoredContent, editorJsonToStoredContent, getStoredContentText } from '@/lib/editor'
import { useBooks } from '@/services/books'
import { useCreateBlog, useUpdateBlog } from '@/services/blogs'
import { useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import TiptapUnderline from '@tiptap/extension-underline'
import TiptapImage from '@tiptap/extension-image'
import TiptapLink from '@tiptap/extension-link'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Heading1,
  Heading2,
  ImageIcon,
  Italic,
  List,
  ListOrdered,
  Link2,
  Pilcrow,
  Quote,
  Underline,
  X,
} from 'lucide-react'
import BookCover from '@/components/ui/BookCover'

const LOCAL_DRAFT_KEY = 'blog-write:local-draft:v1'
type EditorFormatState = {
  block: 'p' | 'h1' | 'h2' | 'blockquote' | null
  bold: boolean
  italic: boolean
  underline: boolean
  orderedList: boolean
  unorderedList: boolean
  align: 'left' | 'center' | 'right' | null
  link: boolean
}

const BlogWritePage = () => {
  const navigate = useNavigate()
  const createBlog = useCreateBlog()
  const updateBlog = useUpdateBlog()
  const { data: booksData } = useBooks({ page: 1, limit: 80 })

  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [content, setContent] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([])
  const [bookSearch, setBookSearch] = useState('')
  const [draftId, setDraftId] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [autoSavedAt, setAutoSavedAt] = useState<Date | null>(null)
  const [autoSaveState, setAutoSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [actionInFlight, setActionInFlight] = useState<'DRAFT' | 'PUBLISHED' | null>(null)
  const [isEditorFocused, setIsEditorFocused] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false)
  const [linkTextInput, setLinkTextInput] = useState('')
  const [linkUrlInput, setLinkUrlInput] = useState('')
  const [linkSelection, setLinkSelection] = useState<{ from: number; to: number } | null>(null)
  const [formatState, setFormatState] = useState<EditorFormatState>({
    block: null,
    bold: false,
    italic: false,
    underline: false,
    orderedList: false,
    unorderedList: false,
    align: null,
    link: false,
  })
  const [hydrated, setHydrated] = useState(false)
  const [scrollDamp, setScrollDamp] = useState(1)
  const didHydrateEditorRef = useRef(false)
  const prefersReducedMotion = useReducedMotion()
  const parallaxX = useMotionValue(0)
  const parallaxY = useMotionValue(0)
  const smoothX = useSpring(parallaxX, { stiffness: 72, damping: 22, mass: 0.7 })
  const smoothY = useSpring(parallaxY, { stiffness: 72, damping: 22, mass: 0.7 })

  const books = booksData?.books ?? []
  const isSaving = createBlog.isPending || updateBlog.isPending
  const focusDamp = isEditorFocused ? 0.58 : 1
  const parallaxStrength = (prefersReducedMotion ? 0 : scrollDamp) * focusDamp
  const deepLayerX = useTransform(smoothX, (value) => value * 4 * parallaxStrength)
  const deepLayerY = useTransform(smoothY, (value) => value * 4 * parallaxStrength)
  const cloudLayerX = useTransform(smoothX, (value) => value * 9 * parallaxStrength)
  const cloudLayerY = useTransform(smoothY, (value) => value * 9 * parallaxStrength)

  const tags = useMemo(
    () => tagsInput.split(',').map((item) => item.trim()).filter(Boolean),
    [tagsInput],
  )
  const plainContent = useMemo(() => getStoredContentText(content), [content])
  const wordCount = useMemo(() => {
    const words = plainContent.trim().split(/\s+/).filter(Boolean)
    return words.length
  }, [plainContent])
  const readingMinutes = Math.max(1, Math.round(wordCount / 220))
  const selectedBooksText = selectedBookIds.sort().join(',')
  const selectedBooks = useMemo(
    () => books.filter((book) => selectedBookIds.includes(book.id)),
    [books, selectedBookIds],
  )
  const filteredBooks = useMemo(() => {
    const query = bookSearch.trim().toLowerCase()
    if (!query) return books
    return books.filter((book) => {
      const title = book.title.toLowerCase()
      const author = book.author.toLowerCase()
      return title.includes(query) || author.includes(query)
    })
  }, [bookSearch, books])

  const toggleBook = (bookId: string) => {
    setSelectedBookIds((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId],
    )
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'blockquote'],
        alignments: ['left', 'center', 'right'],
      }),
      TiptapUnderline,
      TiptapImage.configure({ inline: false }),
      TiptapLink.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
      }),
    ],
    content: '<p><br></p>',
    onFocus: () => setIsEditorFocused(true),
    onBlur: () => setIsEditorFocused(false),
    onUpdate: ({ editor: tiptapEditor }: { editor: { getJSON: () => unknown } }) => {
      setContent(editorJsonToStoredContent(tiptapEditor.getJSON() as Record<string, unknown>))
    },
  })

  const refreshFormatState = (activeEditor = editor) => {
    if (!activeEditor) return
    const block = activeEditor.isActive('heading', { level: 1 })
      ? 'h1'
      : activeEditor.isActive('heading', { level: 2 })
        ? 'h2'
        : activeEditor.isActive('blockquote')
          ? 'blockquote'
          : activeEditor.isActive('paragraph')
            ? 'p'
            : null
    const align = activeEditor.isActive({ textAlign: 'center' })
      ? 'center'
      : activeEditor.isActive({ textAlign: 'right' })
        ? 'right'
        : 'left'

    setFormatState({
      block,
      bold: activeEditor.isActive('bold'),
      italic: activeEditor.isActive('italic'),
      underline: activeEditor.isActive('underline'),
      orderedList: activeEditor.isActive('orderedList'),
      unorderedList: activeEditor.isActive('bulletList'),
      align,
      link: activeEditor.isActive('link'),
    })
  }

  const insertCodeBlock = () => {
    if (!editor) return
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, '\n') || 'code'
    editor.chain().focus().insertContent(`<pre><code>${selectedText}</code></pre>`).run()
  }

  const openLinkPopover = () => {
    if (!editor) return
    const { from, to } = editor.state.selection
    const selected = editor.state.doc.textBetween(from, to, ' ').trim()
    setLinkSelection({ from, to })
    setLinkTextInput(selected)
    setLinkUrlInput(editor.getAttributes('link').href || 'https://')
    setIsLinkPopoverOpen(true)
  }

  const insertImage = () => {
    if (!editor) return
    const url = window.prompt('Paste image URL', 'https://')
    if (!url) return
    const alt = window.prompt('Image alt text', 'Article image') || 'Article image'
    editor.chain().focus().setImage({ src: url, alt }).run()
  }

  const applyBlockFormat = (tag: 'p' | 'h1' | 'h2' | 'blockquote') => {
    if (!editor) return
    if (tag === 'p') editor.chain().focus().setParagraph().run()
    if (tag === 'h1') editor.chain().focus().setHeading({ level: 1 }).run()
    if (tag === 'h2') editor.chain().focus().setHeading({ level: 2 }).run()
    if (tag === 'blockquote') editor.chain().focus().toggleBlockquote().run()
  }

  const applyLinkFromPopover = () => {
    if (!editor) return
    const rawUrl = linkUrlInput.trim()
    if (!rawUrl) return
    const normalizedUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`
    const selection = linkSelection ?? editor.state.selection
    const labelFromDoc = editor.state.doc.textBetween(selection.from, selection.to, ' ').trim()
    const label = linkTextInput.trim() || labelFromDoc || normalizedUrl
    const to = selection.from + label.length

    editor
      .chain()
      .focus()
      .insertContentAt({ from: selection.from, to: selection.to }, label)
      .setTextSelection({ from: selection.from, to })
      .setLink({ href: normalizedUrl, target: '_blank', rel: 'noreferrer' })
      .run()

    setLinkSelection(null)
    setIsLinkPopoverOpen(false)
  }

  const isToolbarActionActive = (key: string) => {
    if (key === 'p') return formatState.block === 'p'
    if (key === 'h1') return formatState.block === 'h1'
    if (key === 'h2') return formatState.block === 'h2'
    if (key === 'bold') return formatState.bold
    if (key === 'italic') return formatState.italic
    if (key === 'underline') return formatState.underline
    if (key === 'quote') return formatState.block === 'blockquote'
    if (key === 'olist') return formatState.orderedList
    if (key === 'ulist') return formatState.unorderedList
    if (key === 'left') return formatState.align === 'left'
    if (key === 'center') return formatState.align === 'center'
    if (key === 'right') return formatState.align === 'right'
    if (key === 'link') return formatState.link
    return false
  }

  const toolbarActions: Array<{
    key: string
    label: string
    icon: React.ReactNode
    onClick: () => void
  }> = [
    { key: 'p', label: 'Paragraph', icon: <Pilcrow className="h-4 w-4" />, onClick: () => applyBlockFormat('p') },
    { key: 'h1', label: 'Heading 1', icon: <Heading1 className="h-4 w-4" />, onClick: () => applyBlockFormat('h1') },
    { key: 'h2', label: 'Heading 2', icon: <Heading2 className="h-4 w-4" />, onClick: () => applyBlockFormat('h2') },
    { key: 'bold', label: 'Bold', icon: <Bold className="h-4 w-4" />, onClick: () => editor?.chain().focus().toggleBold().run() },
    { key: 'italic', label: 'Italic', icon: <Italic className="h-4 w-4" />, onClick: () => editor?.chain().focus().toggleItalic().run() },
    { key: 'underline', label: 'Underline', icon: <Underline className="h-4 w-4" />, onClick: () => editor?.chain().focus().toggleUnderline().run() },
    { key: 'quote', label: 'Quote', icon: <Quote className="h-4 w-4" />, onClick: () => applyBlockFormat('blockquote') },
    { key: 'olist', label: 'Numbered list', icon: <ListOrdered className="h-4 w-4" />, onClick: () => editor?.chain().focus().toggleOrderedList().run() },
    { key: 'ulist', label: 'Bullet list', icon: <List className="h-4 w-4" />, onClick: () => editor?.chain().focus().toggleBulletList().run() },
    { key: 'left', label: 'Align left', icon: <AlignLeft className="h-4 w-4" />, onClick: () => editor?.chain().focus().setTextAlign('left').run() },
    { key: 'center', label: 'Align center', icon: <AlignCenter className="h-4 w-4" />, onClick: () => editor?.chain().focus().setTextAlign('center').run() },
    { key: 'right', label: 'Align right', icon: <AlignRight className="h-4 w-4" />, onClick: () => editor?.chain().focus().setTextAlign('right').run() },
    { key: 'code', label: 'Code block', icon: <Code2 className="h-4 w-4" />, onClick: insertCodeBlock },
    { key: 'link', label: 'Link', icon: <Link2 className="h-4 w-4" />, onClick: openLinkPopover },
    { key: 'image', label: 'Image', icon: <ImageIcon className="h-4 w-4" />, onClick: insertImage },
  ]

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LOCAL_DRAFT_KEY)
      if (!raw) {
        setHydrated(true)
        return
      }

      const parsed = JSON.parse(raw) as Partial<{
        title: string
        subtitle: string
        coverImage: string
        content: string
        tagsInput: string
        selectedBookIds: string[]
        updatedAt: string
      }>

      setTitle(parsed.title ?? '')
      setSubtitle(parsed.subtitle ?? '')
      setCoverImage(parsed.coverImage ?? '')
      setContent(parsed.content ?? '')
      setTagsInput(parsed.tagsInput ?? '')
      setSelectedBookIds(Array.isArray(parsed.selectedBookIds) ? parsed.selectedBookIds : [])
      if (parsed.updatedAt) {
        const parsedDate = new Date(parsed.updatedAt)
        if (!Number.isNaN(parsedDate.getTime())) {
          setAutoSavedAt(parsedDate)
          setAutoSaveState('saved')
        }
      }
    } catch {
      // ignore corrupted local draft
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (didHydrateEditorRef.current) return
    if (!editor) return
    editor.commands.setContent(editableHtmlFromStoredContent(content || ''))
    didHydrateEditorRef.current = true
    refreshFormatState(editor)
  }, [content, editor, hydrated])

  useEffect(() => {
    if (!hydrated) return

    const hasAnyDraftContent =
      Boolean(title.trim()) ||
      Boolean(subtitle.trim()) ||
      Boolean(plainContent.trim()) ||
      Boolean(tagsInput.trim()) ||
      Boolean(coverImage.trim()) ||
      selectedBookIds.length > 0

    if (!hasAnyDraftContent) {
      window.localStorage.removeItem(LOCAL_DRAFT_KEY)
      setAutoSaveState('idle')
      return
    }

    setAutoSaveState('saving')
    const timeout = window.setTimeout(() => {
      const now = new Date()
      window.localStorage.setItem(
        LOCAL_DRAFT_KEY,
        JSON.stringify({
          title,
          subtitle,
          coverImage,
          content,
          tagsInput,
          selectedBookIds,
          updatedAt: now.toISOString(),
        }),
      )
      setAutoSavedAt(now)
      setAutoSaveState('saved')
    }, 900)

    return () => window.clearTimeout(timeout)
  }, [hydrated, title, subtitle, coverImage, content, plainContent, tagsInput, selectedBooksText, selectedBookIds])

  useEffect(() => {
    if (prefersReducedMotion) return
    const handleScroll = () => {
      const damp = Math.max(0.45, 1 - window.scrollY / 2200)
      setScrollDamp(damp)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [prefersReducedMotion])

  useEffect(() => {
    if (!editor) return
    const update = () => refreshFormatState(editor)
    editor.on('selectionUpdate', update)
    editor.on('transaction', update)
    return () => {
      editor.off('selectionUpdate', update)
      editor.off('transaction', update)
    }
  }, [editor])

  const handlePointerMove = (event: MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return
    const rect = event.currentTarget.getBoundingClientRect()
    const normalizedX = ((event.clientX - rect.left) / rect.width - 0.5) * 2
    const normalizedY = ((event.clientY - rect.top) / rect.height - 0.5) * 2
    parallaxX.set(Math.max(-1, Math.min(1, normalizedX)))
    parallaxY.set(Math.max(-1, Math.min(1, normalizedY)))
  }

  const resetParallax = () => {
    parallaxX.set(0)
    parallaxY.set(0)
  }

  const persistPost = async (nextStatus: 'DRAFT' | 'PUBLISHED') => {
    if (draftId) {
      const updated = await updateBlog.mutateAsync({
        blogId: draftId,
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        content,
        coverImage: coverImage.trim() || undefined,
        tags,
        bookIds: selectedBookIds,
        status: nextStatus,
      })
      return updated
    }
    const created = await createBlog.mutateAsync({
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      content,
      coverImage: coverImage.trim() || undefined,
      tags,
      bookIds: selectedBookIds,
      status: nextStatus,
    })
    setDraftId(created.id)
    return created
  }

  const submitPost = async (nextStatus: 'DRAFT' | 'PUBLISHED') => {
    setFeedback('')
    setActionInFlight(nextStatus)

    if (!title.trim() || !plainContent.trim()) {
      setFeedback('Title and content are required.')
      setActionInFlight(null)
      return
    }

    try {
      const post = await persistPost(nextStatus)
      setLastSavedAt(new Date())
      window.localStorage.removeItem(LOCAL_DRAFT_KEY)
      if (nextStatus === 'DRAFT') {
        setFeedback('Draft saved successfully.')
        return
      }
      navigate(`/blogs/${post.id}`)
    } catch (error) {
      setFeedback(getErrorMessage(error))
    } finally {
      setActionInFlight(null)
    }
  }

  const saveText =
    actionInFlight === 'DRAFT'
      ? 'Saving Draft...'
      : autoSaveState === 'saving'
        ? 'Autosaving...'
        : 'Save Draft'

  const saveStamp = lastSavedAt ?? autoSavedAt

  return (
    <div
      className="relative overflow-hidden bg-gradient-to-b from-[#dce7f8] via-[#f7f8fc] to-[#edf2f8] dark:from-[#040b17] dark:via-[#0d1525] dark:to-[#070d19]"
      onMouseMove={handlePointerMove}
      onMouseLeave={resetParallax}
    >
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          style={{ x: deepLayerX, y: deepLayerY }}
          className="absolute inset-0"
        >
          <div className="absolute -top-40 left-1/4 h-[28rem] w-[28rem] rounded-full bg-blue-300/22 blur-3xl dark:bg-blue-700/16" />
          <div className="absolute bottom-[-10rem] right-[-4rem] h-[24rem] w-[24rem] rounded-full bg-cyan-200/18 blur-3xl dark:bg-cyan-700/10" />
        </motion.div>
        <motion.div
          style={{ x: cloudLayerX, y: cloudLayerY }}
          className="absolute inset-0"
        >
          <div className="absolute top-24 right-10 h-64 w-64 rounded-full bg-amber-200/24 blur-3xl dark:bg-amber-600/12" />
          <div className="absolute top-1/2 left-[-6rem] h-56 w-56 rounded-full bg-slate-200/30 blur-3xl dark:bg-slate-700/15" />
        </motion.div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.5),transparent_46%),radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.32),transparent_42%),radial-gradient(circle_at_50%_90%,rgba(255,255,255,0.22),transparent_38%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(30,64,175,0.2),transparent_42%),radial-gradient(circle_at_85%_15%,rgba(15,118,110,0.14),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(30,41,59,0.24),transparent_38%)]" />
      </div>
      <motion.div
        className="pointer-events-none absolute inset-0 bg-slate-900/25 dark:bg-slate-950/50"
        initial={false}
        animate={{ opacity: isEditorFocused ? 0.12 : 0 }}
        transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
      />

      <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <header
          className={`mb-8 rounded-3xl border p-6 shadow-[0_25px_80px_-50px_rgba(15,23,42,0.45)] backdrop-blur-md transition-all duration-300 sm:p-8 dark:shadow-[0_25px_80px_-55px_rgba(0,0,0,0.8)] ${
            isEditorFocused
              ? 'border-slate-200/75 bg-white/82 dark:border-slate-800/75 dark:bg-slate-900/78'
              : 'border-slate-200/65 bg-white/66 dark:border-slate-800/65 dark:bg-slate-900/62'
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Writer Studio</p>
          <h1 className="mt-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-5xl font-black tracking-tight text-transparent dark:from-slate-100 dark:via-slate-200 dark:to-slate-300">
            Write your story
          </h1>
          <p className="mt-3 max-w-2xl text-base text-slate-500 dark:text-slate-400">
            A focused editorial workspace for drafting, revising, and publishing polished posts.
          </p>
        </header>

        <div className="space-y-7">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title"
            className="w-full border-b border-slate-200 bg-transparent px-0 py-4 text-3xl font-black tracking-tight text-slate-900 outline-none transition focus:border-slate-400 placeholder:text-slate-300 sm:text-5xl dark:border-slate-800 dark:text-slate-100 dark:focus:border-slate-600"
          />

          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Subtitle (optional)"
            className="w-full border-b border-slate-100 bg-transparent px-0 py-3 text-lg text-slate-600 outline-none transition focus:border-slate-300 placeholder:text-slate-300 dark:border-slate-900 dark:text-slate-400 dark:focus:border-slate-700"
          />

          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
            <div
              className={`overflow-hidden rounded-3xl border shadow-[0_22px_70px_-45px_rgba(15,23,42,0.5)] backdrop-blur-md transition-all duration-300 ${
                isEditorFocused
                  ? 'border-amber-300/70 bg-white/94 ring-2 ring-amber-300/30 dark:border-amber-400/50 dark:bg-slate-900/88 dark:ring-amber-500/20'
                  : 'border-slate-200/70 bg-white/78 dark:border-slate-800/70 dark:bg-slate-900/66'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 bg-slate-100/60 px-4 py-3 dark:border-slate-800/80 dark:bg-slate-900/80">
                <div className="flex flex-wrap items-center gap-1">
                  {toolbarActions.map((action) => (
                    <button
                      key={action.key}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={action.onClick}
                      title={action.label}
                      className={`rounded-md p-2 transition-all duration-150 hover:-translate-y-0.5 ${
                        isToolbarActionActive(action.key)
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                      }`}
                    >
                      {action.icon}
                    </button>
                  ))}
                </div>
                <span className="rounded-full border border-slate-300 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:border-slate-700 dark:text-slate-300">
                  Rich Editor
                </span>
              </div>

              {isLinkPopoverOpen && (
                <div className="border-b border-slate-200/80 bg-white/90 px-4 py-3 dark:border-slate-800/80 dark:bg-slate-900/85">
                  <div className="rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-[0_12px_30px_rgba(15,23,42,0.14)] dark:border-slate-700 dark:bg-slate-900">
                    <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-center">
                      <label className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 focus-within:border-blue-500 dark:border-slate-700 dark:focus-within:border-blue-400">
                        <Pilcrow className="h-4 w-4 text-slate-400" />
                        <input
                          value={linkTextInput}
                          onChange={(event) => setLinkTextInput(event.target.value)}
                          placeholder="Text"
                          className="w-full bg-transparent text-base text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100"
                        />
                      </label>
                      <label className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 focus-within:border-blue-500 dark:border-slate-700 dark:focus-within:border-blue-400">
                        <Link2 className="h-4 w-4 text-slate-400" />
                        <input
                          value={linkUrlInput}
                          onChange={(event) => setLinkUrlInput(event.target.value)}
                          placeholder="Type or paste a link"
                          className="w-full bg-transparent text-base text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={applyLinkFromPopover}
                        disabled={!linkUrlInput.trim()}
                        className="h-11 rounded-xl px-4 text-lg font-semibold text-slate-900 transition hover:bg-slate-100 disabled:text-slate-400 dark:text-slate-100 dark:hover:bg-slate-800 dark:disabled:text-slate-500"
                      >
                        Apply
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsLinkPopoverOpen(false)}
                        className="h-11 rounded-xl px-4 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <EditorContent
                editor={editor}
                className="prose prose-slate min-h-[440px] max-w-none overflow-y-auto bg-[#fdfdfd] px-5 py-5 text-base leading-8 text-slate-700 outline-none [&_.ProseMirror]:min-h-[440px] [&_.ProseMirror]:outline-none [&_a]:font-medium [&_a]:text-primary-700 [&_a]:underline [&_a]:decoration-primary-400/70 [&_a]:underline-offset-2 [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:text-4xl [&_h1]:font-semibold [&_h2]:mt-5 [&_h2]:mb-3 [&_h2]:text-3xl [&_h2]:font-semibold [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 dark:prose-invert dark:bg-slate-900/40 dark:text-slate-200 dark:[&_a]:text-amber-300 dark:[&_a]:decoration-amber-300/60 dark:[&_blockquote]:border-slate-600"
              />
            </div>

            <aside
              className={`space-y-5 rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-[0_20px_50px_-45px_rgba(15,23,42,0.5)] backdrop-blur-sm transition-all duration-300 lg:sticky lg:top-24 dark:border-slate-800/70 dark:bg-slate-900/60 ${
                isEditorFocused ? 'opacity-80 saturate-75' : 'opacity-100'
              }`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Post Details</p>
              <input
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="Cover image URL (optional)"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
              />
              {coverImage.trim() && (
                <img src={coverImage} alt="Cover preview" className="aspect-[16/10] w-full rounded-xl border border-slate-200 object-cover dark:border-slate-700" />
              )}

              <input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Tags (comma separated)"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
              />
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 8).map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {tag}
                  </span>
                ))}
                {tags.length === 0 && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">No tags yet.</span>
                )}
              </div>
            </aside>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <motion.span key={wordCount} initial={{ scale: 0.95, opacity: 0.7 }} animate={{ scale: 1, opacity: 1 }}>
              {wordCount} words
            </motion.span>
            <span>{readingMinutes} min read</span>
            <span className="inline-flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${autoSaveState === 'saving' ? 'animate-pulse bg-amber-500' : 'bg-emerald-500'}`} />
              {saveStamp ? `Saved ${saveStamp.toLocaleTimeString()}` : 'Not saved yet'}
            </span>
          </div>

          <section
            className={`rounded-2xl bg-white/70 p-4 shadow-[0_18px_50px_-45px_rgba(15,23,42,0.45)] backdrop-blur-sm transition-all duration-300 dark:bg-slate-900/60 ${
              isEditorFocused ? 'opacity-85' : 'opacity-100'
            }`}
          >
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Link Books (Optional)</h2>
            {selectedBooks.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedBooks.map((book) => (
                  <button
                    key={`chip-${book.id}`}
                    type="button"
                    onClick={() => toggleBook(book.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {book.title}
                    <X className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
            )}

            <input
              value={bookSearch}
              onChange={(e) => setBookSearch(e.target.value)}
              placeholder="Search books by title or author"
              className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
            />
            <div className="mt-3 max-h-52 space-y-2 overflow-y-auto pr-1">
              {filteredBooks.map((book) => {
                const checked = selectedBookIds.includes(book.id)
                return (
                  <button
                    key={book.id}
                    type="button"
                    onClick={() => toggleBook(book.id)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
                      checked
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200'
                        : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <BookCover src={book.coverImage} alt={book.title} className="h-9 w-6 rounded object-cover" />
                      <span className="truncate">{book.title} · {book.author}</span>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      {checked ? 'Added' : 'Add'}
                    </span>
                  </button>
                )
              })}
              {books.length === 0 && <p className="text-sm text-slate-500">No books available.</p>}
              {books.length > 0 && filteredBooks.length === 0 && (
                <p className="text-sm text-slate-500">No matching books found.</p>
              )}
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => submitPost('DRAFT')}
              disabled={isSaving}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-100 disabled:opacity-70 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {saveText}
            </button>
            <button
              type="button"
              onClick={() => submitPost('PUBLISHED')}
              disabled={isSaving}
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition-all duration-150 hover:-translate-y-0.5 hover:bg-slate-700 disabled:opacity-70 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {actionInFlight === 'PUBLISHED' ? 'Publishing...' : 'Publish'}
            </button>
          </div>

          {feedback && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-sm font-medium ${feedback.toLowerCase().includes('saved') ? 'text-emerald-600' : 'text-rose-600'}`}
            >
              {feedback}
            </motion.p>
          )}
        </div>
      </div>
    </div>
  )
}

export default BlogWritePage
