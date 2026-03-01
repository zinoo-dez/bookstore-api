import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CircleUser,
  Menu,
  Palette,
  Shield,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useUpdateProfile, type UpdateProfileData, useUploadAvatar } from '@/services/auth'
import Avatar, { AVATARS, BACKGROUND_COLORS } from '@/components/user/Avatar'
import { cn } from '@/lib/utils'
import { resolveMediaUrl } from '@/lib/media'

type SettingsSection = 'profile' | 'privacy' | 'preferences' | 'account'

const settingsNav: Array<{
  key: SettingsSection
  label: string
  description: string
  icon: ComponentType<{ className?: string }>
}> = [
  {
    key: 'profile',
    label: 'Profile',
    description: 'Identity and bio',
    icon: CircleUser,
  },
  {
    key: 'privacy',
    label: 'Privacy',
    description: 'Public visibility',
    icon: Shield,
  },
  {
    key: 'preferences',
    label: 'Preferences',
    description: 'Experience options',
    icon: SlidersHorizontal,
  },
  {
    key: 'account',
    label: 'Account',
    description: 'Notifications and security',
    icon: Bell,
  },
]

const ToggleRow = ({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}) => {
  return (
    <label className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-slate-600">
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</p>
        {description && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition',
          checked
            ? 'border-slate-900 bg-slate-900 dark:border-slate-100 dark:bg-slate-100'
            : 'border-slate-300 bg-slate-200 dark:border-slate-700 dark:bg-slate-700',
        )}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 rounded-full bg-white transition dark:bg-slate-900',
            checked ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </button>
    </label>
  )
}

const Card = ({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) => (
  <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
    {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
    <div className="mt-5">{children}</div>
  </section>
)

const ProfileSettingsPage = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const updateProfileMutation = useUpdateProfile()
  const uploadAvatarMutation = useUploadAvatar()
  const uploadCoverMutation = useUploadAvatar()

  const [activeSection, setActiveSection] = useState<SettingsSection>('profile')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

  const [emailUpdates, setEmailUpdates] = useState(true)
  const [newFollowerAlerts, setNewFollowerAlerts] = useState(true)
  const [marketingTips, setMarketingTips] = useState(false)

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'emoji' | 'upload'>(user?.avatarType || 'emoji')

  useEffect(() => {
    if (!user) return
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
  }, [user])

  const isDirty = useMemo(() => {
    if (!user) return false
    return (
      name !== user.name
      || avatarValue !== (user.avatarValue || 'avatar-1')
      || selectedBg !== (user.backgroundColor || 'bg-slate-100')
      || pronouns !== (user.pronouns || '')
      || shortBio !== (user.shortBio || '')
      || about !== (user.about || '')
      || coverImage !== (user.coverImage || '')
      || showEmail !== !!user.showEmail
      || showFollowers !== (user.showFollowers ?? true)
      || showFollowing !== (user.showFollowing ?? true)
      || showFavorites !== !!user.showFavorites
      || showLikedPosts !== !!user.showLikedPosts
      || supportEnabled !== !!user.supportEnabled
      || supportUrl !== (user.supportUrl || '')
      || supportQrImage !== (user.supportQrImage || '')
      || activeTab !== (user.avatarType || 'emoji')
    )
  }, [
    user,
    name,
    avatarValue,
    selectedBg,
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
    supportUrl,
    supportQrImage,
    activeTab,
  ])

  const validateImageFile = (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage({ type: 'error', text: 'Only JPG, PNG, and WebP images are allowed.' })
      return false
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 2MB.' })
      return false
    }

    return true
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!validateImageFile(file)) return

    try {
      const result = await uploadAvatarMutation.mutateAsync(file)
      setAvatarValue(result.url)
      setMessage({ type: 'success', text: 'Image uploaded successfully.' })
      window.setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to upload image' })
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!validateImageFile(file)) return

    try {
      const result = await uploadCoverMutation.mutateAsync(file)
      setCoverImage(result.url)
      setMessage({ type: 'success', text: 'Cover image uploaded successfully.' })
      window.setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to upload cover image' })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (name.length < 2 || name.length > 30) {
      setMessage({ type: 'error', text: 'Name must be between 2 and 30 characters.' })
      return
    }

    let finalAvatarType: 'emoji' | 'upload' = activeTab
    let finalAvatarValue = avatarValue

    if (activeTab === 'emoji') {
      if (avatarValue.startsWith('/uploads') || avatarValue.includes('/')) {
        finalAvatarValue = 'avatar-1'
      }
    } else if (!avatarValue || !avatarValue.includes('/')) {
      setMessage({ type: 'error', text: 'Please upload an image first.' })
      return
    }

    if (supportEnabled && !supportUrl.trim()) {
      setMessage({ type: 'error', text: 'Support URL is required when author support is enabled.' })
      return
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

    updateProfileMutation.mutate(data, {
      onSuccess: () => {
        setMessage({ type: 'success', text: 'Settings saved.' })
        window.setTimeout(() => setMessage(null), 3000)
      },
      onError: (error: any) => {
        setMessage({ type: 'error', text: error.message || 'Failed to save settings.' })
      },
    })
  }

  return (
    <div className="mx-auto max-w-[1300px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Settings</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Account & Profile</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Manage profile identity, privacy controls, and personal preferences.</p>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu className="h-4 w-4" />
          Settings Menu
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px,minmax(0,1fr)]">
        <aside className="hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-24 lg:block lg:self-start">
          <div className="mb-2 flex items-center justify-between px-2">
            {!sidebarCollapsed && <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Menu</p>}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
              aria-label={sidebarCollapsed ? 'Expand settings menu' : 'Collapse settings menu'}
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          <nav className="space-y-1">
            {settingsNav.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveSection(item.key)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition',
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                    sidebarCollapsed && 'justify-center px-2',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {!sidebarCollapsed && (
                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className={cn('text-xs', isActive ? 'text-white/80 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400')}>
                        {item.description}
                      </p>
                    </div>
                  )}
                </button>
              )
            })}
          </nav>
        </aside>

        <form onSubmit={handleSubmit} className="space-y-6">
          {message && (
            <div
              className={cn(
                'rounded-2xl border px-4 py-3 text-sm',
                message.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/25 dark:text-emerald-200'
                  : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-900/25 dark:text-rose-200',
              )}
            >
              {message.text}
            </div>
          )}

          {activeSection === 'profile' && (
            <>
              <Card title="Profile Preview" subtitle="This is how your public card appears.">
                <div className="grid gap-6 md:grid-cols-[240px,minmax(0,1fr)]">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60">
                    <div
                      className="h-40 bg-cover bg-center"
                      style={coverImage ? { backgroundImage: `url(${resolveMediaUrl(coverImage)})` } : undefined}
                    />
                    <div className="-mt-10 flex flex-col items-center p-4">
                      <Avatar
                        avatarType={activeTab}
                        avatarValue={activeTab === 'emoji' ? (avatarValue.includes('/') ? 'avatar-1' : avatarValue) : avatarValue}
                        backgroundColor={selectedBg}
                        size="xl"
                        className="shadow-md"
                      />
                      <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">{name || 'Your Name'}</p>
                      {pronouns && <p className="text-sm text-slate-500 dark:text-slate-400">{pronouns}</p>}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Avatar</p>
                      <div className="mt-3 flex gap-3 border-b border-slate-200 pb-2 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => setActiveTab('emoji')}
                          className={cn(
                            'rounded-full px-3 py-1 text-sm font-medium',
                            activeTab === 'emoji'
                              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                          )}
                        >
                          Emoji
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('upload')}
                          className={cn(
                            'rounded-full px-3 py-1 text-sm font-medium',
                            activeTab === 'upload'
                              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                          )}
                        >
                          Upload
                        </button>
                      </div>

                      {activeTab === 'emoji' && (
                        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                          {AVATARS.map((avatar) => (
                            <div key={avatar.id} className="flex justify-center">
                              <Avatar
                                avatarType="emoji"
                                avatarValue={avatar.id}
                                backgroundColor={selectedBg}
                                size="md"
                                onClick={() => setAvatarValue(avatar.id)}
                                className={cn('border-2', avatarValue === avatar.id ? 'border-slate-900 dark:border-slate-100' : 'border-transparent')}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {activeTab === 'upload' && (
                        <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-900/50">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleAvatarUpload}
                            disabled={uploadAvatarMutation.isPending}
                          />
                          {uploadAvatarMutation.isPending && (
                            <p className="mt-2 text-xs text-slate-500">Uploading...</p>
                          )}
                        </div>
                      )}
                    </div>

                    {activeTab === 'emoji' && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Background color</p>
                        <div className="mt-3 grid grid-cols-8 gap-2">
                          {BACKGROUND_COLORS.map((bg) => (
                            <button
                              key={bg.id}
                              type="button"
                              onClick={() => setSelectedBg(bg.class)}
                              className={cn(
                                'h-8 w-8 rounded-full border-2 transition',
                                bg.class,
                                selectedBg === bg.class
                                  ? 'border-slate-900 dark:border-slate-100'
                                  : 'border-transparent',
                              )}
                              title={bg.id}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <Card title="Profile Details" subtitle="Public identity and writing context.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Display name</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      placeholder="Your display name"
                      maxLength={30}
                    />
                    <p className="mt-1 text-xs text-slate-500">{name.length}/30</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Pronouns</label>
                    <input
                      value={pronouns}
                      onChange={(e) => setPronouns(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      placeholder="e.g. she/her"
                      maxLength={30}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cover image URL</label>
                    <input
                      value={coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      placeholder="https://..."
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600">
                        Upload cover
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleCoverUpload}
                          disabled={uploadCoverMutation.isPending}
                          className="hidden"
                        />
                      </label>
                      {uploadCoverMutation.isPending && (
                        <span className="text-xs text-slate-500">Uploading cover...</span>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      This cover is shown on your public profile header.
                      {user?.id ? (
                        <>
                          {' '}
                          <Link to={`/user/${user.id}`} className="font-medium text-slate-700 underline dark:text-slate-300">
                            View profile
                          </Link>
                        </>
                      ) : null}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Short bio</label>
                    <textarea
                      value={shortBio}
                      onChange={(e) => setShortBio(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      rows={3}
                      maxLength={160}
                      placeholder="A short one-liner shown on your profile card"
                    />
                    <p className="mt-1 text-xs text-slate-500">{shortBio.length}/160</p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">About</label>
                    <textarea
                      value={about}
                      onChange={(e) => setAbout(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      rows={6}
                      maxLength={4000}
                      placeholder="Longer background, interests, and what you write about"
                    />
                    <p className="mt-1 text-xs text-slate-500">{about.length}/4000</p>
                  </div>
                </div>
              </Card>

              <Card title="Author Support" subtitle="Enable tips on your blog posts with a secure checkout link.">
                <div className="space-y-4">
                  <ToggleRow
                    label='Show "Support this author" on my blog posts'
                    description="Readers will see a support button on your blog detail page."
                    checked={supportEnabled}
                    onChange={setSupportEnabled}
                  />
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Support checkout URL</label>
                    <input
                      value={supportUrl}
                      onChange={(e) => setSupportUrl(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      placeholder="https://buymeacoffee.com/yourname"
                    />
                    <p className="mt-1 text-xs text-slate-500">Use a hosted payment page (BuyMeACoffee, Ko-fi, Stripe payment link).</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Optional QR image URL</label>
                    <input
                      value={supportQrImage}
                      onChange={(e) => setSupportQrImage(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      placeholder="https://.../support-qr.png"
                    />
                  </div>
                </div>
              </Card>
            </>
          )}

          {activeSection === 'privacy' && (
            <Card title="Privacy Controls" subtitle="Choose what others can see on your profile.">
              <div className="space-y-3">
                <ToggleRow
                  label="Show email on public profile"
                  description="Useful for collaborators, hidden by default."
                  checked={showEmail}
                  onChange={setShowEmail}
                />
                <ToggleRow
                  label="Show followers count"
                  description="Display your audience size."
                  checked={showFollowers}
                  onChange={setShowFollowers}
                />
                <ToggleRow
                  label="Show following count"
                  description="Display how many people you follow."
                  checked={showFollowing}
                  onChange={setShowFollowing}
                />
                <ToggleRow
                  label="Show saved books (favorites)"
                  description="Allow visitors to view your saved shelf."
                  checked={showFavorites}
                  onChange={setShowFavorites}
                />
                <ToggleRow
                  label="Show liked posts"
                  description="Allow visitors to view blog posts you liked."
                  checked={showLikedPosts}
                  onChange={setShowLikedPosts}
                />
              </div>
            </Card>
          )}

          {activeSection === 'preferences' && (
            <Card title="Experience Preferences" subtitle="Typical personal settings for reading and browsing.">
              <div className="space-y-3">
                <ToggleRow
                  label="Email updates"
                  description="Receive weekly reading and activity summaries."
                  checked={emailUpdates}
                  onChange={setEmailUpdates}
                />
                <ToggleRow
                  label="New follower alerts"
                  description="Get notified when someone follows you."
                  checked={newFollowerAlerts}
                  onChange={setNewFollowerAlerts}
                />
                <ToggleRow
                  label="Tips and product updates"
                  description="Occasional best practices and feature highlights."
                  checked={marketingTips}
                  onChange={setMarketingTips}
                />
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                  These preference toggles are UI-ready now. Persistence can be wired to backend preferences when you want.
                </div>
              </div>
            </Card>
          )}

          {activeSection === 'account' && (
            <Card title="Account" subtitle="Common account actions and shortcuts.">
              <div className="space-y-3">
                <Link
                  to="/notifications"
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
                >
                  Notifications
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>
                <Link
                  to="/library"
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
                >
                  Library & saved items
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>
                <Link
                  to="/reading-insights"
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
                >
                  Reading insights
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300">
                  Account deletion is not enabled from UI yet. Contact support if needed.
                </div>
              </div>
            </Card>
          )}

          <div className="sticky bottom-4 z-10 rounded-2xl border border-slate-200 bg-white/90 p-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => navigate('/user/' + user?.id)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Back to profile
              </button>
              <button
                type="submit"
                disabled={updateProfileMutation.isPending || !isDirty}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                <Palette className="h-4 w-4" />
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close settings menu"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]"
          />
          <div className="absolute left-0 top-0 h-full w-[82%] max-w-sm border-r border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-2 flex items-center justify-between px-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Settings Menu</p>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
                aria-label="Close settings menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="space-y-1">
              {settingsNav.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.key
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setActiveSection(item.key)
                      setMobileMenuOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition',
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className={cn('text-xs', isActive ? 'text-white/80 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400')}>
                        {item.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileSettingsPage
