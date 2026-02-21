export type LibraryList = {
  name: string
  bookIds: string[]
}

type LibraryListsStore = {
  lists: LibraryList[]
}

const STORAGE_KEY = 'treasurehouse.library.customLists.v1'
const DEFAULT_LISTS = ['Recs 5 stars', 'Weekend Reads', 'Reference Shelf']

const dedupe = (values: string[]) => Array.from(new Set(values))

const normalizeStore = (value: unknown): LibraryListsStore => {
  if (!value || typeof value !== 'object') return { lists: [] }
  const raw = (value as { lists?: unknown }).lists
  if (!Array.isArray(raw)) return { lists: [] }
  const lists: LibraryList[] = raw
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const name = String((item as { name?: unknown }).name ?? '').trim()
      const bookIdsRaw = (item as { bookIds?: unknown }).bookIds
      const bookIds = Array.isArray(bookIdsRaw)
        ? dedupe(bookIdsRaw.map((bookId) => String(bookId)).filter(Boolean))
        : []
      return { name, bookIds }
    })
    .filter((item) => item.name.length > 0)
  return { lists }
}

const readStore = (): LibraryListsStore => {
  if (typeof window === 'undefined') return { lists: [] }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { lists: [] }
    return normalizeStore(JSON.parse(raw))
  } catch {
    return { lists: [] }
  }
}

const writeStore = (store: LibraryListsStore) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export const getLibraryLists = (): LibraryList[] => {
  const store = readStore()
  const names = new Set(store.lists.map((item) => item.name.toLowerCase()))
  const seeded = [...store.lists]
  for (const defaultName of DEFAULT_LISTS) {
    if (!names.has(defaultName.toLowerCase())) {
      seeded.push({ name: defaultName, bookIds: [] })
    }
  }
  return seeded
}

export const getListsForBook = (bookId: string): string[] => {
  return getLibraryLists()
    .filter((list) => list.bookIds.includes(bookId))
    .map((list) => list.name)
}

export const createLibraryList = (name: string): LibraryList[] => {
  const trimmed = name.trim()
  if (!trimmed) return getLibraryLists()
  const store = readStore()
  const exists = store.lists.some((item) => item.name.toLowerCase() === trimmed.toLowerCase())
  if (!exists) {
    store.lists.push({ name: trimmed, bookIds: [] })
    writeStore(store)
  }
  return getLibraryLists()
}

export const toggleBookInLibraryList = (bookId: string, listName: string): LibraryList[] => {
  const trimmed = listName.trim()
  if (!trimmed) return getLibraryLists()
  const store = readStore()
  const index = store.lists.findIndex((item) => item.name.toLowerCase() === trimmed.toLowerCase())
  if (index === -1) {
    store.lists.push({ name: trimmed, bookIds: [bookId] })
    writeStore(store)
    return getLibraryLists()
  }

  const list = store.lists[index]
  if (list.bookIds.includes(bookId)) {
    list.bookIds = list.bookIds.filter((id) => id !== bookId)
  } else {
    list.bookIds = dedupe([...list.bookIds, bookId])
  }
  store.lists[index] = list
  writeStore(store)
  return getLibraryLists()
}
