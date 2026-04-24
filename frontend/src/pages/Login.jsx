import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const navigate = useNavigate()
  const { login, loading, error } = useAuthStore()
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    try {
      const result = await login(data.email, data.password)
      if (result?.requiresOnboarding) {
        toast('Complete your profile to get started!', { icon: '👤' })
        navigate('/onboarding')
      } else {
        toast.success('Welcome back!')
        navigate('/')
      }
    } catch (err) {
      const status = err?.response?.status
      if (status === 402) {
        toast.error('Payment required. Please complete payment first.', { duration: 5000 })
      } else {
        toast.error(err?.response?.data?.message || 'Login failed.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
            <span className="text-2xl font-headline font-extrabold text-on-surface">HireFlow AI</span>
          </div>
          <h1 className="text-3xl font-headline font-bold text-on-surface">Sign in</h1>
          <p className="text-on-surface-variant mt-2">Your AI-powered interview platform awaits</p>
        </div>

        <div className="bg-surface-container-low rounded-[2rem] border border-outline-variant/10 p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">Email</label>
              <input
                {...register('email', { required: 'Email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })}
                type="email"
                placeholder="you@example.com"
                autoFocus
                className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
              />
              {errors.email && <p className="text-error text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">Password</label>
              <input
                {...register('password', { required: 'Password is required' })}
                type="password"
                placeholder="••••••••"
                className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
              />
              {errors.password && <p className="text-error text-xs mt-1">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="p-3 bg-error-container/30 border border-error/20 rounded-xl text-sm text-on-error-container">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary text-on-primary rounded-xl font-bold text-base hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Signing in...</>
              ) : 'Sign In'}
            </button>

            <p className="text-center text-sm text-on-surface-variant">
              New here?{' '}
              <Link to="/register" className="text-primary font-semibold hover:underline">Create account</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
