import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useSearchParams } from 'react-router-dom'
import { Heart, MessageCircle, Eye, PenLine } from 'lucide-react'
import { getStoredContentText } from '@/lib/editor'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import BlogBreadcrumbs from '@/components/blog/BlogBreadcrumbs'
import FollowStateBadge from '@/components/blog/FollowStateBadge'
import {
  type Blog,
  type BlogFeedTab,
  useBlogs,
  useFollowAuthor,
  useFollowedAuthors,
  useLikeBlog,
  useMyLikedBlogPosts,
  useStaffPicks,
  useTrendingBlogTags,
  useUnfollowAuthor,
  useUnlikeBlog,
} from '@/services/blogs'

const FEED_TABS: Array<{ key: BlogFeedTab; label: string }> = [
  { key: 'for_you', label: 'For You' },
  { key: 'trending', label: 'Trending' },
  { key: 'latest', label: 'Latest' },
  { key: 'following', label: 'Following' },
]

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

const readTagsFromParams = (params: URLSearchParams) => {
  const legacyTags = params
    .getAll('tag')
    .map((name) => name.trim())
    .filter(Boolean)
  const commaTags = (params.get('tags') || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)

  return Array.from(new Set([...legacyTags, ...commaTags]))
}

const blogVisualStyle = (blog: Blog, variant: 'hero' | 'tile' = 'hero') => {
  if (blog.coverImage) {
    const overlay = variant === 'hero'
      ? 'linear-gradient(180deg,rgba(2,6,23,0.24),rgba(2,6,23,0.78))'
      : 'linear-gradient(180deg,rgba(2,6,23,0.2),rgba(2,6,23,0.72))'
    return { backgroundImage: `${overlay},url(${blog.coverImage})` }
  }

  return {
    backgroundImage:
      variant === 'hero'
        ? 'linear-gradient(145deg,#172033,#243f5a 48%,#2f5f68 100%)'
        : 'linear-gradient(145deg,#1f2937,#334155 55%,#475569 100%)',
  }
}

const MosaicPostCard = ({
  blog,
  className,
  priority = false,
}: {
  blog: Blog
  className?: string
  priority?: boolean
}) => {
  return (
    <Link
      to={`/blogs/${blog.id}`}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-slate-200/70 shadow-[0_14px_28px_-18px_rgba(15,23,42,0.55)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_32px_-18px_rgba(15,23,42,0.62)] dark:border-white/15',
        className,
      )}
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.04]"
        style={blogVisualStyle(blog, priority ? 'hero' : 'tile')}
      />
      <div className="relative flex h-full min-h-[170px] flex-col justify-end p-4 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">
          {blog.author.name} · {blog.readingTime} min
        </p>
        <h3 className={cn('mt-1 line-clamp-2 font-semibold leading-tight', priority ? 'text-3xl' : 'text-xl')}>
          {blog.title}
        </h3>
      </div>
    </Link>
  )
}

const BlogCard = ({
  blog,
  isAuthed,
  isLiked,
  isFollowingAuthor,
  canFollow,
  onToggleLike,
  onToggleFollow,
  onToggleTag,
  activeTags,
}: {
  blog: Blog
  isAuthed: boolean
  isLiked: boolean
  isFollowingAuthor: boolean
  canFollow: boolean
  onToggleLike: (blog: Blog, liked: boolean) => void
  onToggleFollow: (blog: Blog, following: boolean) => void
  onToggleTag: (tagName: string) => void
  activeTags: Set<string>
}) => {
  return (
    <article className="border-b border-slate-200/90 pb-7 last:border-b-0 dark:border-white/10">
      <div className="mb-3 flex items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
        <div className="inline-flex min-w-0 items-center gap-2">
          <Link to={`/user/${blog.author.id}`} className="inline-flex items-center gap-2 hover:text-slate-900 dark:hover:text-slate-100">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {blog.author.name.slice(0, 1)}
            </span>
            <span className="font-medium">{blog.author.name}</span>
          </Link>
          <span className="truncate">{formatDate(blog.createdAt)} · {blog.readingTime} min read</span>
        </div>
        {canFollow && (
          <button
            type="button"
            onClick={() => onToggleFollow(blog, isFollowingAuthor)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition',
              isFollowingAuthor
                ? 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
                : 'border-slate-300 text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:text-slate-300',
            )}
          >
            <FollowStateBadge followed={isFollowingAuthor} className="h-4.5 w-4.5" />
            {isFollowingAuthor ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      <Link to={`/blogs/${blog.id}`} className="block space-y-2">
        <h2 className="text-[2.1rem] font-semibold tracking-tight text-slate-950 transition-colors hover:text-primary-700 dark:text-slate-50 dark:hover:text-amber-200">
          {blog.title}
        </h2>
        {blog.subtitle && (
          <p className="text-base text-slate-600 dark:text-slate-400 line-clamp-2">{blog.subtitle}</p>
        )}
        {!blog.subtitle && (
          <p className="text-base text-slate-600 dark:text-slate-400 line-clamp-2">{getStoredContentText(blog.content)}</p>
        )}
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {blog.tags.slice(0, 4).map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => onToggleTag(tag.name)}
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-medium transition duration-200 hover:scale-[1.03] active:scale-[0.98]',
              activeTags.has(tag.name)
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
            )}
          >
            #{tag.name}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
        <button
          type="button"
          disabled={!isAuthed}
          onClick={() => onToggleLike(blog, isLiked)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2 py-1 transition-all',
            isLiked ? 'text-rose-500' : 'hover:text-slate-900 dark:hover:text-slate-200',
            isLiked ? 'hover:bg-rose-50 dark:hover:bg-rose-950/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800',
            !isAuthed && 'cursor-not-allowed opacity-60',
          )}
          title={isAuthed ? 'Like this post' : 'Login to like posts'}
        >
          <Heart className={cn('h-4 w-4 transition-transform duration-200 active:scale-90', isLiked && 'fill-current')} />
          <span>{blog.likesCount}</span>
        </button>
        <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800"><MessageCircle className="h-4 w-4" />{blog.commentsCount}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800"><Eye className="h-4 w-4" />{blog.viewsCount}</span>
      </div>
    </article>
  )
}

const AuthorBlogsPage = () => {
  const { isAuthenticated, user } = useAuthStore()
  const [tab, setTab] = useState<BlogFeedTab>('for_you')
  const [page, setPage] = useState(1)
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedTags = useMemo(() => readTagsFromParams(searchParams), [searchParams])
  const selectedTagSet = useMemo(() => new Set(selectedTags), [selectedTags])

  useEffect(() => {
    setPage(1)
  }, [selectedTags.join('|')])

  const toggleTagFilter = (tagName: string) => {
    const normalized = tagName.trim()
    if (!normalized) return

    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      const currentTags = readTagsFromParams(next)
      const hasTag = currentTags.includes(normalized)
      const nextTags = hasTag
        ? currentTags.filter((item) => item !== normalized)
        : [...currentTags, normalized]
      next.delete('tag')
      if (nextTags.length > 0) {
        next.set('tags', nextTags.join(','))
      } else {
        next.delete('tags')
      }
      return next
    })
  }

  const clearTagFilters = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('tag')
      next.delete('tags')
      return next
    })
  }

  const { data: feed, isLoading, error: feedError } = useBlogs({ tab, tags: selectedTags, page, limit: 10 })
  const { data: tags = [] } = useTrendingBlogTags()
  const { data: staffPicks = [] } = useStaffPicks()
  const { data: follows = [] } = useFollowedAuthors(isAuthenticated)
  const { data: liked = { postIds: [] } } = useMyLikedBlogPosts(isAuthenticated)

  const likeMutation = useLikeBlog()
  const unlikeMutation = useUnlikeBlog()
  const followMutation = useFollowAuthor()
  const unfollowMutation = useUnfollowAuthor()

  const likedSet = useMemo(() => new Set(liked.postIds), [liked.postIds])
  const followedSet = useMemo(() => new Set(follows.map((f) => f.authorId)), [follows])

  const items = feed?.items ?? []
  const heroPosts = items.slice(0, 5)
  const leadHeroPost = heroPosts[0]
  const secondaryHeroPosts = heroPosts.slice(1, 3)
  const tertiaryHeroPosts = heroPosts.slice(3, 5)
  const feedOffset = items.length > 6 ? 5 : 1
  const feedPosts = items.slice(feedOffset)
  const mainFeedPosts = feedPosts.length > 0 ? feedPosts : items.slice(1)
  const editorialPicks = (staffPicks.length > 0 ? staffPicks : items).slice(0, 4)
  const editorialLead = editorialPicks[0]
  const editorialList = editorialPicks.slice(1)
  const total = feed?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / (feed?.limit ?? 10)))

  const handleToggleLike = (blog: Blog, currentlyLiked: boolean) => {
    if (!isAuthenticated) return
    if (currentlyLiked) {
      void unlikeMutation.mutateAsync(blog.id)
      return
    }
    void likeMutation.mutateAsync(blog.id)
  }

  const handleToggleFollow = (blog: Blog, currentlyFollowing: boolean) => {
    if (!isAuthenticated) return
    if (currentlyFollowing) {
      void unfollowMutation.mutateAsync(blog.authorId)
      return
    }
    void followMutation.mutateAsync(blog.authorId)
  }

  const popularAuthors = useMemo(() => {
    const map = new Map<string, { id: string; name: string; posts: number }>()
    for (const post of items) {
      const prev = map.get(post.author.id)
      map.set(post.author.id, {
        id: post.author.id,
        name: post.author.name,
        posts: (prev?.posts ?? 0) + 1,
      })
    }
    return Array.from(map.values()).sort((a, b) => b.posts - a.posts).slice(0, 5)
  }, [items])

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-6 top-8 h-[280px] rounded-[2.2rem] bg-[radial-gradient(circle_at_18%_22%,rgba(120,155,235,0.18),rgba(255,255,255,0)_48%),radial-gradient(circle_at_78%_20%,rgba(89,192,174,0.16),rgba(255,255,255,0)_44%)] blur-2xl dark:bg-[radial-gradient(circle_at_18%_22%,rgba(120,155,235,0.22),rgba(0,0,0,0)_48%),radial-gradient(circle_at_78%_20%,rgba(89,192,174,0.2),rgba(0,0,0,0)_44%)]" />
      <BlogBreadcrumbs
        className="mb-4"
        items={[
          { label: 'Home', to: '/' },
          { label: 'Blogs' },
        ]}
      />
      <header className="relative mb-8 overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white/70 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45">
        <div className="pointer-events-none absolute -right-14 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(148,163,184,0.26),rgba(148,163,184,0)_68%)] dark:bg-[radial-gradient(circle,rgba(148,163,184,0.2),rgba(148,163,184,0)_68%)]" />
        <div className="relative flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Treasure House</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Blogs</h1>
          <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">
            Content-first writing space for reviews, essays, and reading journeys.
          </p>
        </div>

        {isAuthenticated && (
          <Link
            to="/blogs/write"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_-16px_rgba(15,23,42,0.58)] transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-amber-300 dark:text-slate-900 dark:hover:bg-amber-200"
          >
            <PenLine className="h-4 w-4" /> Write
          </Link>
        )}
        </div>
      </header>

      <div className="mb-6 inline-flex flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-white/75 p-1.5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45">
        {FEED_TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              setTab(item.key)
              setPage(1)
            }}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200',
              tab === item.key
                ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      {selectedTags.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Active tags</span>
          {selectedTags.map((tagName) => (
            <button
              key={tagName}
              type="button"
              onClick={() => toggleTagFilter(tagName)}
              className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              #{tagName} ×
            </button>
          ))}
          <button
            type="button"
            onClick={clearTagFilters}
            className="rounded-full px-2 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr),320px]">
        <section className="space-y-5">
          {leadHeroPost && (
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="space-y-3"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Featured Grid</p>
              <div className="grid gap-3 md:grid-cols-[1.25fr_0.75fr]">
                <MosaicPostCard blog={leadHeroPost} priority className="min-h-[330px]" />
                <div className="grid gap-3">
                  {secondaryHeroPosts.map((blog) => (
                    <MosaicPostCard key={blog.id} blog={blog} className="min-h-[158px]" />
                  ))}
                </div>
              </div>
              {tertiaryHeroPosts.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {tertiaryHeroPosts.map((blog) => (
                    <MosaicPostCard key={blog.id} blog={blog} className="min-h-[158px]" />
                  ))}
                </div>
              )}
            </motion.section>
          )}

          {editorialLead && (
            <section className="rounded-3xl border border-slate-200/80 bg-white/70 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/40">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Editor&apos;s Picks</p>
                <Link to={`/blogs/${editorialLead.id}`} className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                  Open Story
                </Link>
              </div>
              <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                <MosaicPostCard blog={editorialLead} className="min-h-[280px]" />
                <div className="space-y-3">
                  {editorialList.map((pick) => (
                    <Link
                      key={pick.id}
                      to={`/blogs/${pick.id}`}
                      className="block rounded-2xl border border-slate-200/85 bg-white/80 p-3 transition hover:-translate-y-0.5 hover:border-slate-300 dark:border-white/10 dark:bg-slate-900/45 dark:hover:border-white/25"
                    >
                      <p className="line-clamp-2 text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">{pick.title}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{pick.author.name} · {pick.readingTime} min</p>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {!isAuthenticated && tab === 'following' && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
              <Link to="/login" className="font-semibold text-primary-600 dark:text-amber-300">Login</Link> to view posts from authors you follow.
            </div>
          )}

          {feedError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
              Failed to load blog posts.
            </div>
          ) : isLoading ? (
            <div className="text-sm text-slate-500">Loading posts...</div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700">
              No posts available in this feed.
            </div>
          ) : (
            <div className="space-y-7">
              {mainFeedPosts.map((blog, idx) => (
                <motion.div
                  key={blog.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut', delay: idx * 0.04 }}
                >
                  <BlogCard
                    blog={blog}
                    isAuthed={isAuthenticated}
                    isLiked={likedSet.has(blog.id)}
                    isFollowingAuthor={followedSet.has(blog.authorId)}
                    canFollow={isAuthenticated && blog.authorId !== user?.id}
                    onToggleLike={handleToggleLike}
                    onToggleFollow={handleToggleFollow}
                    onToggleTag={toggleTagFilter}
                    activeTags={selectedTagSet}
                  />
                </motion.div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 text-sm text-slate-500 dark:text-slate-400">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded border border-slate-300 px-3 py-1.5 disabled:opacity-40 dark:border-slate-700"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded border border-slate-300 px-3 py-1.5 disabled:opacity-40 dark:border-slate-700"
              >
                Next
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-slate-200/75 bg-white/72 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/38">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Trending Tags</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.length === 0 && <p className="text-sm text-slate-500">No tags yet.</p>}
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => {
                    toggleTagFilter(tag.name)
                    setPage(1)
                  }}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-xs font-medium',
                    selectedTagSet.has(tag.name)
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                      : 'border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300',
                  )}
                >
                  #{tag.name} ({tag.usageCount})
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/75 bg-white/72 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/38">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Popular Authors</h2>
            <div className="mt-4 space-y-3 text-sm">
              {popularAuthors.length === 0 && <p className="text-slate-500">No data yet.</p>}
              {popularAuthors.map((author) => (
                <Link
                  key={author.id}
                  to={`/user/${author.id}`}
                  className="flex items-center justify-between text-slate-700 hover:text-primary-700 dark:text-slate-300 dark:hover:text-amber-200"
                >
                  <span>{author.name}</span>
                  <span className="text-xs text-slate-500">{author.posts} posts</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/75 bg-white/72 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/38">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Staff Picks</h2>
            <div className="mt-4 space-y-3">
              {staffPicks.map((pick) => (
                <Link key={pick.id} to={`/blogs/${pick.id}`} className="block">
                  <p className="line-clamp-2 text-sm font-semibold text-slate-800 hover:text-primary-700 dark:text-slate-100 dark:hover:text-amber-200">
                    {pick.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{pick.author.name}</p>
                </Link>
              ))}
              {staffPicks.length === 0 && <p className="text-sm text-slate-500">No staff picks yet.</p>}
            </div>
          </div>
        </aside>
      </div>

      {isAuthenticated && (
        <Link
          to="/blogs/write"
          className="fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg lg:hidden dark:bg-amber-300 dark:text-slate-900"
        >
          <PenLine className="h-4 w-4" /> Write
        </Link>
      )}
    </div>
  )
}

export default AuthorBlogsPage
