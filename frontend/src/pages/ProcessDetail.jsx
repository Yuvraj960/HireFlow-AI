import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { useProcessStore } from '../store/processStore'
import { unwrap, STAGES, STAGE_LABELS, STAGE_ICONS, isStageComplete, isStageActive, timeAgo, difficultyColor } from '../utils/helpers'
import { CardSkeleton, QuestionSkeleton } from '../components/ui/Skeleton'

export default function ProcessDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { fetchProcess, updateStage } = useProcessStore()

  const [process, setProcess] = useState(null)
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState([])
  const [qLoading, setQLoading] = useState(false)
  const [stageUpdating, setStageUpdating] = useState(false)
  const [showStageDropdown, setShowStageDropdown] = useState(false)
  const [roadmapSection, setRoadmapSection] = useState('overview')
  const [roadmapRegenerating, setRoadmapRegenerating] = useState(false)
  const [agentQuery, setAgentQuery] = useState('')
  const dropdownRef = useRef(null)

  // Question logging state
  const [loggedQs, setLoggedQs] = useState([])
  const [showLogForm, setShowLogForm] = useState(false)
  const [logText, setLogText] = useState('')
  const [logTopic, setLogTopic] = useState('')
  const [logDiff, setLogDiff] = useState('Medium')
  const [logSubmitting, setLogSubmitting] = useState(false)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowStageDropdown(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Load process
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const p = await fetchProcess(id)
        setProcess(p)
        // Fetch targeted questions after process loads
        if (p?.company && p?.currentStage) {
          setQLoading(true)
          const qRes = await api.get('/questions', {
            params: { company: p.company, stage: p.currentStage, limit: 8 }
          })
          const qData = unwrap(qRes)
          setQuestions(Array.isArray(qData) ? qData : (qData?.data ?? []))
          setQLoading(false)
        }
      } catch (err) {
        toast.error('Failed to load process.')
        navigate('/')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // Load questions logged for this process
  useEffect(() => {
    if (!id) return
    api.get(`/process/${id}/questions`)
      .then(r => setLoggedQs(unwrap(r)?.questionsLogged ?? []))
      .catch(() => {})
  }, [id])

  const handleStageUpdate = async (newStage) => {
    setStageUpdating(true)
    setShowStageDropdown(false)
    try {
      await updateStage(id, newStage)
      setProcess(prev => ({ ...prev, currentStage: newStage }))
      toast.success(`Stage updated to ${STAGE_LABELS[newStage]}`)
    } catch {
      toast.error('Failed to update stage.')
    } finally {
      setStageUpdating(false)
    }
  }

  const handleRegenerateRoadmap = async () => {
    setRoadmapRegenerating(true)
    try {
      const res = await api.post(`/process/${id}/roadmap`)
      const updatedProcess = unwrap(res)?.process
      if (updatedProcess?.roadmap) {
        setProcess(prev => ({ ...prev, roadmap: updatedProcess.roadmap }))
        toast.success('Roadmap regenerated!')
      }
    } catch {
      toast.error('Failed to regenerate roadmap.')
    } finally {
      setRoadmapRegenerating(false)
    }
  }

  const handleAgentSend = () => {
    if (agentQuery.trim()) {
      navigate('/agent', { state: { processId: id, initialMessage: agentQuery } })
    } else {
      navigate('/agent', { state: { processId: id } })
    }
  }

  const handleLogQuestion = async () => {
    if (!logText.trim()) return
    setLogSubmitting(true)
    try {
      const res = await api.post(`/process/${id}/questions`, {
        text: logText.trim(),
        stage: process?.currentStage,
        difficulty: logDiff,
        topic: logTopic.trim() || 'General',
      })
      setLoggedQs(unwrap(res)?.questionsLogged ?? [])
      setLogText('')
      setLogTopic('')
      setLogDiff('Medium')
      setShowLogForm(false)
      toast.success('Question logged!')
    } catch {
      toast.error('Failed to log question.')
    } finally {
      setLogSubmitting(false)
    }
  }

  if (loading) return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <CardSkeleton />
      <div className="space-y-3">{[1,2,3].map(i=><QuestionSkeleton key={i}/>)}</div>
    </div>
  )

  if (!process) return null

  const roadmap = process.roadmap ?? null
  const currentStageIdx = STAGES.indexOf(process.currentStage)

  return (
    <div className="pt-8 px-6 pb-16 max-w-6xl mx-auto space-y-8 overflow-y-auto flex-1 h-full">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-on-surface-variant text-sm mb-3 hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_back</span> Back
          </button>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">{process.company}</h1>
          <p className="text-secondary text-lg mt-1">{process.role} · <span className="text-outline text-sm">Started {timeAgo(process.createdAt)}</span></p>
        </div>
        <div className="flex items-center gap-3">
          {/* Stage Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowStageDropdown(s => !s)}
              disabled={stageUpdating}
              className="flex items-center gap-2 bg-surface-container-high px-4 py-2.5 rounded-xl border border-outline-variant/20 hover:bg-surface-variant transition-colors disabled:opacity-50"
            >
              {stageUpdating ? (
                <span className="w-4 h-4 border-2 border-on-surface/30 border-t-on-surface rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-sm">{STAGE_ICONS[process.currentStage] ?? 'circle'}</span>
              )}
              <span className="text-sm font-medium">{STAGE_LABELS[process.currentStage]}</span>
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </button>
            {showStageDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-surface-container rounded-2xl border border-outline-variant/20 shadow-2xl z-50 overflow-hidden py-1">
                {STAGES.map(stage => (
                  <button
                    key={stage}
                    onClick={() => handleStageUpdate(stage)}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-surface-container-high transition-colors ${stage === process.currentStage ? 'text-primary font-bold' : 'text-on-surface'}`}
                  >
                    <span className="material-symbols-outlined text-sm">{STAGE_ICONS[stage]}</span>
                    {STAGE_LABELS[stage]}
                    {stage === process.currentStage && <span className="material-symbols-outlined text-sm ml-auto">check</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => navigate('/agent', { state: { processId: id } })}
            className="flex items-center gap-2 bg-gradient-to-br from-primary to-on-primary-container px-6 py-2.5 rounded-xl font-bold text-on-primary hover:brightness-110 hover:scale-105 transition-all"
          >
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
            Chat with Agent
          </button>
        </div>
      </div>

      {/* Stage Timeline */}
      <section className="bg-surface-container-low p-6 rounded-[2rem] relative overflow-hidden">
        <div className="flex justify-between items-start relative">
          {/* Progress bar background */}
          <div className="absolute left-6 right-6 top-5 h-0.5 bg-surface-container-highest z-0" />
          {/* Filled portion */}
          {currentStageIdx > 0 && (
            <div
              className="absolute left-6 top-5 h-0.5 bg-gradient-to-r from-primary to-secondary z-0 transition-all duration-500"
              style={{ width: `calc(${(currentStageIdx / (STAGES.length - 1)) * 100}% - 48px)` }}
            />
          )}

          {STAGES.map((stage) => {
            const complete = isStageComplete(stage, process.currentStage)
            const active = isStageActive(stage, process.currentStage)
            return (
              <div key={stage} className="relative z-10 flex flex-col items-center gap-1.5 cursor-pointer group" onClick={() => !active && handleStageUpdate(stage)}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  active   ? 'bg-primary ring-4 ring-primary/20 scale-110 shadow-[0_0_15px_rgba(0,218,243,0.4)]'
                  : complete ? 'bg-primary/50'
                  : 'bg-surface-container-highest opacity-40 group-hover:opacity-70'
                }`}>
                  <span className="material-symbols-outlined text-sm text-on-primary" style={{ fontVariationSettings: complete || active ? "'FILL' 1" : "'FILL' 0" }}>
                    {complete ? 'check' : STAGE_ICONS[stage]}
                  </span>
                </div>
                <span className={`text-[10px] font-bold tracking-widest uppercase text-center ${active ? 'text-primary' : complete ? 'text-primary/60' : 'text-on-surface-variant opacity-50'}`}>
                  {STAGE_LABELS[stage]}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Grid: Roadmap + Questions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Roadmap */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-surface-container-low p-6 rounded-[2rem] border border-outline-variant/10">
            <h3 className="text-xl font-bold mb-4 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                AI Preparation Roadmap
                {roadmap?._fallback && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-highest text-outline font-medium">Offline mode</span>
                )}
              </span>
              <button
                onClick={handleRegenerateRoadmap}
                disabled={roadmapRegenerating}
                title="Regenerate with AI"
                className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container-high transition-all disabled:opacity-40"
              >
                {roadmapRegenerating
                  ? <span className="w-3.5 h-3.5 border border-primary/30 border-t-primary rounded-full animate-spin block" />
                  : <span className="material-symbols-outlined text-base">refresh</span>
                }
              </button>
            </h3>

            {!roadmap ? (
              <div className="text-center py-8 text-on-surface-variant text-sm space-y-3">
                <span className="material-symbols-outlined text-3xl block opacity-30">route</span>
                <p>Roadmap not yet generated.</p>
                <button
                  onClick={handleRegenerateRoadmap}
                  disabled={roadmapRegenerating}
                  className="mx-auto flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold hover:brightness-110 disabled:opacity-50"
                >
                  {roadmapRegenerating
                    ? <><span className="w-3 h-3 border border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Generating…</>
                    : <><span className="material-symbols-outlined text-sm">auto_awesome</span> Generate Now</>
                  }
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Section Tabs */}
                <div className="flex gap-1 bg-surface-container-high rounded-xl p-1">
                  {[['overview','Overview'],['topics','Topics'],['plan','Day Plan'],['tips','Tips']].map(([k,l]) => (
                    <button key={k} onClick={() => setRoadmapSection(k)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${ roadmapSection===k ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
                      {l}
                    </button>
                  ))}
                </div>

                {roadmapSection === 'overview' && (
                  <div className="space-y-3">
                    <p className="text-sm text-on-surface-variant leading-relaxed">{roadmap.overview}</p>
                    {roadmap.currentFocus && (
                      <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
                        <p className="text-xs font-black text-primary uppercase tracking-widest mb-1">Current Focus</p>
                        <p className="text-sm text-on-surface">{roadmap.currentFocus}</p>
                      </div>
                    )}
                    {roadmap.expectedRounds && (
                      <div className="flex flex-wrap gap-1.5">
                        {roadmap.expectedRounds.map(r => (
                          <span key={r} className="px-2 py-0.5 bg-surface-container-highest text-on-surface-variant text-xs rounded-md font-medium">{r}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {roadmapSection === 'topics' && (
                  <div className="space-y-2">
                    {(roadmap.topicPriority ?? []).map((t, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-surface-container-high/50 rounded-xl">
                        <span className={`text-xs font-black uppercase px-2 py-0.5 rounded ${ t.priority==='high' ? 'bg-error-container text-error' : t.priority==='medium' ? 'bg-primary/10 text-primary' : 'bg-surface-container-highest text-outline'}`}>{t.priority}</span>
                        <div>
                          <p className="text-sm font-semibold text-on-surface">{t.topic}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">{t.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {roadmapSection === 'plan' && (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {(roadmap.dailyPlan ?? []).map((d, i) => (
                      <div key={i} className="p-3 border border-outline-variant/10 rounded-xl">
                        <p className="text-xs font-black text-primary mb-1.5">Day {d.day}</p>
                        <ul className="space-y-1">
                          {(d.tasks ?? []).map((t, ti) => (
                            <li key={ti} className="flex items-start gap-1.5 text-xs text-on-surface-variant">
                              <span className="material-symbols-outlined text-primary text-xs mt-0.5">arrow_right</span>{t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {roadmapSection === 'tips' && (
                  <div className="space-y-2">
                    {(roadmap.tips ?? roadmap.mustDoPatterns ?? []).map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 bg-surface-container-high/50 rounded-xl">
                        <span className="material-symbols-outlined text-secondary text-sm mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
                        <p className="text-xs text-on-surface-variant">{tip}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {process.notes && (
              <div className="mt-5 p-4 bg-surface-container rounded-xl border-l-2 border-secondary/40 text-sm text-on-surface-variant">
                <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">Notes</p>
                {process.notes}
              </div>
            )}
          </div>

          {/* ── Question Logger ───────────────────────── */}
          <div className="bg-surface-container-low p-5 rounded-[2rem] border border-outline-variant/10">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
                Questions Asked in This Round
              </h4>
              <button onClick={() => setShowLogForm(f => !f)}
                className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">{showLogForm ? 'close' : 'add'}</span>
                {showLogForm ? 'Cancel' : 'Log'}
              </button>
            </div>

            {showLogForm && (
              <div className="space-y-2 mb-3">
                <textarea
                  value={logText}
                  onChange={e => setLogText(e.target.value)}
                  placeholder="Describe the question asked..."
                  rows={2}
                  className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-3 py-2 text-sm text-on-surface placeholder:text-outline/40 focus:outline-none focus:border-primary/50 resize-none"
                />
                <div className="flex gap-2">
                  <input value={logTopic} onChange={e => setLogTopic(e.target.value)}
                    placeholder="Topic (e.g. Arrays)"
                    className="flex-1 bg-surface-container-high border border-outline-variant/20 rounded-lg px-3 py-1.5 text-xs text-on-surface placeholder:text-outline/40 focus:outline-none focus:border-primary/50" />
                  <select value={logDiff} onChange={e => setLogDiff(e.target.value)}
                    className="bg-surface-container-high border border-outline-variant/20 rounded-lg px-2 py-1.5 text-xs text-on-surface focus:outline-none">
                    {['Easy','Medium','Hard'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <button onClick={handleLogQuestion} disabled={logSubmitting || !logText.trim()}
                  className="w-full py-2 bg-primary text-on-primary rounded-xl text-xs font-bold hover:brightness-110 disabled:opacity-50 transition-all">
                  {logSubmitting ? 'Saving...' : 'Save Question'}
                </button>
              </div>
            )}

            {loggedQs.length === 0 ? (
              <p className="text-xs text-on-surface-variant text-center py-4 opacity-50">No questions logged yet. Click Log to add one.</p>
            ) : (
              <div className="space-y-2">
                {loggedQs.map(q => (
                  <div key={q._id} className="flex items-start gap-2 p-3 bg-surface-container-high/50 rounded-xl">
                    <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                      q.difficulty === 'Hard' ? 'bg-error-container text-error' :
                      q.difficulty === 'Easy' ? 'bg-primary/10 text-primary' :
                      'bg-secondary/10 text-secondary'
                    }`}>{q.difficulty}</span>
                    <div className="min-w-0">
                      <p className="text-xs text-on-surface font-medium leading-snug">{q.text}</p>
                      {q.topic && <p className="text-[10px] text-outline mt-0.5">{q.topic} · {q.stage}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Targeted Questions */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-extrabold tracking-tight">
              Questions for {STAGE_LABELS[process.currentStage]}
            </h3>
            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded-full">
              {process.company} · {questions.length} found
            </span>
          </div>

          {qLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <QuestionSkeleton key={i}/>)}</div>
          ) : questions.length === 0 ? (
            <div className="bg-surface-container-low rounded-2xl p-10 text-center border border-dashed border-outline-variant/20">
              <span className="material-symbols-outlined text-3xl text-outline block mb-3 opacity-40">quiz</span>
              <p className="text-on-surface-variant text-sm">No questions found for {process.company} at {STAGE_LABELS[process.currentStage]} stage.</p>
              <button onClick={() => navigate('/questions')} className="mt-4 text-primary text-sm font-semibold hover:underline">Browse all questions →</button>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map(q => (
                <QuestionCard key={q._id} question={q} />
              ))}
              <button onClick={() => navigate('/questions')} className="w-full py-3 bg-surface-container-low rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all">
                View all questions →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating AI Agent mini-widget */}
      <div className="fixed bottom-6 right-6 w-80 glass-tray rounded-2xl p-5 shadow-2xl border border-primary/10 z-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center ring-2 ring-primary/30">
              <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
            </div>
            <div>
              <p className="text-sm font-bold">HireFlow Agent</p>
              <p className="text-[10px] text-primary uppercase font-black tracking-widest">Active</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            value={agentQuery}
            onChange={e => setAgentQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAgentSend()}
            type="text"
            placeholder={`Ask about ${process.company} ${process.currentStage}...`}
            className="flex-1 bg-surface-container-highest border-none rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/40 outline-none"
          />
          <button onClick={handleAgentSend} className="bg-primary text-on-primary w-9 h-9 rounded-xl flex items-center justify-center hover:brightness-110">
            <span className="material-symbols-outlined text-sm">send</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function QuestionCard({ question }) {
  const [bookmarked, setBookmarked] = useState(question.isBookmarked ?? false)
  const [solved, setSolved] = useState(question.isSolved ?? false)

  const trackActivity = async (type) => {
    try {
      await api.post(`/questions/${question._id}/activity`, { activityType: type })
    } catch {}
  }

  const toggleBookmark = async (e) => {
    e.stopPropagation()
    setBookmarked(b => !b)
    await trackActivity('bookmarked')
  }

  const toggleSolved = async (e) => {
    e.stopPropagation()
    setSolved(s => !s)
    await trackActivity('solved')
  }

  const leetcodeUrl = question.link || question.externalLink || (question.leetcodeId ? `https://leetcode.com/problems/${question.leetcodeId}` : null)

  return (
    <div className={`group bg-surface-container-low p-5 rounded-2xl border border-outline-variant/10 hover:border-primary/20 hover:bg-surface-container transition-all ${solved ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${difficultyColor(question.difficulty)}`}>
              {question.difficulty ?? 'Medium'}
            </span>
            {question.pattern && (
              <span className="text-[10px] px-2 py-0.5 bg-surface-container-highest rounded text-on-surface-variant font-semibold">{question.pattern}</span>
            )}
          </div>
          <h4 className={`font-bold text-base text-on-surface group-hover:text-primary transition-colors ${solved ? 'line-through text-on-surface-variant' : ''}`}>
            {question.title}
          </h4>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {(question.topics ?? question.tags ?? []).slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] px-2 py-0.5 bg-surface-container-highest rounded text-on-surface-variant">{tag}</span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {leetcodeUrl ? (
            <a href={leetcodeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary text-xs font-bold hover:underline">
              Solve <span className="material-symbols-outlined text-xs">open_in_new</span>
            </a>
          ) : (
            <span className="text-xs text-on-surface-variant">No link</span>
          )}
          <div className="flex gap-2">
            <button onClick={toggleSolved} title="Mark solved" className={`text-[11px] flex items-center gap-1 font-medium transition-colors ${solved ? 'text-primary' : 'text-outline hover:text-on-surface'}`}>
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: solved ? "'FILL' 1" : "'FILL' 0" }}>task_alt</span>
            </button>
            <button onClick={toggleBookmark} title="Bookmark" className={`text-[11px] flex items-center gap-1 font-medium transition-colors ${bookmarked ? 'text-secondary' : 'text-outline hover:text-on-surface'}`}>
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: bookmarked ? "'FILL' 1" : "'FILL' 0" }}>bookmark</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
