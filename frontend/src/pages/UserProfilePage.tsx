import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { UserCheck, UserPlus } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import {
  useFollowAuthor,
  useStaffPicks,
  useTrendingBlogTags,
  useUnfollowAuthor,
  useUserBlogProfile,
} from '@/services/blogs'
import BlogBreadcrumbs from '@/components/blog/BlogBreadcrumbs'
import Avatar from '@/components/user/Avatar'

const UserProfilePage = () => {
  const { id = '' } = useParams()
  const { user, isAuthenticated } = useAuthStore()
  const [activeSection, setActiveSection] = useState<'home' | 'about'>('home')
  const { data, isLoading } = useUserBlogProfile(id, !!id)
  const { data: trendingTags = [] } = useTrendingBlogTags()
  const { data: staffPicks = [] } = useStaffPicks()
  const followMutation = useFollowAuthor()
  const unfollowMutation = useUnfollowAuthor()

  if (isLoading || !data) {
    return <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-slate-500">Loading profile...</div>
  }

  const isMe = user?.id === data.user.id

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
      <div className="mt-8 grid gap-8 lg:grid-cols-[260px,minmax(0,1fr),300px]">
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Recommendations</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {trendingTags.slice(0, 8).map((tag) => (
                <Link
                  key={tag.id}
                  to={`/blogs?tag=${encodeURIComponent(tag.name)}`}
                  className="rounded-full border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500"
                >
                  #{tag.name}
                </Link>
              ))}
              {trendingTags.length === 0 && <p className="text-sm text-slate-500">No tag recommendations yet.</p>}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Staff Picks</h2>
            <div className="mt-4 space-y-3">
              {staffPicks.slice(0, 4).map((pick) => (
                <Link key={pick.id} to={`/blogs/${pick.id}`} className="block">
                  <p className="line-clamp-2 text-sm font-semibold text-slate-900 hover:text-primary-700 dark:text-slate-100 dark:hover:text-amber-200">
                    {pick.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{pick.author.name}</p>
                </Link>
              ))}
              {staffPicks.length === 0 && <p className="text-sm text-slate-500">No staff picks yet.</p>}
            </div>
          </section>
        </aside>

        <main>
          <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div
              className="h-44 w-full bg-gradient-to-r from-sky-100 via-cyan-100 to-indigo-100 bg-cover bg-center dark:from-slate-800 dark:via-slate-700 dark:to-slate-800"
              style={
                data.user.coverImage
                  ? { backgroundImage: `linear-gradient(rgba(15,23,42,0.15), rgba(15,23,42,0.35)), url(${data.user.coverImage})` }
                  : undefined
              }
            />
            <div className="px-6 pb-6">
              <div className="-mt-14 flex flex-wrap items-end justify-between gap-4">
                <div className="flex items-end gap-4">
                  <Avatar
                    avatarType={data.user.avatarType === 'upload' ? 'upload' : 'emoji'}
                    avatarValue={data.user.avatarValue || 'avatar-1'}
                    backgroundColor={data.user.backgroundColor || 'bg-slate-100'}
                    size="xl"
                    className="border-4 border-white shadow-lg dark:border-slate-900"
                  />
                  <div className="pb-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Author Profile</p>
                    <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{data.user.name}</h1>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {data.user.pronouns ? `${data.user.pronouns} · ` : ''}{data.user.email}
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                Followers {data.stats.followers} · Following {data.stats.following} · Posts {data.stats.posts}
              </p>
              <div className="mt-5 flex items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveSection('home')}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    activeSection === 'home'
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  Home
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

          {activeSection === 'home' ? (
            <section className="mt-8 space-y-5">
              {data.posts.map((post) => (
                <article key={post.id} className="border-b border-slate-200 pb-5 last:border-b-0 dark:border-slate-800">
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
                          className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
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
          ) : (
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">About</h2>
              <p className="mt-4 text-base leading-relaxed text-slate-700 dark:text-slate-300">
                {data.user.about || data.user.shortBio || 'No about information shared yet.'}
              </p>
            </section>
          )}
        </main>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{data.user.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{data.user.email}</p>
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
              {data.stats.followers} followers · {data.stats.following} following
            </p>
            {data.user.shortBio && (
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                {data.user.shortBio}
              </p>
            )}

            {isAuthenticated && !isMe && (
              <button
                type="button"
                onClick={() => (data.isFollowing ? unfollowMutation.mutate(data.user.id) : followMutation.mutate(data.user.id))}
                className="mt-5 inline-flex w-full items-center justify-center gap-1 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
              >
                {data.isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {data.isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}

export default UserProfilePage
