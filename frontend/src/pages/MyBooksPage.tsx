import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BarChart3, Book, BookOpen, ChevronLeft, ChevronRight, Clock3, Flame, Plus, RotateCcw, X } from 'lucide-react'
import { useCreateReadingSession, useReadingItems, useReadingSessions, useUpdateReadingSession } from '@/services/reading'
import BookCover from '@/components/ui/BookCover'
import { cn } from '@/lib/utils'

type ReadingSession = {
  id: string
  bookId: string
  title: string
  coverImage: string | null
  date: Date
  dateKey: string
  pages: number
}
type InsightsViewMode = 'WEEKLY' | 'MONTHLY' | 'YEARLY'
type DragMode = 'START' | 'END' | null

const MONTH_LABEL = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })
const DAY_LABEL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const SESSION_QUOTES = [
  { text: 'Truth, like love and sleep, resents approaches that are too intense.', author: 'W. H. Auden' },
  { text: 'No book can be finished by those who only read when they feel inspired.', author: 'Anonymous Reader' },
  { text: 'Small sessions, repeated daily, become a finished shelf.', author: 'Treasure House' },
]

const getNowTimeValue = () => {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

const estimatePagesFromDuration = (minutes: number) => Math.max(1, Math.round(minutes * 1.3))
const MAX_SESSION_DURATION_MINUTES = 8 * 60
const toMinutesOfDay = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0
  return (hours * 60) + minutes
}
const fromMinutesOfDay = (value: number) => {
  const safe = Math.max(0, Math.min(23 * 60 + 59, Math.round(value)))
  const hours = Math.floor(safe / 60)
  const minutes = safe % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}
const normalizeAngle = (angle: number) => {
  const normalized = angle % 360
  return normalized < 0 ? normalized + 360 : normalized
}
const minutesToDialAngle = (minutes: number) => normalizeAngle(((minutes % 60) / 60) * 360)
const snapMinutes = (minutes: number) => Math.max(1, Math.round(minutes))
const formatDurationParts = (minutes: number) => {
  const safe = Math.max(1, Math.round(minutes))
  const hours = Math.floor(safe / 60)
  const mins = safe % 60
  return { hours, mins }
}
const pointOnCircle = (angle: number, radius: number, center = 160) => {
  const rad = ((angle - 90) * Math.PI) / 180
  return {
    x: center + (radius * Math.cos(rad)),
    y: center + (radius * Math.sin(rad)),
  }
}
const describeArc = (radius: number, startAngle: number, endAngle: number) => {
  const sweep = normalizeAngle(endAngle - startAngle)
  const safeSweep = sweep === 0 ? 0.1 : sweep
  const start = pointOnCircle(startAngle, radius)
  const end = pointOnCircle(startAngle + safeSweep, radius)
  const largeArc = safeSweep > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`
}
const startOfWeek = (date: Date) => {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  copy.setDate(copy.getDate() - copy.getDay())
  return copy
}
const addDays = (date: Date, amount: number) => {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  copy.setDate(copy.getDate() + amount)
  return copy
}

const toDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const toMonthKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

const shiftMonthKey = (key: string, delta: number) => {
  const { year, monthIndex } = parseMonthKey(key)
  const shifted = new Date(year, monthIndex + delta, 1)
  return toMonthKey(shifted)
}

const parseMonthKey = (key: string) => {
  const [year, month] = key.split('-').map(Number)
  return {
    year,
    monthIndex: month - 1,
  }
}

const makeMonthOptions = (fromDate: Date, count = 12) => {
  return Array.from({ length: count }).map((_, idx) => {
    const monthDate = new Date(fromDate.getFullYear(), fromDate.getMonth() - idx, 1)
    return {
      value: toMonthKey(monthDate),
      label: MONTH_LABEL.format(monthDate),
    }
  })
}

const makeYearOptions = (fromYear: number, toYear: number) => {
  const start = Math.min(fromYear, toYear)
  const end = Math.max(fromYear, toYear)
  const years: Array<{ value: string; label: string }> = []

  for (let year = end; year >= start; year -= 1) {
    years.push({
      value: `${year}-01`,
      label: String(year),
    })
  }

  return years
}

const MyBooksPage = () => {
  const { data: readingItems = [], isLoading } = useReadingItems()
  const { data: readingSessions = [], isLoading: isSessionsLoading } = useReadingSessions()
  const createReadingSession = useCreateReadingSession()
  const updateReadingSession = useUpdateReadingSession()
  const monthOptions = useMemo(() => makeMonthOptions(new Date(), 12), [])
  const [viewMode, setViewMode] = useState<InsightsViewMode>('MONTHLY')
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]?.value ?? toMonthKey(new Date()))
  const [hoveredDateKey, setHoveredDateKey] = useState<string | null>(null)
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [isBookPickerOpen, setIsBookPickerOpen] = useState(false)
  const [isComposerCardFlipped, setIsComposerCardFlipped] = useState(false)
  const [composerSessionId, setComposerSessionId] = useState<string | null>(null)
  const [composerBookId, setComposerBookId] = useState('')
  const [composerDateKey, setComposerDateKey] = useState(toDateKey(new Date()))
  const [composerStartMinute, setComposerStartMinute] = useState(toMinutesOfDay(getNowTimeValue()))
  const [composerDurationMin, setComposerDurationMin] = useState(15)
  const [composerPagesInput, setComposerPagesInput] = useState(String(estimatePagesFromDuration(15)))
  const [isPagesManual, setIsPagesManual] = useState(false)
  const [composerError, setComposerError] = useState('')
  const [isStartTimeEditing, setIsStartTimeEditing] = useState(false)
  const [isDurationEditing, setIsDurationEditing] = useState(false)
  const [durationDraft, setDurationDraft] = useState('15')
  const [dragMode, setDragMode] = useState<DragMode>(null)
  const [hasDialInteracted, setHasDialInteracted] = useState(false)
  const dialRef = useRef<SVGSVGElement | null>(null)
  const dragLastAngleRef = useRef<number | null>(null)
  const dragDurationRef = useRef<number>(15)
  const dragStartMinuteRef = useRef<number>(0)

  const readingItemBookMap = useMemo(() => {
    return new Map(
      readingItems
        .filter((item) => item.book)
        .map((item) => [item.bookId, item.book] as const),
    )
  }, [readingItems])

  const sessions = useMemo<ReadingSession[]>(() => {
    return readingSessions
      .map((session) => {
        const sessionDate = new Date(session.sessionDate)
        if (Number.isNaN(sessionDate.getTime())) return null
        const fallbackBook = readingItemBookMap.get(session.bookId)
        const resolvedTitle = session.book?.title || fallbackBook?.title || 'Untitled'
        const resolvedCoverImage = session.book?.coverImage ?? fallbackBook?.coverImage ?? null
        return {
          id: session.id,
          bookId: session.bookId,
          title: resolvedTitle,
          coverImage: resolvedCoverImage,
          date: sessionDate,
          dateKey: toDateKey(sessionDate),
          pages: Math.max(1, session.pagesRead),
        }
      })
      .filter((item): item is ReadingSession => item !== null)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [readingItemBookMap, readingSessions])

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const baselineStart = currentYear - 100
    const baselineEnd = currentYear + 1
    if (sessions.length === 0) {
      return makeYearOptions(baselineStart, baselineEnd)
    }

    const oldestYear = sessions.reduce((minYear, session) => Math.min(minYear, session.date.getFullYear()), currentYear)
    const newestYear = sessions.reduce((maxYear, session) => Math.max(maxYear, session.date.getFullYear()), currentYear)
    return makeYearOptions(Math.min(baselineStart, oldestYear), Math.max(baselineEnd, newestYear))
  }, [sessions])

  const sessionMap = useMemo(() => {
    const map = new Map<string, ReadingSession[]>()
    for (const session of sessions) {
      const existing = map.get(session.dateKey) ?? []
      existing.push(session)
      map.set(session.dateKey, existing)
    }
    return map
  }, [sessions])

  const sessionTrackedBooks = useMemo(() => {
    return readingItems
      .filter((item) => item.book?.title)
      .map((item) => ({
        bookId: item.bookId,
        title: item.book?.title || 'Untitled',
        author: item.book?.author || 'Unknown author',
      }))
  }, [readingItems])

  const quoteOfDay = useMemo(() => {
    const day = new Date().getDate()
    return SESSION_QUOTES[day % SESSION_QUOTES.length]
  }, [])

  const { year, monthIndex } = parseMonthKey(selectedMonth)
  const selectedTrackedBook = sessionTrackedBooks.find((book) => book.bookId === composerBookId) ?? null
  const monthStart = new Date(year, monthIndex, 1)
  const monthEnd = new Date(year, monthIndex + 1, 0)
  const daysInMonth = monthEnd.getDate()
  const leadingOffset = monthStart.getDay()

  const periodRange = useMemo(() => {
    const nowDate = new Date()
    if (viewMode === 'WEEKLY') {
      const anchor = selectedDateKey ? new Date(`${selectedDateKey}T00:00:00`) : nowDate
      const start = startOfWeek(anchor)
      const end = addDays(start, 7)
      const previousStart = addDays(start, -7)
      return { start, end, previousStart, previousEnd: start, label: 'last week', elapsedDays: 7 }
    }
    if (viewMode === 'YEARLY') {
      const start = new Date(year, 0, 1)
      const end = new Date(year + 1, 0, 1)
      const previousStart = new Date(year - 1, 0, 1)
      const totalDaysInYear = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
      const elapsedDays = nowDate.getFullYear() === year
        ? Math.max(1, Math.ceil((nowDate.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)))
        : totalDaysInYear
      return { start, end, previousStart, previousEnd: start, label: 'last year', elapsedDays }
    }

    const start = new Date(year, monthIndex, 1)
    const end = new Date(year, monthIndex + 1, 1)
    const previousStart = new Date(year, monthIndex - 1, 1)
    const elapsedDays = nowDate.getFullYear() === year && nowDate.getMonth() === monthIndex
      ? nowDate.getDate()
      : daysInMonth
    return {
      start,
      end,
      previousStart,
      previousEnd: start,
      label: MONTH_LABEL.format(previousStart),
      elapsedDays,
    }
  }, [daysInMonth, monthIndex, selectedDateKey, viewMode, year])

  const sessionsInView = useMemo(() => {
    return sessions.filter((session) => session.date >= periodRange.start && session.date < periodRange.end)
  }, [periodRange.end, periodRange.start, sessions])

  const activityByDate = useMemo(() => {
    const map = new Map<string, { pages: number; sessions: ReadingSession[] }>()
    for (const session of sessionsInView) {
      const existing = map.get(session.dateKey)
      if (!existing) {
        map.set(session.dateKey, { pages: session.pages, sessions: [session] })
        continue
      }
      existing.pages += session.pages
      existing.sessions.push(session)
    }
    return map
  }, [sessionsInView])

  const monthPages = sessionsInView.reduce((sum, session) => sum + session.pages, 0)
  const elapsedDays = periodRange.elapsedDays
  const averagePagesPerDay = elapsedDays ? Math.round(monthPages / elapsedDays) : 0
  const booksFinished = readingItems.filter((item) => {
    if (!item.finishedAt) return false
    const finished = new Date(item.finishedAt)
    return finished >= periodRange.start && finished < periodRange.end
  }).length

  const previousMonthPages = sessions
    .filter((session) => session.date >= periodRange.previousStart && session.date < periodRange.previousEnd)
    .reduce((sum, session) => sum + session.pages, 0)
  const previousBooksFinished = readingItems.filter((item) => {
    if (!item.finishedAt) return false
    const finished = new Date(item.finishedAt)
    return finished >= periodRange.previousStart && finished < periodRange.previousEnd
  }).length

  const streak = useMemo(() => {
    if (!sessions.length) return 0
    const activeSet = new Set(sessions.map((session) => session.dateKey))
    const today = new Date()
    const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    let count = 0
    while (activeSet.has(toDateKey(cursor))) {
      count += 1
      cursor.setDate(cursor.getDate() - 1)
    }

    return count
  }, [sessions])

  const maxPagesInMonthDay = Math.max(0, ...Array.from(activityByDate.values()).map((day) => day.pages))

  const calendarCells = [
    ...Array.from({ length: leadingOffset }).map(() => null),
    ...Array.from({ length: daysInMonth }).map((_, idx) => idx + 1),
  ]
  const weeklyCalendarDays = useMemo(() => {
    const anchor = selectedDateKey ? new Date(`${selectedDateKey}T00:00:00`) : new Date()
    const weekStart = startOfWeek(anchor)
    return Array.from({ length: 7 }).map((_, idx) => {
      const date = addDays(weekStart, idx)
      const key = toDateKey(date)
      const dayActivity = sessionMap.get(key) ?? []
      return {
        key,
        label: DAY_LABEL[idx],
        date,
        pages: dayActivity.reduce((sum, row) => sum + row.pages, 0),
        sessions: dayActivity,
      }
    })
  }, [selectedDateKey, sessionMap])
  const yearlyMonthCards = useMemo(() => {
    return Array.from({ length: 12 }).map((_, idx) => {
      const monthStartDate = new Date(year, idx, 1)
      const monthEndDate = new Date(year, idx + 1, 1)
      const monthSessions = sessions.filter((session) => session.date >= monthStartDate && session.date < monthEndDate)
      const pages = monthSessions.reduce((sum, session) => sum + session.pages, 0)
      const topCover = monthSessions[0]?.coverImage ?? null
      return {
        key: toMonthKey(monthStartDate),
        label: monthStartDate.toLocaleDateString('en-US', { month: 'short' }),
        pages,
        cover: topCover,
      }
    })
  }, [sessions, year])

  const timelineSessions = sessionsInView.slice(0, 12)

  const lastSevenDays = useMemo(() => {
    const now = new Date()
    const rows: Array<{
      key: string
      compactLabel: string
      pages: number
      shortDate: string
    }> = []

    for (let idx = 6; idx >= 0; idx -= 1) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - idx)
      const key = toDateKey(day)
      const pages = (sessionMap.get(key) ?? []).reduce((sum, session) => sum + session.pages, 0)
      rows.push({
        key,
        compactLabel: day.toLocaleDateString('en-US', { weekday: 'narrow' }),
        shortDate: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        pages,
      })
    }

    return rows
  }, [sessionMap])

  const maxLastSevenDaysPages = Math.max(1, ...lastSevenDays.map((day) => day.pages))
  const activeDateKey = selectedDateKey ?? hoveredDateKey
  const activeDay = activeDateKey ? activityByDate.get(activeDateKey) : undefined
  const pagesDelta = monthPages - previousMonthPages
  const booksDelta = booksFinished - previousBooksFinished
  const previousMonthLabel = viewMode === 'MONTHLY'
    ? periodRange.label
    : viewMode === 'WEEKLY'
      ? 'last week'
      : 'last year'
  const periodHeading = viewMode === 'MONTHLY'
    ? MONTH_LABEL.format(monthStart)
    : viewMode === 'WEEKLY'
      ? `${periodRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${addDays(periodRange.start, 6).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      : String(year)
  const summaryHeading = viewMode === 'MONTHLY'
    ? `${periodHeading} Reading Summary`
    : viewMode === 'WEEKLY'
      ? 'Weekly Reading Summary'
      : `${periodHeading} Reading Summary`
  const periodHint = viewMode === 'MONTHLY'
    ? 'Click or hover a day for recap'
    : viewMode === 'WEEKLY'
      ? 'Tap a day card to review or log a session'
      : 'Click a month to jump into detailed tracking'
  const now = new Date()
  const todayKey = toDateKey(now)
  const currentMinuteOfDay = (now.getHours() * 60) + now.getMinutes()
  const isComposerToday = composerDateKey === todayKey
  const maxEndMinute = isComposerToday ? currentMinuteOfDay : (23 * 60 + 59)

  const sessionStartAt = useMemo(() => {
    const parsed = new Date(`${composerDateKey}T${fromMinutesOfDay(composerStartMinute)}:00`)
    if (Number.isNaN(parsed.getTime())) return null
    return parsed
  }, [composerDateKey, composerStartMinute])

  const sessionEndAt = useMemo(() => {
    if (!sessionStartAt) return null
    return new Date(sessionStartAt.getTime() + (composerDurationMin * 60 * 1000))
  }, [composerDurationMin, sessionStartAt])

  const isComposerFutureDate = composerDateKey > todayKey
  const isSessionEndInPast = sessionEndAt ? sessionEndAt.getTime() <= Date.now() : false
  const maxDurationForStart = Math.max(1, maxEndMinute - composerStartMinute)
  const composerDateSessions = useMemo(
    () => sessions.filter((session) => session.dateKey === composerDateKey),
    [composerDateKey, sessions],
  )

  const maxAllowedDuration = Math.max(1, Math.min(maxDurationForStart, MAX_SESSION_DURATION_MINUTES))
  const exceedsSessionLimit = composerDurationMin > MAX_SESSION_DURATION_MINUTES
  const isMultiRotationDuration = composerDurationMin >= 60
  const durationParts = formatDurationParts(composerDurationMin)
  const durationDisplay = durationParts.hours > 0
    ? `${durationParts.hours}h ${durationParts.mins}m`
    : `${durationParts.mins} min`
  const startAngle = minutesToDialAngle(composerStartMinute)
  const durationAngle = ((composerDurationMin % 60) / 60) * 360
  const endAngle = normalizeAngle(startAngle + durationAngle)
  const dialArcPath = describeArc(128, startAngle, endAngle)
  const startHandlePoint = pointOnCircle(startAngle, 128)
  const endHandlePoint = pointOnCircle(endAngle, 128)

  const resolvePointerOnDial = useCallback((clientX: number, clientY: number) => {
    if (!dialRef.current) return null
    const rect = dialRef.current.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * 320
    const y = ((clientY - rect.top) / rect.height) * 320
    const dx = x - 160
    const dy = y - 160
    const radius = Math.sqrt((dx * dx) + (dy * dy))
    const rawAngle = ((Math.atan2(dy, dx) * 180) / Math.PI) + 90
    return {
      x,
      y,
      radius,
      angle: normalizeAngle(rawAngle),
    }
  }, [])

  const updateFromDialPointer = useCallback((clientX: number, clientY: number, mode: Exclude<DragMode, null>) => {
    const pointer = resolvePointerOnDial(clientX, clientY)
    if (!pointer) return

    const previousAngle = dragLastAngleRef.current ?? pointer.angle
    let deltaAngle = pointer.angle - previousAngle
    if (deltaAngle > 180) deltaAngle -= 360
    if (deltaAngle < -180) deltaAngle += 360
    dragLastAngleRef.current = pointer.angle
    const deltaMinutes = deltaAngle / 6

    if (mode === 'END') {
      const rawDuration = dragDurationRef.current + deltaMinutes
      const boundedDuration = Math.max(1, Math.min(maxAllowedDuration, snapMinutes(rawDuration)))
      dragDurationRef.current = boundedDuration
      setComposerDurationMin(boundedDuration)
      return
    }

    const rawStartMinute = dragStartMinuteRef.current + deltaMinutes
    const maxStartMinute = Math.max(0, maxEndMinute - composerDurationMin)
    const boundedStart = Math.max(0, Math.min(maxStartMinute, snapMinutes(rawStartMinute)))
    dragStartMinuteRef.current = boundedStart
    setComposerStartMinute(boundedStart)
  }, [composerDurationMin, maxAllowedDuration, maxEndMinute, resolvePointerOnDial])

  const beginDialDrag = (event: React.PointerEvent<HTMLElement | SVGSVGElement>) => {
    event.preventDefault()
    const pointer = resolvePointerOnDial(event.clientX, event.clientY)
    if (!pointer) return

    const endDistance = Math.hypot(pointer.x - endHandlePoint.x, pointer.y - endHandlePoint.y)
    const startDistance = Math.hypot(pointer.x - startHandlePoint.x, pointer.y - startHandlePoint.y)
    const HANDLE_HIT_RADIUS = 32
    let dragTarget: Exclude<DragMode, null> | null = null

    // Prefer direct handle hit first so both endpoints stay draggable.
    if (startDistance <= HANDLE_HIT_RADIUS || endDistance <= HANDLE_HIT_RADIUS) {
      dragTarget = startDistance <= endDistance ? 'START' : 'END'
    } else if (pointer.radius >= 118 && pointer.radius <= 148) {
      dragTarget = 'END'
    } else if (pointer.radius >= 82 && pointer.radius <= 118) {
      dragTarget = 'START'
    } else {
      dragTarget = startDistance <= endDistance ? 'START' : 'END'
    }

    if (!dragTarget) return
    setHasDialInteracted(true)
    setDragMode(dragTarget)
    event.currentTarget.setPointerCapture(event.pointerId)
    dragLastAngleRef.current = pointer.angle
    dragDurationRef.current = composerDurationMin
    dragStartMinuteRef.current = composerStartMinute
    updateFromDialPointer(event.clientX, event.clientY, dragTarget)

    const onPointerMove = (moveEvent: PointerEvent) => {
      updateFromDialPointer(moveEvent.clientX, moveEvent.clientY, dragTarget)
    }
    const stopDrag = () => {
      setDragMode(null)
      dragLastAngleRef.current = null
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', stopDrag)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', stopDrag)
  }

  useEffect(() => {
    if (isPagesManual) return
    setComposerPagesInput(String(estimatePagesFromDuration(composerDurationMin)))
  }, [composerDurationMin, isPagesManual])

  useEffect(() => {
    if (isDurationEditing) return
    setDurationDraft(String(composerDurationMin))
  }, [composerDurationMin, isDurationEditing])

  useEffect(() => {
    if (!isComposerOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isComposerOpen])

  useEffect(() => {
    if (!isComposerOpen) return
    if (composerStartMinute > maxEndMinute) {
      setComposerStartMinute(Math.max(0, maxEndMinute - 1))
    }
  }, [composerStartMinute, isComposerOpen, maxEndMinute])

  useEffect(() => {
    if (!isComposerOpen) return
    if (composerDurationMin > maxAllowedDuration) {
      setComposerDurationMin(maxAllowedDuration)
    }
  }, [composerDurationMin, isComposerOpen, maxAllowedDuration])

  useEffect(() => {
    if (composerBookId || sessionTrackedBooks.length === 0) return
    setComposerBookId(sessionTrackedBooks[0].bookId)
  }, [composerBookId, sessionTrackedBooks])

  const openComposerForDate = (dateKey: string, sessionId?: string | null) => {
    const sessionToEdit = sessionId
      ? sessions.find((session) => session.id === sessionId)
      : sessions.find((session) => session.dateKey === dateKey)
    const nowForDefault = new Date()
    const defaultStartMinute = Math.max(0, (nowForDefault.getHours() * 60) + nowForDefault.getMinutes() - 15)
    const rawStartMinute = sessionToEdit
      ? (sessionToEdit.date.getHours() * 60) + sessionToEdit.date.getMinutes()
      : defaultStartMinute
    const startMinute = dateKey === toDateKey(new Date())
      ? Math.min(rawStartMinute, Math.max(0, currentMinuteOfDay - 1))
      : rawStartMinute
    const duration = sessionToEdit ? Math.min(MAX_SESSION_DURATION_MINUTES, Math.max(1, Math.round(sessionToEdit.pages / 1.3))) : 15

    setComposerSessionId(sessionToEdit?.id ?? null)
    setIsComposerOpen(true)
    setIsComposerCardFlipped(false)
    setComposerError('')
    setIsBookPickerOpen(false)
    setComposerDateKey(dateKey)
    setComposerStartMinute(startMinute)
    setComposerDurationMin(duration)
    setIsPagesManual(false)
    setComposerPagesInput(String(sessionToEdit?.pages ?? estimatePagesFromDuration(duration)))
    if (sessionToEdit) {
      setComposerBookId(sessionToEdit.bookId)
      return
    }
    if (sessionTrackedBooks.length > 0) {
      setComposerBookId(sessionTrackedBooks[0].bookId)
    }
  }

  const openComposer = () => {
    openComposerForDate(toDateKey(new Date()))
  }

  const closeComposer = () => {
    setIsComposerOpen(false)
    setIsComposerCardFlipped(false)
    setComposerError('')
    setComposerSessionId(null)
    setIsBookPickerOpen(false)
    setIsStartTimeEditing(false)
    setIsDurationEditing(false)
  }

  const handleDirectStartTimeChange = (timeValue: string) => {
    const requestedStartMinute = toMinutesOfDay(timeValue)
    const maxStartMinute = Math.max(0, maxEndMinute - composerDurationMin)
    const boundedStartMinute = Math.max(0, Math.min(maxStartMinute, requestedStartMinute))
    setComposerStartMinute(boundedStartMinute)
  }

  const commitDurationDraft = () => {
    const parsed = Number(durationDraft)
    if (Number.isNaN(parsed)) {
      setDurationDraft(String(composerDurationMin))
      setIsDurationEditing(false)
      return
    }

    const boundedDuration = Math.max(1, Math.min(maxAllowedDuration, snapMinutes(parsed)))
    setComposerDurationMin(boundedDuration)
    setDurationDraft(String(boundedDuration))
    setIsDurationEditing(false)
  }

  const handleCalendarDayClick = (dateKey: string) => {
    setSelectedDateKey((prev) => (prev === dateKey ? null : dateKey))
    if (dateKey > todayKey) return
    openComposerForDate(dateKey)
  }

  const submitSession = async () => {
    if (!composerBookId) {
      setComposerError('Select a book before saving this session.')
      return
    }
    if (!sessionStartAt || !sessionEndAt) {
      setComposerError('Invalid date/time selected.')
      return
    }
    if (isComposerFutureDate) {
      setComposerError('You can only log past sessions.')
      return
    }
    if (!isSessionEndInPast) {
      setComposerError('Reading time sessions must end in the past!')
      return
    }
    if (exceedsSessionLimit) {
      setComposerError('Sessions cannot exceed 8 hours.')
      return
    }

    const pagesRead = Number(composerPagesInput)
    if (Number.isNaN(pagesRead) || pagesRead < 1) {
      setComposerError('Pages read must be at least 1.')
      return
    }

    setComposerError('')
    if (composerSessionId) {
      await updateReadingSession.mutateAsync({
        sessionId: composerSessionId,
        pagesRead,
        sessionDate: sessionEndAt.toISOString(),
        notes: `Duration ${composerDurationMin} min`,
      })
    } else {
      await createReadingSession.mutateAsync({
        bookId: composerBookId,
        pagesRead,
        sessionDate: sessionEndAt.toISOString(),
        notes: `Duration ${composerDurationMin} min`,
      })
    }
    closeComposer()
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-[#0f1114] dark:text-slate-100">
      <div className="pointer-events-none fixed inset-0 hidden opacity-85 dark:block">
        <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-[radial-gradient(circle,_rgba(40,166,145,0.18),_rgba(0,0,0,0))]" />
        <div className="absolute -right-10 top-20 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(255,173,64,0.16),_rgba(0,0,0,0))]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-16">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-gradient-to-br dark:from-[#16232b] dark:via-[#11252a] dark:to-[#1b1828] dark:shadow-[0_20px_80px_rgba(0,0,0,0.35)] lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300/80">Reading Insights</p>
              <h1 className="mt-2 font-library-display text-4xl leading-tight text-slate-900 dark:text-[#eef8f6]">{summaryHeading}</h1>
            </div>
            <button
              type="button"
              onClick={openComposer}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.12em] text-white transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(15,23,42,0.22)] dark:bg-white dark:text-slate-900 dark:hover:shadow-none"
            >
              <Plus className="h-4 w-4" />
              Add Session
            </button>
          </div>

          <div className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/85 p-3 dark:border-white/10 dark:bg-white/[0.03] lg:grid-cols-[auto_minmax(220px,1fr)_auto] lg:items-center">
            <div className="grid grid-cols-3 rounded-full border border-slate-300/90 bg-white p-1 dark:border-white/20 dark:bg-black/25">
              {(['WEEKLY', 'MONTHLY', 'YEARLY'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setViewMode(mode)
                    if (mode === 'YEARLY') {
                      const { year: selectedYear } = parseMonthKey(selectedMonth)
                      setSelectedMonth(`${selectedYear}-01`)
                    }
                  }}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition',
                    viewMode === mode
                      ? 'bg-slate-900 text-white shadow-[0_6px_16px_rgba(15,23,42,0.28)] dark:bg-white dark:text-slate-900 dark:shadow-none'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white',
                  )}
                >
                  {mode.toLowerCase()}
                </button>
              ))}
            </div>

            {(viewMode === 'MONTHLY' || viewMode === 'YEARLY') && (
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-slate-500 dark:border-white/20 dark:bg-black/25 dark:text-white dark:focus:border-white/45"
              >
                {(viewMode === 'YEARLY' ? yearOptions : monthOptions).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            <div className="grid grid-cols-3 gap-2 lg:min-w-[330px]">
              <button
                type="button"
                onClick={() => {
                  if (viewMode === 'WEEKLY') {
                    const next = selectedDateKey ? new Date(`${selectedDateKey}T00:00:00`) : new Date()
                    next.setDate(next.getDate() - 7)
                    setSelectedDateKey(toDateKey(next))
                    return
                  }
                  setSelectedMonth(shiftMonthKey(selectedMonth, viewMode === 'YEARLY' ? -12 : -1))
                }}
                className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-slate-300/90 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-white/20 dark:bg-black/20 dark:text-slate-300 dark:hover:border-white/40 dark:hover:text-white"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedMonth(toMonthKey(new Date()))
                  setSelectedDateKey(null)
                }}
                className="h-10 rounded-xl border border-slate-300/90 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-white/20 dark:bg-black/20 dark:text-slate-300 dark:hover:border-white/40 dark:hover:text-white"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  if (viewMode === 'WEEKLY') {
                    const next = selectedDateKey ? new Date(`${selectedDateKey}T00:00:00`) : new Date()
                    next.setDate(next.getDate() + 7)
                    setSelectedDateKey(toDateKey(next))
                    return
                  }
                  setSelectedMonth(shiftMonthKey(selectedMonth, viewMode === 'YEARLY' ? 12 : 1))
                }}
                className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-slate-300/90 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-white/20 dark:bg-black/20 dark:text-slate-300 dark:hover:border-white/40 dark:hover:text-white"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-[1.2fr_1.2fr_0.9fr]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/15 dark:bg-white/[0.04]">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                Pages Read ({viewMode === 'MONTHLY' ? 'Month' : viewMode === 'WEEKLY' ? 'Week' : 'Year'})
              </p>
              <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">{monthPages}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/15 dark:bg-white/[0.04]">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                Books Finished ({viewMode === 'MONTHLY' ? 'Month' : viewMode === 'WEEKLY' ? 'Week' : 'Year'})
              </p>
              <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">{booksFinished}</p>
            </div>
            <div className="grid gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/15 dark:bg-white/[0.04]">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Avg Pages / Day</p>
                <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">{averagePagesPerDay}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/15 dark:bg-white/[0.04]">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Streak</p>
                <p className="mt-1 inline-flex items-center gap-2 text-3xl font-black text-slate-900 dark:text-white">
                  <Flame className="h-6 w-6 text-amber-300" />
                  {streak}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 dark:border-emerald-300/30 dark:bg-emerald-500/10 dark:text-emerald-200">
              {pagesDelta >= 0 ? '+' : ''}{pagesDelta} pages vs {previousMonthLabel}
            </span>
            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sky-700 dark:border-sky-300/30 dark:bg-sky-500/10 dark:text-sky-200">
              {booksDelta >= 0 ? '+' : ''}{booksDelta} books finished
            </span>
          </div>
        </section>

        {isLoading || isSessionsLoading ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300">Loading reading insights...</div>
        ) : readingItems.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-white/20 dark:bg-black/20">
            <p className="text-xl font-semibold text-slate-900 dark:text-[#f5f5f1]">No tracked books yet.</p>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Track books from Library to unlock your Reading Insights.</p>
            <Link
              to="/library"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-900 dark:border-white/20 dark:text-slate-200 dark:hover:border-white/40 dark:hover:text-white"
            >
              Open Library <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 backdrop-blur-md dark:border-white/10 dark:bg-[#16181c]/85 lg:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Reading Calendar</p>
                  <h2 className="mt-1 font-library-display text-3xl text-slate-900 dark:text-[#f5f5f1]">{periodHeading}</h2>
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">{periodHint}</p>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${viewMode}-${selectedMonth}-${selectedDateKey ?? 'none'}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  {viewMode === 'MONTHLY' && (
                    <>
                      <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">
                        {DAY_LABEL.map((day) => (
                          <div key={day}>{day}</div>
                        ))}
                      </div>
                      <div className="mt-2 grid grid-cols-7 gap-2">
                        {calendarCells.map((day, idx) => {
                          if (day === null) {
                            return <div key={`empty-${idx}`} className="aspect-[1.05/1] rounded-xl bg-transparent" />
                          }

                          const date = new Date(year, monthIndex, day)
                          const dateKey = toDateKey(date)
                          const dayActivity = activityByDate.get(dateKey)
                          const dayPages = dayActivity?.pages ?? 0
                          const daySessions = dayActivity?.sessions ?? []
                          const sessionCount = daySessions.length
                          const hasSessions = sessionCount > 0
                          const isMultiSession = sessionCount > 1
                          const isSelected = selectedDateKey === dateKey
                          const previewSessions = daySessions.slice(0, 3)
                          const intensity = hasSessions && maxPagesInMonthDay > 0 ? Math.ceil((dayPages / maxPagesInMonthDay) * 4) : 0
                          const intensityClass =
                            intensity === 4
                              ? 'bg-emerald-400/18 border-emerald-300/55'
                              : intensity === 3
                                ? 'bg-emerald-400/14 border-emerald-300/45'
                                : intensity === 2
                                  ? 'bg-emerald-400/10 border-emerald-300/30'
                                  : intensity === 1
                                    ? 'bg-emerald-400/6 border-emerald-300/22'
                                    : 'bg-slate-100/60 border-slate-200/70 dark:bg-white/[0.02] dark:border-white/10'

                          const tooltip = hasSessions
                            ? `${MONTH_LABEL.format(date)} ${day}: ${dayPages} pages | ${daySessions.map((session) => session.title).join(', ')}`
                            : `${MONTH_LABEL.format(date)} ${day}: No reading sessions`

                          return (
                            <button
                              key={dateKey}
                              type="button"
                              title={tooltip}
                              onMouseEnter={() => setHoveredDateKey(dateKey)}
                              onMouseLeave={() => setHoveredDateKey(null)}
                              onClick={() => handleCalendarDayClick(dateKey)}
                              className={cn(
                                'group relative aspect-[1.05/1] overflow-hidden rounded-xl border p-2 text-left transition duration-300 hover:-translate-y-0.5',
                                hasSessions ? 'hover:border-emerald-300/60' : 'hover:border-slate-300/70 dark:hover:border-white/20',
                                isSelected ? (hasSessions ? 'ring-2 ring-emerald-300/60' : 'ring-2 ring-slate-300/80 dark:ring-white/30') : '',
                                intensityClass
                              )}
                            >
                              <div className="absolute inset-x-2 top-2 bottom-10">
                                {hasSessions ? (
                                  isMultiSession ? (
                                    previewSessions.map((session, stackIdx) => (
                                      <div
                                        key={`${dateKey}-${session.id}`}
                                        className={cn(
                                          'absolute h-[80%] w-[62%] overflow-hidden rounded-lg border border-white/45 shadow-[0_10px_24px_rgba(15,23,42,0.24)] transition-all duration-300',
                                          stackIdx === 0 ? 'left-[3%] top-[14%] rotate-[-12deg] z-[1] blur-[0.9px] opacity-85 saturate-75 group-hover:-translate-y-1.5' : '',
                                          stackIdx === 1 ? 'left-[20%] top-[8%] rotate-[-2deg] z-[2] blur-[0.45px] opacity-95 saturate-90 group-hover:-translate-y-2' : '',
                                          stackIdx === 2 ? 'left-[37%] top-[12%] rotate-[9deg] z-[3] group-hover:-translate-y-2.5' : '',
                                        )}
                                      >
                                        <BookCover src={session.coverImage} alt={session.title} className="h-full w-full" />
                                      </div>
                                    ))
                                  ) : (
                                    <div className="absolute left-1/2 top-[8%] h-[78%] w-[62%] -translate-x-1/2 overflow-hidden rounded-lg border border-white/45 shadow-[0_10px_24px_rgba(15,23,42,0.22)] transition-transform duration-300 group-hover:-translate-y-1">
                                      <BookCover src={previewSessions[0]?.coverImage} alt={previewSessions[0]?.title || 'Reading session'} className="h-full w-full" />
                                    </div>
                                  )
                                ) : null}
                              </div>

                              {isMultiSession && (
                                <span className="absolute right-2 top-2 rounded-full bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-white dark:bg-white/85 dark:text-slate-900">
                                  +{sessionCount - 1}
                                </span>
                              )}

                              {dayPages > 0 && (
                                <span className="absolute bottom-2 left-2 rounded-full bg-slate-900/70 px-1.5 py-0.5 text-[10px] font-semibold text-white dark:bg-white/80 dark:text-slate-900">
                                  {dayPages}p
                                </span>
                              )}

                              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-lg font-bold tracking-tight text-slate-700 dark:text-slate-200">
                                {day}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </>
                  )}

                  {viewMode === 'WEEKLY' && (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
                      {weeklyCalendarDays.map((day) => {
                        const isActive = selectedDateKey === day.key
                        const isFuture = day.key > todayKey
                        return (
                          <button
                            key={day.key}
                            type="button"
                            onMouseEnter={() => setHoveredDateKey(day.key)}
                            onMouseLeave={() => setHoveredDateKey(null)}
                            onClick={() => handleCalendarDayClick(day.key)}
                            className={cn(
                              'rounded-2xl border p-3 text-left transition hover:-translate-y-0.5',
                              isActive
                                ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-300/40 dark:bg-emerald-500/10'
                                : 'border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/25',
                              isFuture ? 'opacity-60' : '',
                            )}
                          >
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{day.label}</p>
                            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{day.date.getDate()}</p>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                              {day.pages > 0 ? `${day.pages} pages` : isFuture ? 'Future day' : 'No session'}
                            </p>
                            <div className="mt-2 flex -space-x-2">
                              {day.sessions.slice(0, 3).map((session) => (
                                <span key={session.id} className="h-8 w-6 overflow-hidden rounded border border-white/35">
                                  <BookCover src={session.coverImage} alt={session.title} className="h-full w-full" />
                                </span>
                              ))}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {viewMode === 'YEARLY' && (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {yearlyMonthCards.map((monthCard) => (
                        <button
                          key={monthCard.key}
                          type="button"
                          onClick={() => {
                            setViewMode('MONTHLY')
                            setSelectedMonth(monthCard.key)
                          }}
                          className="group rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:-translate-y-0.5 hover:border-emerald-300/60 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-emerald-300/40"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{monthCard.label}</p>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{monthCard.pages}p</span>
                          </div>
                          <div className="mt-3 h-20 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-black/20">
                            {monthCard.cover ? (
                              <BookCover src={monthCard.cover} alt={`${monthCard.label} top title`} className="h-full w-full" />
                            ) : (
                              <div className="grid h-full place-items-center text-xs text-slate-400 dark:text-slate-500">No sessions</div>
                            )}
                          </div>
                          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Open month</p>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {activeDay && (
                  <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-200/20 dark:bg-emerald-500/10 dark:text-emerald-100">
                  {activeDay.pages} pages logged across {activeDay.sessions.length} session{activeDay.sessions.length > 1 ? 's' : ''}.
                </div>
              )}
            </section>

            <div className="mb-20 mt-6 space-y-6 lg:mb-24">
              <section className="rounded-3xl border border-slate-200 bg-white p-4 backdrop-blur-md dark:border-white/10 dark:bg-[#16181c]/85 lg:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Reading Distribution</h3>
                  <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-500">
                    <BarChart3 className="h-4 w-4" />
                    Last 7 days
                  </span>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-black/20">
                  <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500">
                    <span className="whitespace-nowrap">{maxLastSevenDaysPages}p max</span>
                    <span className="whitespace-nowrap">0p min</span>
                  </div>
                  <div className="grid h-36 grid-cols-7 items-end gap-2 border-t border-dashed border-slate-300 pt-3 dark:border-white/15">
                    {lastSevenDays.map((day) => {
                      const barHeight = day.pages > 0 ? Math.max(10, (day.pages / maxLastSevenDaysPages) * 100) : 4
                      return (
                        <div key={day.key} className="group relative flex h-full flex-col items-center justify-end gap-2">
                          <div
                            className={cn(
                              'w-full rounded-sm transition group-hover:opacity-100',
                              day.pages > 0 ? 'bg-gradient-to-t from-emerald-500 to-teal-300 opacity-90' : 'bg-slate-300 dark:bg-white/10'
                            )}
                            style={{ height: `${barHeight}%` }}
                            title={`${day.shortDate}: ${day.pages} pages`}
                          />
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" title={day.shortDate}>
                            {day.compactLabel}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-4 backdrop-blur-md dark:border-white/10 dark:bg-[#16181c]/85 lg:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Sessions Timeline</h3>
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">{timelineSessions.length} sessions</span>
                </div>
                {timelineSessions.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500 dark:border-white/15 dark:bg-black/15 dark:text-slate-400">
                    No sessions logged for this {viewMode === 'MONTHLY' ? 'month' : viewMode === 'WEEKLY' ? 'week' : 'year'} yet.
                  </p>
                ) : (
                  <div className="no-scrollbar overflow-x-auto pb-2">
                    <div className="inline-flex min-w-full items-end gap-4 px-1 pt-1">
                      {timelineSessions.map((session) => (
                        <article key={session.id} className="group w-[132px] shrink-0 text-left sm:w-[142px]">
                          <Link to={`/books/${session.bookId}`} className="block">
                            <div className="overflow-visible rounded-[2px] shadow-[0_6px_14px_rgba(15,23,42,0.14)] transition duration-300 group-hover:-translate-y-1.5 group-hover:[transform:perspective(1000px)_rotateY(-8deg)_rotateX(3deg)] group-hover:shadow-[0_14px_24px_rgba(15,23,42,0.22)]">
                              <BookCover
                                src={session.coverImage}
                                alt={session.title}
                                className="aspect-[2/3] w-full"
                                variant="physical"
                              />
                            </div>
                          </Link>
                          <div className="mt-2">
                            <p className="truncate text-xs font-semibold text-slate-600 dark:text-slate-300">
                              {session.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {session.pages}p
                            </p>
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{session.title}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isComposerOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={closeComposer}
            >
              <motion.div
                initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                animate={{ opacity: 1, backdropFilter: 'blur(2px)' }}
                exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="absolute inset-0 bg-slate-900/28 dark:bg-black/16"
              />
              <motion.aside
                initial={{ opacity: 0, x: 40, scale: 0.985, filter: 'blur(6px)' }}
                animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: 28, scale: 0.99, filter: 'blur(4px)' }}
                transition={{ type: 'spring', stiffness: 260, damping: 28, mass: 0.85 }}
                onClick={(event) => event.stopPropagation()}
                className="pointer-events-auto fixed inset-y-0 right-0 h-screen w-full overflow-y-auto border-l border-slate-200/80 bg-gradient-to-br from-white via-slate-100 to-slate-200/85 p-5 pb-8 text-slate-900 shadow-[-24px_0_80px_rgba(15,23,42,0.22)] sm:w-[min(92vw,700px)] sm:p-6 sm:pb-8 dark:border-white/10 dark:bg-gradient-to-br dark:from-[#0f1114] dark:via-[#11161a] dark:to-[#0c0f12] dark:text-[#f3f3f1] dark:shadow-[-24px_0_80px_rgba(0,0,0,0.5)]"
              >
              <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-slate-400/35 dark:bg-white/20 lg:hidden" />
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-white/45">Reading Session</p>
                  <p className="mt-1 text-3xl font-library-display sm:text-[2.1rem]">
                    {new Date(`${composerDateKey}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-base text-slate-500 dark:text-white/45 sm:text-lg">{new Date(`${composerDateKey}T00:00:00`).getFullYear()}</p>
                </div>
                <button
                  type="button"
                  onClick={closeComposer}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-300/80 bg-white/55 text-slate-500 backdrop-blur-sm transition hover:text-slate-900 dark:border-white/15 dark:bg-transparent dark:text-white/60 dark:hover:text-white"
                  aria-label="Close session composer"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mt-5 relative min-h-[820px] [perspective:1400px]">
                <div
                  className={cn(
                    'relative min-h-[820px] transition-[transform,opacity] duration-700 [transform-style:preserve-3d]',
                    isComposerCardFlipped ? '[transform:rotateY(180deg)]' : '',
                  )}
                >
                  <div
                    className={cn(
                      'absolute inset-0 overflow-y-auto rounded-[1.5rem] border border-slate-200/80 bg-white/72 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] backdrop-blur-xl [backface-visibility:hidden] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none',
                      isComposerCardFlipped ? 'pointer-events-none opacity-0' : 'opacity-100',
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-white/45">Added Sessions</p>
                      <button
                        type="button"
                        onClick={() => {
                          setComposerSessionId(null)
                          setComposerError('')
                          setComposerDurationMin(15)
                          setIsPagesManual(false)
                          setComposerPagesInput(String(estimatePagesFromDuration(15)))
                          setIsComposerCardFlipped(true)
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-300/75 bg-white/70 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-white dark:border-white/15 dark:bg-white/[0.06] dark:text-white/85 dark:hover:bg-white/[0.12]"
                      >
                        <Plus className="h-4 w-4" /> Add
                      </button>
                    </div>
                    {composerDateSessions.length === 0 ? (
                      <div className="rounded-2xl border border-slate-200/80 bg-white/65 p-3 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/55">
                        No sessions logged for this day yet.
                      </div>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {composerDateSessions
                          .slice()
                          .sort((a, b) => b.date.getTime() - a.date.getTime())
                          .map((session) => (
                            <button
                              key={`day-session-${session.id}`}
                              type="button"
                              onClick={() => {
                                openComposerForDate(composerDateKey, session.id)
                                setIsComposerCardFlipped(true)
                              }}
                              className={cn(
                                'flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition',
                                composerSessionId === session.id
                                  ? 'border-white/40 bg-white text-black'
                                  : 'border-slate-200/80 bg-white/70 text-slate-700 hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-black/25 dark:text-white/85 dark:hover:border-white/30 dark:hover:bg-black/35',
                              )}
                            >
                              <div className="h-12 w-8 overflow-hidden rounded border border-slate-200 dark:border-white/20">
                                <BookCover src={session.coverImage} alt={session.title} className="h-full w-full" />
                              </div>
                              <div className="min-w-0">
                                <p className={cn('truncate text-sm font-semibold', composerSessionId === session.id ? 'text-black' : 'text-slate-800 dark:text-white')}>
                                  {session.title}
                                </p>
                                <p className={cn('text-xs', composerSessionId === session.id ? 'text-black/70' : 'text-slate-500 dark:text-white/55')}>
                                  {session.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} · {session.pages}p
                                </p>
                              </div>
                            </button>
                          ))}
                      </div>
                    )}

                    <blockquote className="mt-5 text-base font-library-display leading-relaxed text-slate-600 sm:text-[1.55rem] sm:leading-tight dark:text-white/70">
                      “{quoteOfDay.text}”
                      <footer className="mt-3 font-sans text-sm text-slate-500 sm:text-base dark:text-white/40">{quoteOfDay.author}</footer>
                    </blockquote>

                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setIsComposerCardFlipped(true)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 transition hover:bg-white dark:border-white/20 dark:bg-white/[0.06] dark:text-white/85 dark:hover:bg-white/[0.12]"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Flip to edit
                      </button>
                    </div>
                  </div>

                  <div
                    className={cn(
                      'absolute inset-0 overflow-y-auto rounded-[1.5rem] border border-slate-200/80 bg-white/72 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] backdrop-blur-xl [backface-visibility:hidden] [transform:rotateY(180deg)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none',
                      isComposerCardFlipped ? 'opacity-100' : 'pointer-events-none opacity-0',
                    )}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-white/45">Session Editor</p>
                      <button
                        type="button"
                        onClick={() => setIsComposerCardFlipped(false)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 transition hover:bg-white dark:border-white/20 dark:bg-white/[0.06] dark:text-white/85 dark:hover:bg-white/[0.12]"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Back to overview
                      </button>
                    </div>
                    <div className="space-y-7">
                <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-white/45">Add duration...</p>
                    <button
                      type="button"
                      onClick={() => setIsBookPickerOpen((prev) => !prev)}
                      className="mt-1 flex w-full items-center justify-between rounded-xl bg-slate-900/6 px-4 py-3 text-left text-base text-slate-800 transition hover:bg-slate-900/10 dark:bg-black/30 dark:text-white/90 dark:hover:bg-black/40"
                    >
                      <span className="truncate">{selectedTrackedBook?.title || 'No book selected'}</span>
                      <ChevronRight className={cn('h-4 w-4 text-slate-500 transition dark:text-white/45', isBookPickerOpen ? 'rotate-90' : '')} />
                    </button>
                    <AnimatePresence>
                      {isBookPickerOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="mt-2 max-h-44 space-y-1 overflow-y-auto rounded-xl bg-white/75 p-2 shadow-[0_10px_30px_rgba(15,23,42,0.12)] backdrop-blur-md dark:bg-black/35 dark:shadow-none"
                        >
                          {sessionTrackedBooks.length === 0 ? (
                            <div className="rounded-lg px-3 py-2 text-sm text-slate-500 dark:text-white/55">No book selected</div>
                          ) : (
                            sessionTrackedBooks.map((book) => (
                              <button
                                key={book.bookId}
                                type="button"
                                onClick={() => {
                                  setComposerBookId(book.bookId)
                                  setIsBookPickerOpen(false)
                                }}
                                className={cn(
                                  'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition',
                                  composerBookId === book.bookId ? 'bg-white text-black shadow-sm' : 'text-slate-700 hover:bg-white/75 dark:text-white/80 dark:hover:bg-white/10',
                                )}
                              >
                                <span className="truncate">{book.title}</span>
                                <span className={cn('ml-3 shrink-0 text-xs', composerBookId === book.bookId ? 'text-black/70' : 'text-slate-500 dark:text-white/45')}>
                                  {book.author}
                                </span>
                              </button>
                            ))
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="flex items-end">
                    <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-white/45">
                      Pages
                      <input
                        type="number"
                        min={1}
                        value={composerPagesInput}
                        onChange={(event) => {
                          setIsPagesManual(true)
                          setComposerPagesInput(event.target.value)
                        }}
                        className="mt-1 block w-20 rounded-xl bg-slate-900/6 px-2 py-2 text-center text-sm text-slate-800 outline-none ring-1 ring-slate-300/70 focus:ring-slate-400 dark:bg-black/20 dark:text-white/90 dark:ring-white/10 dark:focus:ring-white/25"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-slate-900/6 px-3 py-2 dark:bg-black/20">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-white/45">Start</p>
                    <div className="mt-1 inline-flex items-center gap-1.5 text-base font-semibold">
                      <Clock3 className="h-3.5 w-3.5 text-slate-500 dark:text-white/50" />
                      {isStartTimeEditing ? (
                        <input
                          type="time"
                          value={fromMinutesOfDay(composerStartMinute)}
                          onChange={(event) => handleDirectStartTimeChange(event.target.value)}
                          onBlur={() => setIsStartTimeEditing(false)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === 'Escape') {
                              setIsStartTimeEditing(false)
                            }
                          }}
                          className="w-[92px] rounded-md border border-slate-300 bg-white/70 px-2 py-1 text-sm tracking-wide text-slate-900 outline-none focus:border-slate-500 dark:border-white/20 dark:bg-black/25 dark:text-white dark:focus:border-white/45"
                          autoFocus
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsStartTimeEditing(true)}
                          className="rounded-md bg-transparent tracking-wide text-slate-900 transition hover:text-slate-700 dark:text-white/95 dark:hover:text-white"
                        >
                          {fromMinutesOfDay(composerStartMinute)}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-900/6 px-3 py-2 dark:bg-black/20">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-white/45">Duration</p>
                    <div className="mt-1">
                      {isDurationEditing ? (
                        <div className="inline-flex items-center gap-1.5 text-sm font-semibold">
                          <input
                            type="number"
                            min={1}
                            max={maxAllowedDuration}
                            value={durationDraft}
                            onChange={(event) => setDurationDraft(event.target.value)}
                            onBlur={commitDurationDraft}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') commitDurationDraft()
                              if (event.key === 'Escape') {
                                setDurationDraft(String(composerDurationMin))
                                setIsDurationEditing(false)
                              }
                            }}
                            className="w-12 rounded-md border border-slate-300 bg-white/80 px-2 py-1 text-center text-sm text-slate-900 outline-none focus:border-slate-500 dark:border-white/20 dark:bg-black/25 dark:text-white dark:focus:border-white/45"
                            autoFocus
                          />
                          <span className="text-slate-700 dark:text-white/85">min</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsDurationEditing(true)}
                          className="rounded-md bg-transparent text-base font-semibold text-slate-800 transition hover:text-slate-900 dark:text-white/95 dark:hover:text-white"
                        >
                          {durationDisplay}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-900/6 px-3 py-2 dark:bg-black/20">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-white/45">End</p>
                    <p className="mt-1 text-base font-semibold text-slate-800 dark:text-white/90">
                      {sessionEndAt ? sessionEndAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '--:--'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div
                    className="relative h-[320px] w-[320px] [touch-action:none]"
                    onPointerDown={(event) => {
                      event.stopPropagation()
                      beginDialDrag(event)
                    }}
                  >
                    <div className="pointer-events-none absolute inset-5 rounded-full bg-[radial-gradient(circle_at_45%_35%,rgba(15,23,42,0.12),rgba(255,255,255,0.02)_58%,rgba(15,23,42,0.08))] blur-[1px] dark:bg-[radial-gradient(circle_at_45%_35%,rgba(255,255,255,0.13),rgba(255,255,255,0.02)_55%,rgba(0,0,0,0.25))]" />
                    <svg
                      ref={dialRef}
                      viewBox="0 0 320 320"
                      className="h-full w-full cursor-grab [touch-action:none] active:cursor-grabbing"
                    >
                      <circle cx="160" cy="160" r="128" stroke="currentColor" strokeWidth="28" fill="none" className="text-slate-500/20 dark:text-white/[0.05]" />
                      <circle cx="160" cy="160" r="106" stroke="currentColor" strokeWidth="10" fill="none" className="text-slate-500/30 dark:text-white/[0.08]" />
                      {Array.from({ length: 120 }).map((_, idx) => {
                        const tickAngle = (idx / 120) * 360
                        const start = pointOnCircle(tickAngle, 114)
                        const end = pointOnCircle(tickAngle, 124)
                        return (
                          <line
                            key={`dial-tick-${idx}`}
                            x1={start.x}
                            y1={start.y}
                            x2={end.x}
                            y2={end.y}
                            stroke={exceedsSessionLimit ? 'rgba(254,202,202,0.75)' : 'currentColor'}
                            strokeWidth={idx % 5 === 0 ? 2 : 1.3}
                            strokeLinecap="round"
                            className={cn(!exceedsSessionLimit && 'text-slate-500/65 dark:text-white/[0.32]')}
                          />
                        )
                      })}
                      {isMultiRotationDuration ? (
                        <circle
                          cx="160"
                          cy="160"
                          r="128"
                          stroke={composerError || exceedsSessionLimit ? '#f87171' : 'url(#durationStroke)'}
                          strokeWidth="28"
                          fill="none"
                          className={cn(
                            'transition-all duration-200',
                            dragMode ? 'drop-shadow-[0_0_18px_rgba(255,255,255,0.35)]' : 'drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]',
                          )}
                        />
                      ) : (
                        <path
                          d={dialArcPath}
                          stroke={composerError || exceedsSessionLimit ? '#f87171' : 'url(#durationStroke)'}
                          strokeWidth="28"
                          strokeLinecap="round"
                          fill="none"
                          className={cn(
                            'transition-all duration-200',
                            dragMode ? 'drop-shadow-[0_0_18px_rgba(255,255,255,0.35)]' : 'drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]',
                          )}
                        />
                      )}
                      {Array.from({ length: 12 }).map((_, idx) => {
                        const minute = idx * 5
                        const labelPoint = pointOnCircle((minute / 60) * 360, 78)
                        return (
                          <text
                            key={`minute-label-${minute}`}
                            x={labelPoint.x}
                            y={labelPoint.y}
                            fill="currentColor"
                            fontSize={minute === 0 || minute === 30 ? 17 : 15}
                            fontWeight={600}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-slate-500/80 dark:text-white/[0.66]"
                          >
                            {minute}
                          </text>
                        )
                      })}
                      <circle cx={startHandlePoint.x} cy={startHandlePoint.y} r="18" fill="rgba(248,250,252,0.94)" />
                      <circle cx={endHandlePoint.x} cy={endHandlePoint.y} r="20" fill={composerError || exceedsSessionLimit ? '#ef4444' : '#dbeafe'} />
                      <defs>
                        <linearGradient id="durationStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#e2e8f0" />
                          <stop offset="100%" stopColor="#64748b" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                      <p className="rounded-full bg-white/60 px-4 py-1.5 text-sm font-medium uppercase tracking-[0.2em] text-slate-500 backdrop-blur-sm dark:bg-black/28 dark:text-white/55">Duration</p>
                    </div>
                    <motion.div
                      animate={{ scale: dragMode === 'START' ? 1.12 : 1 }}
                      transition={{ type: 'spring', stiffness: 520, damping: 28 }}
                      className="pointer-events-none absolute"
                      style={{ left: `${(startHandlePoint.x / 320) * 100}%`, top: `${(startHandlePoint.y / 320) * 100}%` }}
                    >
                      <div className="flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-slate-900">
                        <BookOpen className="h-4 w-4 -translate-x-[0.5px] -translate-y-[0.5px]" />
                      </div>
                    </motion.div>
                    <motion.div
                      animate={{ scale: dragMode === 'END' ? 1.14 : 1 }}
                      transition={{ type: 'spring', stiffness: 520, damping: 28 }}
                      className="pointer-events-none absolute"
                      style={{
                        left: `${(endHandlePoint.x / 320) * 100}%`,
                        top: `${(endHandlePoint.y / 320) * 100}%`,
                      }}
                    >
                      <div
                        className={cn(
                          'flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full',
                          composerError || exceedsSessionLimit ? 'text-rose-100' : 'text-slate-900',
                        )}
                      >
                        <Book className="h-4 w-4 -translate-x-[0.5px] -translate-y-[0.5px]" />
                      </div>
                    </motion.div>
                    {dragMode === 'END' && composerDurationMin >= 60 && (
                      <>
                        <div className="pointer-events-none absolute left-[-48px] top-1/2 -translate-y-1/2 rounded-full bg-white/70 px-2.5 py-1.5 text-base font-semibold tracking-wide text-slate-500 backdrop-blur-sm dark:bg-white/8 dark:text-white/65">
                          -1H
                        </div>
                        <div className="pointer-events-none absolute right-[-48px] top-1/2 -translate-y-1/2 rounded-full bg-white/70 px-2.5 py-1.5 text-base font-semibold tracking-wide text-slate-500 backdrop-blur-sm dark:bg-white/8 dark:text-white/65">
                          +1H
                        </div>
                      </>
                    )}
                  </div>
                  {!hasDialInteracted && (
                    <p className="mt-2 rounded-full bg-white/65 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500 dark:bg-white/8 dark:text-white/60">
                      Drag outer handle to set minutes
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-500 dark:text-white/45">Full ring = 60 min. Drag clockwise to add time, anticlockwise to subtract.</p>
                </div>

                {(composerError || isComposerFutureDate) && (
                  <p className="mt-4 text-center text-sm font-medium text-rose-400 sm:text-base">
                    {composerError || 'You can only log sessions for today or past dates.'}
                  </p>
                )}
                {!composerError && !isComposerFutureDate && exceedsSessionLimit && (
                  <p className="mt-4 text-center text-sm font-medium text-rose-400 sm:text-base">
                    Sessions cannot exceed 8 hours.
                  </p>
                )}
                  </div>
                  <button
                    type="button"
                    onClick={submitSession}
                    disabled={createReadingSession.isPending || updateReadingSession.isPending}
                    className="mt-6 w-full rounded-2xl bg-slate-900 py-3 text-xl font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90"
                  >
                    {(createReadingSession.isPending || updateReadingSession.isPending) ? 'Saving...' : 'Done'}
                  </button>
                </div>
              </div>
              </div>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <div className="fixed bottom-4 left-1/2 z-30 w-[min(92vw,420px)] -translate-x-1/2 rounded-full border border-slate-300 bg-white/85 p-2 backdrop-blur-xl dark:border-white/15 dark:bg-black/45 lg:hidden">
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <Link to="/" className="rounded-full px-3 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10">Home</Link>
          <Link to="/library" className="rounded-full px-3 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10">Library</Link>
          <span className="rounded-full bg-slate-200 px-3 py-2 font-semibold text-slate-900 dark:bg-white/15 dark:text-white">Insights</span>
        </div>
      </div>
    </div>
  )
}

export default MyBooksPage
