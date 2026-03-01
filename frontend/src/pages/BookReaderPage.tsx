import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Bookmark, Highlighter, List, Maximize2, Minimize2, MoonStar, Play, Search, Settings, Square, StickyNote } from 'lucide-react'
import {
  useCreateEbookBookmark,
  useCreateEbookHighlight,
  useCreateEbookNote,
  useDeleteEbookBookmark,
  useDeleteEbookNote,
  useEbookState,
  useOpenEbook,
  useUpdateEbookProgress,
} from '@/services/reading'
import type { EbookState } from '@/services/reading'
import { getErrorMessage } from '@/lib/api'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const JSZIP_CDN_SCRIPT = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'
const EPUB_CDN_SCRIPT = 'https://cdn.jsdelivr.net/npm/epubjs/dist/epub.min.js'
const PDFJS_CDN_SCRIPT = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js'
const PDFJS_WORKER_CDN_SCRIPT = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'
const PDFJS_CMAP_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/'
const PDFJS_STANDARD_FONTS_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/'
const READER_SETTINGS_KEY = 'reader-settings-v1'

type ReaderTheme = 'paper' | 'sepia' | 'night'

type ReaderSettings = {
  theme: ReaderTheme
  fontSizeRem: number
  lineHeight: number
  sidePaddingRem: number
  pdfZoom: number
  pageView: 'single' | 'spread'
  stylePresetId: 'original' | 'quiet' | 'paper' | 'bold' | 'calm' | 'focus'
}

type TocEntry = {
  label: string
  href?: string
  subitems?: TocEntry[]
}

type SaveState = 'idle' | 'saving' | 'error'

type SaveJob = {
  payload: {
    bookId: string
    page?: number
    locationCfi?: string
    percent?: number
  }
  silent: boolean
}

type ReaderLastPosition = {
  page?: number
  locationCfi?: string
  percent?: number
}

type ReaderAssetFormat = 'EPUB' | 'PDF' | ''

type EpubSearchResult = {
  cfi: string
  excerpt: string
  page: number | null
}

type HighlightStyle = 'yellow' | 'green' | 'pink' | 'blue' | 'underline'

type PdfSelectionRect = {
  x: number
  y: number
  w: number
  h: number
}

type EpubSelectionActionAnchor = {
  x: number
  y: number
}

const QUICK_DICTIONARY: Record<string, string> = {
  metaphor: 'A comparison that describes one thing as another to create meaning.',
  irony: 'A contrast between expectation and reality.',
  narrative: 'The structured telling of events in a story.',
  premise: 'The basic idea or foundation of an argument or story.',
  conflict: 'A struggle between opposing forces in a story.',
  protagonist: 'The main character in a narrative.',
  antagonist: 'The opposing force or character to the protagonist.',
  theme: 'The central message or underlying idea of a work.',
  context: 'The surrounding circumstances that shape meaning.',
  nuance: 'A subtle difference in meaning or expression.',
}

type DictionaryLookup = {
  definition: string
  phonetic?: string
  audioUrl?: string
  source: 'online' | 'fallback'
}

declare global {
  interface Window {
    JSZip?: unknown
    ePub?: (source: string | ArrayBuffer | Uint8Array) => any
    pdfjsLib?: any
  }
}

let epubScriptPromise: Promise<void> | null = null
let pdfScriptPromise: Promise<void> | null = null

const defaultSettings: ReaderSettings = {
  theme: 'paper',
  fontSizeRem: 1.06,
  lineHeight: 1.68,
  sidePaddingRem: 1.15,
  pdfZoom: 1,
  pageView: 'single',
  stylePresetId: 'original',
}

const READER_STYLE_PRESETS: Array<{
  id: 'original' | 'quiet' | 'paper' | 'bold' | 'calm' | 'focus'
  label: string
  fontFamily: string
  fontWeight: string
  letterSpacing: string
}> = [
  { id: 'original', label: 'Original', fontFamily: '"Georgia", "Times New Roman", serif', fontWeight: '400', letterSpacing: '0em' },
  { id: 'quiet', label: 'Quiet', fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif', fontWeight: '400', letterSpacing: '0.002em' },
  { id: 'paper', label: 'Paper', fontFamily: '"Baskerville", "Times New Roman", serif', fontWeight: '400', letterSpacing: '0.004em' },
  { id: 'bold', label: 'Bold', fontFamily: '"Georgia", "Times New Roman", serif', fontWeight: '600', letterSpacing: '0.003em' },
  { id: 'calm', label: 'Calm', fontFamily: '"Garamond", "Times New Roman", serif', fontWeight: '400', letterSpacing: '0.005em' },
  { id: 'focus', label: 'Focus', fontFamily: '"Charter", "Palatino Linotype", serif', fontWeight: '500', letterSpacing: '0.002em' },
]

const loadEpubScript = async () => {
  const loadScript = (src: string, marker: string) =>
    new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(
        `script[data-reader-lib="${marker}"]`,
      ) as HTMLScriptElement | null
      if (existing) {
        if ((existing as HTMLScriptElement).dataset.loaded === 'true') {
          resolve()
          return
        }
        existing.addEventListener('load', () => resolve(), { once: true })
        existing.addEventListener('error', () => reject(new Error(`Failed to load ${marker}`)), { once: true })
        return
      }

      const script = document.createElement('script')
      script.src = src
      script.async = true
      script.defer = true
      script.dataset.readerLib = marker
      script.onload = () => {
        script.dataset.loaded = 'true'
        resolve()
      }
      script.onerror = () => reject(new Error(`Failed to load ${marker}`))
      document.head.appendChild(script)
    })

  if (!window.JSZip) {
    await loadScript(JSZIP_CDN_SCRIPT, 'jszip')
  }

  if (window.ePub) return
  if (epubScriptPromise) {
    await epubScriptPromise
    return
  }

  epubScriptPromise = loadScript(EPUB_CDN_SCRIPT, 'epubjs')
  await epubScriptPromise
}

const loadPdfScript = async () => {
  const loadScript = (src: string, marker: string) =>
    new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(
        `script[data-reader-lib="${marker}"]`,
      ) as HTMLScriptElement | null
      if (existing) {
        if ((existing as HTMLScriptElement).dataset.loaded === 'true') {
          resolve()
          return
        }
        existing.addEventListener('load', () => resolve(), { once: true })
        existing.addEventListener('error', () => reject(new Error(`Failed to load ${marker}`)), { once: true })
        return
      }

      const script = document.createElement('script')
      script.src = src
      script.async = true
      script.defer = true
      script.dataset.readerLib = marker
      script.onload = () => {
        script.dataset.loaded = 'true'
        resolve()
      }
      script.onerror = () => reject(new Error(`Failed to load ${marker}`))
      document.head.appendChild(script)
    })

  if (window.pdfjsLib) return
  if (pdfScriptPromise) {
    await pdfScriptPromise
    return
  }

  pdfScriptPromise = loadScript(PDFJS_CDN_SCRIPT, 'pdfjs')
  await pdfScriptPromise
  if (window.pdfjsLib?.GlobalWorkerOptions) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN_SCRIPT
  }
}

const flattenToc = (items: TocEntry[] = [], depth = 0): Array<TocEntry & { depth: number }> => {
  const rows: Array<TocEntry & { depth: number }> = []
  for (const item of items) {
    rows.push({ ...item, depth })
    if (item.subitems?.length) {
      rows.push(...flattenToc(item.subitems, depth + 1))
    }
  }
  return rows
}

const getReaderSettingsKey = (bookId: string) => `${READER_SETTINGS_KEY}:${bookId || 'default'}`
const getReaderPositionKey = (bookId: string) => `reader-last-position-v1:${bookId || 'default'}`

const readLastPosition = (bookId: string): ReaderLastPosition | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(getReaderPositionKey(bookId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as ReaderLastPosition
    return parsed ?? null
  } catch {
    return null
  }
}

const writeLastPosition = (bookId: string, value: ReaderLastPosition) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(getReaderPositionKey(bookId), JSON.stringify(value))
  } catch {
    // ignore storage write failures
  }
}

const readSettings = (bookId: string): ReaderSettings => {
  if (typeof window === 'undefined') return defaultSettings
  try {
    const raw =
      window.localStorage.getItem(getReaderSettingsKey(bookId))
      || window.localStorage.getItem(READER_SETTINGS_KEY)
    if (!raw) return defaultSettings
    const parsed = JSON.parse(raw) as Partial<ReaderSettings>
    return {
      theme: parsed.theme === 'sepia' || parsed.theme === 'night' ? parsed.theme : 'paper',
      fontSizeRem:
        typeof parsed.fontSizeRem === 'number' ? Math.min(1.9, Math.max(0.72, parsed.fontSizeRem)) : defaultSettings.fontSizeRem,
      lineHeight:
        typeof parsed.lineHeight === 'number' ? Math.min(2, Math.max(1.2, parsed.lineHeight)) : defaultSettings.lineHeight,
      sidePaddingRem:
        typeof parsed.sidePaddingRem === 'number' ? Math.min(2.2, Math.max(0.4, parsed.sidePaddingRem)) : defaultSettings.sidePaddingRem,
      pdfZoom:
        typeof parsed.pdfZoom === 'number' ? Math.min(2.3, Math.max(0.8, parsed.pdfZoom)) : defaultSettings.pdfZoom,
      pageView: parsed.pageView === 'spread' ? 'spread' : 'single',
      stylePresetId:
        parsed.stylePresetId === 'quiet'
        || parsed.stylePresetId === 'paper'
        || parsed.stylePresetId === 'bold'
        || parsed.stylePresetId === 'calm'
        || parsed.stylePresetId === 'focus'
          ? parsed.stylePresetId
          : 'original',
    }
  } catch {
    return defaultSettings
  }
}

const detectAssetFormat = (buffer: ArrayBuffer): ReaderAssetFormat => {
  const bytes = new Uint8Array(buffer)
  if (bytes.length >= 5) {
    const pdfMagic =
      bytes[0] === 0x25 && // %
      bytes[1] === 0x50 && // P
      bytes[2] === 0x44 && // D
      bytes[3] === 0x46 && // F
      bytes[4] === 0x2d // -
    if (pdfMagic) return 'PDF'
  }
  if (bytes.length >= 2) {
    const zipMagic = bytes[0] === 0x50 && bytes[1] === 0x4b // PK
    if (zipMagic) return 'EPUB'
  }
  return ''
}

const formatSavedTime = (iso: string | null) => {
  if (!iso) return 'Not saved yet'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Saved'
  return `Saved ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

const encodePdfRects = (rects: PdfSelectionRect[]) =>
  rects
    .map((rect) =>
      [
        rect.x.toFixed(4),
        rect.y.toFixed(4),
        rect.w.toFixed(4),
        rect.h.toFixed(4),
      ].join(','),
    )
    .join('|')

const decodePdfRects = (value: string): PdfSelectionRect[] => {
  if (!value) return []
  return value
    .split('|')
    .map((segment) => segment.split(',').map(Number))
    .filter((nums) => nums.length === 4 && nums.every((num) => Number.isFinite(num)))
    .map(([x, y, w, h]) => ({ x, y, w, h }))
}

const makePdfSelectionStartRef = (page: number, rects: PdfSelectionRect[]) =>
  `pdfsel:${page}:${encodePdfRects(rects)}`

const parsePdfSelectionStartRef = (startCfi: string): { page: number; rects: PdfSelectionRect[] } | null => {
  if (!startCfi.startsWith('pdfsel:')) return null
  const match = /^pdfsel:(\d+):(.*)$/.exec(startCfi)
  if (!match) return null
  const page = Number(match[1])
  if (!Number.isFinite(page) || page < 1) return null
  const rects = decodePdfRects(match[2])
  if (rects.length === 0) return null
  return { page, rects }
}

const getHighlightSwatch = (style: HighlightStyle) => {
  switch (style) {
    case 'green':
      return '#86efac'
    case 'pink':
      return '#f9a8d4'
    case 'blue':
      return '#93c5fd'
    case 'underline':
      return '#f59e0b'
    case 'yellow':
    default:
      return '#fde047'
  }
}

const canvasLooksBlank = (canvas: HTMLCanvasElement | null) => {
  if (!canvas) return true
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx || canvas.width < 2 || canvas.height < 2) return true

  const sampleWidth = Math.min(canvas.width, 360)
  const sampleHeight = Math.min(canvas.height, 360)
  const sx = Math.floor((canvas.width - sampleWidth) / 2)
  const sy = Math.floor((canvas.height - sampleHeight) / 2)
  const pixels = ctx.getImageData(sx, sy, sampleWidth, sampleHeight).data

  let nonWhite = 0
  for (let i = 0; i < pixels.length; i += 32) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    const a = pixels[i + 3]
    if (a > 10 && (r < 245 || g < 245 || b < 245)) {
      nonWhite += 1
      if (nonWhite > 30) return false
    }
  }
  return true
}

const BookReaderPage = () => {
  const { id: bookId = '' } = useParams()
  const { data: openData, isLoading: isOpenLoading } = useOpenEbook(bookId, !!bookId)
  const { data: ebookState, isLoading: isStateLoading } = useEbookState(bookId, !!bookId)

  const updateProgress = useUpdateEbookProgress()
  const createBookmark = useCreateEbookBookmark()
  const deleteBookmark = useDeleteEbookBookmark()
  const createNote = useCreateEbookNote()
  const deleteNote = useDeleteEbookNote()
  const createHighlight = useCreateEbookHighlight()

  const [pageInput, setPageInput] = useState('1')
  const [noteInput, setNoteInput] = useState('')
  const [feedback, setFeedback] = useState('')
  const [epubError, setEpubError] = useState('')
  const [pdfError, setPdfError] = useState('')
  const [isTurningPage, setIsTurningPage] = useState(false)
  const [isEpubReady, setIsEpubReady] = useState(false)
  const [isPdfReady, setIsPdfReady] = useState(false)
  const [pdfCanvasReady, setPdfCanvasReady] = useState(false)
  const [epubContainerReady, setEpubContainerReady] = useState(false)
  const [pdfPageCount, setPdfPageCount] = useState(0)
  const [pdfPageNumber, setPdfPageNumber] = useState(1)
  const [pdfUseNativeViewer, setPdfUseNativeViewer] = useState(false)
  const [pdfObjectUrl, setPdfObjectUrl] = useState('')
  const [settings, setSettings] = useState<ReaderSettings>(defaultSettings)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isTocOpen, setIsTocOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [helpPanelMode, setHelpPanelMode] = useState<'notes' | 'highlights'>('notes')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [tocSearch, setTocSearch] = useState('')
  const [tocEntries, setTocEntries] = useState<TocEntry[]>([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchingText, setIsSearchingText] = useState(false)
  const [searchResults, setSearchResults] = useState<EpubSearchResult[]>([])
  const [bookmarkItems, setBookmarkItems] = useState<EbookState['bookmarks']>([])
  const [dictionaryWord, setDictionaryWord] = useState('')
  const [dictionaryDefinition, setDictionaryDefinition] = useState('')
  const [dictionaryPhonetic, setDictionaryPhonetic] = useState('')
  const [dictionaryAudioUrl, setDictionaryAudioUrl] = useState('')
  const [isDictionaryLoading, setIsDictionaryLoading] = useState(false)
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false)
  const [speechRate, setSpeechRate] = useState(1)
  const [selectedVoiceUri, setSelectedVoiceUri] = useState('')
  const [availableVoices, setAvailableVoices] = useState<any[]>([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [scrubValue, setScrubValue] = useState(0)
  const [highlightColor, setHighlightColor] = useState<HighlightStyle>('yellow')
  const [epubSelectedHighlight, setEpubSelectedHighlight] = useState<{ cfiRange: string; text: string } | null>(null)
  const [flipDirection, setFlipDirection] = useState<'prev' | 'next' | null>(null)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [formatOverride, setFormatOverride] = useState<ReaderAssetFormat>('')
  const [pdfSelectedText, setPdfSelectedText] = useState('')
  const [pdfSelectedRects, setPdfSelectedRects] = useState<PdfSelectionRect[]>([])
  const [pdfSelectedPage, setPdfSelectedPage] = useState<number | null>(null)
  const [epubSelectionActionAnchor, setEpubSelectionActionAnchor] = useState<EpubSelectionActionAnchor | null>(null)

  const readerShellRef = useRef<HTMLDivElement | null>(null)
  const epubContainerRef = useRef<HTMLDivElement | null>(null)
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const pdfCanvasSecondaryRef = useRef<HTMLCanvasElement | null>(null)
  const pdfTextLayerRef = useRef<HTMLDivElement | null>(null)
  const pdfTextLayerSecondaryRef = useRef<HTMLDivElement | null>(null)
  const pdfViewportRef = useRef<HTMLDivElement | null>(null)
  const renditionRef = useRef<any>(null)
  const bookRef = useRef<any>(null)
  const pdfDocRef = useRef<any>(null)
  const pdfRenderTaskPrimaryRef = useRef<any>(null)
  const pdfRenderTaskSecondaryRef = useRef<any>(null)
  const lastRelocationSyncRef = useRef<{ cfi: string; at: number }>({ cfi: '', at: 0 })
  const wheelLockUntilRef = useRef(0)
  const initialCfiRef = useRef<string | undefined>(undefined)
  const pageInputRef = useRef(pageInput)
  const appliedHighlightsRef = useRef(new Set<string>())
  const latestCfiRef = useRef<string | undefined>(undefined)
  const latestPercentRef = useRef<number | undefined>(undefined)
  const latestPageRef = useRef<number>(1)
  const totalPagesRef = useRef<number | null>(null)
  const highlightColorRef = useRef(highlightColor)
  const createHighlightRef = useRef(createHighlight)
  const applyEpubTypographyRef = useRef<(rendition: any) => void>(() => undefined)
  const queueProgressSaveRef = useRef<((job: SaveJob) => Promise<void>) | null>(null)
  const saveInFlightRef = useRef(false)
  const pendingSaveRef = useRef<SaveJob | null>(null)
  const turnFallbackTimerRef = useRef<number | null>(null)
  const lastPositionRef = useRef<ReaderLastPosition | null>(null)
  const resolvedProgressConflictRef = useRef(false)
  const dictionaryLookupTokenRef = useRef(0)
  const dictionaryAudioRef = useRef<HTMLAudioElement | null>(null)
  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)
  const touchStartAtRef = useRef<number>(0)
  const flipTimerRef = useRef<number | null>(null)
  const readerStageRef = useRef<HTMLDivElement | null>(null)
  const toolbarAreaRef = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const selectionActionRef = useRef<HTMLDivElement | null>(null)
  const pdfObjectUrlRef = useRef<string>('')
  const suppressSelectionDismissUntilRef = useRef(0)

  const currentPage = ebookState?.progress?.page ?? openData?.progress?.page ?? 1
  const totalPages = ebookState?.book?.totalPages ?? openData?.totalPages ?? null
  const progressPercent = ebookState?.progress?.percent ?? openData?.progress?.percent ?? 0

  const showMessage = (message: string) => {
    setFeedback(message)
    window.setTimeout(() => setFeedback(''), 2400)
  }

  const closeReaderPanels = useCallback(() => {
    setIsTocOpen(false)
    setIsSearchOpen(false)
    setIsSettingsOpen(false)
    setIsHelpOpen(false)
  }, [])

  const toggleReaderPanel = useCallback((panel: 'toc' | 'search' | 'settings' | 'notes' | 'highlights') => {
    setEpubSelectionActionAnchor(null)
    const wantsHelpPanel = panel === 'notes' || panel === 'highlights'
    const nextHelpMode = panel === 'highlights' ? 'highlights' : 'notes'
    const shouldToggleOffHelp = wantsHelpPanel && isHelpOpen && helpPanelMode === nextHelpMode
    const next = {
      toc: panel === 'toc' ? !isTocOpen : false,
      search: panel === 'search' ? !isSearchOpen : false,
      settings: panel === 'settings' ? !isSettingsOpen : false,
      notes: wantsHelpPanel ? !shouldToggleOffHelp : false,
    }
    if (wantsHelpPanel) {
      setHelpPanelMode(nextHelpMode)
    }
    setIsTocOpen(next.toc)
    setIsSearchOpen(next.search)
    setIsSettingsOpen(next.settings)
    setIsHelpOpen(next.notes)
  }, [helpPanelMode, isHelpOpen, isSearchOpen, isSettingsOpen, isTocOpen])

  const applyReaderPreset = useCallback((presetId: (typeof READER_STYLE_PRESETS)[number]['id']) => {
    setSettings((prev) => ({
      ...prev,
      stylePresetId: presetId,
    }))
  }, [])

  const activePresetId = settings.stylePresetId

  const setPdfCanvas = useCallback((node: HTMLCanvasElement | null) => {
    pdfCanvasRef.current = node
    setPdfCanvasReady(Boolean(node))
  }, [])

  const setPdfCanvasSecondary = useCallback((node: HTMLCanvasElement | null) => {
    pdfCanvasSecondaryRef.current = node
  }, [])

  const setPdfTextLayer = useCallback((node: HTMLDivElement | null) => {
    pdfTextLayerRef.current = node
  }, [])

  const setPdfTextLayerSecondary = useCallback((node: HTMLDivElement | null) => {
    pdfTextLayerSecondaryRef.current = node
  }, [])

  const setEpubContainer = useCallback((node: HTMLDivElement | null) => {
    epubContainerRef.current = node
    setEpubContainerReady(Boolean(node))
  }, [])

  const resolvedAssetUrl = useMemo(() => {
    if (!openData?.contentUrl) return ''
    if (openData.contentUrl.startsWith('http')) return openData.contentUrl
    return `${API_BASE_URL}${openData.contentUrl}`
  }, [openData?.contentUrl])

  const ebookFormat = (openData?.ebookFormat ?? '').trim().toUpperCase()
  const inferredFormat = useMemo(() => {
    if (formatOverride) return formatOverride
    if (ebookFormat) return ebookFormat
    const lowerUrl = resolvedAssetUrl.toLowerCase()
    if (lowerUrl.endsWith('.epub')) return 'EPUB'
    if (lowerUrl.endsWith('.pdf')) return 'PDF'
    return ''
  }, [ebookFormat, formatOverride, resolvedAssetUrl])

  useEffect(() => {
    setFormatOverride('')
  }, [bookId, openData?.ebookFormat, openData?.contentUrl])

  useEffect(() => {
    return () => {
      if (pdfObjectUrlRef.current) {
        URL.revokeObjectURL(pdfObjectUrlRef.current)
        pdfObjectUrlRef.current = ''
      }
    }
  }, [])

  const flattenedToc = useMemo(() => flattenToc(tocEntries), [tocEntries])
  const filteredToc = useMemo(() => {
    const query = tocSearch.trim().toLowerCase()
    if (!query) return flattenedToc
    return flattenedToc.filter((item) => item.label?.toLowerCase().includes(query))
  }, [flattenedToc, tocSearch])

  const applyEpubTheme = useCallback((rendition: any) => {
    const preset = READER_STYLE_PRESETS.find((item) => item.id === settings.stylePresetId) ?? READER_STYLE_PRESETS[0]
    const palette =
      settings.theme === 'night'
        ? { bg: '#111827', fg: '#e5e7eb' }
        : settings.theme === 'sepia'
          ? { bg: '#f6f0df', fg: '#3f2f1f' }
          : { bg: '#fffdf7', fg: '#1f2937' }

    rendition.themes.default({
      body: {
        'line-height': String(settings.lineHeight),
        'font-size': `${settings.fontSizeRem}rem`,
        'padding-top': '1.2rem',
        'padding-bottom': '1.2rem',
        'padding-left': `${settings.sidePaddingRem}rem`,
        'padding-right': `${settings.sidePaddingRem}rem`,
        color: palette.fg,
        'background-color': palette.bg,
        'font-family': preset.fontFamily,
        'font-weight': preset.fontWeight,
        'letter-spacing': preset.letterSpacing,
      },
      p: {
        'margin-top': '0.9rem',
        'margin-bottom': '0.9rem',
      },
      h1: { color: palette.fg },
      h2: { color: palette.fg },
      h3: { color: palette.fg },
      a: {
        color: settings.theme === 'night' ? '#7dd3fc' : '#2563eb',
      },
    })
    rendition.themes.fontSize?.(`${Math.round(settings.fontSizeRem * 100)}%`)
  }, [settings])

  const applyEpubTypographyToRenderedContents = useCallback((rendition: any) => {
    const preset = READER_STYLE_PRESETS.find((item) => item.id === settings.stylePresetId) ?? READER_STYLE_PRESETS[0]
    const sizePercent = `${Math.round(settings.fontSizeRem * 100)}%`
    const lineHeight = String(settings.lineHeight)
    const contents = typeof rendition?.getContents === 'function' ? rendition.getContents() : []
    for (const content of contents ?? []) {
      const doc = content?.document as Document | undefined
      if (!doc) continue
      doc.documentElement.style.setProperty('font-size', sizePercent, 'important')
      doc.body?.style.setProperty('font-size', sizePercent, 'important')
      doc.body?.style.setProperty('line-height', lineHeight, 'important')
      doc.body?.style.setProperty('padding-top', '1.2rem', 'important')
      doc.body?.style.setProperty('padding-bottom', '1.2rem', 'important')
      doc.body?.style.setProperty('font-family', preset.fontFamily, 'important')
      doc.body?.style.setProperty('font-weight', preset.fontWeight, 'important')
      doc.body?.style.setProperty('letter-spacing', preset.letterSpacing, 'important')
    }
  }, [settings.fontSizeRem, settings.lineHeight, settings.stylePresetId])

  useEffect(() => {
    applyEpubTypographyRef.current = applyEpubTypographyToRenderedContents
  }, [applyEpubTypographyToRenderedContents])

  const queueProgressSave = useCallback(async (job: SaveJob) => {
    pendingSaveRef.current = job
    if (saveInFlightRef.current) return

    saveInFlightRef.current = true
    while (pendingSaveRef.current) {
      const next = pendingSaveRef.current
      pendingSaveRef.current = null
      setSaveState('saving')
      try {
        let lastError: unknown = null
        let success = false
        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            await updateProgress.mutateAsync(next.payload)
            success = true
            break
          } catch (error) {
            lastError = error
            if (attempt < 2) {
              await new Promise((resolve) => window.setTimeout(resolve, 300 * (attempt + 1)))
            }
          }
        }
        if (!success) {
          throw lastError ?? new Error('Save failed')
        }
        setSaveState('idle')
        setLastSavedAt(new Date().toISOString())
        if (!next.silent) {
          showMessage('Progress saved.')
        }
      } catch (error) {
        setSaveState('error')
        if (!next.silent) {
          showMessage(getErrorMessage(error))
        }
      }
    }
    saveInFlightRef.current = false
  }, [updateProgress])

  const normalizePdfPageForView = useCallback((page: number) => {
    const safe = Math.max(1, Math.floor(page))
    if (settings.pageView !== 'spread') return safe
    return safe % 2 === 0 ? Math.max(1, safe - 1) : safe
  }, [settings.pageView])

  const triggerFlip = useCallback((direction: 'prev' | 'next') => {
    setFlipDirection(direction)
    if (flipTimerRef.current) {
      window.clearTimeout(flipTimerRef.current)
    }
    flipTimerRef.current = window.setTimeout(() => {
      setFlipDirection(null)
      flipTimerRef.current = null
    }, 320)
  }, [])

  const renderPdfPage = useCallback(async (pageNumber: number) => {
    if (!pdfDocRef.current || !pdfCanvasRef.current) return
    const total = pdfDocRef.current.numPages || 0
    const leftPage = Math.min(Math.max(1, pageNumber), Math.max(1, total))
    const rightPage = leftPage + 1

    const renderToCanvas = async (
      pageToRender: number,
      canvas: HTMLCanvasElement,
      taskRef: { current: any },
    ) => {
      const page = await pdfDocRef.current.getPage(pageToRender)
      const baseViewport = page.getViewport({ scale: 1 })
      const containerWidth = pdfViewportRef.current?.clientWidth ?? 0
      const availableWidth = settings.pageView === 'spread'
        ? Math.max(220, (containerWidth - 56) / 2)
        : Math.max(220, containerWidth - 36)
      const fitScale = availableWidth > 0 ? availableWidth / baseViewport.width : 1
      const effectiveScale = Math.max(settings.pdfZoom, fitScale)
      const viewport = page.getViewport({ scale: effectiveScale })
      const context = canvas.getContext('2d')
      if (!context) return

      canvas.height = viewport.height
      canvas.width = viewport.width
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`

      taskRef.current?.cancel?.()
      taskRef.current = page.render({ canvasContext: context, viewport })
      await taskRef.current.promise

      const renderTextLayer = async (layerNode: HTMLDivElement | null) => {
        if (!layerNode) return
        layerNode.innerHTML = ''
        layerNode.style.width = `${viewport.width}px`
        layerNode.style.height = `${viewport.height}px`

        try {
          const textContent = await page.getTextContent()
          if (typeof window.pdfjsLib?.renderTextLayer === 'function') {
            const task = window.pdfjsLib.renderTextLayer({
              textContentSource: textContent,
              container: layerNode,
              viewport,
              textDivs: [],
            })
            if (task?.promise) {
              await task.promise
            } else if (typeof task?.then === 'function') {
              await task
            }
          }
        } catch {
          // Selection layer is best-effort for PDFs; rendering can continue without it.
        }
      }

      await renderTextLayer(
        canvas === pdfCanvasRef.current ? pdfTextLayerRef.current : pdfTextLayerSecondaryRef.current,
      )
    }

    await renderToCanvas(leftPage, pdfCanvasRef.current, pdfRenderTaskPrimaryRef)

    const shouldRenderSpread = settings.pageView === 'spread'
    const secondaryCanvas = pdfCanvasSecondaryRef.current
    if (shouldRenderSpread && secondaryCanvas && rightPage <= total) {
      await renderToCanvas(rightPage, secondaryCanvas, pdfRenderTaskSecondaryRef)
    } else if (secondaryCanvas) {
      const context = secondaryCanvas.getContext('2d')
      if (context) {
        context.clearRect(0, 0, secondaryCanvas.width, secondaryCanvas.height)
      }
      secondaryCanvas.width = 1
      secondaryCanvas.height = 1
      secondaryCanvas.style.width = '0px'
      secondaryCanvas.style.height = '0px'
      if (pdfTextLayerSecondaryRef.current) {
        pdfTextLayerSecondaryRef.current.innerHTML = ''
        pdfTextLayerSecondaryRef.current.style.width = '0px'
        pdfTextLayerSecondaryRef.current.style.height = '0px'
      }
      pdfRenderTaskSecondaryRef.current?.cancel?.()
      pdfRenderTaskSecondaryRef.current = null
    }
  }, [settings.pageView, settings.pdfZoom])

  const goToPrevPdfPage = useCallback(async () => {
    if (!isPdfReady || !pdfDocRef.current) return
    const step = settings.pageView === 'spread' ? 2 : 1
    if (pdfPageNumber <= 1) {
      showMessage('You are at the beginning.')
      return
    }
    const nextPage = normalizePdfPageForView(Math.max(1, pdfPageNumber - step))
    triggerFlip('prev')
    setPdfPageNumber(nextPage)
    latestPageRef.current = nextPage
    writeLastPosition(bookId, {
      page: nextPage,
      percent: pdfPageCount ? Number(((nextPage / pdfPageCount) * 100).toFixed(2)) : undefined,
    })
    await renderPdfPage(nextPage)
    await queueProgressSave({
      payload: {
        bookId,
        page: nextPage,
        percent: pdfPageCount ? Number(((nextPage / pdfPageCount) * 100).toFixed(2)) : undefined,
      },
      silent: true,
    })
  }, [bookId, isPdfReady, normalizePdfPageForView, pdfPageCount, pdfPageNumber, queueProgressSave, renderPdfPage, settings.pageView, triggerFlip])

  const goToNextPdfPage = useCallback(async () => {
    if (!isPdfReady || !pdfDocRef.current) return
    const step = settings.pageView === 'spread' ? 2 : 1
    if (pdfPageCount && pdfPageNumber >= pdfPageCount) {
      showMessage('You reached the end.')
      return
    }
    const nextPage = normalizePdfPageForView(Math.min(pdfPageCount || Number.MAX_SAFE_INTEGER, pdfPageNumber + step))
    triggerFlip('next')
    setPdfPageNumber(nextPage)
    latestPageRef.current = nextPage
    writeLastPosition(bookId, {
      page: nextPage,
      percent: pdfPageCount ? Number(((nextPage / pdfPageCount) * 100).toFixed(2)) : undefined,
    })
    await renderPdfPage(nextPage)
    await queueProgressSave({
      payload: {
        bookId,
        page: nextPage,
        percent: pdfPageCount ? Number(((nextPage / pdfPageCount) * 100).toFixed(2)) : undefined,
      },
      silent: true,
    })
  }, [bookId, isPdfReady, normalizePdfPageForView, pdfPageCount, pdfPageNumber, queueProgressSave, renderPdfPage, settings.pageView, triggerFlip])

  const capturePdfSelection = useCallback(() => {
    if (inferredFormat !== 'PDF') return
    const selection = window.getSelection?.()
    if (!selection || selection.rangeCount === 0) {
      setPdfSelectedText('')
      setPdfSelectedRects([])
      setPdfSelectedPage(null)
      return
    }

    const text = selection.toString().trim()
    if (!text) {
      setPdfSelectedText('')
      setPdfSelectedRects([])
      setPdfSelectedPage(null)
      return
    }

    const range = selection.getRangeAt(0)
    const primaryLayer = pdfTextLayerRef.current
    const secondaryLayer = pdfTextLayerSecondaryRef.current
    const leftPage = Math.max(1, pdfPageNumber)
    const rightPage = leftPage + 1

    const resolveLayer = () => {
      if (primaryLayer && primaryLayer.contains(range.commonAncestorContainer)) {
        return { layer: primaryLayer, page: leftPage }
      }
      if (secondaryLayer && secondaryLayer.contains(range.commonAncestorContainer)) {
        return { layer: secondaryLayer, page: rightPage }
      }
      return null
    }

    const target = resolveLayer()
    if (!target) return

    const layerRect = target.layer.getBoundingClientRect()
    if (layerRect.width <= 0 || layerRect.height <= 0) return

    const rects = Array.from(range.getClientRects())
      .map((rect) => {
        const left = Math.max(rect.left, layerRect.left)
        const top = Math.max(rect.top, layerRect.top)
        const right = Math.min(rect.right, layerRect.right)
        const bottom = Math.min(rect.bottom, layerRect.bottom)
        const w = right - left
        const h = bottom - top
        if (w < 2 || h < 2) return null
        return {
          x: Number(((left - layerRect.left) / layerRect.width).toFixed(4)),
          y: Number(((top - layerRect.top) / layerRect.height).toFixed(4)),
          w: Number((w / layerRect.width).toFixed(4)),
          h: Number((h / layerRect.height).toFixed(4)),
        } satisfies PdfSelectionRect
      })
      .filter((item): item is PdfSelectionRect => Boolean(item))

    if (rects.length === 0) return
    setPdfSelectedText(text.slice(0, 400))
    setPdfSelectedRects(rects)
    setPdfSelectedPage(target.page)
  }, [inferredFormat, pdfPageNumber])

  const runEpubTurn = useCallback(async (direction: 'prev' | 'next') => {
    const rendition = renditionRef.current
    if (!rendition || isTurningPage) {
      showMessage('Reader is still loading. Try again in a moment.')
      return
    }

    if (turnFallbackTimerRef.current) {
      window.clearTimeout(turnFallbackTimerRef.current)
      turnFallbackTimerRef.current = null
    }

    setIsTurningPage(true)
    triggerFlip(direction)
    turnFallbackTimerRef.current = window.setTimeout(() => {
      setIsTurningPage(false)
      turnFallbackTimerRef.current = null
    }, 2500)

    try {
      await Promise.race([
        direction === 'prev' ? rendition.prev() : rendition.next(),
        new Promise((_, reject) =>
          window.setTimeout(() => reject(new Error('EPUB_PAGE_TURN_TIMEOUT')), 2200),
        ),
      ])
    } catch {
      // Fallback for EPUB files where rendition.next/prev hangs:
      // advance by percentage and render by CFI directly.
      const book = bookRef.current
      const currentCfi = latestCfiRef.current
      const percentageFromCfi = book?.locations?.percentageFromCfi
      const cfiFromPercentage = book?.locations?.cfiFromPercentage || book?.locations?.percentageToCfi

      if (
        currentCfi
        && typeof percentageFromCfi === 'function'
        && typeof cfiFromPercentage === 'function'
      ) {
        try {
          const raw = Number(percentageFromCfi(currentCfi))
          const estimatedStep = totalPages ? 1 / Math.max(1, totalPages) : 0.015
          const delta = Math.max(0.0035, Math.min(0.03, estimatedStep * 1.4))
          const nextRaw = Math.max(
            0,
            Math.min(1, direction === 'next' ? raw + delta : raw - delta),
          )
          const fallbackCfi = cfiFromPercentage(nextRaw)
          await rendition.display(fallbackCfi)
          return
        } catch {
          // ignore and show user-friendly edge message below
        }
      }

      showMessage(direction === 'prev' ? 'You are at the beginning.' : 'You reached the end.')
    } finally {
      if (turnFallbackTimerRef.current) {
        window.clearTimeout(turnFallbackTimerRef.current)
        turnFallbackTimerRef.current = null
      }
      setIsTurningPage(false)
    }
  }, [isTurningPage, totalPages, triggerFlip])

  const goToPrevPage = useCallback(async () => {
    await runEpubTurn('prev')
  }, [runEpubTurn])

  const goToNextPage = useCallback(async () => {
    await runEpubTurn('next')
  }, [runEpubTurn])

  const jumpToEpubToc = useCallback(async (href?: string) => {
    if (!href || !renditionRef.current) return
    try {
      await renditionRef.current.display(href)
      setIsTocOpen(false)
    } catch {
      showMessage('Unable to open that chapter.')
    }
  }, [])

  const runEpubTextSearch = useCallback(async (query: string) => {
    const trimmed = query.trim()
    if (!trimmed || inferredFormat !== 'EPUB' || !bookRef.current) {
      setSearchResults([])
      return
    }

    const book = bookRef.current
    const toPageFromCfi = (cfi: string): number | null => {
      const total = totalPagesRef.current
      if (!total || typeof book?.locations?.percentageFromCfi !== 'function') return null
      try {
        const raw = Number(book.locations.percentageFromCfi(cfi))
        if (!Number.isFinite(raw)) return null
        const normalized = Math.min(1, Math.max(0, raw))
        return Math.min(total, Math.max(1, Math.floor(normalized * total) + 1))
      } catch {
        return null
      }
    }
    const spineItems = (book.spine?.spineItems ?? []) as any[]
    if (!spineItems.length) {
      setSearchResults([])
      return
    }

    setIsSearchingText(true)
    try {
      const results: EpubSearchResult[] = []
      for (const item of spineItems) {
        if (results.length >= 80) break
        try {
          const section = typeof book.spine?.get === 'function'
            ? book.spine.get(item.index)
            : item
          if (!section) continue
          await section.load(book.load?.bind(book))
          const matches = typeof section.find === 'function' ? section.find(trimmed) : []
          for (const match of matches ?? []) {
            const cfi = match?.cfi as string | undefined
            if (!cfi) continue
            results.push({
              cfi,
              excerpt: (match?.excerpt as string | undefined)?.trim() || 'Match',
              page: toPageFromCfi(cfi),
            })
            if (results.length >= 80) break
          }
          section.unload?.()
        } catch {
          // Ignore malformed sections; continue searching remaining spine.
        }
      }
      setSearchResults(results)
    } finally {
      setIsSearchingText(false)
    }
  }, [inferredFormat])

  const jumpToSearchResult = useCallback(async (result: EpubSearchResult) => {
    if (!renditionRef.current) return
    try {
      await renditionRef.current.display(result.cfi)
      setIsSearchOpen(false)
    } catch {
      showMessage('Unable to open that result.')
    }
  }, [])

  const lookupDictionary = useCallback(async (rawText: string) => {
    const cleaned = rawText.trim().toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, '')
    if (!cleaned) return
    const lookupToken = dictionaryLookupTokenRef.current + 1
    dictionaryLookupTokenRef.current = lookupToken
    setDictionaryWord(cleaned)
    setDictionaryDefinition('')
    setDictionaryPhonetic('')
    setDictionaryAudioUrl('')
    setIsDictionaryOpen(true)
    setIsDictionaryLoading(true)

    const fallback: DictionaryLookup = {
      definition:
        QUICK_DICTIONARY[cleaned]
        || `No built-in definition for "${cleaned}". Tip: long-press and search web/dictionary for full context.`,
      source: 'fallback',
    }

    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleaned)}`,
      )
      if (!response.ok) {
        throw new Error('Dictionary request failed')
      }
      const payload = await response.json()
      const first = Array.isArray(payload) ? payload[0] : null
      const phonetics = Array.isArray(first?.phonetics) ? first.phonetics : []
      const meanings = Array.isArray(first?.meanings) ? first.meanings : []
      const firstMeaning = meanings[0]
      const definitions = Array.isArray(firstMeaning?.definitions)
        ? firstMeaning.definitions
        : []
      const firstDefinition = definitions[0]
      const dictionaryData: DictionaryLookup = {
        definition: firstDefinition?.definition || fallback.definition,
        phonetic:
          first?.phonetic
          || phonetics.find((item: any) => item?.text)?.text
          || '',
        audioUrl: phonetics.find((item: any) => item?.audio)?.audio || '',
        source: 'online',
      }

      if (dictionaryLookupTokenRef.current !== lookupToken) return
      setDictionaryDefinition(dictionaryData.definition)
      setDictionaryPhonetic(dictionaryData.phonetic || '')
      setDictionaryAudioUrl(dictionaryData.audioUrl || '')
      setIsDictionaryLoading(false)
      return
    } catch {
      if (dictionaryLookupTokenRef.current !== lookupToken) return
      setDictionaryDefinition(fallback.definition)
      setDictionaryPhonetic('')
      setDictionaryAudioUrl('')
      setIsDictionaryLoading(false)
    }
  }, [])

  const playDictionaryAudio = useCallback(() => {
    if (!dictionaryAudioUrl) return
    try {
      dictionaryAudioRef.current?.pause()
      const audio = new Audio(dictionaryAudioUrl)
      dictionaryAudioRef.current = audio
      void audio.play()
    } catch {
      showMessage('Unable to play pronunciation audio.')
    }
  }, [dictionaryAudioUrl])

  const stopReadAloud = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [])

  const speakCurrentEpubView = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      showMessage('Text-to-speech is not supported in this browser.')
      return
    }
    if (inferredFormat !== 'EPUB' || !renditionRef.current) {
      showMessage('Read aloud currently supports EPUB pages.')
      return
    }

    const contents = typeof renditionRef.current.getContents === 'function'
      ? renditionRef.current.getContents()
      : []
    const text = (contents ?? [])
      .map((entry: any) => entry?.document?.body?.innerText || '')
      .join('\n')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 5000)

    if (!text) {
      showMessage('No readable text on this page yet.')
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = speechRate
    if (selectedVoiceUri) {
      const voice = availableVoices.find((item) => item.voiceURI === selectedVoiceUri)
      if (voice) {
        utterance.voice = voice
      }
    }
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }, [availableVoices, inferredFormat, selectedVoiceUri, speechRate])

  const handleReaderTouchStart = useCallback((event: any) => {
    if (event.touches.length !== 1) return
    touchStartXRef.current = event.touches[0].clientX
    touchStartYRef.current = event.touches[0].clientY
    touchStartAtRef.current = Date.now()
  }, [])

  const handleReaderTouchMove = useCallback((event: any) => {
    if (event.touches.length !== 1) return
    const startX = touchStartXRef.current
    const startY = touchStartYRef.current
    if (startX === null || startY === null) return

    const deltaX = event.touches[0].clientX - startX
    const deltaY = event.touches[0].clientY - startY
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 12) {
      event.preventDefault()
    }
  }, [])

  const handleReaderTouchEnd = useCallback(async (event: any) => {
    const startX = touchStartXRef.current
    const startY = touchStartYRef.current
    touchStartXRef.current = null
    touchStartYRef.current = null
    if (startX === null || startY === null) return

    const elapsed = Date.now() - touchStartAtRef.current
    if (elapsed > 800) return

    const activeTouch = event.changedTouches?.[0]
    if (!activeTouch) return

    const deltaX = activeTouch.clientX - startX
    const deltaY = activeTouch.clientY - startY
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY)) return

    if (deltaX < 0) {
      await (inferredFormat === 'PDF' ? goToNextPdfPage() : goToNextPage())
    } else {
      await (inferredFormat === 'PDF' ? goToPrevPdfPage() : goToPrevPage())
    }
  }, [goToNextPage, goToNextPdfPage, goToPrevPage, goToPrevPdfPage, inferredFormat])

  const toggleFullscreen = useCallback(async () => {
    const container = readerStageRef.current ?? readerShellRef.current
    if (!container || typeof document === 'undefined') return
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await container.requestFullscreen()
      }
    } catch {
      showMessage('Fullscreen is not available in this browser.')
    }
  }, [])

  const handleScrubCommit = useCallback(async () => {
    if (inferredFormat === 'PDF') {
      if (!pdfPageCount || !isPdfReady) return
      const target = normalizePdfPageForView(Math.min(pdfPageCount, Math.max(1, Math.round(scrubValue))))
      try {
        triggerFlip(target < pdfPageNumber ? 'prev' : 'next')
        setPdfPageNumber(target)
        latestPageRef.current = target
        writeLastPosition(bookId, {
          page: target,
          percent: Number(((target / pdfPageCount) * 100).toFixed(2)),
        })
        await renderPdfPage(target)
        await queueProgressSave({
          payload: {
            bookId,
            page: target,
            percent: Number(((target / pdfPageCount) * 100).toFixed(2)),
          },
          silent: true,
        })
      } catch {
        showMessage('Unable to jump to that page.')
      }
      return
    }

    if (inferredFormat === 'EPUB' && bookRef.current && renditionRef.current) {
      const rawPercent = Math.min(100, Math.max(0, scrubValue)) / 100
      const percentageToCfi = bookRef.current.locations?.cfiFromPercentage
        || bookRef.current.locations?.percentageToCfi
      if (typeof percentageToCfi !== 'function') {
        showMessage('Reader map is still loading. Try again in a moment.')
        return
      }
      try {
        const cfi = percentageToCfi(rawPercent)
        triggerFlip(rawPercent >= ((latestPercentRef.current ?? 0) / 100) ? 'next' : 'prev')
        await renditionRef.current.display(cfi)
        writeLastPosition(bookId, {
          page: latestPageRef.current,
          locationCfi: cfi,
          percent: Number((rawPercent * 100).toFixed(2)),
        })
      } catch {
        showMessage('Unable to jump to that location.')
      }
    }
  }, [bookId, inferredFormat, isPdfReady, normalizePdfPageForView, pdfPageCount, pdfPageNumber, queueProgressSave, renderPdfPage, scrubValue, triggerFlip])

  const handleAddBookmark = async () => {
    const page = Number(pageInput || currentPage)
    if (Number.isNaN(page) || page < 1) {
      showMessage('Select a valid page first.')
      return
    }

    try {
      const bookmark = await createBookmark.mutateAsync({
        bookId,
        page,
        locationCfi: inferredFormat === 'EPUB' ? latestCfiRef.current : undefined,
        label: `Page ${page}`,
      })
      setBookmarkItems((prev) => [bookmark, ...prev.filter((item) => item.id !== bookmark.id)])
      showMessage('Bookmark saved.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const jumpToBookmark = useCallback(async (bookmark: EbookState['bookmarks'][number]) => {
    const targetPage = Math.max(1, Number(bookmark.page || 1))

    if (inferredFormat === 'PDF') {
      if (!isPdfReady || !pdfDocRef.current) {
        showMessage('Reader is still loading. Try again in a moment.')
        return
      }
      const target = normalizePdfPageForView(targetPage)
      try {
        triggerFlip(target < pdfPageNumber ? 'prev' : 'next')
        setPdfPageNumber(target)
        latestPageRef.current = target
        setPageInput(String(target))
        writeLastPosition(bookId, {
          page: target,
          percent: pdfPageCount ? Number(((target / pdfPageCount) * 100).toFixed(2)) : undefined,
        })
        await renderPdfPage(target)
        await queueProgressSave({
          payload: {
            bookId,
            page: target,
            percent: pdfPageCount ? Number(((target / pdfPageCount) * 100).toFixed(2)) : undefined,
          },
          silent: true,
        })
        closeReaderPanels()
      } catch {
        showMessage('Unable to open bookmark.')
      }
      return
    }

    if (inferredFormat !== 'EPUB' || !renditionRef.current) {
      showMessage('Unable to open bookmark.')
      return
    }

    try {
      const percentageToCfi = bookRef.current?.locations?.cfiFromPercentage
        || bookRef.current?.locations?.percentageToCfi
      let cfi = bookmark.locationCfi || undefined

      if (!cfi && totalPages && typeof percentageToCfi === 'function') {
        const rawPercent = Math.min(1, Math.max(0, (targetPage - 1) / Math.max(1, totalPages)))
        cfi = percentageToCfi(rawPercent)
      }

      if (!cfi) {
        showMessage('Bookmark location is unavailable.')
        return
      }

      triggerFlip(targetPage < latestPageRef.current ? 'prev' : 'next')
      await renditionRef.current.display(cfi)
      setPageInput(String(targetPage))
      writeLastPosition(bookId, {
        page: targetPage,
        locationCfi: cfi,
        percent: totalPages ? Number(((targetPage / totalPages) * 100).toFixed(2)) : undefined,
      })
      await queueProgressSave({
        payload: {
          bookId,
          page: targetPage,
          locationCfi: cfi,
          percent: totalPages ? Number(((targetPage / totalPages) * 100).toFixed(2)) : undefined,
        },
        silent: true,
      })
      closeReaderPanels()
    } catch {
      showMessage('Unable to open bookmark.')
    }
  }, [
    bookId,
    closeReaderPanels,
    inferredFormat,
    isPdfReady,
    normalizePdfPageForView,
    pdfPageCount,
    pdfPageNumber,
    queueProgressSave,
    renderPdfPage,
    totalPages,
    triggerFlip,
  ])

  const handleAddNote = async () => {
    const content = noteInput.trim()
    if (!content) {
      showMessage('Note cannot be empty.')
      return
    }

    const page = Number(pageInput || currentPage)
    try {
      await createNote.mutateAsync({
        bookId,
        page: Number.isNaN(page) ? currentPage : page,
        content,
      })
      setNoteInput('')
      showMessage('Note saved.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const handleAddPdfHighlight = async () => {
    if (inferredFormat !== 'PDF') return
    const page = Math.max(1, (pdfSelectedPage ?? pdfPageNumber ?? 1))
    const hasSelection = pdfSelectedRects.length > 0 && !!pdfSelectedText
    const snippet =
      (hasSelection ? pdfSelectedText : noteInput.trim()).slice(0, 400)
      || `Highlighted page ${page}`
    const startCfi = hasSelection
      ? makePdfSelectionStartRef(page, pdfSelectedRects)
      : `pdf:page:${page}:manual:${Date.now()}`

    try {
      await createHighlight.mutateAsync({
        bookId,
        page,
        startCfi,
        textSnippet: snippet,
        color: highlightColor,
      })
      if (hasSelection) {
        window.getSelection?.()?.removeAllRanges?.()
        setPdfSelectedText('')
        setPdfSelectedRects([])
        setPdfSelectedPage(null)
      }
      showMessage(`Page ${page} highlighted.`)
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const handleAddEpubHighlight = async () => {
    if (inferredFormat !== 'EPUB') return
    if (!epubSelectedHighlight?.cfiRange) {
      showMessage('Select text first, then tap highlight.')
      return
    }

    const page = Number(pageInputRef.current)
    const payloadPage = Number.isNaN(page) ? latestPageRef.current : page
    const swatch = getHighlightSwatch(highlightColor)

    try {
      await createHighlightRef.current.mutateAsync({
        bookId,
        page: payloadPage,
        startCfi: epubSelectedHighlight.cfiRange,
        textSnippet: epubSelectedHighlight.text.slice(0, 400),
        color: highlightColor,
      })

      renditionRef.current?.annotations?.add?.(
        'highlight',
        epubSelectedHighlight.cfiRange,
        {},
        undefined,
        `hl-${Date.now()}`,
        {
          fill: swatch,
          'fill-opacity': highlightColor === 'underline' ? '0.08' : '0.35',
        },
      )

      setEpubSelectedHighlight(null)
      showMessage('Highlight saved.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const handleSelectionDictionaryLookup = useCallback(() => {
    const selectedText = epubSelectedHighlight?.text?.trim() ?? ''
    if (!selectedText) {
      showMessage('Select text first.')
      return
    }
    const firstWord = selectedText.split(/\s+/).find(Boolean) ?? ''
    if (!firstWord) {
      showMessage('Pick a word to lookup.')
      return
    }
    void lookupDictionary(firstWord)
    setEpubSelectionActionAnchor(null)
  }, [epubSelectedHighlight?.text, lookupDictionary])

  const handleSelectionHighlight = useCallback(async () => {
    await handleAddEpubHighlight()
    setEpubSelectionActionAnchor(null)
  }, [handleAddEpubHighlight])

  useEffect(() => {
    setPageInput(String(currentPage))
    latestPageRef.current = currentPage
  }, [currentPage])

  useEffect(() => {
    if (!initialCfiRef.current) {
      initialCfiRef.current = ebookState?.progress?.locationCfi || undefined
    }
    latestCfiRef.current = ebookState?.progress?.locationCfi || undefined
    latestPercentRef.current = ebookState?.progress?.percent
  }, [ebookState?.progress?.locationCfi, ebookState?.progress?.percent])

  useEffect(() => {
    setBookmarkItems(ebookState?.bookmarks ?? [])
  }, [ebookState?.bookmarks])

  useEffect(() => {
    pageInputRef.current = pageInput
  }, [pageInput])

  useEffect(() => {
    setPdfSelectedText('')
    setPdfSelectedRects([])
    setPdfSelectedPage(null)
  }, [pdfPageNumber, settings.pageView])

  useEffect(() => {
    setEpubSelectedHighlight(null)
  }, [inferredFormat])

  useEffect(() => {
    if (inferredFormat !== 'EPUB') {
      setEpubSelectionActionAnchor(null)
      return
    }
    if (!epubSelectedHighlight?.cfiRange) {
      setEpubSelectionActionAnchor(null)
    }
  }, [epubSelectedHighlight?.cfiRange, inferredFormat])

  useEffect(() => {
    totalPagesRef.current = totalPages
  }, [totalPages])

  useEffect(() => {
    highlightColorRef.current = highlightColor
  }, [highlightColor])

  useEffect(() => {
    createHighlightRef.current = createHighlight
  }, [createHighlight])

  useEffect(() => {
    queueProgressSaveRef.current = queueProgressSave
  }, [queueProgressSave])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(getReaderSettingsKey(bookId), JSON.stringify(settings))
  }, [bookId, settings])

  useEffect(() => {
    setSettings(readSettings(bookId))
    const cached = readLastPosition(bookId)
    lastPositionRef.current = cached
    initialCfiRef.current = cached?.locationCfi || undefined
    latestCfiRef.current = cached?.locationCfi || undefined
    if (typeof cached?.page === 'number' && cached.page > 0) {
      latestPageRef.current = cached.page
      setPageInput(String(cached.page))
    } else {
      latestPageRef.current = 1
      setPageInput('1')
    }
    if (typeof cached?.percent === 'number') {
      latestPercentRef.current = cached.percent
    }
  }, [bookId])

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices() || []
      setAvailableVoices(voices)
      if (!selectedVoiceUri && voices.length > 0) {
        setSelectedVoiceUri(voices[0].voiceURI)
      }
    }
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [selectedVoiceUri])

  useEffect(() => {
    const local = lastPositionRef.current
    const serverPage = ebookState?.progress?.page ?? openData?.progress?.page
    if (!local || !serverPage || typeof local.page !== 'number') {
      resolvedProgressConflictRef.current = false
      return
    }
    if (resolvedProgressConflictRef.current) return

    if (local.page > serverPage + 1) {
      resolvedProgressConflictRef.current = true
      void queueProgressSave({
        payload: {
          bookId,
          page: local.page,
          locationCfi: local.locationCfi,
          percent: local.percent,
        },
        silent: true,
      })
      return
    }

    if (serverPage > local.page + 1) {
      const serverPosition = {
        page: serverPage,
        locationCfi: ebookState?.progress?.locationCfi ?? openData?.progress?.locationCfi ?? undefined,
        percent: ebookState?.progress?.percent ?? openData?.progress?.percent ?? undefined,
      }
      writeLastPosition(bookId, serverPosition)
      lastPositionRef.current = serverPosition
      resolvedProgressConflictRef.current = true
    }
  }, [
    bookId,
    ebookState?.progress?.locationCfi,
    ebookState?.progress?.page,
    ebookState?.progress?.percent,
    openData?.progress?.locationCfi,
    openData?.progress?.page,
    openData?.progress?.percent,
    queueProgressSave,
  ])

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  useEffect(() => {
    if (!(isTocOpen || isSearchOpen || isSettingsOpen || isHelpOpen)) return

    const handleOutsideInteraction = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (panelRef.current?.contains(target)) return
      if (toolbarAreaRef.current?.contains(target)) return
      if (selectionActionRef.current?.contains(target)) return
      closeReaderPanels()
      setEpubSelectionActionAnchor(null)
    }

    document.addEventListener('mousedown', handleOutsideInteraction)
    document.addEventListener('touchstart', handleOutsideInteraction)
    return () => {
      document.removeEventListener('mousedown', handleOutsideInteraction)
      document.removeEventListener('touchstart', handleOutsideInteraction)
    }
  }, [closeReaderPanels, isHelpOpen, isSearchOpen, isSettingsOpen, isTocOpen])

  useEffect(() => {
    if (!epubSelectionActionAnchor) return

    const handleOutsideSelectionAction = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (selectionActionRef.current?.contains(target)) return
      setEpubSelectionActionAnchor(null)
    }

    document.addEventListener('mousedown', handleOutsideSelectionAction)
    document.addEventListener('touchstart', handleOutsideSelectionAction)
    return () => {
      document.removeEventListener('mousedown', handleOutsideSelectionAction)
      document.removeEventListener('touchstart', handleOutsideSelectionAction)
    }
  }, [epubSelectionActionAnchor])

  useEffect(() => {
    if (inferredFormat === 'PDF') {
      setScrubValue(pdfPageNumber)
      return
    }
    if (inferredFormat === 'EPUB') {
      setScrubValue(Number(progressPercent.toFixed(0)))
    }
  }, [inferredFormat, pdfPageNumber, progressPercent])

  useEffect(() => {
    if (inferredFormat !== 'PDF') return
    setPdfPageNumber((prev) => {
      const normalized = normalizePdfPageForView(prev)
      if (normalized !== prev) {
        latestPageRef.current = normalized
      }
      return normalized
    })
  }, [inferredFormat, normalizePdfPageForView, settings.pageView])

  useEffect(() => {
    if (inferredFormat !== 'EPUB' || !resolvedAssetUrl || !epubContainerReady) return

    let disposed = false

    const mountEpub = async () => {
      try {
        setEpubError('')
        setIsEpubReady(false)
        setTocEntries([])
        await loadEpubScript()

        if (disposed || !window.ePub || !epubContainerRef.current) return

        const assetResponse = await fetch(resolvedAssetUrl, { credentials: 'include' })
        if (!assetResponse.ok) {
          throw new Error(`Failed to load eBook asset (${assetResponse.status})`)
        }

        const epubBuffer = await assetResponse.arrayBuffer()
        const detectedFormat = detectAssetFormat(epubBuffer)
        if (detectedFormat === 'PDF') {
          setFormatOverride('PDF')
          showMessage('Detected PDF file. Opening in PDF reader.')
          return
        }
        const book = window.ePub(epubBuffer)
        bookRef.current = book

        await book.ready

        const navigationToc = (book.navigation?.toc ?? []) as TocEntry[]
        setTocEntries(Array.isArray(navigationToc) ? navigationToc : [])

        const rendition = book.renderTo(epubContainerRef.current, {
          width: '100%',
          height: '100%',
          spread: settings.pageView === 'spread' ? 'auto' : 'none',
          flow: 'paginated',
          allowScriptedContent: true,
        })

        renditionRef.current = rendition
        setIsEpubReady(true)
        const syncRenderedTypography = () => applyEpubTypographyRef.current(rendition)
        rendition.on('rendered', syncRenderedTypography)
        rendition.on('click', () => {
          window.setTimeout(() => {
            const hasActiveSelection = (rendition.getContents?.() ?? []).some((entry: any) => {
              const selection = entry?.window?.getSelection?.()
              if (!selection) return false
              return !selection.isCollapsed && selection.toString().trim().length > 0
            })
            if (hasActiveSelection) return
            if (Date.now() < suppressSelectionDismissUntilRef.current) return
            setEpubSelectionActionAnchor(null)
          }, 0)
        })

        await rendition.display(initialCfiRef.current)
        syncRenderedTypography()

        try {
          await book.locations.generate(1200)
        } catch (error) {
          console.warn('[EPUB] Could not generate location map:', error)
        }

        rendition.on('selected', (cfiRange: string, contents: any) => {
          const selectedText = contents?.window?.getSelection?.()?.toString()?.trim() ?? ''
          if (!selectedText) return

          const stageRect = readerStageRef.current?.getBoundingClientRect()
          let anchorX = 160
          let anchorY = 84
          if (stageRect) {
            try {
              const selection = contents?.window?.getSelection?.()
              const range = selection?.rangeCount ? selection.getRangeAt(0) : null
              const rect = range?.getBoundingClientRect?.()
              const frame = contents?.document?.defaultView?.frameElement as HTMLElement | null
              const frameRect = frame?.getBoundingClientRect?.()
              if (rect) {
                const left = frameRect ? frameRect.left + rect.left : rect.left
                const top = frameRect ? frameRect.top + rect.top : rect.top
                anchorX = left - stageRect.left + (rect.width / 2)
                anchorY = top - stageRect.top - 12
              }
            } catch {
              // Selection anchor is best-effort; fallback keeps actions available.
            }
            anchorX = Math.max(74, Math.min(stageRect.width - 74, anchorX))
            anchorY = Math.max(72, Math.min(stageRect.height - 48, anchorY))
          }

          setEpubSelectedHighlight({
            cfiRange,
            text: selectedText.slice(0, 400),
          })
          setEpubSelectionActionAnchor({ x: anchorX, y: anchorY })
          suppressSelectionDismissUntilRef.current = Date.now() + 1200
        })

        rendition.on('relocated', (location: any) => {
          const cfi = location?.start?.cfi as string | undefined
          if (!cfi) return

          const now = Date.now()
          const last = lastRelocationSyncRef.current
          if ((last.cfi === cfi && now - last.at < 4000) || now - last.at < 3000) {
            return
          }
          lastRelocationSyncRef.current = { cfi, at: now }

          let percent: number | undefined
          let rawPercent: number | undefined
          if (typeof book.locations?.percentageFromCfi === 'function') {
            try {
              const raw = Number(book.locations.percentageFromCfi(cfi))
              if (Number.isFinite(raw) && raw >= 0) {
                rawPercent = Math.min(1, Math.max(0, raw))
                percent = Number((raw * 100).toFixed(2))
              }
            } catch {
              rawPercent = undefined
              percent = undefined
            }
          }

          const total = totalPagesRef.current
          const page = total && typeof rawPercent === 'number'
            ? Math.min(total, Math.max(1, Math.floor(rawPercent * total) + 1))
            : undefined

          latestCfiRef.current = cfi
          latestPercentRef.current = percent

          if (typeof page === 'number') {
            latestPageRef.current = page
            setPageInput(String(page))
          }
          writeLastPosition(bookId, {
            page: typeof page === 'number' ? page : latestPageRef.current,
            locationCfi: cfi,
            percent,
          })

          const queueSave = queueProgressSaveRef.current
          if (!queueSave) return
          void queueSave({
            payload: {
              bookId,
              page,
              locationCfi: cfi,
              percent,
            },
            silent: true,
          })
        })
      } catch (error) {
        setEpubError(getErrorMessage(error))
        setIsEpubReady(false)
      }
    }

    appliedHighlightsRef.current = new Set()
    void mountEpub()

    return () => {
      disposed = true
      try {
        renditionRef.current?.destroy?.()
      } catch {
        // ignore teardown issues
      }
      renditionRef.current = null
      bookRef.current = null
      setIsEpubReady(false)
      setTocEntries([])
    }
  }, [bookId, epubContainerReady, inferredFormat, lookupDictionary, resolvedAssetUrl])

  useEffect(() => {
    if (inferredFormat !== 'PDF' || !resolvedAssetUrl || !pdfCanvasReady) return

    let disposed = false

    const mountPdf = async () => {
      try {
        setPdfError('')
        setIsPdfReady(false)
        setPdfUseNativeViewer(false)
        setPdfPageNumber(1)
        await loadPdfScript()

        if (!window.pdfjsLib) {
          throw new Error('PDF renderer unavailable')
        }
        if (disposed || !pdfCanvasRef.current) return

        const assetResponse = await fetch(resolvedAssetUrl, { credentials: 'include' })
        if (!assetResponse.ok) {
          throw new Error(`Failed to load PDF asset (${assetResponse.status})`)
        }

        const pdfBuffer = await assetResponse.arrayBuffer()
        const nextObjectUrl = URL.createObjectURL(new Blob([pdfBuffer], { type: 'application/pdf' }))
        if (pdfObjectUrlRef.current) {
          URL.revokeObjectURL(pdfObjectUrlRef.current)
        }
        pdfObjectUrlRef.current = nextObjectUrl
        setPdfObjectUrl(nextObjectUrl)
        const detectedFormat = detectAssetFormat(pdfBuffer)
        if (detectedFormat === 'EPUB') {
          setFormatOverride('EPUB')
          showMessage('Detected EPUB file. Opening in EPUB reader.')
          return
        }
        const loadingTask = window.pdfjsLib.getDocument({
          data: pdfBuffer,
          cMapUrl: PDFJS_CMAP_URL,
          cMapPacked: true,
          standardFontDataUrl: PDFJS_STANDARD_FONTS_URL,
          useSystemFonts: true,
        })
        const pdfDoc = await loadingTask.promise
        pdfDocRef.current = pdfDoc
        setPdfPageCount(pdfDoc.numPages || 0)

        const savedPage =
          lastPositionRef.current?.page
          ?? ebookState?.progress?.page
          ?? openData?.progress?.page
          ?? 1
        const initialPage = normalizePdfPageForView(
          Math.min(Math.max(1, savedPage), Math.max(1, pdfDoc.numPages || 1)),
        )
        setPdfPageNumber(initialPage)
        latestPageRef.current = initialPage
        setPageInput(String(initialPage))
        await renderPdfPage(initialPage)
        if (canvasLooksBlank(pdfCanvasRef.current)) {
          setPdfUseNativeViewer(true)
          showMessage('Using native PDF viewer for better compatibility.')
        }
        setIsPdfReady(true)
      } catch (error) {
        if (pdfObjectUrlRef.current) {
          setPdfUseNativeViewer(true)
          setPdfError('')
          setIsPdfReady(true)
          showMessage('Switched to native PDF viewer.')
        } else {
          setPdfError(getErrorMessage(error))
          setIsPdfReady(false)
        }
      }
    }

    void mountPdf()

    return () => {
      disposed = true
      pdfRenderTaskPrimaryRef.current?.cancel?.()
      pdfRenderTaskSecondaryRef.current?.cancel?.()
      pdfDocRef.current = null
      setIsPdfReady(false)
      setPdfPageCount(0)
    }
  }, [inferredFormat, normalizePdfPageForView, pdfCanvasReady, renderPdfPage, resolvedAssetUrl])

  useEffect(() => {
    if (inferredFormat !== 'EPUB' || !isEpubReady || !renditionRef.current) return
    const rendition = renditionRef.current
    const targetCfi = latestCfiRef.current
    applyEpubTheme(rendition)
    rendition.spread?.(settings.pageView === 'spread' ? 'auto' : 'none')
    applyEpubTypographyToRenderedContents(rendition)
    if (targetCfi) {
      void rendition.display(targetCfi).catch(() => {
        // Keep current view if re-display is unavailable for this spine location.
      })
    }
  }, [
    applyEpubTypographyToRenderedContents,
    applyEpubTheme,
    inferredFormat,
    isEpubReady,
    settings.fontSizeRem,
    settings.lineHeight,
    settings.pageView,
    settings.sidePaddingRem,
    settings.theme,
  ])

  useEffect(() => {
    if (inferredFormat !== 'PDF' || !isPdfReady || !pdfDocRef.current) return
    void renderPdfPage(pdfPageNumber)
  }, [inferredFormat, isPdfReady, pdfPageNumber, renderPdfPage, settings.pdfZoom])

  useEffect(() => {
    if (inferredFormat !== 'EPUB' || !isEpubReady || !renditionRef.current) return
    const rendition = renditionRef.current
    for (const highlight of ebookState?.highlights ?? []) {
      const key = `hl-${highlight.id}`
      if (appliedHighlightsRef.current.has(key)) continue
      appliedHighlightsRef.current.add(key)
      rendition.annotations.add('highlight', highlight.startCfi, {}, undefined, key, {
        fill: highlight.color || 'yellow',
        'fill-opacity': '0.35',
      })
    }
  }, [ebookState?.highlights, inferredFormat, isEpubReady])

  useEffect(() => {
    if (inferredFormat !== 'EPUB') return

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea') return

      if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
        event.preventDefault()
        void goToNextPage()
      }
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault()
        void goToPrevPage()
      }
      if (event.key.toLowerCase() === 't') {
        event.preventDefault()
        toggleReaderPanel('toc')
      }
      if (event.key.toLowerCase() === 's') {
        event.preventDefault()
        toggleReaderPanel('settings')
      }
      if (event.key === '/') {
        event.preventDefault()
        toggleReaderPanel('search')
      }
      if (event.key.toLowerCase() === 'f') {
        event.preventDefault()
        void toggleFullscreen()
      }
      if (event.key === '?') {
        event.preventDefault()
        toggleReaderPanel('notes')
      }
      if (event.key === 'Escape') {
        closeReaderPanels()
        setIsDictionaryOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [closeReaderPanels, goToNextPage, goToPrevPage, inferredFormat, toggleFullscreen, toggleReaderPanel])

  useEffect(() => {
    if (!isSearchOpen || inferredFormat !== 'EPUB') return
    const id = window.setTimeout(() => {
      void runEpubTextSearch(searchQuery)
    }, 220)
    return () => window.clearTimeout(id)
  }, [inferredFormat, isSearchOpen, runEpubTextSearch, searchQuery])

  useEffect(() => {
    const id = window.setInterval(() => {
      if (inferredFormat === 'EPUB' && latestCfiRef.current) {
        void queueProgressSave({
          payload: {
            bookId,
            page: latestPageRef.current,
            locationCfi: latestCfiRef.current,
            percent: latestPercentRef.current,
          },
          silent: true,
        })
        return
      }

      if (inferredFormat === 'PDF' && isPdfReady) {
        const page = latestPageRef.current
        void queueProgressSave({
          payload: {
            bookId,
            page,
            percent: pdfPageCount ? Number(((page / pdfPageCount) * 100).toFixed(2)) : undefined,
          },
          silent: true,
        })
      }
    }, 20000)

    return () => window.clearInterval(id)
  }, [bookId, inferredFormat, isPdfReady, pdfPageCount, queueProgressSave])

  useEffect(() => {
    const onBeforeUnload = () => {
      if (inferredFormat === 'EPUB' && latestCfiRef.current) {
        void queueProgressSave({
          payload: {
            bookId,
            page: latestPageRef.current,
            locationCfi: latestCfiRef.current,
            percent: latestPercentRef.current,
          },
          silent: true,
        })
      }
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [bookId, inferredFormat, queueProgressSave])

  useEffect(() => {
    return () => {
      if (turnFallbackTimerRef.current) {
        window.clearTimeout(turnFallbackTimerRef.current)
        turnFallbackTimerRef.current = null
      }
      if (flipTimerRef.current) {
        window.clearTimeout(flipTimerRef.current)
        flipTimerRef.current = null
      }
      stopReadAloud()
      dictionaryAudioRef.current?.pause()
    }
  }, [stopReadAloud])

  if (!bookId) {
    return <div className="mx-auto max-w-4xl p-6">Missing book ID.</div>
  }

  const isInitialLoading = !openData && !ebookState && (isOpenLoading || isStateLoading)
  const canNavigateEpub = inferredFormat === 'EPUB' && !!renditionRef.current && !isTurningPage
  const canNavigatePdf = inferredFormat === 'PDF' && isPdfReady && !pdfUseNativeViewer

  const paperToneClass =
    settings.theme === 'night'
      ? 'bg-[#121212]'
      : settings.theme === 'sepia'
        ? 'bg-[#f6f0df]'
        : 'bg-[#fffdf7]'

  const textToneClass = settings.theme === 'night' ? 'text-slate-200' : 'text-slate-700'
  const isLightReaderTheme = settings.theme === 'paper'
  const toolbarShellClass = isLightReaderTheme
    ? 'border-[#8f7a57] bg-[rgba(47,41,33,0.94)]'
    : 'border-[#8a7552] bg-[rgba(47,41,33,0.9)]'
  const toolbarButtonIdleClass = isLightReaderTheme
    ? 'text-[#fff8ee] hover:bg-white/15'
    : 'text-[#e8dbc8] hover:bg-white/12'
  const toolbarButtonActiveClass = isLightReaderTheme
    ? 'bg-white/24 text-[#ffffff]'
    : 'bg-white/15 text-[#f7f1e6]'
  const panelShellClass = isLightReaderTheme
    ? 'border-[#8f7a57] bg-[#fffaf1]/94 text-[#2a241c]'
    : 'border-[#8a7552] bg-[#241f18]/88 text-[#f0e8da]'
  const panelMutedTextClass = isLightReaderTheme ? 'text-[#6a5a44]' : 'text-[#d5c7b0]'
  const panelPrimaryTextClass = isLightReaderTheme ? 'text-[#2f281f]' : 'text-[#f3eadb]'
  const panelInputClass = isLightReaderTheme
    ? 'border-[#bfa882] bg-[#fffdf7] text-[#2d261d] focus:border-[#8f7551]'
    : 'border-[#8a7552] bg-black/20 text-[#f8f1e6] focus:border-[#c7b18f]'
  const panelCardClass = isLightReaderTheme
    ? 'border-[#d3bea0] hover:bg-[#f3e8d6]/70'
    : 'border-white/10 hover:bg-white/10'
  const readerStageClass = isFullscreen
    ? 'relative flex h-[100dvh] flex-col rounded-[20px] border border-[#d8ccb8] bg-[#f4eee2] p-3 pt-14 shadow-none dark:border-white/10 dark:bg-[#181818]'
    : 'relative mt-4 rounded-[30px] border border-[#d8ccb8] bg-[#f4eee2] p-4 pt-16 shadow-[0_26px_45px_rgba(80,57,18,0.14)] dark:border-white/10 dark:bg-[#181818]'
  const readerViewportClass = isFullscreen ? 'h-full min-h-0' : 'h-[70vh]'
  const useLegacyDrawers = false
  const pdfPrimaryPage = Math.max(1, pdfPageNumber)
  const pdfSecondaryPage = pdfPrimaryPage + 1
  const pdfHighlights = ebookState?.highlights ?? []
  const pdfHighlightRectsPrimary = pdfHighlights
    .map((highlight) => {
      const parsed = parsePdfSelectionStartRef(highlight.startCfi)
      return parsed && parsed.page === pdfPrimaryPage
        ? parsed.rects.map((rect) => ({ ...rect, color: (highlight.color as HighlightStyle) || 'yellow' }))
        : null
    })
    .flatMap((rects) => rects ?? [])
  const pdfHighlightRectsSecondary = settings.pageView === 'spread'
    ? pdfHighlights
      .map((highlight) => {
        const parsed = parsePdfSelectionStartRef(highlight.startCfi)
        return parsed && parsed.page === pdfSecondaryPage
          ? parsed.rects.map((rect) => ({ ...rect, color: (highlight.color as HighlightStyle) || 'yellow' }))
          : null
      })
      .flatMap((rects) => rects ?? [])
    : []

  return (
    <div
      ref={readerShellRef}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_#f7f3ea_0%,_#ece6d9_42%,_#e1dbcf_100%)] px-3 py-4 text-slate-900 dark:bg-[radial-gradient(circle_at_top,_#171717_0%,_#101010_100%)] dark:text-slate-100 md:px-6 md:py-6"
    >
      <style>
        {`@keyframes readerFlipNext{0%{opacity:0;transform:translateX(22%) skewX(-10deg)}35%{opacity:.26}100%{opacity:0;transform:translateX(-8%) skewX(-2deg)}}@keyframes readerFlipPrev{0%{opacity:0;transform:translateX(-22%) skewX(10deg)}35%{opacity:.26}100%{opacity:0;transform:translateX(8%) skewX(2deg)}}.reader-pdf-text-layer{user-select:text;-webkit-user-select:text;}.reader-pdf-text-layer span{position:absolute;white-space:pre;cursor:text;color:transparent;transform-origin:0 0;}.reader-pdf-text-layer ::selection{background:rgba(250,204,21,0.35);}`}
      </style>
      <div className="mx-auto max-w-6xl">
        <header className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 shadow-[0_8px_30px_rgba(53,38,16,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-black/30">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold md:text-2xl">{openData?.title ?? ebookState?.book.title ?? 'Reader'}</h1>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Page {currentPage}{totalPages ? ` / ${totalPages}` : ''} · {progressPercent.toFixed(1)}%
              </p>
              <p className={`mt-1 text-[11px] uppercase tracking-[0.12em] ${saveState === 'error' ? 'text-rose-600' : 'text-slate-500 dark:text-slate-400'}`}>
                {saveState === 'saving' ? 'Saving...' : saveState === 'error' ? 'Save failed' : formatSavedTime(lastSavedAt)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/library"
                className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 transition hover:bg-slate-100 dark:border-white/20 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
              >
                Back to Library
              </Link>
            </div>
          </div>
        </header>

        {feedback ? (
          <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
            {feedback}
          </div>
        ) : null}

        <section className="sticky top-2 z-40 mt-3 rounded-2xl border border-white/80 bg-white/90 px-3 py-2 shadow-[0_10px_24px_rgba(15,23,42,0.12)] backdrop-blur-md dark:border-white/15 dark:bg-black/60">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            <span>{inferredFormat === 'PDF' ? `Page ${pdfPageNumber}` : `Page ${currentPage}`}</span>
            <span>{inferredFormat === 'PDF' ? `${pdfPageCount} pages` : `${progressPercent.toFixed(1)}%`}</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-slate-800 transition-[width] duration-300 dark:bg-slate-200"
              style={{
                width: `${
                  inferredFormat === 'PDF'
                    ? (pdfPageCount ? (pdfPageNumber / pdfPageCount) * 100 : 0)
                    : progressPercent
                }%`,
              }}
            />
          </div>
        </section>

        {isInitialLoading ? (
          <div className="mt-4 rounded-3xl border border-white/60 bg-white/80 p-8 text-sm text-slate-600 shadow-[0_12px_35px_rgba(53,38,16,0.08)] dark:border-white/10 dark:bg-black/30 dark:text-slate-300">
            Loading reader...
          </div>
        ) : (
          <>
            <section ref={readerStageRef} className={readerStageClass}>
              <div ref={toolbarAreaRef} className="absolute left-4 right-4 top-3 z-30 flex items-center justify-between">
                <div className={`inline-flex items-center rounded-full border p-1 shadow-lg backdrop-blur ${toolbarShellClass}`}>
                  <button
                    type="button"
                    onClick={() => toggleReaderPanel('toc')}
                    className={`rounded-full px-3 py-1.5 text-sm leading-none ${isTocOpen ? toolbarButtonActiveClass : toolbarButtonIdleClass}`}
                    aria-label="Contents"
                  >
                    <List className="h-4 w-4 stroke-2" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      closeReaderPanels()
                      await handleAddBookmark()
                    }}
                    className={`rounded-full px-3 py-1.5 text-sm leading-none ${toolbarButtonIdleClass}`}
                    aria-label="Bookmark current page"
                  >
                    <Bookmark className="h-4 w-4 stroke-2" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleReaderPanel('notes')}
                    className={`rounded-full px-3 py-1.5 text-sm leading-none ${isHelpOpen && helpPanelMode === 'notes' ? toolbarButtonActiveClass : toolbarButtonIdleClass}`}
                    aria-label="Notes"
                  >
                    <StickyNote className="h-4 w-4 stroke-2" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleReaderPanel('highlights')}
                    className={`rounded-full px-3 py-1.5 text-sm leading-none ${isHelpOpen && helpPanelMode === 'highlights' ? toolbarButtonActiveClass : toolbarButtonIdleClass}`}
                    aria-label="Highlights"
                  >
                    <Highlighter className="h-4 w-4 stroke-2" />
                  </button>
                </div>

                <div className={`inline-flex items-center rounded-full border p-1 shadow-lg backdrop-blur ${toolbarShellClass}`}>
                  <button
                    type="button"
                    onClick={() => toggleReaderPanel('settings')}
                    className={`rounded-full px-3 py-1.5 text-sm leading-none ${isSettingsOpen ? toolbarButtonActiveClass : toolbarButtonIdleClass}`}
                    aria-label="Reader typography"
                  >
                    Aa
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleReaderPanel('search')}
                    className={`rounded-full px-3 py-1.5 text-sm leading-none ${isSearchOpen ? toolbarButtonActiveClass : toolbarButtonIdleClass}`}
                    aria-label="Search in book"
                  >
                    <Search className="h-4 w-4 stroke-2" />
                  </button>
                  <button
                    type="button"
                    onClick={() => (isSpeaking ? stopReadAloud() : speakCurrentEpubView())}
                    className={`rounded-full px-3 py-1.5 text-sm leading-none ${toolbarButtonIdleClass}`}
                    aria-label="Read aloud"
                  >
                    {isSpeaking ? <Square className="h-4 w-4 stroke-2" /> : <Play className="h-4 w-4 stroke-2" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleFullscreen()}
                    className={`rounded-full px-3 py-1.5 text-sm leading-none ${toolbarButtonIdleClass}`}
                    aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? <Minimize2 className="h-4 w-4 stroke-2" /> : <Maximize2 className="h-4 w-4 stroke-2" />}
                  </button>
                </div>
              </div>

              {(isTocOpen || isSearchOpen || isSettingsOpen || isHelpOpen) ? (
                <div ref={panelRef} className={`absolute left-4 top-16 z-30 max-h-[55vh] w-full max-w-[22rem] overflow-hidden rounded-3xl border p-3 shadow-2xl backdrop-blur ${panelShellClass}`}>
                  {isTocOpen ? (
                    <>
                      <p className="mb-2 text-center text-base font-semibold">Contents</p>
                      {inferredFormat !== 'EPUB' ? (
                        <p className={`text-xs ${panelMutedTextClass}`}>TOC is available for EPUB only.</p>
                      ) : filteredToc.length === 0 ? (
                        <p className={`text-xs ${panelMutedTextClass}`}>No chapter list available.</p>
                      ) : (
                        <div className="max-h-[42vh] space-y-1 overflow-y-auto pr-2">
                          {filteredToc.map((item, idx) => (
                            <button
                              key={`${item.label}-${idx}`}
                              type="button"
                              onClick={() => void jumpToEpubToc(item.href)}
                              className={`block w-full rounded-2xl px-2.5 py-1.5 text-left text-xs ${panelPrimaryTextClass} ${panelCardClass}`}
                              style={{ paddingLeft: `${0.65 + item.depth * 0.6}rem` }}
                            >
                              {item.label || `Chapter ${idx + 1}`}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : null}

                  {isSearchOpen ? (
                    <>
                      <p className="mb-2 text-center text-base font-semibold">Search</p>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search text..."
                        className={`mb-2.5 w-full rounded-2xl border px-3 py-1.5 text-xs outline-none ${panelInputClass}`}
                      />
                      {isSearchingText ? (
                        <p className={`text-xs ${panelMutedTextClass}`}>Searching...</p>
                      ) : searchQuery.trim() && searchResults.length === 0 ? (
                        <p className={`text-xs ${panelMutedTextClass}`}>No matches found.</p>
                      ) : (
                        <div className="max-h-[40vh] space-y-1.5 overflow-y-auto pr-1">
                          {searchResults.map((result, idx) => (
                            <button
                              key={`${result.cfi}-${idx}`}
                              type="button"
                              onClick={() => void jumpToSearchResult(result)}
                              className={`block w-full rounded-2xl border px-3 py-1.5 text-left text-xs ${panelPrimaryTextClass} ${panelCardClass}`}
                            >
                              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] opacity-75">
                                Page {result.page ?? '?'}
                              </p>
                              <p>{result.excerpt}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : null}

                  {isSettingsOpen ? (
                    <div className="space-y-3">
                      <p className="text-center text-base font-semibold">Themes & Settings</p>
                      <div className="grid grid-cols-[1fr_auto] gap-2">
                        <div className={`grid grid-cols-2 overflow-hidden rounded-3xl border ${isLightReaderTheme ? 'border-[#c7b08b] bg-[#eadfca]' : 'border-white/15 bg-white/10'}`}>
                          <button
                            type="button"
                            onClick={() => setSettings((prev) => ({ ...prev, fontSizeRem: Math.max(0.72, Number((prev.fontSizeRem - 0.06).toFixed(2))) }))}
                            className={`py-1.5 text-base font-semibold ${isLightReaderTheme ? 'text-[#4b3d2b] hover:bg-[#dfd2ba]' : 'text-[#f2e7d4] hover:bg-white/10'}`}
                          >
                            A
                          </button>
                          <button
                            type="button"
                            onClick={() => setSettings((prev) => ({ ...prev, fontSizeRem: Math.min(1.9, Number((prev.fontSizeRem + 0.06).toFixed(2))) }))}
                            className={`border-l py-1.5 text-3xl leading-none ${isLightReaderTheme ? 'border-[#c7b08b] text-[#4b3d2b] hover:bg-[#dfd2ba]' : 'border-white/15 text-[#f2e7d4] hover:bg-white/10'}`}
                          >
                            A
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSettings((prev) => ({ ...prev, theme: prev.theme === 'night' ? 'paper' : 'night' }))}
                          className={`inline-flex items-center justify-center rounded-3xl border px-3 ${isLightReaderTheme ? 'border-[#c7b08b] bg-[#eadfca] text-[#4b3d2b] hover:bg-[#dfd2ba]' : 'border-white/15 bg-white/10 text-[#f2e7d4] hover:bg-white/15'}`}
                        >
                          <MoonStar className="h-4 w-4" />
                        </button>
                      </div>

                      <div className={`flex items-center gap-2 px-1 ${isLightReaderTheme ? 'text-[#7a6950]' : 'text-[#9f8e78]'}`}>
                        {Array.from({ length: 16 }).map((_, idx) => (
                          <span
                            key={`density-${idx}`}
                            className={`h-1.5 w-1.5 rounded-full ${idx < Math.min(16, Math.max(1, Math.round(((settings.fontSizeRem - 0.72) / (1.9 - 0.72)) * 16))) ? (isLightReaderTheme ? 'bg-[#7a6950]' : 'bg-[#e8dbc8]') : 'bg-current/35'}`}
                          />
                        ))}
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {READER_STYLE_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => applyReaderPreset(preset.id)}
                            className={`rounded-2xl border px-2 py-2 text-center transition ${
                              activePresetId === preset.id
                                ? 'border-white bg-white/15 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.45)]'
                                : isLightReaderTheme
                                  ? 'border-[#c7b08b] bg-[#f3e7d2] hover:bg-[#ebdcc3]'
                                  : 'border-white/15 bg-black/35 hover:bg-black/45'
                            }`}
                          >
                            <div className={`text-[1.65rem] leading-none ${isLightReaderTheme ? 'text-[#2f281f]' : 'text-[#f2e9dc]'}`}>Aa</div>
                            <div className={`text-xs font-semibold ${isLightReaderTheme ? 'text-[#2f281f]' : 'text-[#f2e9dc]'}`}>{preset.label}</div>
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowAdvancedSettings((prev) => !prev)}
                        className={`inline-flex w-full items-center justify-center gap-2 rounded-3xl border py-2.5 text-sm font-semibold ${
                          isLightReaderTheme
                            ? 'border-[#b8a080] bg-[#eadfca] text-[#3f3224] hover:bg-[#dfd2ba]'
                            : 'border-white/15 bg-white/10 text-[#f2e9dc] hover:bg-white/15'
                        }`}
                      >
                        <Settings className="h-4 w-4" />
                        Customize
                      </button>

                      {showAdvancedSettings ? (
                        <div className={`space-y-3 rounded-2xl border p-3 ${isLightReaderTheme ? 'border-[#c9b18f] bg-[#fbf3e4]' : 'border-white/10 bg-black/25'}`}>
                          <div className="grid grid-cols-2 gap-2">
                            {(['single', 'spread'] as const).map((mode) => (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => setSettings((prev) => ({ ...prev, pageView: mode }))}
                                className={`rounded-2xl border px-2 py-2 text-xs font-semibold uppercase ${
                                  settings.pageView === mode
                                    ? 'border-[#d6c09e] bg-white/25 text-[#fff8ee]'
                                    : isLightReaderTheme
                                      ? 'border-[#c7b08b] text-[#4e4130] hover:bg-[#f4e8d5]/70'
                                      : 'border-white/15 text-[#ddd0bd] hover:bg-white/10'
                                }`}
                              >
                                {mode === 'single' ? 'Single Page' : 'Two Page'}
                              </button>
                            ))}
                          </div>
                          {inferredFormat === 'EPUB' ? (
                            <>
                              <label className={`block text-xs ${panelMutedTextClass}`}>
                                Line Height
                                <input
                                  type="range"
                                  min={1.2}
                                  max={2}
                                  step={0.02}
                                  value={settings.lineHeight}
                                  onChange={(event) => setSettings((prev) => ({ ...prev, lineHeight: Number(event.target.value) }))}
                                  className="mt-1 w-full"
                                />
                              </label>
                            </>
                          ) : (
                            <label className={`block text-xs ${panelMutedTextClass}`}>
                              Zoom
                              <input
                                type="range"
                                min={0.8}
                                max={2.3}
                                step={0.05}
                                value={settings.pdfZoom}
                                onChange={(event) => setSettings((prev) => ({ ...prev, pdfZoom: Number(event.target.value) }))}
                                className="mt-1 w-full"
                              />
                            </label>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {isHelpOpen ? (
                    <div className="space-y-3">
                      <p className="text-center text-lg font-semibold">
                        {helpPanelMode === 'highlights' ? 'Highlights' : 'Notes'}
                      </p>

                      {helpPanelMode === 'highlights' ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2 rounded-2xl border px-3 py-2">
                            <span className={`text-xs font-semibold uppercase tracking-[0.12em] ${panelMutedTextClass}`}>
                              Style
                            </span>
                            <div className="flex items-center gap-1.5">
                              {(['yellow', 'green', 'pink', 'blue', 'underline'] as HighlightStyle[]).map((style) => (
                                <button
                                  key={style}
                                  type="button"
                                  onClick={() => setHighlightColor(style)}
                                  className={`h-6 rounded-full border px-2 text-[10px] font-semibold uppercase ${
                                    highlightColor === style ? 'border-slate-800 dark:border-slate-200' : 'border-slate-300 dark:border-slate-700'
                                  }`}
                                  style={{
                                    backgroundColor: style === 'underline' ? 'transparent' : getHighlightSwatch(style),
                                    textDecoration: style === 'underline' ? 'underline' : 'none',
                                  }}
                                >
                                  {style === 'underline' ? 'U' : ''}
                                </button>
                              ))}
                            </div>
                          </div>

                          {inferredFormat === 'PDF' ? (
                            <div className="space-y-2">
                              <button
                                onClick={() => void handleAddPdfHighlight()}
                                className={`w-full rounded-2xl border px-3 py-2 text-sm font-semibold ${
                                  isLightReaderTheme
                                    ? 'border-[#af9470] bg-[#f7ebd8] text-[#3f3224] hover:bg-[#efdfc7]'
                                    : 'border-[#8a7552] bg-white/10 text-[#f8f1e6] hover:bg-white/20'
                                }`}
                                type="button"
                              >
                                {pdfSelectedText ? 'Highlight Selected Text' : 'Highlight This Page'}
                              </button>
                              {pdfSelectedText ? (
                                <p className={`line-clamp-2 rounded-xl border px-3 py-2 text-xs ${panelCardClass}`}>
                                  Selected: {pdfSelectedText}
                                </p>
                              ) : (
                                <p className={`text-xs ${panelMutedTextClass}`}>
                                  Select text on the PDF page, then tap highlight.
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <button
                                onClick={() => void handleAddEpubHighlight()}
                                className={`w-full rounded-2xl border px-3 py-2 text-sm font-semibold ${
                                  isLightReaderTheme
                                    ? 'border-[#af9470] bg-[#f7ebd8] text-[#3f3224] hover:bg-[#efdfc7]'
                                    : 'border-[#8a7552] bg-white/10 text-[#f8f1e6] hover:bg-white/20'
                                }`}
                                type="button"
                              >
                                Highlight Selected Text
                              </button>
                              {epubSelectedHighlight?.text ? (
                                <p className={`line-clamp-2 rounded-xl border px-3 py-2 text-xs ${panelCardClass}`}>
                                  Selected: {epubSelectedHighlight.text}
                                </p>
                              ) : (
                                <p className={`text-xs ${panelMutedTextClass}`}>
                                  Select text in the page, then tap highlight.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ) : null}

                      {helpPanelMode === 'notes' ? (
                        <>
                          <textarea
                            value={noteInput}
                            onChange={(event) => setNoteInput(event.target.value)}
                            rows={3}
                            className={`w-full rounded-2xl border px-3 py-2 text-sm outline-none ${panelInputClass}`}
                            placeholder="Write a note for this page..."
                          />
                          <button
                            onClick={() => void handleAddNote()}
                            className={`w-full rounded-2xl border px-3 py-2 text-sm font-semibold ${
                              isLightReaderTheme
                                ? 'border-[#af9470] bg-[#f7ebd8] text-[#3f3224] hover:bg-[#efdfc7]'
                                : 'border-[#8a7552] bg-white/10 text-[#f8f1e6] hover:bg-white/20'
                            }`}
                            type="button"
                          >
                            Save Note
                          </button>
                          <div className="max-h-[34vh] space-y-2 overflow-y-auto pr-1 text-sm">
                            <p className={`text-xs uppercase tracking-[0.12em] ${panelMutedTextClass}`}>Bookmarks</p>
                            {bookmarkItems.length === 0 ? (
                              <p className={panelMutedTextClass}>No bookmarks.</p>
                            ) : (
                              bookmarkItems.map((bookmark) => (
                                <div key={bookmark.id} className={`flex items-center justify-between gap-2 rounded-xl border px-2 py-1.5 ${panelCardClass}`}>
                                  <button
                                    type="button"
                                    onClick={() => void jumpToBookmark(bookmark)}
                                    className="flex-1 truncate text-left hover:underline"
                                  >
                                    {bookmark.label ?? `Page ${bookmark.page}`}
                                  </button>
                                  <button
                                    className="text-rose-300 hover:text-rose-200"
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        await deleteBookmark.mutateAsync({ bookId, bookmarkId: bookmark.id })
                                        setBookmarkItems((prev) => prev.filter((item) => item.id !== bookmark.id))
                                        showMessage('Bookmark removed.')
                                      } catch (error) {
                                        showMessage(getErrorMessage(error))
                                      }
                                    }}
                                  >
                                    x
                                  </button>
                                </div>
                              ))
                            )}

                            <p className={`pt-2 text-xs uppercase tracking-[0.12em] ${panelMutedTextClass}`}>Notes</p>
                            {(ebookState?.notes.length ?? 0) === 0 ? (
                              <p className={panelMutedTextClass}>No notes.</p>
                            ) : (
                              ebookState?.notes.slice(0, 8).map((note) => (
                                <div key={note.id} className={`flex items-start justify-between gap-2 rounded-xl border px-2 py-1.5 ${panelCardClass}`}>
                                  <span className="line-clamp-2">{note.content}</span>
                                  <button
                                    className="text-rose-300 hover:text-rose-200"
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        await deleteNote.mutateAsync({ bookId, noteId: note.id })
                                        showMessage('Note removed.')
                                      } catch (error) {
                                        showMessage(getErrorMessage(error))
                                      }
                                    }}
                                  >
                                    x
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {inferredFormat === 'EPUB' && epubSelectionActionAnchor && epubSelectedHighlight?.text ? (
                <div
                  ref={selectionActionRef}
                  className={`absolute z-40 w-[min(22rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-full rounded-2xl border px-3 py-2 shadow-xl backdrop-blur ${
                    isLightReaderTheme
                      ? 'border-[#8f7a57] bg-[rgba(47,41,33,0.95)] text-[#fff8ee]'
                      : 'border-[#8a7552] bg-[rgba(47,41,33,0.92)] text-[#f2e9dc]'
                  }`}
                  style={{
                    left: `${epubSelectionActionAnchor.x}px`,
                    top: `${epubSelectionActionAnchor.y}px`,
                  }}
                >
                  <p className="line-clamp-2 text-[11px] opacity-85">
                    {epubSelectedHighlight.text}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleSelectionHighlight()}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-white/25 px-2.5 py-1.5 text-xs font-semibold hover:bg-white/10"
                    >
                      <Highlighter className="h-3.5 w-3.5" />
                      Highlight
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectionDictionaryLookup}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-white/25 px-2.5 py-1.5 text-xs font-semibold hover:bg-white/10"
                    >
                      <Search className="h-3.5 w-3.5" />
                      Dictionary
                    </button>
                  </div>
                </div>
              ) : null}

              {resolvedAssetUrl ? (
                inferredFormat === 'PDF' ? (
                  pdfError ? (
                    <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                      <p>PDF renderer could not load ({pdfError}).</p>
                      <a
                        href={resolvedAssetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
                      >
                        Open PDF
                      </a>
                    </div>
                  ) : (
                    <div className={isFullscreen ? 'relative flex-1 min-h-0' : 'relative'}>
                      {!pdfUseNativeViewer ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void goToPrevPdfPage()}
                            disabled={!canNavigatePdf}
                            aria-label="Previous page"
                            className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-slate-300 bg-white/90 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 shadow-md transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/20 dark:bg-black/60 dark:text-slate-200"
                          >
                            &#8249;
                          </button>
                          <button
                            type="button"
                            onClick={() => void goToNextPdfPage()}
                            disabled={!canNavigatePdf}
                            aria-label="Next page"
                            className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-slate-300 bg-white/90 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 shadow-md transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/20 dark:bg-black/60 dark:text-slate-200"
                          >
                            &#8250;
                          </button>
                        </>
                      ) : null}
                      {flipDirection ? (
                        <div
                          className="pointer-events-none absolute inset-x-8 top-6 bottom-6 z-10 rounded-2xl"
                          style={{
                            animation: flipDirection === 'next' ? 'readerFlipNext 320ms ease-out' : 'readerFlipPrev 320ms ease-out',
                            background:
                              flipDirection === 'next'
                                ? 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(254,242,218,0.35) 62%, rgba(180,147,95,0.24) 100%)'
                                : 'linear-gradient(270deg, rgba(255,255,255,0) 0%, rgba(254,242,218,0.35) 62%, rgba(180,147,95,0.24) 100%)',
                          }}
                        />
                      ) : null}
                      {pdfUseNativeViewer && pdfObjectUrl ? (
                        <div className={`overflow-hidden rounded-2xl border border-[#cab89b] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7),0_16px_30px_rgba(93,69,33,0.2)] dark:border-white/10 ${paperToneClass} ${readerViewportClass}`}>
                          <iframe
                            src={pdfObjectUrl}
                            title="PDF reader fallback"
                            className="h-full w-full"
                          />
                        </div>
                      ) : (
                        <div
                          ref={pdfViewportRef}
                          className={`flex items-start justify-center overflow-auto rounded-2xl border border-[#cab89b] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7),0_16px_30px_rgba(93,69,33,0.2)] dark:border-white/10 ${paperToneClass} ${readerViewportClass}`}
                          onTouchStart={handleReaderTouchStart}
                          onTouchMove={handleReaderTouchMove}
                          onTouchEnd={(event) => void handleReaderTouchEnd(event)}
                          onMouseUp={capturePdfSelection}
                        >
                          <div className={`flex min-h-full w-full items-start justify-center px-3 py-3 ${settings.pageView === 'spread' ? 'gap-2 md:gap-4' : ''}`}>
                            <div className={`relative ${settings.pageView === 'spread' ? 'max-w-[48%]' : ''}`}>
                              <canvas
                                ref={setPdfCanvas}
                                className={settings.pageView === 'spread' ? 'h-auto w-auto max-w-[48%]' : 'h-auto w-auto'}
                              />
                              <div
                                ref={setPdfTextLayer}
                                className="reader-pdf-text-layer absolute inset-0 z-10"
                              />
                              <div className="pointer-events-none absolute inset-0 z-20">
                                {pdfHighlightRectsPrimary.map((rect, idx) => (
                                  <span
                                    key={`pdfhl-left-${idx}`}
                                    className={`absolute rounded-sm ${rect.color === 'underline' ? '' : ''}`}
                                    style={{
                                      left: `${rect.x * 100}%`,
                                      top: `${rect.y * 100}%`,
                                      width: `${rect.w * 100}%`,
                                      height: rect.color === 'underline' ? '2px' : `${rect.h * 100}%`,
                                      marginTop: rect.color === 'underline' ? `${Math.max(0, rect.h * 100 - 0.4)}%` : undefined,
                                      backgroundColor:
                                        rect.color === 'underline'
                                          ? getHighlightSwatch('underline')
                                          : getHighlightSwatch((rect.color as HighlightStyle) || 'yellow'),
                                      opacity: rect.color === 'underline' ? 0.95 : 0.35,
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                            {settings.pageView === 'spread' ? (
                              <div className="relative max-w-[48%] border-l border-[#d3c0a3]/70 pl-2 md:pl-4">
                                <canvas
                                  ref={setPdfCanvasSecondary}
                                  className="h-auto w-auto max-w-[48%]"
                                />
                                <div
                                  ref={setPdfTextLayerSecondary}
                                  className="reader-pdf-text-layer absolute inset-0 z-10"
                                />
                                <div className="pointer-events-none absolute inset-0 z-20">
                                  {pdfHighlightRectsSecondary.map((rect, idx) => (
                                    <span
                                      key={`pdfhl-right-${idx}`}
                                      className={`absolute rounded-sm ${rect.color === 'underline' ? '' : ''}`}
                                      style={{
                                        left: `${rect.x * 100}%`,
                                        top: `${rect.y * 100}%`,
                                        width: `${rect.w * 100}%`,
                                        height: rect.color === 'underline' ? '2px' : `${rect.h * 100}%`,
                                        marginTop: rect.color === 'underline' ? `${Math.max(0, rect.h * 100 - 0.4)}%` : undefined,
                                        backgroundColor:
                                          rect.color === 'underline'
                                            ? getHighlightSwatch('underline')
                                            : getHighlightSwatch((rect.color as HighlightStyle) || 'yellow'),
                                        opacity: rect.color === 'underline' ? 0.95 : 0.35,
                                      }}
                                    />
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                ) : inferredFormat === 'EPUB' ? (
                  epubError ? (
                    <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                      <p>EPUB renderer could not load ({epubError}).</p>
                      <a
                        href={resolvedAssetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
                      >
                        Open EPUB
                      </a>
                    </div>
                  ) : (
                    <div className={isFullscreen ? 'relative flex-1 min-h-0' : 'relative'}>
                      <button
                        type="button"
                        onClick={() => void goToPrevPage()}
                        disabled={!canNavigateEpub}
                        aria-label="Previous page"
                        className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-slate-300 bg-white/90 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 shadow-md transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/20 dark:bg-black/60 dark:text-slate-200"
                      >
                        &#8249;
                      </button>
                      <button
                        type="button"
                        onClick={() => void goToNextPage()}
                        disabled={!canNavigateEpub}
                        aria-label="Next page"
                        className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-slate-300 bg-white/90 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 shadow-md transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/20 dark:bg-black/60 dark:text-slate-200"
                      >
                        &#8250;
                      </button>
                      {flipDirection ? (
                        <div
                          className="pointer-events-none absolute inset-x-8 top-6 bottom-6 z-10 rounded-2xl"
                          style={{
                            animation: flipDirection === 'next' ? 'readerFlipNext 320ms ease-out' : 'readerFlipPrev 320ms ease-out',
                            background:
                              flipDirection === 'next'
                                ? 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(254,242,218,0.35) 62%, rgba(180,147,95,0.24) 100%)'
                                : 'linear-gradient(270deg, rgba(255,255,255,0) 0%, rgba(254,242,218,0.35) 62%, rgba(180,147,95,0.24) 100%)',
                          }}
                        />
                      ) : null}
                      <div
                        className={`overflow-hidden rounded-2xl border border-[#cab89b] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7),0_16px_30px_rgba(93,69,33,0.2)] dark:border-white/10 ${paperToneClass} ${readerViewportClass}`}
                        onTouchStart={handleReaderTouchStart}
                        onTouchMove={handleReaderTouchMove}
                        onTouchEnd={(event) => void handleReaderTouchEnd(event)}
                        onWheel={(event) => {
                          if (!renditionRef.current) return
                          const now = Date.now()
                          if (now < wheelLockUntilRef.current) return
                          if (Math.abs(event.deltaY) < 24) return
                          event.preventDefault()
                          wheelLockUntilRef.current = now + 420
                          if (event.deltaY > 0) {
                            void goToNextPage()
                          } else {
                            void goToPrevPage()
                          }
                        }}
                      >
                        <div ref={setEpubContainer} className="h-full w-full" />
                      </div>
                    </div>
                  )
                ) : (
                  <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                    <p>
                      Unsupported eBook format: <strong>{inferredFormat || 'unknown'}</strong>.
                    </p>
                  </div>
                )
              ) : (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
                  Reader content is unavailable for this eBook.
                </div>
              )}

              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  <span>{inferredFormat === 'PDF' ? `Page ${pdfPageNumber}` : `Page ${currentPage}`}</span>
                  <span>{inferredFormat === 'PDF' ? `${pdfPageCount} pages` : `${progressPercent.toFixed(1)}%`}</span>
                </div>
                <input
                  type="range"
                  min={inferredFormat === 'PDF' ? 1 : 0}
                  max={inferredFormat === 'PDF' ? Math.max(1, pdfPageCount) : 100}
                  step={1}
                  value={scrubValue}
                  onChange={(event) => setScrubValue(Number(event.target.value))}
                  onMouseUp={() => void handleScrubCommit()}
                  onTouchEnd={() => void handleScrubCommit()}
                  className="w-full accent-slate-700 dark:accent-slate-200"
                />
              </div>
            </section>

          </>
        )}
      </div>

      {useLegacyDrawers && isSettingsOpen ? (
        <div className="fixed inset-y-0 right-0 z-[70] w-full max-w-sm border-l border-slate-300 bg-white/95 p-4 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-[#0f1115]/95">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">Reader Settings</h2>
            <button type="button" onClick={() => setIsSettingsOpen(false)} className="rounded border px-2 py-1 text-xs">Close</button>
          </div>
          <div className="space-y-4 text-sm">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Theme</p>
              <div className="grid grid-cols-3 gap-2">
                {(['paper', 'sepia', 'night'] as ReaderTheme[]).map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => setSettings((prev) => ({ ...prev, theme }))}
                    className={`rounded border px-2 py-2 text-xs font-semibold uppercase ${settings.theme === theme ? 'border-slate-700 bg-slate-900 text-white dark:border-slate-200 dark:bg-slate-100 dark:text-slate-900' : 'border-slate-300'}`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Page View</p>
              <div className="grid grid-cols-2 gap-2">
                {(['single', 'spread'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSettings((prev) => ({ ...prev, pageView: mode }))}
                    className={`rounded border px-2 py-2 text-xs font-semibold uppercase ${
                      settings.pageView === mode
                        ? 'border-slate-700 bg-slate-900 text-white dark:border-slate-200 dark:bg-slate-100 dark:text-slate-900'
                        : 'border-slate-300'
                    }`}
                  >
                    {mode === 'single' ? 'Single Page' : 'Two Page'}
                  </button>
                ))}
              </div>
            </div>

            {inferredFormat === 'EPUB' ? (
              <>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Line Height</span>
                  <input
                    type="range"
                    min={1.2}
                    max={2}
                    step={0.02}
                    value={settings.lineHeight}
                    onChange={(event) => setSettings((prev) => ({ ...prev, lineHeight: Number(event.target.value) }))}
                    className="mt-2 w-full"
                  />
                  <span className="text-xs text-slate-500">{settings.lineHeight.toFixed(2)}</span>
                </label>

                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Side Padding</span>
                  <input
                    type="range"
                    min={0.4}
                    max={2.2}
                    step={0.05}
                    value={settings.sidePaddingRem}
                    onChange={(event) => setSettings((prev) => ({ ...prev, sidePaddingRem: Number(event.target.value) }))}
                    className="mt-2 w-full"
                  />
                  <span className="text-xs text-slate-500">{settings.sidePaddingRem.toFixed(2)}rem</span>
                </label>
              </>
            ) : null}

            {inferredFormat === 'PDF' ? (
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Zoom</span>
                <input
                  type="range"
                  min={0.8}
                  max={2.3}
                  step={0.05}
                  value={settings.pdfZoom}
                  onChange={(event) => setSettings((prev) => ({ ...prev, pdfZoom: Number(event.target.value) }))}
                  className="mt-2 w-full"
                />
                <span className="text-xs text-slate-500">{settings.pdfZoom.toFixed(2)}x</span>
              </label>
            ) : null}

            <div className="border-t border-slate-200 pt-3 dark:border-white/10">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Read Aloud</p>
              <label className="block">
                <span className="text-xs text-slate-500 dark:text-slate-400">Voice</span>
                <select
                  value={selectedVoiceUri}
                  onChange={(event) => setSelectedVoiceUri(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 dark:border-white/20 dark:bg-black/30 dark:text-slate-100"
                >
                  {availableVoices.map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-2 block">
                <span className="text-xs text-slate-500 dark:text-slate-400">Speed</span>
                <input
                  type="range"
                  min={0.7}
                  max={1.4}
                  step={0.05}
                  value={speechRate}
                  onChange={(event) => setSpeechRate(Number(event.target.value))}
                  className="mt-1 w-full"
                />
                <span className="text-xs text-slate-500">{speechRate.toFixed(2)}x</span>
              </label>
            </div>
          </div>
        </div>
      ) : null}

      {useLegacyDrawers && isTocOpen ? (
        <div className="fixed inset-y-0 left-0 z-[70] w-full max-w-sm border-r border-slate-300 bg-white/95 p-4 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-[#0f1115]/95">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">Table of Contents</h2>
            <button type="button" onClick={() => setIsTocOpen(false)} className="rounded border px-2 py-1 text-xs">Close</button>
          </div>
          <input
            type="text"
            value={tocSearch}
            onChange={(event) => setTocSearch(event.target.value)}
            placeholder="Search chapters..."
            className="mb-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 dark:border-white/20 dark:bg-black/30 dark:text-slate-100"
          />

          {inferredFormat !== 'EPUB' ? (
            <p className={`text-sm ${textToneClass}`}>TOC is available for EPUB only.</p>
          ) : filteredToc.length === 0 ? (
            <p className={`text-sm ${textToneClass}`}>No chapter list available.</p>
          ) : (
            <div className="no-scrollbar max-h-[calc(100vh-7rem)] space-y-1 overflow-y-auto pr-2">
              {filteredToc.map((item, idx) => (
                <button
                  key={`${item.label}-${idx}`}
                  type="button"
                  onClick={() => void jumpToEpubToc(item.href)}
                  className="block w-full rounded border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
                  style={{ paddingLeft: `${0.75 + item.depth * 0.75}rem` }}
                >
                  {item.label || `Chapter ${idx + 1}`}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {useLegacyDrawers && isHelpOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#0f1115]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">Keyboard Shortcuts</h2>
              <button type="button" onClick={() => setIsHelpOpen(false)} className="rounded border px-2 py-1 text-xs">Close</button>
            </div>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
              <li><strong>→ / Space / PageDown</strong> Next page</li>
              <li><strong>← / PageUp</strong> Previous page</li>
              <li><strong>T</strong> Toggle table of contents</li>
              <li><strong>S</strong> Toggle settings drawer</li>
              <li><strong>/</strong> Toggle text search drawer</li>
              <li><strong>Select word</strong> Opens quick dictionary card</li>
              <li><strong>F</strong> Toggle fullscreen</li>
              <li><strong>?</strong> Open shortcut help</li>
              <li><strong>Esc</strong> Close open reader overlays</li>
            </ul>
          </div>
        </div>
      ) : null}

      {useLegacyDrawers && isSearchOpen ? (
        <div className="fixed inset-y-0 right-0 z-[75] w-full max-w-md border-l border-slate-300 bg-white/95 p-4 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-[#0f1115]/95">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">Search In Book</h2>
            <button type="button" onClick={() => setIsSearchOpen(false)} className="rounded border px-2 py-1 text-xs">Close</button>
          </div>
          {inferredFormat !== 'EPUB' ? (
            <p className={`text-sm ${textToneClass}`}>Full-text search is available for EPUB only.</p>
          ) : (
            <>
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search text..."
                className="mb-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 dark:border-white/20 dark:bg-black/30 dark:text-slate-100"
              />
              {isSearchingText ? (
                <p className={`text-sm ${textToneClass}`}>Searching...</p>
              ) : searchQuery.trim() && searchResults.length === 0 ? (
                <p className={`text-sm ${textToneClass}`}>No matches found.</p>
              ) : (
                <div className="no-scrollbar max-h-[calc(100vh-8rem)] space-y-2 overflow-y-auto pr-1">
                  {searchResults.map((result, idx) => (
                    <button
                      key={`${result.cfi}-${idx}`}
                      type="button"
                      onClick={() => void jumpToSearchResult(result)}
                      className="block w-full rounded border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
                    >
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] opacity-75">
                        Page {result.page ?? '?'}
                      </p>
                      <p>{result.excerpt}</p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ) : null}

      {isDictionaryOpen ? (
        <div className="fixed bottom-4 right-4 z-[76] w-full max-w-sm rounded-2xl border border-slate-300 bg-white/95 p-4 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-[#0f1115]/95">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Quick Dictionary</p>
            <button
              type="button"
              onClick={() => setIsDictionaryOpen(false)}
              className="rounded border px-2 py-1 text-xs"
            >
              Close
            </button>
          </div>
          <p className="text-lg font-semibold capitalize text-slate-900 dark:text-slate-100">{dictionaryWord}</p>
          {dictionaryPhonetic ? (
            <p className="mt-0.5 text-xs uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
              {dictionaryPhonetic}
            </p>
          ) : null}
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
            {isDictionaryLoading ? 'Looking up definition...' : dictionaryDefinition}
          </p>
          {dictionaryAudioUrl ? (
            <button
              type="button"
              onClick={playDictionaryAudio}
              className="mt-3 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-slate-700 hover:bg-slate-100 dark:border-white/20 dark:text-slate-200 dark:hover:bg-white/10"
            >
              Play Pronunciation
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default BookReaderPage
