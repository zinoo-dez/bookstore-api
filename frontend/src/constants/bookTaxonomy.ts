export const BOOK_CATEGORIES = [
  'Fiction',
  'Non-Fiction',
  'Children',
  'Academic',
  'Comics & Graphic Novels',
  'Reference',
] as const

export const BOOK_GENRES_BY_CATEGORY: Record<(typeof BOOK_CATEGORIES)[number], string[]> = {
  Fiction: [
    'Fantasy',
    'Sci-Fi',
    'Mystery',
    'Thriller',
    'Romance',
    'Historical Fiction',
    'Literary Fiction',
  ],
  'Non-Fiction': [
    'Biography',
    'Memoir',
    'Self-Help',
    'Business',
    'History',
    'Psychology',
    'Health',
    'Science',
  ],
  Children: ['Picture Book', 'Middle Grade', 'Young Adult'],
  Academic: ['Computer Science', 'Mathematics', 'Economics', 'Engineering', 'Medicine'],
  'Comics & Graphic Novels': ['Manga', 'Superhero', 'Graphic Memoir'],
  Reference: ['Dictionary', 'Encyclopedia', 'Atlas'],
}

export const BOOK_GENRES = Array.from(
  new Set(Object.values(BOOK_GENRES_BY_CATEGORY).flat()),
).sort((a, b) => a.localeCompare(b))
