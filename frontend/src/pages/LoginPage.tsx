import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginData } from '@/lib/schemas'
import { useLogin } from '@/services/auth'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Logo from '@/components/ui/Logo'

const LoginPage = () => {
  const loginMutation = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginData) => {
    loginMutation.mutate(data)
    // Navigation is handled by useLogin hook based on user role
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="relative isolate overflow-hidden">
        <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-primary-200/50 blur-3xl dark:bg-primary-900/40" />
        <div className="absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-amber-200/50 blur-3xl dark:bg-amber-900/30" />

        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]"
          >
            <div className="hidden lg:block">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
                Modern Commerce
                <span className="h-1.5 w-1.5 rounded-full bg-primary-600" />
              </div>
              <h1 className="mt-6 text-5xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                Welcome back to a sharper shopping experience.
              </h1>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                Sign in to manage your orders, track shipments, and unlock curated picks built around your reading habits.
              </p>
              <div className="mt-8 grid gap-4 text-sm text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white">
                    <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.25 7.25a1 1 0 01-1.415.005L3.3 9.12a1 1 0 011.4-1.428l3.03 2.97 6.54-6.372a1 1 0 011.434 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Fast reorder and saved carts across devices.
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white">
                    <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.25 7.25a1 1 0 01-1.415.005L3.3 9.12a1 1 0 011.4-1.428l3.03 2.97 6.54-6.372a1 1 0 011.434 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Real-time stock visibility and updates.
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white">
                    <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.25 7.25a1 1 0 01-1.415.005L3.3 9.12a1 1 0 011.4-1.428l3.03 2.97 6.54-6.372a1 1 0 011.434 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Secure checkout backed by verified payment flows.
                </div>
              </div>
            </div>

            <div>
              <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-8 shadow-xl shadow-slate-200/40 backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/80 dark:shadow-slate-900/40">
                <div className="flex items-center justify-between">
                  <Logo />
                  <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                    Member Access
                  </span>
                </div>

                <div className="mt-8">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    Sign in to your account
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Or{' '}
                    <Link
                      to="/register"
                      className="font-semibold text-primary-600 hover:text-primary-700"
                    >
                      create a new account
                    </Link>
                  </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-4">
                    <Input
                      {...register('email')}
                      type="email"
                      label="Email address"
                      placeholder="Enter your email"
                      error={errors.email?.message}
                      autoComplete="email"
                    />

                    <Input
                      {...register('password')}
                      type="password"
                      label="Password"
                      placeholder="Enter your password"
                      error={errors.password?.message}
                      autoComplete="current-password"
                    />
                  </div>

                  {loginMutation.error && (
                    <div className="rounded-xl border border-red-100 bg-red-50/80 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-200">
                      <div className="flex items-start gap-3">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
                          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.721-1.36 3.486 0l6.518 11.597c.75 1.336-.213 3.004-1.742 3.004H3.48c-1.53 0-2.493-1.668-1.743-3.004L8.257 3.1zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-8a1 1 0 00-.993.883L9 7v4a1 1 0 001.993.117L11 11V7a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </span>
                        <div>
                          <p className="font-semibold text-red-800 dark:text-red-200">Login Failed</p>
                          <p className="mt-1 text-sm text-red-700 dark:text-red-200">
                            {loginMutation.error.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    isLoading={loginMutation.isPending}
                    className="w-full"
                  >
                    Sign in
                  </Button>
                </form>
              </div>

              <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
                By signing in you agree to our policies and secure checkout terms.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
