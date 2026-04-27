import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { useAuthStore } from '../store/authStore'
import { useProcessStore } from '../store/processStore'
import { unwrap, timeAgo } from '../utils/helpers'
import { Skeleton } from '../components/ui/Skeleton'

export default function Profile() {
  const { user, loadUser } = useAuthStore()
  const { processes } = useProcessStore()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    if (user) reset({
      name: user.name || '',
      field: user.profile?.field || user.field || '',
      college: user.profile?.college || user.college || '',
      company: user.profile?.company || user.company || '',
      targetCompanies: (user.profile?.targetCompanies || user.targetCompanies || []).join(', '),
      targetRoles: (user.profile?.targetRoles || user.targetRoles || []).join(', '),
      skillLevel: user.profile?.skillLevel || user.skillLevel || 'beginner',
    })
  }, [user])

  useEffect(() => {
    // Compute stats from processes
    if (processes.length > 0) {
      setStats({
        total: processes.length,
        active: processes.filter(p => !['Offer', 'Rejected'].includes(p.currentStage)).length,
        offers: processes.filter(p => p.currentStage === 'Offer').length,
        rejected: processes.filter(p => p.currentStage === 'Rejected').length,
      })
    }
  }, [processes])

  const onSave = async (data) => {
    setSaving(true)
    try {
      const payload = {
        name: data.name,
        field: data.field,
        college: data.college,
        company: data.company,
        targetCompanies: data.targetCompanies ? data.targetCompanies.split(',').map(s => s.trim()).filter(Boolean) : [],
        targetRoles: data.targetRoles ? data.targetRoles.split(',').map(s => s.trim()).filter(Boolean) : [],
        skillLevel: data.skillLevel,
      }
      await api.patch('/user/profile', payload)
      await loadUser()
      setEditing(false)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  if (!user) return (
    <div className="p-8 space-y-6 max-w-3xl mx-auto">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
    </div>
  )

  const avatarLetter = user.name?.[0]?.toUpperCase() ?? 'U'
  const profileData = user.profile || user

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 overflow-y-auto flex-1 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline font-extrabold text-on-surface">My Profile</h1>
        <button
          onClick={() => setEditing(e => !e)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${editing ? 'bg-surface-container-high text-on-surface-variant' : 'bg-primary text-on-primary hover:brightness-110'}`}
        >
          <span className="material-symbols-outlined text-sm">{editing ? 'close' : 'edit'}</span>
          {editing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {/* Avatar + Identity */}
      <div className="flex items-center gap-6 bg-surface-container-low rounded-[2rem] p-8 border border-outline-variant/10">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-on-primary-container flex items-center justify-center text-4xl font-black text-on-primary shadow-xl shadow-primary/20 shrink-0">
          {avatarLetter}
        </div>
        <div>
          <h2 className="text-2xl font-headline font-extrabold text-on-surface">{user.name}</h2>
          <p className="text-on-surface-variant text-sm mt-1">{user.email}</p>
          <div className="flex gap-2 mt-3 flex-wrap">
            {profileData.field && (
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">{profileData.field}</span>
            )}
            {profileData.skillLevel && (
              <span className="px-3 py-1 bg-secondary/10 text-secondary text-xs font-bold rounded-full capitalize">{profileData.skillLevel}</span>
            )}
            <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-xs rounded-full">
              Joined {timeAgo(user.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Processes', value: stats?.total ?? processes.length, icon: 'layers', color: 'text-primary' },
          { label: 'Active', value: stats?.active ?? 0, icon: 'pending_actions', color: 'text-secondary' },
          { label: 'Offers', value: stats?.offers ?? 0, icon: 'celebration', color: 'text-primary' },
          { label: 'Rejected', value: stats?.rejected ?? 0, icon: 'close', color: 'text-error' },
        ].map(stat => (
          <div key={stat.label} className="bg-surface-container-low rounded-2xl p-5 text-center border border-outline-variant/5">
            <span className={`material-symbols-outlined ${stat.color} text-3xl block mb-2`} style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
            <p className={`text-3xl font-black font-headline ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-outline uppercase tracking-wider mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Profile Form */}
      <div className="bg-surface-container-low rounded-[2rem] p-8 border border-outline-variant/10">
        <h3 className="text-lg font-headline font-bold text-on-surface mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
          Profile Information
        </h3>

        {editing ? (
          <form onSubmit={handleSubmit(onSave)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Full Name</label>
                <input {...register('name', { required: true })}
                  className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/60 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Field / Domain</label>
                <input {...register('field')} placeholder="e.g. Computer Science"
                  className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/60 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">College</label>
                <input {...register('college')} placeholder="e.g. IIT Delhi"
                  className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/60 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Current Company</label>
                <input {...register('company')} placeholder="e.g. Infosys"
                  className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/60 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">Target Companies <span className="text-outline font-normal">(comma separated)</span></label>
              <input {...register('targetCompanies')} placeholder="Google, Amazon, Microsoft"
                className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/60 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">Target Roles <span className="text-outline font-normal">(comma separated)</span></label>
              <input {...register('targetRoles')} placeholder="SDE-1, Backend Engineer"
                className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/60 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">Skill Level</label>
              <div className="flex gap-3">
                {['beginner', 'intermediate', 'advanced'].map(level => (
                  <label key={level} className="flex-1 text-center py-2.5 rounded-xl cursor-pointer border text-sm font-medium capitalize transition-all border-outline-variant/20 text-on-surface-variant hover:border-primary/40">
                    <input type="radio" value={level} {...register('skillLevel')} className="sr-only" />
                    {level}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditing(false)} className="px-6 py-2.5 border border-outline-variant/30 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-all">Cancel</button>
              <button type="submit" disabled={saving} className="px-8 py-2.5 bg-primary text-on-primary rounded-xl font-bold hover:brightness-110 disabled:opacity-50 flex items-center gap-2 transition-all">
                {saving ? <><span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Saving...</> : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-y-5 gap-x-8">
            {[
              { label: 'Email', value: user.email },
              { label: 'Field', value: profileData.field || '—' },
              { label: 'College', value: profileData.college || '—' },
              { label: 'Current Company', value: profileData.company || '—' },
              { label: 'Skill Level', value: profileData.skillLevel || '—', capitalize: true },
              { label: 'User Type', value: profileData.userType || '—', capitalize: true },
              { label: 'Target Companies', value: (profileData.targetCompanies || []).join(', ') || '—' },
              { label: 'Target Roles', value: (profileData.targetRoles || []).join(', ') || '—' },
            ].map(({ label, value, capitalize }) => (
              <div key={label}>
                <p className="text-xs text-outline uppercase tracking-wider mb-1">{label}</p>
                <p className={`text-sm font-semibold text-on-surface ${capitalize ? 'capitalize' : ''}`}>{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
