import { useEffect, useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts'
import toast from 'react-hot-toast'
import { useProcessStore } from '../store/processStore'
import { useAuthStore } from '../store/authStore'
import api from '../api/axios'
import { unwrap, timeAgo, STAGE_LABELS, difficultyColor } from '../utils/helpers'
import CreateProcessModal from '../components/process/CreateProcessModal'
import { CardSkeleton } from '../components/ui/Skeleton'

const STAGE_COLORS = {
  Applied:  'text-on-surface-variant bg-surface-container-highest',
  OA:       'text-secondary bg-secondary-container/30 border-secondary/20',
  Round1:   'text-primary bg-primary-container border-primary/20',
  Round2:   'text-primary bg-primary-container border-primary/20',
  HR:       'text-tertiary bg-tertiary-container/30 border-tertiary/20',
  Offer:    'text-primary bg-primary/10 border-primary/30',
  Rejected: 'text-error bg-error-container/20 border-error/20',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { processes, loading: procLoading, fetchProcesses } = useProcessStore()
  const { user } = useAuthStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [overview, setOverview] = useState(null)
  const [performance, setPerformance] = useState([])

  useEffect(() => {
    fetchProcesses()
    // Auto-open modal if ?new=1
    if (searchParams.get('new') === '1') {
      setShowCreateModal(true)
      setSearchParams({})
    }
    api.get('/dashboard/overview').then(r => setOverview(unwrap(r))).catch(() => {})
    api.get('/dashboard/performance').then(r => {
      const d = unwrap(r)
      // Shape: array of { topic, score } or object
      const arr = Array.isArray(d) ? d : (d?.topicScores ?? [])
      setPerformance(arr)
    }).catch(() => {})
  }, [])

  const activeProcs = processes.filter(p => !['Offer', 'Rejected'].includes(p.currentStage))
  const completedProcs = processes.filter(p => ['Offer', 'Rejected'].includes(p.currentStage))

  // Build weekly bar chart data from overview (fallback to placeholder)
  const weekData = overview?.weeklyActivity ?? [
    { day: 'Mon', count: 0 }, { day: 'Tue', count: 0 }, { day: 'Wed', count: 0 },
    { day: 'Thu', count: 0 }, { day: 'Fri', count: 0 }, { day: 'Sat', count: 0 }, { day: 'Sun', count: 0 }
  ]

  // Build radar data from performance (fallback)
  const radarData = performance.length > 0 ? performance.slice(0, 7).map(p => ({
    topic: p.topic || p._id || 'Topic',
    score: p.score ?? p.count ?? 0,
    fullMark: 100,
  })) : [
    { topic: 'DP', score: 60, fullMark: 100 },
    { topic: 'Graphs', score: 75, fullMark: 100 },
    { topic: 'Arrays', score: 85, fullMark: 100 },
    { topic: 'SQL', score: 40, fullMark: 100 },
    { topic: 'Systems', score: 55, fullMark: 100 },
    { topic: 'OOD', score: 65, fullMark: 100 },
  ]

  const handleDeleteProcess = async (e, id) => {
    e.stopPropagation()
    e.preventDefault()
    if (!confirm('Delete this process?')) return
    const { deleteProcess } = useProcessStore.getState()
    try {
      await deleteProcess(id)
      toast.success('Process deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 overflow-y-auto flex-1 h-full">

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2rem] bg-surface-container-low p-10 flex flex-col md:flex-row items-center justify-between gap-8 border-l-4 border-primary">
        <div className="relative z-10 max-w-xl">
          <h1 className="text-4xl md:text-5xl font-extrabold font-headline tracking-tighter text-on-surface mb-3 leading-tight">
            {user?.name ? `Welcome back, ${user.name.split(' ')[0]}` : 'Orchestrate your'}{' '}
            <span className="text-primary italic">interview journey</span>
          </h1>
          <p className="text-on-surface-variant text-base mb-6 max-w-md leading-relaxed">
            {activeProcs.length > 0
              ? `You have ${activeProcs.length} active process${activeProcs.length > 1 ? 'es' : ''} in progress. Keep pushing!`
              : 'Start tracking your hiring processes. AI will analyze patterns and guide you to success.'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-8 py-4 bg-primary text-on-primary rounded-full font-bold text-base flex items-center gap-3 hover:brightness-110 hover:scale-105 transition-all shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
            Start New Process
          </button>
        </div>

        {/* Stats widget */}
        <div className="relative w-full md:w-80 glass-panel rounded-2xl border border-primary/10 overflow-hidden bg-surface-container/60 backdrop-blur-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs uppercase tracking-widest text-primary font-bold">At a Glance</span>
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Active', value: activeProcs.length, icon: 'pending_actions', color: 'text-primary' },
              { label: 'Completed', value: completedProcs.length, icon: 'task_alt', color: 'text-secondary' },
              { label: 'Total', value: processes.length, icon: 'layers', color: 'text-tertiary' },
              { label: 'Offers', value: processes.filter(p => p.currentStage === 'Offer').length, icon: 'celebration', color: 'text-primary' },
            ].map(stat => (
              <div key={stat.label} className="bg-surface-container/50 rounded-xl p-3 flex items-center gap-3">
                <span className={`material-symbols-outlined ${stat.color} text-xl`} style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
                <div>
                  <p className={`text-xl font-black font-headline ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] text-outline uppercase">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Active Processes */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-end px-1">
            <h2 className="text-2xl font-bold font-headline text-on-surface">Active Processes</h2>
            {processes.length > 0 && (
              <span className="text-outline text-sm">{activeProcs.length} active · {processes.length} total</span>
            )}
          </div>

          {procLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
            </div>
          ) : activeProcs.length === 0 ? (
            <div className="bg-surface-container-low rounded-2xl p-12 text-center border border-dashed border-outline-variant/20">
              <span className="material-symbols-outlined text-4xl text-outline mb-4 block">inbox</span>
              <h3 className="text-lg font-bold text-on-surface mb-2">No active processes yet</h3>
              <p className="text-on-surface-variant text-sm mb-6">Add your first hiring process to get started with AI preparation.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-primary text-on-primary rounded-xl font-bold hover:brightness-110 transition-all"
              >
                Start New Process
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeProcs.map(process => (
                <Link
                  key={process._id}
                  to={`/process/${process._id}`}
                  className="group block bg-surface-container-low hover:bg-surface-container rounded-2xl p-5 transition-all duration-200 border border-transparent hover:border-primary/20 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      {/* Company Avatar */}
                      <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center border border-outline-variant/20 shrink-0">
                        <span className="text-xl font-black text-on-surface">{process.company?.[0] ?? '?'}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-on-surface group-hover:text-primary transition-colors">{process.company}</h3>
                        <p className="text-sm text-on-surface-variant">{process.role}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border uppercase tracking-wider ${STAGE_COLORS[process.currentStage] ?? 'text-on-surface bg-surface-container-highest border-transparent'}`}>
                      {STAGE_LABELS[process.currentStage] ?? process.currentStage}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex gap-2">
                      {process.jobUrl && (
                        <a href={process.jobUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                          className="px-3 py-1 text-xs rounded-full bg-surface-container-highest text-on-surface-variant hover:text-primary transition-colors">
                          Job Link ↗
                        </a>
                      )}
                    </div>
                    <span className="text-xs text-outline">Updated {timeAgo(process.updatedAt)}</span>
                  </div>
                </Link>
              ))}

              {completedProcs.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs text-outline uppercase tracking-widest mb-3 px-1">Completed ({completedProcs.length})</p>
                  <div className="space-y-2">
                    {completedProcs.map(process => (
                      <Link
                        key={process._id}
                        to={`/process/${process._id}`}
                        className="group flex items-center justify-between bg-surface-container-lowest hover:bg-surface-container-low rounded-xl p-4 transition-all border border-transparent hover:border-outline-variant/20 opacity-70 hover:opacity-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center">
                            <span className="text-sm font-black text-on-surface-variant">{process.company?.[0]}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-on-surface">{process.company} · {process.role}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${STAGE_COLORS[process.currentStage]}`}>
                          {STAGE_LABELS[process.currentStage]}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Analytics Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Weekly Activity */}
          <div className="bg-surface-container-low rounded-3xl p-6 border-l-2 border-secondary/30">
            <h3 className="text-lg font-bold font-headline mb-4">Weekly Activity</h3>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={weekData} barSize={14}>
                <XAxis dataKey="day" tick={{ fill: '#8b9295', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#171f33', border: '1px solid rgba(139,146,149,0.15)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#dae2fd' }}
                  cursor={{ fill: 'rgba(0,218,243,0.05)' }}
                />
                <Bar dataKey="count" fill="#00daf3" radius={[4, 4, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-outline-variant/10">
              <div>
                <p className="text-2xl font-black font-headline text-on-surface">{overview?.totalProcesses ?? processes.length}</p>
                <p className="text-[10px] text-outline uppercase">Total Processes</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black font-headline text-primary">{overview?.activeProcesses ?? activeProcs.length}</p>
                <p className="text-[10px] text-outline uppercase">In Progress</p>
              </div>
            </div>
          </div>

          {/* Skill Radar */}
          <div className="bg-surface-container-low rounded-3xl p-6 border-r-2 border-primary/30">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold font-headline">Skill Strength</h3>
              <span className="material-symbols-outlined text-primary/50" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="rgba(139,146,149,0.15)" />
                  <PolarAngleAxis dataKey="topic" tick={{ fill: '#c1c7cb', fontSize: 10, fontWeight: 600 }} />
                  <Radar name="Skill" dataKey="score" stroke="#00daf3" fill="#00daf3" fillOpacity={0.15} strokeWidth={1.5} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-center text-on-surface-variant text-sm">
                <div>
                  <span className="material-symbols-outlined text-2xl block mb-2 opacity-30">radar</span>
                  Skill data appears after solving questions
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FAB */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={() => navigate('/agent')}
          className="w-14 h-14 bg-surface-container-highest border border-primary/20 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform group ai-pulse"
          title="Open AI Agent"
        >
          <span className="material-symbols-outlined text-primary group-hover:rotate-12 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
        </button>
      </div>

      {/* Create Process Modal */}
      <CreateProcessModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => fetchProcesses()}
      />
    </div>
  )
}
