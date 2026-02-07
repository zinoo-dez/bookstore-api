import { useState } from 'react'

interface CategoryInputProps {
    value: string[]
    onChange: (categories: string[]) => void
    error?: string
}

const SUGGESTED_CATEGORIES = [
    'Fiction',
    'Non-Fiction',
    'Science Fiction',
    'Fantasy',
    'Mystery',
    'Thriller',
    'Romance',
    'Horror',
    'Biography',
    'History',
    'Self-Help',
    'Business',
    'Technology',
    'Science',
    'Philosophy',
    'Poetry',
    'Children',
    'Young Adult',
]

const CategoryInput = ({ value = [], onChange, error }: CategoryInputProps) => {
    const [inputValue, setInputValue] = useState('')

    const addCategory = (category: string) => {
        const trimmed = category.trim()
        if (trimmed && !value.includes(trimmed)) {
            onChange([...value, trimmed])
            setInputValue('')
        }
    }

    const removeCategory = (index: number) => {
        onChange(value.filter((_, i) => i !== index))
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            addCategory(inputValue)
        }
    }

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Categories/Genres (Optional)
            </label>

            {/* Selected Categories */}
            {value.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-50 rounded-lg">
                    {value.map((cat, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center gap-1 bg-primary-100 text-primary-700 px-2 py-1 rounded text-sm"
                        >
                            {cat}
                            <button
                                type="button"
                                onClick={() => removeCategory(index)}
                                className="hover:text-primary-900 font-bold"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Input */}
            <input
                type="text"
                list="category-suggestions"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type and press Enter to add categories"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />

            {/* Suggestions */}
            <datalist id="category-suggestions">
                {SUGGESTED_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} />
                ))}
            </datalist>

            {/* Quick Add Buttons */}
            <div className="flex flex-wrap gap-1 mt-2">
                {SUGGESTED_CATEGORIES.filter(cat => !value.includes(cat)).slice(0, 6).map((cat) => (
                    <button
                        key={cat}
                        type="button"
                        onClick={() => addCategory(cat)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors"
                    >
                        + {cat}
                    </button>
                ))}
            </div>

            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    )
}

export default CategoryInput
