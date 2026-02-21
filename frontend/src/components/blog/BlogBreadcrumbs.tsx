import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface BlogBreadcrumbItem {
  label: string
  to?: string
}

interface BlogBreadcrumbsProps {
  items: BlogBreadcrumbItem[]
  className?: string
}

const BlogBreadcrumbs = ({ items, className }: BlogBreadcrumbsProps) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex flex-wrap items-center gap-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500', className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
            {item.to && !isLast ? (
              <Link to={item.to} className="transition-colors hover:text-slate-700 dark:hover:text-slate-300">
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast && 'text-slate-700 dark:text-slate-300')}>{item.label}</span>
            )}
            {!isLast && <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
          </span>
        )
      })}
    </nav>
  )
}

export default BlogBreadcrumbs
