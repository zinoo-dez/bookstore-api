interface BookCornerRibbonProps {
  label?: string
  className?: string
}

const BookCornerRibbon = ({ label = 'BEST SELLER', className = '' }: BookCornerRibbonProps) => {
  return (
    <div className={`pointer-events-none absolute right-0 top-0 z-30 h-24 w-24 overflow-hidden ${className}`}>
      <span
        className="absolute right-[-32px] top-[14px] z-40 block w-[140px] rotate-45 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 px-2 py-1 text-center text-[10px] font-black uppercase tracking-[0.16em] text-slate-900 shadow-[0_6px_18px_-8px_rgba(0,0,0,0.45)]"
      >
        {label}
      </span>
    </div>
  )
}

export default BookCornerRibbon
