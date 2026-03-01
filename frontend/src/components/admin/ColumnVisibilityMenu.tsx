import { type Dispatch, type SetStateAction, useMemo, useState } from 'react'
import { Check, ChevronDown, Columns } from 'lucide-react'

type ColumnOption<T extends Record<string, boolean>> = {
  key: keyof T
  label: string
}

type ColumnVisibilityMenuProps<T extends Record<string, boolean>> = {
  visibleColumns: T
  setVisibleColumns: Dispatch<SetStateAction<T>>
  options: Array<ColumnOption<T>>
  className?: string
}

const ColumnVisibilityMenu = <T extends Record<string, boolean>>({
  visibleColumns,
  setVisibleColumns,
  options,
  className = '',
}: ColumnVisibilityMenuProps<T>) => {
  const [isOpen, setIsOpen] = useState(false)

  const visibleCount = useMemo(
    () => options.filter((option) => visibleColumns[option.key]).length,
    [options, visibleColumns],
  )

  const resetColumns = () => {
    setVisibleColumns((prev) => {
      const next = { ...prev }
      for (const option of options) {
        next[option.key] = true as T[keyof T]
      }
      return next
    })
  }

  return (
    <div className={`relative ${isOpen ? 'z-[140]' : 'z-20'} ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:ring-amber-500/20"
      >
        <Columns className="h-4 w-4" />
        Columns ({visibleCount}/{options.length})
        <ChevronDown className={`h-4 w-4 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-[150] mt-2 w-full max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Show Columns</p>
            <button
              type="button"
              onClick={resetColumns}
              className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:border-amber-300 hover:text-amber-500 dark:border-slate-700 dark:text-slate-300"
            >
              Reset
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {options.map((column) => {
              const active = visibleColumns[column.key]
              return (
                <button
                  key={String(column.key)}
                  type="button"
                  onClick={() => {
                    if (active && visibleCount === 1) return
                    setVisibleColumns((prev) => ({ ...prev, [column.key]: !active }))
                  }}
                  aria-pressed={active}
                  className={`inline-flex items-center justify-between rounded-lg border px-2.5 py-2 text-xs font-semibold transition ${
                    active
                      ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-400/60 dark:bg-amber-900/30 dark:text-amber-200'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>{column.label}</span>
                  {active && <Check className="h-3.5 w-3.5" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default ColumnVisibilityMenu
