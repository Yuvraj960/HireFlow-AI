import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

export default function Register() {
  const navigate = useNavigate()
  const { register: registerUser, loading, error } = useAuthStore()
  const [step, setStep] = useState(1) // 1 = form, 2 = success/bypass message

  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    try {
      const result = await registerUser(data.name, data.email, data.password)

      if (result?.bypassPayment) {
        // Dev mode: no payment needed, go straight to login
        toast.success('Account created! Please log in to continue.')
        navigate('/login')
      } else {
        // Production: user needs to pay — show them the subscriptionId info
        setStep(2)
        toast('Account created! Complete payment to activate.', { icon: '💳' })
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed.')
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
          <h1 className="text-3xl font-headline font-bold text-on-surface">Create your account</h1>
          <p className="text-on-surface-variant mt-2">Start your AI-powered interview preparation</p>
        </div>

        <div className="bg-surface-container-low rounded-[2rem] border border-outline-variant/10 p-8 shadow-2xl">
          {step === 1 ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Full Name</label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  type="text"
                  placeholder="Rahul Sharma"
                  className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
                />
                {errors.name && <p className="text-error text-xs mt-1">{errors.name.message}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Email</label>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' }
                  })}
                  type="email"
                  placeholder="you@example.com"
                  className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
                />
                {errors.email && <p className="text-error text-xs mt-1">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Password</label>
                <input
                  {...register('password', { required: 'Password required', minLength: { value: 6, message: 'Min 6 characters' } })}
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
                  <>
                    <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : 'Create Account'}
              </button>

              <p className="text-center text-sm text-on-surface-variant">
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
              </p>
            </form>
          ) : (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-on-surface mb-2">Account created!</h3>
                <p className="text-on-surface-variant text-sm">Please complete payment to activate your account, then log in.</p>
              </div>
              <button onClick={() => navigate('/login')} className="w-full py-3 bg-primary text-on-primary rounded-xl font-bold hover:brightness-110 transition-all">
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
