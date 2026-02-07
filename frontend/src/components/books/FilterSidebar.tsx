import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFilterStore } from '@/store/filter.store'
import { cn } from '@/lib/utils'

// Available categories
const CATEGORIES = [
    'Fiction',
    'Non-Fiction',
    'Science Fiction',
    'Mystery',
    'Romance',
    'Biography',
    'History',
    'Self-Help',
    'Programming',
    'Technology'
]

const SORT_OPTIONS = [
    { label: 'Title (A-Z)', value: 'title', order: 'asc' },
    { label: 'Price (Low to High)', value: 'price', order: 'asc' },
    { label: 'Price (High to Low)', value: 'price', order: 'desc' },
    { label: 'Rating (High to Low)', value: 'rating', order: 'desc' },
    { label: 'Newest Arrivals', value: 'createdAt', order: 'desc' },
]

interface FilterSidebarProps {
    className?: string
}

// Extract FilterContent as a separate component to prevent re-creation
interface FilterContentProps {
    title: string
    author: string
    category: string
    minPrice: number | null
    maxPrice: number | null
    minRating: number | null
    inStockOnly: boolean
    sortBy: string
    sortOrder: 'asc' | 'desc'
    setTitle: (title: string) => void
    setAuthor: (author: string) => void
    setCategory: (category: string) => void
    setPriceRange: (min: number | null, max: number | null) => void
    setMinRating: (rating: number | null) => void
    setInStockOnly: (inStock: boolean) => void
    setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => void
    applyFilters: () => void
    resetFilters: () => void
    activeFilterCount: number
    openSections: { search: boolean; filters: boolean; sorting: boolean }
    toggleSection: (section: keyof { search: boolean; filters: boolean; sorting: boolean }) => void
}

const FilterContent = ({
    title,
    author,
    category,
    minPrice,
    maxPrice,
    minRating,
    inStockOnly,
    sortBy,
    sortOrder,
    setTitle,
    setAuthor,
    setCategory,
    setPriceRange,
    setMinRating,
    setInStockOnly,
    setSorting,
    applyFilters,
    resetFilters,
    activeFilterCount,
    openSections,
    toggleSection,
}: FilterContentProps) => (
    <div className="space-y-4">
        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
            <button
                onClick={() => toggleSection('search')}
                className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
            >
                <div className="flex items-center gap-2.5">
                    <span className="text-lg">🔍</span>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Search</h3>
                </div>
                <motion.svg
                    animate={{ rotate: openSections.search ? 180 : 0 }}
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
            </button>
            <AnimatePresence>
                {openSections.search && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="px-5 pb-5 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Book Title</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        placeholder="Atomic Habits..."
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 text-sm transition-all group-hover:bg-white"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Author</label>
                                <input
                                    type="text"
                                    placeholder="James Clear..."
                                    value={author}
                                    onChange={(e) => setAuthor(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 text-sm transition-all hover:bg-white"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
            <button
                onClick={() => toggleSection('filters')}
                className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
            >
                <div className="flex items-center gap-2.5">
                    <span className="text-lg">🎛</span>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Filters</h3>
                </div>
                <motion.svg
                    animate={{ rotate: openSections.filters ? 180 : 0 }}
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
            </button>
            <AnimatePresence>
                {openSections.filters && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="px-5 pb-5 space-y-6">
                            {/* Category */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-sm appearance-none cursor-pointer hover:bg-white transition-all"
                                >
                                    <option value="">All Categories</option>
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Price Range */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Price Range</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative group">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            value={minPrice ?? ''}
                                            onChange={(e) => setPriceRange(e.target.value ? Number(e.target.value) : null, maxPrice)}
                                            className="w-full pl-7 pr-3 py-2 bg-gray-50/50 border border-gray-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all hover:bg-white"
                                        />
                                    </div>
                                    <div className="relative group">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            value={maxPrice ?? ''}
                                            onChange={(e) => setPriceRange(minPrice, e.target.value ? Number(e.target.value) : null)}
                                            className="w-full pl-7 pr-3 py-2 bg-gray-50/50 border border-gray-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all hover:bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Rating */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Min. Rating</label>
                                <div className="flex justify-between items-center bg-gray-50/50 p-2 rounded-xl border border-gray-100">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setMinRating(minRating === star ? null : star)}
                                            className={cn(
                                                "p-1.5 rounded-lg transition-all",
                                                (minRating ?? 0) >= star ? "text-yellow-400 scale-110" : "text-gray-300 hover:text-gray-400"
                                            )}
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Availability */}
                            <label className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-100 cursor-pointer group hover:bg-white transition-all">
                                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider group-hover:text-primary-600 transition-colors">In Stock Only</span>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={inStockOnly}
                                        onChange={(e) => setInStockOnly(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                                </div>
                            </label>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Sort Section */}
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
            <button
                onClick={() => toggleSection('sorting')}
                className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
            >
                <div className="flex items-center gap-2.5">
                    <span className="text-lg">⇅</span>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Sort By</h3>
                </div>
                <motion.svg
                    animate={{ rotate: openSections.sorting ? 180 : 0 }}
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
            </button>
            <AnimatePresence>
                {openSections.sorting && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="px-5 pb-5 space-y-2">
                            {SORT_OPTIONS.map((option) => {
                                const isActive = sortBy === option.value && sortOrder === option.order
                                return (
                                    <button
                                        key={`${option.value}-${option.order}`}
                                        onClick={() => setSorting(option.value, option.order as any)}
                                        className={cn(
                                            "w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border",
                                            isActive
                                                ? "bg-primary-50 text-primary-700 border-primary-100 shadow-sm shadow-primary-100/50"
                                                : "text-gray-500 hover:text-gray-700 border-transparent hover:bg-gray-50"
                                        )}
                                    >
                                        {option.label}
                                    </button>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Show Results Button */}
        <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={applyFilters}
            className="w-full py-4 px-6 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg hover:shadow-xl active:scale-95"
        >
            Show Results
        </motion.button>

        {/* Reset Button */}
        {activeFilterCount > 0 && (
            <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={resetFilters}
                className="w-full py-4 px-6 bg-gray-900 hover:bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
                Reset All Filters ({activeFilterCount})
            </motion.button>
        )}
    </div>
)

const FilterSidebar = ({ className }: FilterSidebarProps) => {
    const {
        title,
        author,
        category,
        minPrice,
        maxPrice,
        minRating,
        inStockOnly,
        sortBy,
        sortOrder,
        isSidebarOpen,
        isMobileSidebarOpen,
        setTitle,
        setAuthor,
        setCategory,
        setPriceRange,
        setMinRating,
        setInStockOnly,
        setSorting,
        applyFilters,
        toggleSidebar,
        toggleMobileSidebar,
        resetFilters,
    } = useFilterStore()

    // Accordion state
    const [openSections, setOpenSections] = useState({
        search: true,
        filters: true,
        sorting: true
    })

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
    }

    const activeFilterCount =
        (title ? 1 : 0) +
        (author ? 1 : 0) +
        (category ? 1 : 0) +
        (minPrice !== null || maxPrice !== null ? 1 : 0) +
        (minRating !== null ? 1 : 0) +
        (inStockOnly ? 1 : 0)

    return (
        <>
            {/* Desktop Sidebar */}
            <div className={cn('hidden lg:block', className)}>
                <motion.div
                    initial={false}
                    animate={{ width: isSidebarOpen ? 300 : 70 }}
                    className="sticky top-24 h-[calc(100vh-8rem)] bg-gray-50/30 rounded-3xl p-2 border border-white transition-all shadow-inner"
                >
                    <div className="h-full flex flex-col p-2">
                        <div className="flex items-center justify-between mb-6 px-0 pt-2">
                            <AnimatePresence>
                                {isSidebarOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center gap-3"
                                    >
                                        <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-200">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                            </svg>
                                        </div>
                                        <span className="text-sm font-black uppercase tracking-widest text-gray-900">Explore</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <button
                                onClick={toggleSidebar}
                                className="p-2.5 bg-white hover:bg-gray-50 rounded-xl transition-all shadow-sm border border-gray-100 hover:scale-110 active:scale-90"
                            >
                                <motion.div animate={{ rotate: isSidebarOpen ? 0 : 180 }}>
                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                    </svg>
                                </motion.div>
                            </button>
                        </div>

                        {isSidebarOpen ? (
                            <div className="flex-1 overflow-y-auto px-2 custom-scrollbar space-y-4">
                                <FilterContent
                                    title={title}
                                    author={author}
                                    category={category}
                                    minPrice={minPrice}
                                    maxPrice={maxPrice}
                                    minRating={minRating}
                                    inStockOnly={inStockOnly}
                                    sortBy={sortBy}
                                    sortOrder={sortOrder}
                                    setTitle={setTitle}
                                    setAuthor={setAuthor}
                                    setCategory={setCategory}
                                    setPriceRange={setPriceRange}
                                    setMinRating={setMinRating}
                                    setInStockOnly={setInStockOnly}
                                    setSorting={setSorting}
                                    applyFilters={applyFilters}
                                    resetFilters={resetFilters}
                                    activeFilterCount={activeFilterCount}
                                    openSections={openSections}
                                    toggleSection={toggleSection}
                                />
                            </div>
                        ) : null}
                    </div>
                </motion.div>
            </div>

            {/* Mobile Drawer (Truncated for brevity, assuming standard implementation) */}
            <AnimatePresence>
                {isMobileSidebarOpen && (
                    <div className="lg:hidden fixed inset-0 z-50">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={toggleMobileSidebar}
                            className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white shadow-2xl overflow-y-auto px-6 py-8"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-black uppercase tracking-widest text-gray-900">Filters</h2>
                                <button onClick={toggleMobileSidebar} className="p-2 bg-gray-100 rounded-xl">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <FilterContent
                                title={title}
                                author={author}
                                category={category}
                                minPrice={minPrice}
                                maxPrice={maxPrice}
                                minRating={minRating}
                                inStockOnly={inStockOnly}
                                sortBy={sortBy}
                                sortOrder={sortOrder}
                                setTitle={setTitle}
                                setAuthor={setAuthor}
                                setCategory={setCategory}
                                setPriceRange={setPriceRange}
                                setMinRating={setMinRating}
                                setInStockOnly={setInStockOnly}
                                setSorting={setSorting}
                                applyFilters={applyFilters}
                                resetFilters={resetFilters}
                                activeFilterCount={activeFilterCount}
                                openSections={openSections}
                                toggleSection={toggleSection}
                            />
                            <button
                                onClick={toggleMobileSidebar}
                                className="mt-8 w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-primary-200"
                            >
                                Show Results
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>
        </>
    )
}

export default FilterSidebar
