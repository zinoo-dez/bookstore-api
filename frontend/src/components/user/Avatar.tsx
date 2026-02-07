import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// Centralized API base URL (dev + prod safe)
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Legacy DiceBear avatars (kept for backward compatibility)
export const AVATARS = [
  { id: 'avatar-1', url: 'https://api.dicebear.com/7.x/lorelei/svg' },
  { id: 'avatar-2', url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Aneka' },
  { id: 'avatar-3', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Anything' },
  { id: 'avatar-4', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Calista' },
  { id: 'avatar-5', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Dante' },
  { id: 'avatar-6', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Elias' },
]

export const BACKGROUND_COLORS = [
  { id: 'bg-slate-100', class: 'bg-slate-100' },
  { id: 'bg-red-100', class: 'bg-red-100' },
  { id: 'bg-orange-100', class: 'bg-orange-100' },
  { id: 'bg-amber-100', class: 'bg-amber-100' },
  { id: 'bg-green-100', class: 'bg-green-100' },
  { id: 'bg-emerald-100', class: 'bg-emerald-100' },
  { id: 'bg-teal-100', class: 'bg-teal-100' },
  { id: 'bg-cyan-100', class: 'bg-cyan-100' },
  { id: 'bg-sky-100', class: 'bg-sky-100' },
  { id: 'bg-blue-100', class: 'bg-blue-100' },
  { id: 'bg-indigo-100', class: 'bg-indigo-100' },
  { id: 'bg-violet-100', class: 'bg-violet-100' },
  { id: 'bg-purple-100', class: 'bg-purple-100' },
  { id: 'bg-fuchsia-100', class: 'bg-fuchsia-100' },
  { id: 'bg-pink-100', class: 'bg-pink-100' },
  { id: 'bg-rose-100', class: 'bg-rose-100' },
]

interface AvatarProps {
  avatarType?: 'emoji' | 'upload'
  avatarValue?: string
  backgroundColor?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  onClick?: () => void
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32',
}

const Avatar = ({
  avatarType = 'emoji',
  avatarValue: rawAvatarValue,
  backgroundColor: rawBackgroundColor,
  size = 'md',
  className,
  onClick,
}: AvatarProps) => {
  const avatarValue = rawAvatarValue || '🐶'
  const backgroundColor = rawBackgroundColor || 'bg-slate-100'

  let content: React.ReactNode

  /**
   * UPLOADED IMAGE AVATAR
   */
  if (!avatarValue) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-full">
        👤
      </div>
    )
  }
  if (avatarType === 'upload' && avatarValue) {
    const imageSrc = avatarValue.startsWith('http')
      ? avatarValue
      : `${API_BASE_URL}${avatarValue}`

    content = (
      <img
        src={imageSrc}
        alt="User avatar"
        className="w-full h-full object-cover"
      />
    )
  } else {
    /**
     * EMOJI OR LEGACY AVATAR
     */
    const isLegacyId =
      typeof avatarValue === 'string' && avatarValue.startsWith('avatar-')

    if (isLegacyId) {
      const avatarUrl =
        AVATARS.find(a => a.id === avatarValue)?.url || AVATARS[0].url

      content = (
        <img
          src={avatarUrl}
          alt="User avatar"
          className="w-full h-full object-contain"
        />
      )
    } else {
      // Emoji avatar
      content = (
        <span
          className={cn(
            'flex items-center justify-center leading-none select-none',
            {
              'text-lg': size === 'sm',
              'text-2xl': size === 'md',
              'text-5xl': size === 'lg',
              'text-6xl': size === 'xl',
            }
          )}
        >
          {avatarValue}
        </span>
      )
    }
  }

  // Background applies ONLY to emoji avatars
  const finalBg =
    avatarType === 'upload' ? 'bg-transparent' : backgroundColor

  return (
    <motion.div
      whileHover={onClick ? { scale: 1.05 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
      onClick={onClick}
      className={cn(
        'rounded-full overflow-hidden flex items-center justify-center border border-gray-200 shadow-sm transition-all',
        sizeClasses[size],
        finalBg,
        onClick && 'cursor-pointer hover:shadow-md',
        className
      )}
    >
      {content}
    </motion.div>
  )
}

export default Avatar
