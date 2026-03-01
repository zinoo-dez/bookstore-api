import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/auth.store'
import { useUpdateProfile, UpdateProfileData, useUploadAvatar } from '@/services/auth'
import Avatar, { AVATARS, BACKGROUND_COLORS } from '@/components/user/Avatar'
import { cn } from '@/lib/utils'

interface ProfileSettingsPanelProps {
  variant?: 'page' | 'embedded'
  className?: string
}

const ProfileSettingsPanel = ({ variant = 'page', className }: ProfileSettingsPanelProps) => {
  const { user } = useAuthStore()
  const updateProfileMutation = useUpdateProfile()
  const uploadAvatarMutation = useUploadAvatar()

  const [name, setName] = useState(user?.name || '')
  const [avatarValue, setAvatarValue] = useState(user?.avatarValue || 'avatar-1')
  const [selectedBg, setSelectedBg] = useState(user?.backgroundColor || 'bg-slate-100')
  const [pronouns, setPronouns] = useState(user?.pronouns || '')
  const [shortBio, setShortBio] = useState(user?.shortBio || '')
  const [about, setAbout] = useState(user?.about || '')
  const [coverImage, setCoverImage] = useState(user?.coverImage || '')
  const [showEmail, setShowEmail] = useState(!!user?.showEmail)
  const [showFollowers, setShowFollowers] = useState(user?.showFollowers ?? true)
  const [showFollowing, setShowFollowing] = useState(user?.showFollowing ?? true)
  const [showFavorites, setShowFavorites] = useState(!!user?.showFavorites)
  const [showLikedPosts, setShowLikedPosts] = useState(!!user?.showLikedPosts)
  const [supportEnabled, setSupportEnabled] = useState(!!user?.supportEnabled)
  const [supportUrl, setSupportUrl] = useState(user?.supportUrl || '')
  const [supportQrImage, setSupportQrImage] = useState(user?.supportQrImage || '')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'emoji' | 'upload'>(user?.avatarType || 'emoji')

  useEffect(() => {
    if (user) {
      setName(user.name)
      setAvatarValue(user.avatarValue || 'avatar-1')
      setSelectedBg(user.backgroundColor || 'bg-slate-100')
      setActiveTab(user.avatarType || 'emoji')
      setPronouns(user.pronouns || '')
      setShortBio(user.shortBio || '')
      setAbout(user.about || '')
      setCoverImage(user.coverImage || '')
      setShowEmail(!!user.showEmail)
      setShowFollowers(user.showFollowers ?? true)
      setShowFollowing(user.showFollowing ?? true)
      setShowFavorites(!!user.showFavorites)
      setShowLikedPosts(!!user.showLikedPosts)
      setSupportEnabled(!!user.supportEnabled)
      setSupportUrl(user.supportUrl || '')
      setSupportQrImage(user.supportQrImage || '')
    }
  }, [user])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage({ type: 'error', text: 'Only JPG, PNG, and WebP images are allowed.' })
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 2MB.' })
      return
    }

    try {
      const result = await uploadAvatarMutation.mutateAsync(file)
      setAvatarValue(result.url)
      setMessage({ type: 'success', text: 'Image uploaded successfully!' })
      window.setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to upload image' })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (name.length < 2 || name.length > 30) {
      setMessage({ type: 'error', text: 'Name must be between 2 and 30 characters' })
      return
    }

    let finalAvatarType: 'emoji' | 'upload' = activeTab
    let finalAvatarValue = avatarValue

    if (activeTab === 'emoji') {
      if (avatarValue.startsWith('/uploads') || avatarValue.includes('/')) {
        finalAvatarValue = 'avatar-1'
      }
    } else {
      if (!avatarValue || !avatarValue.includes('/')) {
        setMessage({ type: 'error', text: 'Please upload an image first.' })
        return
      }
    }

    const data: UpdateProfileData = {
      name,
      avatarType: finalAvatarType,
      avatarValue: finalAvatarValue,
      backgroundColor: selectedBg,
      pronouns,
      shortBio,
      about,
      coverImage,
      showEmail,
      showFollowers,
      showFollowing,
      showFavorites,
      showLikedPosts,
      supportEnabled,
      supportUrl: supportUrl.trim() || undefined,
      supportQrImage: supportQrImage.trim() || undefined,
    }

    if (supportEnabled && !supportUrl.trim()) {
      setMessage({ type: 'error', text: 'Support URL is required when support is enabled.' })
      return
    }

    updateProfileMutation.mutate(data, {
      onSuccess: () => {
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        window.setTimeout(() => setMessage(null), 3000)
      },
      onError: (error: any) => {
        setMessage({ type: 'error', text: error.message })
      }
    })
  }

  const panelClass =
    variant === 'embedded'
      ? 'rounded-3xl border border-slate-200 bg-white shadow-[0_30px_80px_-60px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900'
      : 'bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden dark:bg-slate-900 dark:border-slate-800'

  return (
    <div className={cn(panelClass, className)}>
      <div className={variant === 'embedded' ? 'p-6 md:p-8' : 'p-8'}>
        <div className={variant === 'embedded' ? 'mb-8' : 'mb-6'}>
          <h2 className={variant === 'embedded' ? 'text-xl font-semibold text-slate-900 dark:text-slate-100' : 'text-lg font-semibold text-gray-900 dark:text-slate-100'}>
            Profile Settings
          </h2>
          <p className={variant === 'embedded' ? 'mt-1 text-sm text-slate-500' : 'mt-1 text-sm text-gray-500'}>
            Customize your appearance and display name.
          </p>
        </div>

        {message && (
          <div
            className={cn(
              'mb-6 rounded-xl border px-4 py-3 text-sm',
              message.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-200'
                : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-900/20 dark:text-rose-200'
            )}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Preview</h3>
            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 dark:bg-slate-900/60">
              <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div
                  className="h-28 w-full bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-cover bg-center"
                  style={coverImage ? { backgroundImage: `url(${coverImage})` } : undefined}
                />
                <div className="-mt-10 flex flex-col items-center px-4 pb-5">
                  <Avatar
                    avatarType={activeTab}
                    avatarValue={
                      activeTab === 'emoji'
                        ? (avatarValue.includes('/') ? 'avatar-1' : avatarValue)
                        : avatarValue
                    }
                    backgroundColor={selectedBg}
                    size="xl"
                    className="mb-4 shadow-md"
                  />
                  <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">{name || 'Your Name'}</h4>
                  {pronouns && <p className="mt-1 text-sm text-slate-500">{pronouns}</p>}
                  {shortBio && (
                    <p className="mt-3 text-center text-sm text-slate-600 dark:text-slate-400">{shortBio}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Choose Avatar</h3>
                <div className="flex space-x-4 mb-6 border-b border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setActiveTab('emoji')}
                    className={cn(
                      'pb-2 px-1 text-sm font-medium transition-colors relative',
                      activeTab === 'emoji'
                        ? 'text-primary-600 border-b-2 border-primary-600'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    )}
                  >
                    Fun Emoji
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className={cn(
                      'pb-2 px-1 text-sm font-medium transition-colors relative',
                      activeTab === 'upload'
                        ? 'text-primary-600 border-b-2 border-primary-600'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    )}
                  >
                    Upload Image
                  </button>
                </div>

                {activeTab === 'emoji' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-3 sm:grid-cols-6 gap-4"
                  >
                    {AVATARS.map((avatar) => (
                      <div key={avatar.id} className="flex justify-center">
                        <Avatar
                          avatarType="emoji"
                          avatarValue={avatar.id}
                          backgroundColor={selectedBg}
                          size="md"
                          onClick={() => setAvatarValue(avatar.id)}
                          className={cn(
                            'cursor-pointer border-2 transition',
                            avatarValue === avatar.id ? 'border-primary-500' : 'border-transparent'
                          )}
                        />
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'upload' && (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileUpload} />
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Background Color</h3>
                <div className="grid grid-cols-6 gap-3">
                  {BACKGROUND_COLORS.map((bg) => (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => setSelectedBg(bg.class)}
                      className={cn(
                        'h-10 w-10 rounded-full border-2 transition',
                        bg.class,
                        selectedBg === bg.class ? 'border-primary-600' : 'border-transparent'
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Display Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    placeholder="Your display name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Pronouns</label>
                  <input
                    value={pronouns}
                    onChange={(e) => setPronouns(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    placeholder="e.g. she/her"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Short Bio</label>
                <input
                  value={shortBio}
                  onChange={(e) => setShortBio(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  placeholder="A quick intro"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">About</label>
                <textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  rows={4}
                  placeholder="Tell people about yourself"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cover Image URL</label>
                <input
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  placeholder="https://..."
                />
              </div>

              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Author Support</h3>
                <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <label className="flex items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <span>Enable "Support this author" on your blog posts</span>
                    <input type="checkbox" checked={supportEnabled} onChange={(e) => setSupportEnabled(e.target.checked)} />
                  </label>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Support checkout URL</label>
                    <input
                      value={supportUrl}
                      onChange={(e) => setSupportUrl(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      placeholder="https://buymeacoffee.com/yourname"
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Users will be redirected to this secure checkout link.
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Optional QR image URL</label>
                    <input
                      value={supportQrImage}
                      onChange={(e) => setSupportQrImage(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      placeholder="https://.../payment-qr.png"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Privacy</h3>
                <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <label className="flex items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <span>Show email on public profile</span>
                    <input type="checkbox" checked={showEmail} onChange={(e) => setShowEmail(e.target.checked)} />
                  </label>
                  <label className="flex items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <span>Show followers count</span>
                    <input type="checkbox" checked={showFollowers} onChange={(e) => setShowFollowers(e.target.checked)} />
                  </label>
                  <label className="flex items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <span>Show following count</span>
                    <input type="checkbox" checked={showFollowing} onChange={(e) => setShowFollowing(e.target.checked)} />
                  </label>
                  <label className="flex items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <span>Show saved books (favorites)</span>
                    <input type="checkbox" checked={showFavorites} onChange={(e) => setShowFavorites(e.target.checked)} />
                  </label>
                  <label className="flex items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <span>Show liked posts</span>
                    <input type="checkbox" checked={showLikedPosts} onChange={(e) => setShowLikedPosts(e.target.checked)} />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileSettingsPanel
