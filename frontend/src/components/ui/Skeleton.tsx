type SkeletonVariant = 'rect' | 'logo'

interface SkeletonProps {
  className?: string
  variant?: SkeletonVariant
}

const Skeleton = ({ className = '', variant = 'rect' }: SkeletonProps) => {
  if (variant === 'logo') {
    return (
      <div
        className={`animate-pulse text-slate-300 dark:text-slate-700 ${className}`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <path
            d="M6 14 L16 6 L26 14"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect
            x="9"
            y="14"
            width="14"
            height="13"
            rx="2.5"
            fill="currentColor"
            opacity="0.85"
          />
          <line
            x1="16"
            y1="17"
            x2="16"
            y2="25"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            opacity="0.6"
          />
        </svg>
      </div>
    )
  }

  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-800/80 ${className}`}
      aria-hidden="true"
    />
  )
}

export default Skeleton
