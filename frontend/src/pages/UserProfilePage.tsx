import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Bookmark, BookOpen, Heart, Star, TrendingUp, UserCheck, UserPlus } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import {
  useFollowAuthor,
  useUnfollowAuthor,
  useUserBlogProfile,
} from '@/services/blogs'
import BlogBreadcrumbs from '@/components/blog/BlogBreadcrumbs'
import Avatar from '@/components/user/Avatar'
import { resolveMediaUrl } from '@/lib/media'

const UserProfilePage = () => {
  const { id = '' } = useParams()
  const { user, isAuthenticated } = useAuthStore()
  const [activeSection, setActiveSection] = useState<'overview' | 'favorites' | 'liked' | 'posts' | 'about'>('overview')
  const { data, isLoading, isError } = useUserBlogProfile(id, !!id)
  const followMutation = useFollowAuthor()
  const unfollowMutation = useUnfollowAuthor()

  const favoriteBooks = useMemo(
    () => data?.favorites.filter((item) => item.book) ?? [],
    [data?.favorites],
  )
  const likedPosts = useMemo(() => data?.likedPosts ?? [], [data?.likedPosts])
  const totalReadingMinutes = useMemo(
    () => data?.posts.reduce((sum, post) => sum + (post.readingTime || 0), 0) ?? 0,
    [data?.posts],
  )
  const avgReadTime = useMemo(
    () => (data?.posts.length ? Math.round(totalReadingMinutes / data.posts.length) : 0),
    [data?.posts.length, totalReadingMinutes],
  )
  const recentPosts = useMemo(
    () => data?.posts.slice(0, 4) ?? [],
    [data?.posts],
  )

  if (!id) {
    return <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-slate-500">Profile not found.</div>
  }

  if (isLoading) {
    return <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-slate-500">Loading profile...</div>
  }

  if (isError || !data) {
    return <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-rose-600">Unable to load this profile.</div>
  }

  const isMe = user?.id === data.user.id
  const canViewFavorites = isMe || data.visibility.showFavorites
  const canViewLikedPosts = isMe || data.visibility.showLikedPosts
  const memberSince = data.user.createdAt
    ? new Date(data.user.createdAt).toLocaleDateString()
    : 'Not available'

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
      <BlogBreadcrumbs
        className="mb-4"
        items={[
          { label: 'Home', to: '/' },
          { label: 'Blogs', to: '/blogs' },
          { label: data.user.name },
        ]}
      />
      <div className="mt-8">
        <main className="w-full">
          <header className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_34px_90px_-62px_rgba(15,23,42,0.55)] dark:border-slate-800 dark:bg-slate-900">
            <div
              className="h-56 w-full bg-gradient-to-r from-sky-100 via-cyan-100 to-indigo-100 bg-cover bg-center sm:h-64 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800"
              style={
                data.user.coverImage
                  ? { backgroundImage: `linear-gradient(rgba(15,23,42,0.15), rgba(15,23,42,0.35)), url(${resolveMediaUrl(data.user.coverImage)})` }
                  : undefined
              }
            />
            <div className="bg-gradient-to-b from-white via-white to-slate-50/60 px-6 pb-7 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900/80">
              <div className="-mt-16 flex flex-wrap items-end justify-between gap-5">
                <div className="flex items-end gap-4">
                  <Avatar
                    avatarType={data.user.avatarType === 'upload' ? 'upload' : 'emoji'}
                    avatarValue={data.user.avatarValue || 'avatar-1'}
                    backgroundColor={data.user.backgroundColor || 'bg-slate-100'}
                    size="xl"
                    className="border-4 border-white shadow-lg dark:border-slate-900"
                  />
                  <div className="pb-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Profile</p>
                    <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{data.user.name}</h1>
                    {(data.user.pronouns || data.user.email) && (
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {data.user.pronouns || ''}
                        {data.user.pronouns && data.user.email ? ' · ' : ''}
                        {data.user.email || ''}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAuthenticated && !isMe && (
                    <button
                      type="button"
                      onClick={() => (data.isFollowing ? unfollowMutation.mutate(data.user.id) : followMutation.mutate(data.user.id))}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                    >
                      {data.isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                      {data.isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                  {isMe && (
                    <Link
                      to="/settings/profile"
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-200"
                    >
                      Edit Profile
                    </Link>
                  )}
                </div>
              </div>
              <div className="mt-6 grid gap-3 lg:grid-cols-3">
                {[
                  { label: 'Followers', value: data.stats.followers ?? 'Private' },
                  { label: 'Following', value: data.stats.following ?? 'Private' },
                  { label: 'Posts', value: data.stats.posts },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-slate-200/80 bg-white px-5 py-4 text-sm shadow-[0_10px_30px_-24px_rgba(15,23,42,0.7)] dark:border-slate-800 dark:bg-slate-900/70">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveSection('overview')}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    activeSection === 'overview'
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  Overview
                </button>
                {canViewFavorites && (
                  <button
                    type="button"
                    onClick={() => setActiveSection('favorites')}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      activeSection === 'favorites'
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    Favorites
                  </button>
                )}
                {canViewLikedPosts && (
                  <button
                    type="button"
                    onClick={() => setActiveSection('liked')}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      activeSection === 'liked'
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    Liked
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveSection('posts')}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    activeSection === 'posts'
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  Posts
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('about')}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    activeSection === 'about'
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  About
                </button>
              </div>
            </div>
          </header>

          {activeSection === 'overview' && (
            <section className="mt-8 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Engagement</h2>
                    <TrendingUp className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-slate-200/70 px-3 py-3 dark:border-slate-700">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Avg read</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{avgReadTime} min</p>
                    </div>
                    <div className="rounded-xl border border-slate-200/70 px-3 py-3 dark:border-slate-700">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total mins</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{totalReadingMinutes}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">About</h2>
                    <BookOpen className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                    {data.user.shortBio || data.user.about || 'Add a short bio to introduce yourself.'}
                  </p>
                  <p className="mt-4 text-xs text-slate-500">Member since {memberSince}</p>
                </div>
              </div>

              {canViewFavorites && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-400" />
                      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Favorites</h2>
                    </div>
                    {isMe && (
                      <Link to="/library" className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300">
                        Manage
                      </Link>
                    )}
                  </div>
                  <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                    {favoriteBooks.slice(0, 8).map((item) => (
                      <div key={item.id} className="min-w-[180px] rounded-2xl border border-slate-200/70 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                        <div className="h-24 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700" />
                        <p className="mt-3 line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {item.book?.title || 'Untitled'}
                        </p>
                        <p className="text-xs text-slate-500">{item.book?.author}</p>
                      </div>
                    ))}
                    {favoriteBooks.length === 0 && (
                      <p className="text-sm text-slate-500">No favorites yet.</p>
                    )}
                  </div>
                </div>
              )}

              {canViewLikedPosts && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-rose-400" />
                      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Liked Posts</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveSection('liked')}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300"
                    >
                      View all
                    </button>
                  </div>
                  <div className="mt-4 space-y-3">
                    {likedPosts.slice(0, 3).map((post) => (
                      <article key={post.id} className="rounded-xl border border-slate-200/70 p-4 dark:border-slate-700">
                        <Link to={`/blogs/${post.id}`}>
                          <h3 className="text-base font-semibold text-slate-900 hover:text-primary-700 dark:text-slate-100 dark:hover:text-amber-200">
                            {post.title}
                          </h3>
                        </Link>
                        <p className="mt-2 text-xs text-slate-500">
                          {new Date(post.createdAt).toLocaleDateString()} · {post.readingTime} min read
                        </p>
                      </article>
                    ))}
                    {likedPosts.length === 0 && <p className="text-sm text-slate-500">No liked posts yet.</p>}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bookmark className="h-4 w-4 text-slate-400" />
                    <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Recent Posts</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSection('posts')}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300"
                  >
                    View all
                  </button>
                </div>
                <div className="mt-4 grid gap-4">
                  {recentPosts.map((post) => (
                    <article key={post.id} className="rounded-xl border border-slate-200/70 p-4 dark:border-slate-700">
                      <Link to={`/blogs/${post.id}`}>
                        <h3 className="text-lg font-semibold text-slate-900 hover:text-primary-700 dark:text-slate-100 dark:hover:text-amber-200">
                          {post.title}
                        </h3>
                      </Link>
                      {post.subtitle && <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{post.subtitle}</p>}
                      <p className="mt-3 text-xs text-slate-500">
                        {new Date(post.createdAt).toLocaleDateString()} · {post.readingTime} min read
                      </p>
                    </article>
                  ))}
                  {data.posts.length === 0 && <p className="text-sm text-slate-500">No published posts yet.</p>}
                </div>
              </div>
            </section>
          )}

          {activeSection === 'favorites' && canViewFavorites && (
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Favorites</h2>
                {isMe && (
                  <Link to="/library" className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300">
                    Manage
                  </Link>
                )}
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {favoriteBooks.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="h-32 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700" />
                    <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {item.book?.title || 'Untitled'}
                    </p>
                    <p className="text-xs text-slate-500">{item.book?.author}</p>
                  </div>
                ))}
                {favoriteBooks.length === 0 && (
                  <p className="text-sm text-slate-500">No favorites yet.</p>
                )}
              </div>
            </section>
          )}

          {activeSection === 'liked' && canViewLikedPosts && (
            <section className="mt-8 space-y-5">
              {likedPosts.map((post) => (
                <article key={post.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <Link to={`/blogs/${post.id}`}>
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900 hover:text-primary-700 dark:text-slate-100 dark:hover:text-amber-200">
                      {post.title}
                    </h2>
                  </Link>
                  {post.subtitle && <p className="mt-2 text-slate-600 dark:text-slate-400">{post.subtitle}</p>}
                  <p className="mt-3 text-sm text-slate-500">
                    {new Date(post.createdAt).toLocaleDateString()} · {post.readingTime} min read
                  </p>
                </article>
              ))}
              {likedPosts.length === 0 && <p className="text-sm text-slate-500">No liked posts yet.</p>}
            </section>
          )}

          {activeSection === 'posts' && (
            <section className="mt-8 space-y-5">
              {data.posts.map((post) => (
                <article key={post.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <Link to={`/blogs/${post.id}`}>
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900 hover:text-primary-700 dark:text-slate-100 dark:hover:text-amber-200">
                      {post.title}
                    </h2>
                  </Link>
                  {post.subtitle && <p className="mt-2 text-slate-600 dark:text-slate-400">{post.subtitle}</p>}
                  {post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {post.tags.slice(0, 4).map((tag) => (
                        <Link
                          key={tag.id}
                          to={`/blogs?tag=${encodeURIComponent(tag.name)}`}
                          className="tone-hover-gold rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        >
                          #{tag.name}
                        </Link>
                      ))}
                    </div>
                  )}
                  <p className="mt-3 text-sm text-slate-500">
                    {new Date(post.createdAt).toLocaleDateString()} · {post.readingTime} min read
                  </p>
                </article>
              ))}

              {data.posts.length === 0 && <p className="text-sm text-slate-500">No published posts yet.</p>}
            </section>
          )}

          {activeSection === 'about' && (
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">About</h2>
              <p className="mt-4 text-base leading-relaxed text-slate-700 dark:text-slate-300">
                {data.user.about || data.user.shortBio || 'No about information shared yet.'}
              </p>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

export default UserProfilePage
