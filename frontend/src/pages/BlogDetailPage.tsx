import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Eye, Heart, MessageCircle, Share2, Trash2 } from 'lucide-react'
import { getErrorMessage } from '@/lib/api'
import { renderStoredContentHtml } from '@/lib/editor'
import { useAuthStore } from '@/store/auth.store'
import BlogBreadcrumbs from '@/components/blog/BlogBreadcrumbs'
import FollowStateBadge from '@/components/blog/FollowStateBadge'
import BookCover from '@/components/ui/BookCover'
import {
  useAddBlogComment,
  useBlogDetails,
  useBlogs,
  useDeleteBlog,
  useDeleteBlogComment,
  useFollowAuthor,
  useFollowedAuthors,
  useLikeBlog,
  useMyLikedBlogPosts,
  useStaffPicks,
  useUnfollowAuthor,
  useUnlikeBlog,
} from '@/services/blogs'

const BlogDetailPage = () => {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const { data: blog, isLoading, error } = useBlogDetails(id, !!id)
  const { data: relatedFeed } = useBlogs({
    tab: 'trending',
    tags: blog?.tags.slice(0, 3).map((tag) => tag.name),
    page: 1,
    limit: 8,
  })
  const { data: staffPicks = [] } = useStaffPicks()
  const { data: follows = [] } = useFollowedAuthors(isAuthenticated)
  const { data: liked = { postIds: [] } } = useMyLikedBlogPosts(isAuthenticated)

  const followMutation = useFollowAuthor()
  const unfollowMutation = useUnfollowAuthor()
  const likeMutation = useLikeBlog()
  const unlikeMutation = useUnlikeBlog()
  const addComment = useAddBlogComment()
  const deleteComment = useDeleteBlogComment()
  const deleteBlog = useDeleteBlog()

  const [comment, setComment] = useState('')
  const [feedback, setFeedback] = useState('')

  const isFollowingAuthor = useMemo(
    () => follows.some((f) => f.authorId === blog?.authorId),
    [follows, blog?.authorId],
  )
  const isLiked = useMemo(
    () => (blog ? liked.postIds.includes(blog.id) : false),
    [liked.postIds, blog],
  )
  const canEditOrDelete = user?.id === blog?.authorId || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const relatedByTags = useMemo(() => {
    if (!blog) return []
    const currentTagNames = new Set(blog.tags.map((tag) => tag.name))
    return (relatedFeed?.items ?? [])
      .filter((item) => item.id !== blog.id)
      .filter((item) => item.tags.some((tag) => currentTagNames.has(tag.name)))
      .slice(0, 5)
  }, [blog, relatedFeed?.items])
  const fallbackRelated = useMemo(() => {
    if (!blog) return []
    return staffPicks
      .filter((item) => item.id !== blog.id)
      .slice(0, 5)
  }, [blog, staffPicks])
  const relatedPosts = relatedByTags.length > 0 ? relatedByTags : fallbackRelated

  const handleComment = async () => {
    if (!blog || !comment.trim()) return
    try {
      await addComment.mutateAsync({ blogId: blog.id, content: comment.trim() })
      setComment('')
      setFeedback('Comment posted.')
    } catch (error) {
      setFeedback(getErrorMessage(error))
    }
  }

  const handleDelete = async () => {
    if (!blog) return
    try {
      await deleteBlog.mutateAsync(blog.id)
      navigate('/blogs')
    } catch (error) {
      setFeedback(getErrorMessage(error))
    }
  }

  if (error) {
    return <div className="mx-auto max-w-4xl px-4 py-10 text-sm text-rose-600">Failed to load this post.</div>
  }

  if (isLoading || !blog) {
    return <div className="mx-auto max-w-4xl px-4 py-10 text-sm text-slate-500">Loading post...</div>
  }

  return (
    <article className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <BlogBreadcrumbs
        className="mb-4"
        items={[
          { label: 'Home', to: '/' },
          { label: 'Blogs', to: '/blogs' },
          { label: blog.title },
        ]}
      />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr),320px]">
        <div>
          <header className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45">
            <div
              className="relative h-56 w-full bg-cover bg-center"
              style={{
                backgroundImage: blog.coverImage
                  ? `linear-gradient(180deg,rgba(2,6,23,0.2),rgba(2,6,23,0.74)),url(${blog.coverImage})`
                  : 'linear-gradient(140deg,#1f2937,#334155 55%,#475569)',
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),rgba(255,255,255,0)_52%)]" />
            </div>
            <div className="border-t border-slate-200/80 px-5 pb-6 pt-5 dark:border-white/10 sm:px-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{blog.readingTime} min read</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{blog.title}</h1>
              {blog.subtitle && <p className="mt-3 text-xl text-slate-600 dark:text-slate-400">{blog.subtitle}</p>}

              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <Link to={`/user/${blog.author.id}`} className="font-semibold hover:text-slate-900 dark:hover:text-slate-200">{blog.author.name}</Link>
                <span>·</span>
                <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1"><Eye className="h-4 w-4" />{blog.viewsCount}</span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {blog.tags.map((tag) => (
                  <Link key={tag.id} to={`/blogs?tag=${encodeURIComponent(tag.name)}`} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                    #{tag.name}
                  </Link>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={!isAuthenticated}
                  onClick={() => (isLiked ? unlikeMutation.mutate(blog.id) : likeMutation.mutate(blog.id))}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-100"
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current text-rose-500' : ''}`} /> {blog.likesCount}
                </button>

                {isAuthenticated && user?.id !== blog.authorId && (
                  <button
                    type="button"
                    onClick={() => (isFollowingAuthor ? unfollowMutation.mutate(blog.authorId) : followMutation.mutate(blog.authorId))}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                      isFollowingAuthor
                        ? 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
                        : 'border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-100'
                    }`}
                  >
                    <FollowStateBadge followed={isFollowingAuthor} />
                    {isFollowingAuthor ? 'Following' : 'Follow'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-100"
                >
                  <Share2 className="h-4 w-4" /> Share
                </button>

                {canEditOrDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="ml-auto inline-flex items-center gap-1 rounded-full border border-rose-300 px-3 py-1.5 text-sm text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                )}
              </div>
            </div>
          </header>

          <section className="prose prose-slate mt-8 max-w-none text-[17px] leading-8 dark:prose-invert">
            <div dangerouslySetInnerHTML={{ __html: renderStoredContentHtml(blog.content) }} />
          </section>

          {blog.bookReferences.length > 0 && (
            <section className="mt-10 rounded-2xl border border-slate-200 bg-white/65 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/35">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Referenced Books</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {blog.bookReferences.map((book, idx) => (
                  <Link
                    key={book.id}
                    to={`/books/${book.id}`}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-3 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_12px_28px_-20px_rgba(15,23,42,0.55)] dark:border-white/10 dark:bg-slate-900/45 dark:hover:border-white/25"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-20 w-14 shrink-0 overflow-hidden rounded-md border border-slate-200 shadow-sm dark:border-white/10">
                        <BookCover src={book.coverImage ?? null} alt={book.title} className="h-full w-full" variant="physical" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">{book.title}</p>
                        <p className="truncate text-sm text-slate-500 dark:text-slate-400">{book.author}</p>
                        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                          Reference {String(idx + 1).padStart(2, '0')}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mt-10">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Comments ({blog.comments?.length ?? blog.commentsCount})</h3>

        {isAuthenticated ? (
          <div className="mt-4 space-y-2">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add your comment"
              className="min-h-[100px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <button
              type="button"
              onClick={handleComment}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
            >
              <span className="inline-flex items-center gap-1"><MessageCircle className="h-4 w-4" /> Post Comment</span>
            </button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500"><Link to="/login" className="font-semibold text-primary-600 dark:text-amber-300">Login</Link> to comment.</p>
        )}

        <div className="mt-6 space-y-3">
          {(blog.comments ?? []).map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.user.name}</p>
                {(user?.id === item.userId || canEditOrDelete) && (
                  <button
                    type="button"
                    onClick={() => deleteComment.mutate({ commentId: item.id, blogId: blog.id })}
                    className="text-xs font-semibold text-rose-600"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.content}</p>
            </div>
          ))}
          {(blog.comments ?? []).length === 0 && (
            <p className="text-sm text-slate-500">No comments yet.</p>
          )}
        </div>
          </section>

          {feedback && <p className="mt-4 text-sm text-rose-600">{feedback}</p>}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white/72 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/35">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">More Like This</h3>
            <div className="mt-3 space-y-3">
              {relatedPosts.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">No related posts yet.</p>
              )}
              {relatedPosts.map((post) => (
                <Link key={post.id} to={`/blogs/${post.id}`} className="group block overflow-hidden rounded-xl border border-slate-200 bg-white/75 transition hover:-translate-y-0.5 hover:border-slate-300 dark:border-white/10 dark:bg-slate-900/45 dark:hover:border-white/20">
                  <div
                    className="h-24 w-full bg-cover bg-center"
                    style={{
                      backgroundImage: post.coverImage
                        ? `linear-gradient(180deg,rgba(2,6,23,0.15),rgba(2,6,23,0.62)),url(${post.coverImage})`
                        : 'linear-gradient(140deg,#334155,#475569)',
                    }}
                  />
                  <div className="p-3">
                    <p className="line-clamp-2 text-sm font-semibold text-slate-900 transition group-hover:text-primary-700 dark:text-slate-100 dark:group-hover:text-amber-200">
                      {post.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {post.author.name} · {post.readingTime} min
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/72 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/35">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">From This Author</h3>
            <Link to={`/user/${blog.author.id}`} className="mt-3 block rounded-xl border border-slate-200 bg-white/80 p-3 transition hover:border-slate-300 dark:border-white/10 dark:bg-slate-900/45 dark:hover:border-white/20">
              <p className="font-semibold text-slate-900 dark:text-slate-100">{blog.author.name}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">See profile and published posts</p>
            </Link>
          </div>
        </aside>
      </div>
    </article>
  )
}

export default BlogDetailPage
