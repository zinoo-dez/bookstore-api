import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { createBookSchema, type CreateBookData, type Book } from '@/lib/schemas'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import CategoryInput from '@/components/ui/CategoryInput'

interface BookFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateBookData) => void
  book?: Book | null
  isLoading?: boolean
}

const BookFormModal = ({ isOpen, onClose, onSubmit, book, isLoading }: BookFormModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateBookData>({
    resolver: zodResolver(createBookSchema),
    defaultValues: book ? {
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      price: Number(book.price),
      stock: book.stock,
      description: book.description || '',
      coverImage: book.coverImage || '',
      categories: book.categories || [],
    } : undefined,
  })

  useEffect(() => {
    if (book) {
      reset({
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        price: Number(book.price),
        stock: book.stock,
        description: book.description || '',
        coverImage: book.coverImage || '',
        categories: book.categories || [],
      })
    } else {
      reset({
        title: '',
        author: '',
        isbn: '',
        price: 0,
        stock: 0,
        description: '',
        coverImage: '',
        categories: [],
      })
    }
  }, [book, reset])

  const handleFormSubmit = (data: CreateBookData) => {
    onSubmit(data)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black bg-opacity-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto dark:bg-slate-900 dark:border dark:border-slate-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b dark:border-slate-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                {book ? 'Edit Book' : 'Add New Book'}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl dark:text-slate-500 dark:hover:text-amber-300"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6">
              <div className="space-y-4">
                <Input
                  {...register('title')}
                  label="Title"
                  placeholder="Enter book title"
                  error={errors.title?.message}
                />

                <Input
                  {...register('author')}
                  label="Author"
                  placeholder="Enter author name"
                  error={errors.author?.message}
                />

                <Input
                  {...register('isbn')}
                  label="ISBN"
                  placeholder="Enter ISBN (10-17 characters)"
                  error={errors.isbn?.message}
                />

                <Input
                  {...register('coverImage')}
                  label="Cover Image URL (Optional)"
                  placeholder="https://example.com/book-cover.jpg"
                  error={errors.coverImage?.message}
                />

                <Controller
                  name="categories"
                  control={control}
                  render={({ field }) => (
                    <CategoryInput
                      value={field.value || []}
                      onChange={field.onChange}
                      error={errors.categories?.message}
                    />
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    {...register('price', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    label="Price"
                    placeholder="0.00"
                    error={errors.price?.message}
                  />

                  <Input
                    {...register('stock', { valueAsNumber: true })}
                    type="number"
                    label="Stock"
                    placeholder="0"
                    error={errors.stock?.message}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
                    Description (Optional)
                  </label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    placeholder="Enter book description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isLoading}>
                  {book ? 'Update Book' : 'Add Book'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default BookFormModal
