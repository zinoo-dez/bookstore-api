import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-3 rounded-xl border
            border-slate-200 bg-white/90 text-slate-900
            shadow-sm transition-all
            focus:outline-none
            focus:ring-2 focus:ring-primary-500/30
            focus:border-primary-500/60
            disabled:bg-slate-100 disabled:cursor-not-allowed
            dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100
            ${error ? 'border-rose-400 focus:ring-rose-400/30 focus:border-rose-400' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-2 text-xs font-medium text-rose-600">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
