import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '@/lib/api'
import { editableHtmlFromStoredContent, editorJsonToStoredContent, getStoredContentText } from '@/lib/editor'
import { useBooks } from '@/services/books'
import { useBlogs, useCreateBlog, useUpdateBlog } from '@/services/blogs'
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
  BookOpen,
  CircleHelp,
  Eraser,
  ImageIcon,
  Italic,
  List,
  ListOrdered,
  Link2,
  PanelRightClose,
  PanelRightOpen,
  Pilcrow,
  Settings2,
  Sparkles,
  Upload,
  Underline,
  X,
} from 'lucide-react'
import BookCover from '@/components/ui/BookCover'
import { useAuthStore } from '@/store/auth.store'

const LOCAL_DRAFT_KEY = 'blog-write:local-draft:v1'
type EditorFormatState = {
  block: 'p' | 'h1' | 'h2' | 'blockquote' | 'codeBlock' | null
  bold: boolean
  italic: boolean
  underline: boolean
  orderedList: boolean
  unorderedList: boolean
  align: 'left' | 'center' | 'right' | null
  link: boolean
}

type StudioTheme = 'classic' | 'parchment' | 'mist' | 'night'
type StudioAtmosphere = 'dawn' | 'library' | 'aurora' | 'noir'

const STUDIO_THEMES: Array<{
  key: StudioTheme
  label: string
  pageClass: string
  frameClass: string
}> = [
  {
    key: 'classic',
    label: 'Classic',
    pageClass: 'bg-[#fdfaf3] text-slate-800 dark:text-slate-100',
    frameClass: 'from-amber-100/60 to-amber-50/20 dark:from-slate-900/90 dark:to-slate-900/70',
  },
  {
    key: 'parchment',
    label: 'Parchment',
    pageClass: 'bg-[#f7efd8] text-[#5b4630]',
    frameClass: 'from-[#e9d6a2]/45 to-[#f6edd2]/20',
  },
  {
    key: 'mist',
    label: 'Mist',
    pageClass: 'bg-[#eef4ff] text-[#21324a]',
    frameClass: 'from-cyan-100/50 to-sky-100/20',
  },
  {
    key: 'night',
    label: 'Night',
    pageClass: 'bg-[#111827] text-slate-100',
    frameClass: 'from-slate-800/65 to-slate-900/45',
  },
]

const STUDIO_ATMOSPHERES: Array<{
  key: StudioAtmosphere
  label: string
  shellClass: string
  haloClass: string
}> = [
  {
    key: 'dawn',
    label: 'Dawn',
    shellClass: 'from-[#dce7f8] via-[#f7f8fc] to-[#edf2f8] dark:from-[#040b17] dark:via-[#0d1525] dark:to-[#070d19]',
    haloClass:
      'bg-[radial-gradient(circle_at_18%_14%,rgba(255,255,255,0.58),transparent_42%),radial-gradient(circle_at_85%_15%,rgba(240,249,255,0.42),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(255,255,255,0.22),transparent_38%)] dark:bg-[radial-gradient(circle_at_18%_14%,rgba(30,64,175,0.2),transparent_42%),radial-gradient(circle_at_85%_15%,rgba(8,145,178,0.16),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(30,41,59,0.24),transparent_38%)]',
  },
  {
    key: 'library',
    label: 'Library',
    shellClass: 'from-[#efe6d7] via-[#f7f0e5] to-[#ece5d7] dark:from-[#1b1511] dark:via-[#201915] dark:to-[#17110d]',
    haloClass:
      'bg-[radial-gradient(circle_at_20%_16%,rgba(251,191,36,0.2),transparent_34%),radial-gradient(circle_at_78%_18%,rgba(251,146,60,0.16),transparent_34%)] dark:bg-[radial-gradient(circle_at_20%_16%,rgba(180,83,9,0.26),transparent_34%),radial-gradient(circle_at_78%_18%,rgba(146,64,14,0.2),transparent_34%)]',
  },
  {
    key: 'aurora',
    label: 'Aurora',
    shellClass: 'from-[#d9f0ef] via-[#e7f3ff] to-[#efe9ff] dark:from-[#05121a] dark:via-[#0a1825] dark:to-[#17132a]',
    haloClass:
      'bg-[radial-gradient(circle_at_10%_20%,rgba(34,211,238,0.25),transparent_38%),radial-gradient(circle_at_88%_12%,rgba(56,189,248,0.2),transparent_36%),radial-gradient(circle_at_55%_90%,rgba(168,85,247,0.16),transparent_36%)] dark:bg-[radial-gradient(circle_at_10%_20%,rgba(34,211,238,0.22),transparent_38%),radial-gradient(circle_at_88%_12%,rgba(59,130,246,0.22),transparent_36%),radial-gradient(circle_at_55%_90%,rgba(147,51,234,0.18),transparent_36%)]',
  },
  {
    key: 'noir',
    label: 'Noir',
    shellClass: 'from-[#d8dde7] via-[#e9edf4] to-[#dce2ec] dark:from-[#020617] dark:via-[#030b1a] dark:to-[#070f1e]',
    haloClass:
      'bg-[radial-gradient(circle_at_18%_16%,rgba(148,163,184,0.25),transparent_34%),radial-gradient(circle_at_80%_14%,rgba(125,211,252,0.14),transparent_34%)] dark:bg-[radial-gradient(circle_at_18%_16%,rgba(30,41,59,0.38),transparent_34%),radial-gradient(circle_at_80%_14%,rgba(8,47,73,0.24),transparent_34%)]',
  },
]

const BlogWritePage = () => {
  const navigate = useNavigate()
  const createBlog = useCreateBlog()
  const updateBlog = useUpdateBlog()
  const { data: booksData } = useBooks({ page: 1, limit: 80, status: 'active' })
  const { user } = useAuthStore()
  const { data: myPublishedFeed } = useBlogs({
    authorId: user?.id,
    status: 'PUBLISHED',
    page: 1,
    limit: 6,
  })

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
  const [studioTheme, setStudioTheme] = useState<StudioTheme>('classic')
  const [studioAtmosphere, setStudioAtmosphere] = useState<StudioAtmosphere>('dawn')
  const [studioBackdrop, setStudioBackdrop] = useState('')
  const [backdropTint, setBackdropTint] = useState(38)
  const [toolsCollapsed, setToolsCollapsed] = useState(false)
  const [isEnvironmentPanelOpen, setIsEnvironmentPanelOpen] = useState(false)
  const [isTutorialPanelOpen, setIsTutorialPanelOpen] = useState(false)
  const [isBooksPanelOpen, setIsBooksPanelOpen] = useState(false)
  const didHydrateEditorRef = useRef(false)
  const imageUploadInputRef = useRef<HTMLInputElement | null>(null)
  const backdropUploadInputRef = useRef<HTMLInputElement | null>(null)
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
  const currentStudioTheme = useMemo(
    () => STUDIO_THEMES.find((theme) => theme.key === studioTheme) ?? STUDIO_THEMES[0],
    [studioTheme],
  )
  const currentStudioAtmosphere = useMemo(
    () => STUDIO_ATMOSPHERES.find((theme) => theme.key === studioAtmosphere) ?? STUDIO_ATMOSPHERES[0],
    [studioAtmosphere],
  )
  const referencePosts = useMemo(
    () => (myPublishedFeed?.items ?? []).slice(0, 5),
    [myPublishedFeed?.items],
  )

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
    const block = activeEditor.isActive('codeBlock')
      ? 'codeBlock'
      : activeEditor.isActive('heading', { level: 1 })
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

  const applyBlockFormat = (tag: 'p' | 'h1' | 'h2' | 'blockquote' | 'codeBlock') => {
    if (!editor) return
    if (tag === 'p') editor.chain().focus().setParagraph().run()
    if (tag === 'h1') editor.chain().focus().setHeading({ level: 1 }).run()
    if (tag === 'h2') editor.chain().focus().setHeading({ level: 2 }).run()
    if (tag === 'blockquote') editor.chain().focus().toggleBlockquote().run()
    if (tag === 'codeBlock') editor.chain().focus().setCodeBlock().run()
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

  const resolveAutoImageAlt = () => {
    const trimmed = title.trim()
    if (trimmed) return `${trimmed} image`
    return 'Blog image'
  }

  const insertImageFromUrl = () => {
    if (!editor) return
    const url = window.prompt('Paste image URL', 'https://')
    if (!url) return
    editor.chain().focus().setImage({ src: url, alt: resolveAutoImageAlt() }).run()
  }

  const insertImageFromDevice = () => {
    imageUploadInputRef.current?.click()
  }

  const triggerBackdropUpload = () => {
    backdropUploadInputRef.current?.click()
  }

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !editor) return

    const reader = new FileReader()
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : ''
      if (!src) return
      editor.chain().focus().setImage({ src, alt: resolveAutoImageAlt() }).run()
      event.target.value = ''
    }
    reader.readAsDataURL(file)
  }

  const handleBackdropFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : ''
      if (!src) return
      setStudioBackdrop(src)
      event.target.value = ''
    }
    reader.readAsDataURL(file)
  }

  const clearFormatting = () => {
    if (!editor) return
    editor.chain().focus().unsetAllMarks().clearNodes().unsetTextAlign().run()
    refreshFormatState(editor)
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
    { key: 'bold', label: 'Bold (Ctrl/Cmd+B)', icon: <Bold className="h-4 w-4" />, onClick: () => editor?.chain().focus().toggleBold().run() },
    { key: 'italic', label: 'Italic (Ctrl/Cmd+I)', icon: <Italic className="h-4 w-4" />, onClick: () => editor?.chain().focus().toggleItalic().run() },
    { key: 'underline', label: 'Underline', icon: <Underline className="h-4 w-4" />, onClick: () => editor?.chain().focus().toggleUnderline().run() },
    { key: 'olist', label: 'Numbered list', icon: <ListOrdered className="h-4 w-4" />, onClick: () => editor?.chain().focus().toggleOrderedList().run() },
    { key: 'ulist', label: 'Bullet list', icon: <List className="h-4 w-4" />, onClick: () => editor?.chain().focus().toggleBulletList().run() },
    { key: 'left', label: 'Align left', icon: <AlignLeft className="h-4 w-4" />, onClick: () => editor?.chain().focus().setTextAlign('left').run() },
    { key: 'center', label: 'Align center', icon: <AlignCenter className="h-4 w-4" />, onClick: () => editor?.chain().focus().setTextAlign('center').run() },
    { key: 'right', label: 'Align right', icon: <AlignRight className="h-4 w-4" />, onClick: () => editor?.chain().focus().setTextAlign('right').run() },
    { key: 'link', label: 'Link', icon: <Link2 className="h-4 w-4" />, onClick: openLinkPopover },
    { key: 'imageUpload', label: 'Upload image from device', icon: <ImageIcon className="h-4 w-4" />, onClick: insertImageFromDevice },
    { key: 'imageUrl', label: 'Insert image URL', icon: <Link2 className="h-4 w-4" />, onClick: insertImageFromUrl },
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsEnvironmentPanelOpen(false)
      setIsTutorialPanelOpen(false)
      setIsBooksPanelOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
      className={`relative overflow-hidden bg-gradient-to-b ${currentStudioAtmosphere.shellClass}`}
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
        <div className={`absolute inset-0 ${currentStudioAtmosphere.haloClass}`} />
      </div>
      <motion.div
        className="pointer-events-none absolute inset-0 bg-slate-900/25 dark:bg-slate-950/50"
        initial={false}
        animate={{ opacity: isEditorFocused ? 0.12 : 0 }}
        transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
      />

      <div className="relative mx-auto w-full px-4 py-8 sm:px-6 lg:px-10">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setIsEnvironmentPanelOpen((prev) => !prev)
              setIsTutorialPanelOpen(false)
              setIsBooksPanelOpen(false)
            }}
            className="inline-flex items-center gap-2 rounded-full border border-white/65 bg-white/65 px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.6)] backdrop-blur-xl transition hover:border-white dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-200"
          >
            <Settings2 className="h-4 w-4" />
            Environment settings
          </button>
          <button
            type="button"
            onClick={() => {
              setIsTutorialPanelOpen((prev) => !prev)
              setIsEnvironmentPanelOpen(false)
              setIsBooksPanelOpen(false)
            }}
            className="inline-flex items-center gap-2 rounded-full border border-white/65 bg-white/65 px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.6)] backdrop-blur-xl transition hover:border-white dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-200"
          >
            <CircleHelp className="h-4 w-4" />
            Quick tutorial
          </button>
          <button
            type="button"
            onClick={() => {
              setIsBooksPanelOpen((prev) => !prev)
              setIsEnvironmentPanelOpen(false)
              setIsTutorialPanelOpen(false)
            }}
            className="inline-flex items-center gap-2 rounded-full border border-white/65 bg-white/65 px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.6)] backdrop-blur-xl transition hover:border-white dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-200"
          >
            <BookOpen className="h-4 w-4" />
            Linked books
          </button>
        </div>

        <header
          className={`mb-6 rounded-3xl border p-6 shadow-[0_30px_90px_-54px_rgba(15,23,42,0.55)] backdrop-blur-xl transition-all duration-300 sm:p-8 dark:shadow-[0_30px_90px_-55px_rgba(0,0,0,0.85)] ${
            isEditorFocused
              ? 'border-white/70 bg-white/76 dark:border-slate-700/70 dark:bg-slate-900/72'
              : 'border-white/55 bg-white/52 dark:border-slate-700/55 dark:bg-slate-900/52'
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Writer Studio</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl dark:text-slate-100">
            Write your story
          </h1>
          <p className="mt-2 max-w-2xl text-base text-slate-500 dark:text-slate-400">
            A focused editorial workspace for drafting, revising, and publishing polished posts.
          </p>
        </header>

        <motion.div
          initial={false}
          animate={{ opacity: isEnvironmentPanelOpen ? 1 : 0, y: isEnvironmentPanelOpen ? 0 : -10 }}
          className={`absolute left-4 right-4 top-24 z-30 sm:left-6 sm:right-auto sm:w-[38rem] lg:left-10 ${
            isEnvironmentPanelOpen ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        >
          <div className="rounded-2xl border border-white/70 bg-white/70 p-5 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.58)] backdrop-blur-2xl dark:border-slate-700/75 dark:bg-slate-900/75">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Studio Environment</p>
              <button
                type="button"
                onClick={() => setIsEnvironmentPanelOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Paper Theme</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {STUDIO_THEMES.map((theme) => (
                <button
                  key={theme.key}
                  type="button"
                  onClick={() => setStudioTheme(theme.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    studioTheme === theme.key
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'border border-slate-300/90 bg-white/70 text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {theme.label}
                </button>
              ))}
            </div>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Studio Background</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {STUDIO_ATMOSPHERES.map((theme) => (
                <button
                  key={theme.key}
                  type="button"
                  onClick={() => setStudioAtmosphere(theme.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    studioAtmosphere === theme.key
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'border border-slate-300/90 bg-white/70 text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {theme.label}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={triggerBackdropUpload}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload backdrop (device)
              </button>
              {studioBackdrop && (
                <button
                  type="button"
                  onClick={() => setStudioBackdrop('')}
                  className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
                >
                  Remove backdrop
                </button>
              )}
            </div>
            {studioBackdrop && (
              <div className="mt-4">
                <label className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Backdrop visibility
                  <span>{100 - backdropTint}%</span>
                </label>
                <input
                  type="range"
                  min={12}
                  max={70}
                  value={backdropTint}
                  onChange={(event) => setBackdropTint(Number(event.target.value))}
                  className="mt-2 w-full accent-slate-900 dark:accent-slate-100"
                />
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={false}
          animate={{ opacity: isTutorialPanelOpen ? 1 : 0, x: isTutorialPanelOpen ? 0 : 40 }}
          className={`fixed right-3 top-24 z-30 w-[22rem] max-w-[calc(100vw-1.5rem)] ${
            isTutorialPanelOpen ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        >
          <div className="space-y-4 rounded-2xl border border-white/70 bg-white/78 p-4 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.58)] backdrop-blur-2xl dark:border-slate-700/75 dark:bg-slate-900/78">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Quick Tutorial</p>
              </div>
              <button
                type="button"
                onClick={() => setIsTutorialPanelOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              {[
                'Open Environment settings and pick your studio mood.',
                'Use left tools rail for formatting while drafting.',
                'Add cover, tags, and linked books before publishing.',
              ].map((tip, idx) => (
                <p key={tip} className="text-xs text-slate-600 dark:text-slate-300">
                  {idx + 1}. {tip}
                </p>
              ))}
            </div>
            <section className="rounded-xl border border-white/65 bg-white/65 p-3 dark:border-slate-700/65 dark:bg-slate-900/60">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">References</p>
              <div className="mt-3 space-y-2">
                {referencePosts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/blogs/${post.id}`}
                    className="block rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
                  >
                    <p className="line-clamp-2 font-semibold text-slate-800 dark:text-slate-100">{post.title}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{post.readingTime} min read</p>
                  </Link>
                ))}
                {referencePosts.length === 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">Publish posts to see references here.</p>
                )}
              </div>
            </section>
          </div>
        </motion.div>

        <motion.div
          initial={false}
          animate={{ opacity: isBooksPanelOpen ? 1 : 0, x: isBooksPanelOpen ? 0 : 40 }}
          className={`fixed right-3 top-24 z-30 w-[24rem] max-w-[calc(100vw-1.5rem)] ${
            isBooksPanelOpen ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        >
          <div className="space-y-4 rounded-2xl border border-white/70 bg-white/78 p-4 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.58)] backdrop-blur-2xl dark:border-slate-700/75 dark:bg-slate-900/78">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Link Books (Optional)</p>
              <button
                type="button"
                onClick={() => setIsBooksPanelOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {selectedBooks.length > 0 && (
              <div className="flex flex-wrap gap-2">
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
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
            />
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
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
          </div>
        </motion.div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-white/65 bg-white/56 p-4 backdrop-blur-xl dark:border-slate-700/65 dark:bg-slate-900/56">
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Post title</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter title"
                  className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-2xl font-bold tracking-tight text-slate-900 outline-none transition focus:border-slate-400 placeholder:text-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-600"
                />
              </label>
              <label className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Subtitle</span>
                <input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Optional one-line subtitle"
                  className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-base text-slate-700 outline-none transition focus:border-slate-400 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-slate-600"
                />
              </label>
            </div>
          </section>

          <input
            ref={imageUploadInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageFileChange}
            className="hidden"
          />
          <input
            ref={backdropUploadInputRef}
            type="file"
            accept="image/*"
            onChange={handleBackdropFileChange}
            className="hidden"
          />

          <div className="grid gap-6 lg:grid-cols-[auto,minmax(0,1fr)]">
            <aside className="rounded-2xl border border-white/60 bg-white/42 p-3 shadow-[0_20px_50px_-45px_rgba(15,23,42,0.52)] backdrop-blur-xl dark:border-slate-700/55 dark:bg-slate-900/45">
              <div className="mb-3 flex items-center justify-between">
                {!toolsCollapsed && (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Editor Tools</p>
                )}
                <button
                  type="button"
                  onClick={() => setToolsCollapsed((prev) => !prev)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100"
                >
                  {toolsCollapsed ? <PanelRightOpen className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
                </button>
              </div>
              <div className={`space-y-2 ${toolsCollapsed ? 'w-10' : 'w-56'}`}>
                {!toolsCollapsed && (
                  <select
                    value={formatState.block ?? 'p'}
                    onChange={(event) => applyBlockFormat(event.target.value as 'p' | 'h1' | 'h2' | 'blockquote' | 'codeBlock')}
                    className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600"
                    title="Style"
                  >
                    <option value="p">Style: Body</option>
                    <option value="h1">Style: Heading 1</option>
                    <option value="h2">Style: Heading 2</option>
                    <option value="blockquote">Style: Quote</option>
                    <option value="codeBlock">Style: Code Block</option>
                  </select>
                )}
                <div className="flex flex-wrap gap-1">
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
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={clearFormatting}
                    title="Clear formatting"
                    className="rounded-md p-2 text-slate-500 transition-all duration-150 hover:-translate-y-0.5 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    <Eraser className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </aside>

            <div
              className={`relative overflow-hidden rounded-3xl border shadow-[0_28px_82px_-52px_rgba(15,23,42,0.62)] backdrop-blur-xl transition-all duration-300 ${
                isEditorFocused
                  ? 'border-amber-300/70 ring-2 ring-amber-300/30 dark:border-amber-400/50 dark:ring-amber-500/20'
                  : 'border-white/65 dark:border-slate-700/65'
              } bg-gradient-to-br ${currentStudioTheme.frameClass}`}
            >
              <div className="pointer-events-none absolute inset-y-5 left-1/2 w-px -translate-x-1/2 bg-slate-500/25 dark:bg-slate-600/60" />
              <div className="pointer-events-none absolute left-3 top-8 h-[82%] w-4 rounded-full bg-gradient-to-r from-amber-200/45 to-transparent blur-[1px] dark:from-slate-800/90" />
              <div className="pointer-events-none absolute right-3 top-8 h-[82%] w-4 rounded-full bg-gradient-to-l from-amber-200/45 to-transparent blur-[1px] dark:from-slate-800/90" />

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

              <div
                className="relative rounded-[1.7rem] border border-white/70 bg-white/44 p-6 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/45"
                style={
                  studioBackdrop
                    ? {
                        backgroundImage: `url(${studioBackdrop})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : undefined
                }
              >
                {studioBackdrop && (
                  <div
                    className="pointer-events-none absolute inset-4 rounded-[1.25rem]"
                    style={{ backgroundColor: `rgba(255,255,255,${backdropTint / 100})` }}
                  />
                )}
                <div className="pointer-events-none absolute inset-0 rounded-[1.5rem] bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.5),transparent_40%),radial-gradient(circle_at_100%_0%,rgba(255,255,255,0.45),transparent_36%)] dark:bg-[radial-gradient(circle_at_0%_0%,rgba(15,23,42,0.42),transparent_44%),radial-gradient(circle_at_100%_0%,rgba(15,23,42,0.36),transparent_40%)]" />
                {studioTheme === 'parchment' && (
                  <div className="pointer-events-none absolute inset-4 rounded-[1.25rem] border border-amber-300/45 bg-[radial-gradient(circle_at_12%_14%,rgba(161,98,7,0.12),transparent_24%),radial-gradient(circle_at_88%_90%,rgba(120,53,15,0.18),transparent_26%),radial-gradient(circle_at_50%_50%,rgba(120,53,15,0.06),transparent_62%)] shadow-[inset_0_0_45px_rgba(120,53,15,0.2)]" />
                )}
                <EditorContent
                  editor={editor}
                  className={`prose prose-slate relative z-10 min-h-[640px] max-w-none overflow-y-auto rounded-[1.2rem] border border-black/6 px-8 py-8 text-base leading-8 outline-none shadow-inner [&_.ProseMirror]:min-h-[600px] [&_.ProseMirror]:outline-none [&_a]:font-medium [&_a]:text-primary-700 [&_a]:underline [&_a]:decoration-primary-400/70 [&_a]:underline-offset-2 [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:text-4xl [&_h1]:font-semibold [&_h2]:mt-5 [&_h2]:mb-3 [&_h2]:text-3xl [&_h2]:font-semibold [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 ${studioBackdrop ? 'bg-white/40 backdrop-blur-[1px]' : currentStudioTheme.pageClass}`}
                />
              </div>
            </div>
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

          <section className="rounded-2xl border border-white/60 bg-white/45 p-4 shadow-[0_18px_50px_-45px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-slate-700/55 dark:bg-slate-900/45">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Post Details</h2>
            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              <div>
                <input
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="Cover image URL (optional)"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
                />
                {coverImage.trim() && (
                  <img
                    src={coverImage}
                    alt="Cover preview"
                    className="mt-3 aspect-[16/10] w-full rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                  />
                )}
              </div>
              <div>
                <input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Tags (comma separated)"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.slice(0, 10).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                  {tags.length === 0 && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">No tags yet.</span>
                  )}
                </div>
              </div>
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
