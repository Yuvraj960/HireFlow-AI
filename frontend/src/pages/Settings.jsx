import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import api from '../api/axios'

const NOTIFICATION_TYPES = [
  { key: 'stageReminders', label: 'Stage Update Reminders', desc: 'Get notified when it\'s time to follow up on a process', icon: 'schedule' },
  { key: 'newQuestions', label: 'New Questions Added', desc: 'Alert when new questions matching your targets are added', icon: 'quiz' },
  { key: 'weeklySummary', label: 'Weekly Progress Summary', desc: 'A weekly digest of your preparation progress', icon: 'analytics' },
  { key: 'aiInsights', label: 'AI Pattern Insights', desc: 'When AI detects new interview patterns from the community', icon: 'auto_awesome' },
]

export default function Settings() {
  const { user, logout } = useAuthStore()
  const [notifications, setNotifications] = useState({
    stageReminders: true,
    newQuestions: true,
    weeklySummary: false,
    aiInsights: true,
  })
  const [seeding, setSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState(null)
  const [seedingExp, setSeedingExp] = useState(false)
  const [seedExpResult, setSeedExpResult] = useState(null)
  const [companyQuery, setCompanyQuery] = useState('')
  const [companySearching, setCompanySearching] = useState(false)
  const [companyResult, setCompanyResult] = useState(null)

  const toggleNotif = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }))
    toast.success('Preference saved')
  }

  const handleSeedQuestions = async () => {
    setSeeding(true)
    setSeedResult(null)
    try {
      const res = await api.post('/seed/questions')
      const data = res.data?.data
      setSeedResult(data)
      if (data?.seeded > 0) {
        toast.success(`✅ Seeded ${data.seeded} questions into the database!`)
      } else {
        toast('Database already populated — no new questions added.', { icon: 'ℹ️' })
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Seeding failed.')
    } finally {
      setSeeding(false)
    }
  }

  const handleSeedExperiences = async () => {
    setSeedingExp(true)
    setSeedExpResult(null)
    try {
      const res = await api.post('/seed/experiences')
      const data = res.data?.data
      setSeedExpResult(data)
      if (data?.seeded > 0) {
        toast.success(`✅ Seeded ${data.seeded} interview experiences!`)
      } else {
        toast('Experiences already seeded — nothing new added.', { icon: 'ℹ️' })
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Experience seeding failed.')
    } finally {
      setSeedingExp(false)
    }
  }

  const handleCompanySearch = async () => {
    if (!companyQuery.trim()) return
    setCompanySearching(true)
    setCompanyResult(null)
    try {
      const res = await api.post('/seed/company', { company: companyQuery.trim() })
      setCompanyResult(res.data?.data)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Search failed.')
    } finally {
      setCompanySearching(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8 overflow-y-auto flex-1 h-full">
      <h1 className="text-3xl font-headline font-extrabold text-on-surface">Settings</h1>

      {/* Notifications */}
      <section className="bg-surface-container-low rounded-[2rem] p-7 border border-outline-variant/10">
        <h2 className="text-lg font-headline font-bold text-on-surface mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>notifications</span>
          Notification Preferences
        </h2>
        <div className="space-y-5">
          {NOTIFICATION_TYPES.map(({ key, label, desc, icon }) => (
            <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-surface-container-high/40 hover:bg-surface-container-high transition-all">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-primary mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                <div>
                  <p className="text-sm font-semibold text-on-surface">{label}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{desc}</p>
                </div>
              </div>
              <button
                onClick={() => toggleNotif(key)}
                className={`relative w-12 h-6 rounded-full transition-all duration-200 ${notifications[key] ? 'bg-primary' : 'bg-surface-container-highest'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${notifications[key] ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Seed Questions */}
      <section className="bg-surface-container-low rounded-[2rem] p-7 border border-outline-variant/10">
        <h2 className="text-lg font-headline font-bold text-on-surface mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>database</span>
          Question Database
        </h2>
        <p className="text-sm text-on-surface-variant mb-5">
          Populate the platform with 50 curated interview questions across DSA, System Design, SQL, OS, Behavioral, and OOP. This is safe to run multiple times — it skips duplicates.
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSeedQuestions}
            disabled={seeding}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {seeding ? (
              <><span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Seeding...</>
            ) : (
              <><span className="material-symbols-outlined text-sm">download</span> Seed Questions Now</>
            )}
          </button>
          {seedResult && (
            <div className="text-sm text-on-surface-variant bg-surface-container-high px-4 py-2.5 rounded-xl">
              ✅ Added <span className="text-primary font-bold">{seedResult.seeded}</span> questions · Total: <span className="font-bold">{seedResult.total}</span>
            </div>
          )}
        </div>
      </section>

      {/* Seed Experiences */}
      <section className="bg-surface-container-low rounded-[2rem] p-7 border border-outline-variant/10">
        <h2 className="text-lg font-headline font-bold text-on-surface mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>work_history</span>
          Interview Experiences Database
        </h2>
        <p className="text-sm text-on-surface-variant mb-5">
          Populate the platform with 20 real interview experiences from Google, Amazon, Microsoft, Flipkart, and more. Used by the Experiences feed and AI insights engine.
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSeedExperiences}
            disabled={seedingExp}
            className="flex items-center gap-2 px-6 py-3 bg-secondary text-on-secondary rounded-xl font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {seedingExp ? (
              <><span className="w-4 h-4 border-2 border-on-secondary/30 border-t-on-secondary rounded-full animate-spin" /> Seeding...</>
            ) : (
              <><span className="material-symbols-outlined text-sm">history_edu</span> Seed Experiences Now</>
            )}
          </button>
          {seedExpResult && (
            <div className="text-sm text-on-surface-variant bg-surface-container-high px-4 py-2.5 rounded-xl">
              ✅ Added <span className="text-secondary font-bold">{seedExpResult.seeded}</span> experiences · Total: <span className="font-bold">{seedExpResult.total}</span>
            </div>
          )}
        </div>
      </section>

      {/* Appearance (placeholder) */}
      <section className="bg-surface-container-low rounded-[2rem] p-7 border border-outline-variant/10">
        <h2 className="text-lg font-headline font-bold text-on-surface mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>palette</span>
          Appearance
        </h2>
        <div className="flex gap-3 mt-4">
          {['Dark (Default)', 'System'].map((theme, i) => (
            <div key={theme} className={`px-5 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all ${i === 0 ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/20 hover:border-primary/30'}`}>
              {theme}
            </div>
          ))}
        </div>
      </section>

      {/* Account */}
      <section className="bg-surface-container-low rounded-[2rem] p-7 border border-outline-variant/10">
        <h2 className="text-lg font-headline font-bold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>manage_accounts</span>
          Account
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-surface-container-high/40 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-on-surface">{user?.name}</p>
              <p className="text-xs text-on-surface-variant">{user?.email}</p>
            </div>
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">Active</span>
          </div>
          <button
            onClick={() => { logout(); toast.success('Signed out') }}
            className="w-full flex items-center justify-center gap-2 py-3 border border-error/30 text-error rounded-xl font-semibold hover:bg-error-container/20 transition-all"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            Sign Out
          </button>
        </div>
      </section>
    </div>
  )
}
