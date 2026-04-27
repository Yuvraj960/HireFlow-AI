import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

const FIELDS = [
  { name: 'field', label: 'Field / Domain', placeholder: 'e.g. Computer Science, Data Science', required: true },
  { name: 'college', label: 'College / University', placeholder: 'e.g. IIT Delhi', required: false },
  { name: 'company', label: 'Current Company (if working)', placeholder: 'Optional', required: false },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { completeOnboarding, loading } = useAuthStore()
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { userType: 'student', interviewCount: '0', skillLevel: 'beginner' }
  })
  const userType = watch('userType')

  const onSubmit = async (data) => {
    try {
      // Convert targetRoles and targetCompanies from comma-separated strings
      const payload = {
        ...data,
        targetRoles: data.targetRoles ? data.targetRoles.split(',').map(s => s.trim()).filter(Boolean) : [],
        targetCompanies: data.targetCompanies ? data.targetCompanies.split(',').map(s => s.trim()).filter(Boolean) : [],
        yearsOfExperience: Number(data.yearsOfExperience) || 0,
      }
      await completeOnboarding(payload)
      toast.success("Welcome to HireFlow AI! 🎉")
      navigate('/')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Onboarding failed.')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
            <span className="text-2xl font-headline font-extrabold text-on-surface">HireFlow AI</span>
          </div>
          <h1 className="text-3xl font-headline font-bold text-on-surface">Complete your profile</h1>
          <p className="text-on-surface-variant mt-2">Help us personalize your experience</p>
        </div>

        <div className="bg-surface-container-low rounded-[2rem] border border-outline-variant/10 p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* User Type */}
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-3">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                {['student', 'professional'].map((type) => (
                  <label key={type} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${watch('userType') === type ? 'border-primary bg-primary-container/30' : 'border-outline-variant/20 bg-surface-container-high hover:border-primary/40'}`}>
                    <input type="radio" value={type} {...register('userType', { required: true })} className="sr-only" />
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {type === 'student' ? 'school' : 'work'}
                    </span>
                    <span className="font-semibold capitalize text-on-surface">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Field */}
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">Field / Domain *</label>
              <input
                {...register('field', { required: 'Required' })}
                placeholder="e.g. Computer Science, Data Science, Frontend"
                className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/60 transition-all"
              />
              {errors.field && <p className="text-error text-xs mt-1">{errors.field.message}</p>}
            </div>

            {/* Conditional fields */}
            {userType === 'student' ? (
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">College / University</label>
                <input
                  {...register('college')}
                  placeholder="e.g. IIT Delhi, VIT Vellore"
                  className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/60 transition-all"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Current Company</label>
                  <input
                    {...register('company')}
                    placeholder="e.g. Infosys, TCS"
                    className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/60 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Years of Experience</label>
                  <input
                    {...register('yearsOfExperience')}
                    type="number" min="0" max="50" placeholder="e.g. 2"
                    className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/60 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Interview Count */}
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-3">How many interviews have you given?</label>
              <div className="flex flex-wrap gap-2">
                {[['0', '0'], ['1-3', '1–3'], ['4-10', '4–10'], ['10+', '10+']].map(([val, label]) => (
                  <label key={val} className={`px-4 py-2 rounded-full cursor-pointer border text-sm font-medium transition-all ${watch('interviewCount') === val ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant/30 text-on-surface-variant hover:border-primary/50'}`}>
                    <input type="radio" value={val} {...register('interviewCount')} className="sr-only" />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* Skill Level */}
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-3">Skill Level</label>
              <div className="flex gap-3">
                {['beginner', 'intermediate', 'advanced'].map((level) => (
                  <label key={level} className={`flex-1 text-center py-2.5 rounded-xl cursor-pointer border text-sm font-medium capitalize transition-all ${watch('skillLevel') === level ? 'bg-secondary-container/60 border-secondary text-on-secondary-container font-bold' : 'border-outline-variant/20 text-on-surface-variant hover:border-secondary/40'}`}>
                    <input type="radio" value={level} {...register('skillLevel')} className="sr-only" />
                    {level}
                  </label>
                ))}
              </div>
            </div>

            {/* Target Companies */}
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">Target Companies <span className="text-on-surface-variant font-normal">(comma-separated)</span></label>
              <input
                {...register('targetCompanies')}
                placeholder="e.g. Google, Amazon, Microsoft"
                className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/60 transition-all"
              />
            </div>

            {/* Target Roles */}
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">Target Roles <span className="text-on-surface-variant font-normal">(comma-separated)</span></label>
              <input
                {...register('targetRoles')}
                placeholder="e.g. SDE-1, Data Analyst, Backend Engineer"
                className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/60 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-primary to-on-primary-container text-on-primary rounded-xl font-bold text-base hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Setting up...</>
              ) : (
                <><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span> Launch HireFlow AI</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
