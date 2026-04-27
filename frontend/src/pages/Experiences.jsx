import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { unwrap, timeAgo } from '../utils/helpers'
import { CardSkeleton } from '../components/ui/Skeleton'

export default function Experiences() {
  const [activeTab, setActiveTab] = useState('submit')

  return (
    <div className="flex-1 flex flex-col pt-8 min-h-0">
      {/* Top Header */}
      <header className="flex justify-between items-center px-8 mb-6">
        <h1 className="text-xl font-headline font-bold text-primary tracking-tight">Interview Experiences</h1>
        <div className="flex gap-1 bg-surface-container-high rounded-xl p-1">
          {['submit', 'browse'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === tab ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-8 pb-12">
        {activeTab === 'submit' ? <SubmitTab /> : <BrowseTab />}
      </div>
    </div>
  )
}

/* ─── Submit Tab ─── */
function SubmitTab() {
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm()
  const text = watch('rawText', '')

  const onSubmit = async (data) => {
    if (!data.rawText?.trim()) return toast.error('Please paste your experience text.')
    setSubmitting(true)
    setResult(null)
    try {
      const res = await api.post('/experiences', {
        rawText: data.rawText,
        company: data.company,
        role: data.role,
      })
      const exp = unwrap(res)?.experience ?? unwrap(res)
      setResult(exp)
      reset()
      toast.success('Experience submitted and analyzed by AI!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Submission failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Insights Banner */}
      <InsightsBanner />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-5">
          <div>
            <h2 className="text-3xl font-headline font-extrabold mb-2">Share Your Experience</h2>
            <p className="text-on-surface-variant text-sm">Paste any interview experience in plain text — AI will extract structured data automatically.</p>
          </div>

          {/* Company + Role */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">Company</label>
              <input
                {...register('company', { required: 'Required' })}
                placeholder="e.g. Google"
                className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/60 transition-all"
              />
              {errors.company && <p className="text-error text-xs mt-1">{errors.company.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">Role</label>
              <input
                {...register('role', { required: 'Required' })}
                placeholder="e.g. SDE-2"
                className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/60 transition-all"
              />
              {errors.role && <p className="text-error text-xs mt-1">{errors.role.message}</p>}
            </div>
          </div>

          {/* Text area */}
          <div className="relative">
            <textarea
              {...register('rawText', { required: 'Experience text is required', minLength: { value: 50, message: 'Please write more detail (min 50 chars)' } })}
              className="w-full h-72 bg-surface-container-low border border-outline-variant/10 rounded-xl p-6 text-on-surface text-base focus:ring-1 focus:ring-primary/40 focus:border-primary/40 placeholder:text-outline/40 transition-all resize-none outline-none custom-scrollbar"
              placeholder="Paste your full interview experience here. Be as detailed as possible — the AI will extract questions asked, difficulty, topics covered, and the overall experience..."
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <span className="text-xs text-outline">{text.length} chars</span>
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            </div>
            {errors.rawText && <p className="text-error text-xs mt-1">{errors.rawText.message}</p>}
          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={submitting}
              className="px-8 py-3.5 bg-gradient-to-br from-primary to-on-primary-container text-on-primary font-headline font-bold rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <><span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Analyzing with AI...</>
              ) : (
                <><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span> Analyze with AI</>
              )}
            </button>
          </div>

          {/* AI Extraction Result */}
          {result && (
            <div className="bg-surface-container-low rounded-2xl border border-primary/20 overflow-hidden">
              <div className="p-4 bg-primary-container/20 border-b border-primary/10 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <h3 className="font-bold text-primary">AI Extraction Complete</h3>
              </div>
              <div className="p-5 space-y-4">
                {result.structuredData?.questionsAsked?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Questions Detected</p>
                    <ul className="space-y-1">
                      {result.structuredData.questionsAsked.map((q, i) => (
                        <li key={i} className="text-sm text-on-surface-variant flex items-start gap-2">
                          <span className="text-primary mt-0.5 shrink-0">•</span> {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.structuredData?.topics?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Topics Covered</p>
                    <div className="flex flex-wrap gap-2">
                      {result.structuredData.topics.map(t => (
                        <span key={t} className="px-3 py-1 bg-surface-container-highest text-on-surface-variant text-xs rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
                {result.structuredData?.outcome && (
                  <div>
                    <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">Outcome</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${result.structuredData.outcome === 'selected' ? 'bg-primary/10 text-primary' : result.structuredData.outcome === 'rejected' ? 'bg-error-container/30 text-on-error-container' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                      {result.structuredData.outcome}
                    </span>
                  </div>
                )}
                {result.structuredData?.difficulty && (
                  <div>
                    <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">Overall Difficulty</p>
                    <span className="text-sm font-semibold text-on-surface capitalize">{result.structuredData.difficulty}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Guide Panel */}
        <div className="lg:col-span-4">
          <div className="glass-panel rounded-xl p-6 border-l-2 border-primary/40 space-y-4 sticky top-0">
            <h3 className="font-headline font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined">info</span> Tips for Best Results
            </h3>
            <ul className="space-y-3">
              {[
                'Mention specific questions and problems you were asked',
                'Include company name, role, and round number',
                'Describe the interviewer\'s feedback and follow-ups',
                'Note the overall difficulty and time pressure',
                'Experiences are anonymized before being shared',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-primary text-sm shrink-0 mt-0.5">check_circle</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Browse Tab ─── */
function BrowseTab() {
  const [experiences, setExperiences] = useState([])
  const [loading, setLoading] = useState(true)
  const [companyFilter, setCompanyFilter] = useState('')
  const [expanded, setExpanded] = useState({})

  const fetchExperiences = async () => {
    setLoading(true)
    try {
      const params = {}
      if (companyFilter) params.company = companyFilter
      const res = await api.get('/experiences', { params })
      const data = unwrap(res)
      setExperiences(Array.isArray(data) ? data : (data?.data ?? []))
    } catch { toast.error('Failed to load experiences.') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchExperiences() }, [companyFilter])

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <InsightsBanner />

      {/* Filter */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg">business</span>
          <input
            value={companyFilter}
            onChange={e => setCompanyFilter(e.target.value)}
            placeholder="Filter by company..."
            className="bg-surface-container-low border border-outline-variant/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/60 transition-all w-56"
          />
        </div>
        {companyFilter && (
          <button onClick={() => setCompanyFilter('')} className="text-sm text-primary font-semibold hover:underline">Clear</button>
        )}
      </div>

      {/* Experience cards */}
      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <CardSkeleton key={i}/>)}</div>
      ) : experiences.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-4xl text-outline block mb-3 opacity-30">article</span>
          <p className="text-on-surface-variant">No experiences found. Be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {experiences.map(exp => (
            <div key={exp._id} className="bg-surface-container-low rounded-2xl border border-outline-variant/10 overflow-hidden">
              {/* Header */}
              <div
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-surface-container transition-colors"
                onClick={() => setExpanded(prev => ({ ...prev, [exp._id]: !prev[exp._id] }))}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center font-black text-on-surface">
                    {exp.company?.[0] ?? '?'}
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface">{exp.company} · {exp.role}</h3>
                    <p className="text-xs text-outline">{timeAgo(exp.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {exp.structuredData?.outcome && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${exp.structuredData.outcome === 'selected' ? 'bg-primary/10 text-primary' : exp.structuredData.outcome === 'rejected' ? 'bg-error-container/30 text-on-error-container' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                      {exp.structuredData.outcome}
                    </span>
                  )}
                  <span className="material-symbols-outlined text-on-surface-variant text-xl">
                    {expanded[exp._id] ? 'expand_less' : 'expand_more'}
                  </span>
                </div>
              </div>

              {/* Expanded content */}
              {expanded[exp._id] && (
                <div className="px-5 pb-5 border-t border-outline-variant/10 pt-4 space-y-4">
                  {exp.rawText && (
                    <div>
                      <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Experience</p>
                      <p className="text-sm text-on-surface-variant leading-relaxed">{exp.rawText}</p>
                    </div>
                  )}
                  {exp.structuredData?.questionsAsked?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Questions Asked</p>
                      <ul className="space-y-1">
                        {exp.structuredData.questionsAsked.map((q, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-on-surface-variant">
                            <span className="text-primary shrink-0">•</span> {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {exp.structuredData?.topics?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {exp.structuredData.topics.map(t => (
                        <span key={t} className="px-2.5 py-1 bg-surface-container-highest text-on-surface-variant text-xs rounded-full">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Shared Insights Banner ─── */
function InsightsBanner() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/experiences/insights').then(r => setStats(unwrap(r))).catch(() => {})
  }, [])

  const items = [
    { label: 'Top Pattern', value: stats?.topPattern ?? 'System Design' },
    { label: 'Success Rate', value: stats?.successRate ? `${stats.successRate}%` : '~48%' },
    { label: 'Experiences', value: stats?.totalExperiences ?? stats?.count ?? '—' },
  ]

  return (
    <section className="relative overflow-hidden rounded-2xl p-0.5 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20">
      <div className="bg-surface-container-low px-6 py-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <span className="material-symbols-outlined text-primary">insights</span>
          </div>
          <p className="font-headline font-semibold text-on-surface">Community Insights</p>
        </div>
        <div className="flex gap-10">
          {items.map(item => (
            <div key={item.label} className="text-center">
              <span className="text-xs uppercase tracking-widest text-secondary/60 block mb-1">{item.label}</span>
              <span className="text-primary font-bold">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
