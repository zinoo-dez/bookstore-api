import { motion, HTMLMotionProps } from 'framer-motion'
import { ReactNode } from 'react'

interface ButtonProps extends Omit<HTMLMotionProps<"button">, 'children'> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  isLoading = false,
  disabled,
  className = '',
  ...props 
}: ButtonProps) => {
  const baseStyles = 'font-medium rounded-xl transition-all focus:outline-none focus-visible:ring-2'

  
  const variants = {
    primary: 'bg-primary-600 text-white shadow-lg shadow-primary-200/60 hover:bg-primary-700 hover:shadow-xl focus-visible:ring-primary-500 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-500 dark:shadow-amber-300/40 dark:focus-visible:ring-amber-400',
    secondary: 'bg-slate-900 text-white shadow-lg shadow-slate-300/60 hover:bg-slate-800 focus-visible:ring-slate-500 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white',
    danger: 'bg-rose-600 text-white shadow-lg shadow-rose-200/60 hover:bg-rose-700 focus-visible:ring-rose-500',
    outline: 'border border-slate-200 text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900',
  }
  
  const sizes = {
  sm: 'px-3 py-1.5 text-sm font-medium',
  md: 'px-4 py-2 text-sm font-medium',
  lg: 'px-5 py-2.5 text-base font-medium',
}

  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : children}
    </motion.button>
  )
}

export default Button
