import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface FilterState {
    // Search filters (draft state - not yet applied)
    title: string
    author: string
    category: string
    minPrice: number | null
    maxPrice: number | null
    minRating: number | null
    inStockOnly: boolean
    sortBy: string
    sortOrder: 'asc' | 'desc'
    page: number
    limit: number

    // Applied filters (used for API calls)
    appliedFilters: {
        title: string
        author: string
        category: string
        minPrice: number | null
        maxPrice: number | null
        minRating: number | null
        inStockOnly: boolean
        sortBy: string
        sortOrder: 'asc' | 'desc'
        page: number
        limit: number
    }

    // UI state
    isSidebarOpen: boolean
    isMobileSidebarOpen: boolean

    // Actions
    setTitle: (title: string) => void
    setAuthor: (author: string) => void
    setCategory: (category: string) => void
    setPriceRange: (min: number | null, max: number | null) => void
    setMinRating: (rating: number | null) => void
    setInStockOnly: (inStock: boolean) => void
    setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => void
    setPage: (page: number) => void
    applyFilters: () => void
    toggleSidebar: () => void
    toggleMobileSidebar: () => void
    resetFilters: () => void
}

const initialFilters = {
    title: '',
    author: '',
    category: '',
    minPrice: null,
    maxPrice: null,
    minRating: null,
    inStockOnly: false,
    sortBy: 'title',
    sortOrder: 'asc' as const,
    page: 1,
    limit: 12,
}

export const useFilterStore = create<FilterState>()(
    persist(
        (set, get) => ({
            ...initialFilters,
            appliedFilters: { ...initialFilters },
            isSidebarOpen: true,
            isMobileSidebarOpen: false,

            setTitle: (title) => set({ title }),
            setAuthor: (author) => set({ author }),
            setCategory: (category) => set({ category }),
            setPriceRange: (min, max) => set({ minPrice: min, maxPrice: max }),
            setMinRating: (rating) => set({ minRating: rating }),
            setInStockOnly: (inStock) => set({ inStockOnly: inStock }),
            setSorting: (sortBy, sortOrder) => set({ sortBy, sortOrder }),
            setPage: (page) => {
                // When page changes, apply it immediately to appliedFilters
                set({ page, appliedFilters: { ...get().appliedFilters, page } })
            },
            applyFilters: () => {
                const state = get()
                set({
                    appliedFilters: {
                        title: state.title,
                        author: state.author,
                        category: state.category,
                        minPrice: state.minPrice,
                        maxPrice: state.maxPrice,
                        minRating: state.minRating,
                        inStockOnly: state.inStockOnly,
                        sortBy: state.sortBy,
                        sortOrder: state.sortOrder,
                        page: 1, // Reset to page 1 when applying new filters
                        limit: state.limit,
                    },
                    page: 1, // Also reset the draft page
                })
            },
            toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
            toggleMobileSidebar: () => set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
            resetFilters: () => {
                set({
                    ...initialFilters,
                    appliedFilters: { ...initialFilters },
                })
            },
        }),
        {
            name: 'filter-storage',
            storage: createJSONStorage(() => sessionStorage),
            partialize: (state) => ({
                title: state.title,
                author: state.author,
                category: state.category,
                minPrice: state.minPrice,
                maxPrice: state.maxPrice,
                minRating: state.minRating,
                inStockOnly: state.inStockOnly,
                sortBy: state.sortBy,
                sortOrder: state.sortOrder,
                page: state.page,
                limit: state.limit,
                appliedFilters: state.appliedFilters,
            }),
        }
    )
)
