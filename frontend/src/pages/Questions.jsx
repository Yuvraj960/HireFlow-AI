import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import { unwrap, difficultyColor } from '../utils/helpers'
import { QuestionSkeleton } from '../components/ui/Skeleton'
import toast from 'react-hot-toast'

const STAGES_FILTER = ['Applied', 'OA', 'Round1', 'Round2', 'HR']
const DIFFICULTIES   = ['Easy', 'Medium', 'Hard']
const TOPICS = [
  'Dynamic Programming', 'Graphs', 'Arrays', 'Trees', 'Sliding Window',
  'Binary Search', 'System Design', 'SQL', 'Behavioral', 'OOP', 'Operating Systems',
]

export default function Questions() {
  const [searchParams] = useSearchParams()
  const [questions, setQuestions]     = useState([])
  const [patterns, setPatterns]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [searchText, setSearchText]   = useState(searchParams.get('q') || '')
  const [filters, setFilters]         = useState({ company: '', stage: '', topic: '', difficulty: '' })
  const [page, setPage]               = useState(1)
  const [pagination, setPagination]   = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [aiOpen, setAiOpen]           = useState(false)
  const [aiLoading, setAiLoading]     = useState(false)
  const [aiInput, setAiInput]         = useState('')
  const [aiMessages, setAiMessages]   = useState([])

  // Fetch questions
  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    try {
      const params = { ...filters, page, limit: 20 }
      Object.keys(params).forEach(k => !params[k] && delete params[k])
      const res = await api.get('/questions', { params })
      const payload = unwrap(res)
      setQuestions(Array.isArray(payload) ? payload : (payload?.data ?? []))
      if (payload?.pagination) setPagination(payload.pagination)
    } catch {
      toast.error('Failed to load questions.')
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  // Semantic search (debounced)
  useEffect(() => {
    if (!searchText.trim()) { fetchQuestions(); return }
    const t = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await api.get('/questions/search', { params: { q: searchText, limit: 20 } })
        const payload = unwrap(res)
        setQuestions(Array.isArray(payload) ? payload : (payload?.data ?? []))
        setPagination(null)
      } catch { toast.error('Search failed.') }
      finally { setIsSearching(false) }
    }, 500)
    return () => clearTimeout(t)
  }, [searchText])

  useEffect(() => { if (!searchText.trim()) fetchQuestions() }, [fetchQuestions])

  useEffect(() => {
    api.get('/experiences/insights').then(r => {
      const d = unwrap(r)
      const arr = Array.isArray(d) ? d : (d?.patterns ?? [])
      setPatterns(arr.slice(0, 4))
    }).catch(() => {})
  }, [])

  const setFilter = (key, value) => {
    setPage(1)
    setFilters(prev => ({ ...prev, [key]: value === prev[key] ? '' : value }))
  }

  const clearFilters = () => {
    setFilters({ company: '', stage: '', topic: '', difficulty: '' })
    setSearchText('')
    setPage(1)
  }

  const hasFilters = Object.values(filters).some(Boolean) || searchText

  const sendAiQuestion = async () => {
    if (!aiInput.trim()) return
    const q = aiInput.trim()
    setAiMessages(prev => [...prev, { role: 'user', text: q }])
    setAiInput('')
    setAiLoading(true)
    try {
      const res = await api.post('/agent/chat', { message: q })
      const reply = unwrap(res)?.reply ?? unwrap(res)?.message ?? 'No response'
      setAiMessages(prev => [...prev, { role: 'ai', text: reply }])
    } catch { toast.error('AI unavailable.') }
    finally { setAiLoading(false) }
  }

  const quickAsk = (text) => {
    setAiInput(text)
    setAiOpen(true)
  }

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Left Filter Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-60 shrink-0 bg-surface-container-low border-r border-outline-variant/5 overflow-y-auto p-5 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-secondary uppercase tracking-[0.2em]">Filters</h3>
          {hasFilters && (
            <button onClick={clearFilters} className="text-[10px] text-primary hover:underline font-bold">Clear all</button>
          )}
        </div>

        {/* Company */}
        <div>
          <label className="block text-xs font-bold text-on-surface mb-2 uppercase tracking-wider">Company</label>
          <input
            value={filters.company}
            onChange={e => setFilter('company', e.target.value)}
            placeholder="Google, Amazon…"
            className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-outline/40 focus:outline-none focus:border-primary/50"
          />
        </div>

        {/* Stage */}
        <div>
          <label className="block text-xs font-bold text-on-surface mb-2 uppercase tracking-wider">Stage</label>
          <div className="flex flex-wrap gap-1.5">
            {STAGES_FILTER.map(s => (
              <button key={s} onClick={() => setFilter('stage', s)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${filters.stage === s ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-high text-on-surface-variant border-outline-variant/20 hover:border-primary/40'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Topic */}
        <div>
          <label className="block text-xs font-bold text-on-surface mb-2 uppercase tracking-wider">Topic</label>
          <div className="space-y-1">
            {TOPICS.map(t => (
              <button key={t} onClick={() => setFilter('topic', t)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all ${filters.topic === t ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-xs font-bold text-on-surface mb-2 uppercase tracking-wider">Difficulty</label>
          <div className="flex gap-1.5">
            {DIFFICULTIES.map(d => (
              <button key={d} onClick={() => setFilter('difficulty', d)}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${filters.difficulty === d ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant/20 text-on-surface-variant hover:border-primary/40'}`}>
                {d}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Main Feed ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Search + AI toggle */}
        <div className="flex items-center gap-3 p-6 pb-4 border-b border-outline-variant/5 bg-background/50 backdrop-blur shrink-0">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-xl">search</span>
            <input
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="Semantic search — describe any concept, e.g. 'two pointer approach'…"
              className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl py-3 pl-12 pr-4 text-sm text-on-surface placeholder:text-outline/40 focus:outline-none focus:border-primary/60 transition-all"
            />
            {(isSearching || loading) && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            )}
          </div>
          <button
            onClick={() => setAiOpen(o => !o)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${aiOpen ? 'bg-primary text-on-primary' : 'bg-surface-container-low border border-outline-variant/10 text-on-surface-variant hover:border-primary/40 hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
            AI Focus
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* Question List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* Trending Patterns */}
            {patterns.length > 0 && !hasFilters && (
              <div>
                <h2 className="text-base font-bold text-on-surface mb-3">📈 Trending Patterns</h2>
                <div className="grid grid-cols-2 gap-2">
                  {patterns.map((p, i) => (
                    <button key={i}
                      onClick={() => setFilter('topic', p.pattern ?? p._id ?? p)}
                      className="text-left p-3 rounded-xl bg-surface-container-low border border-outline-variant/5 hover:border-primary/20 hover:bg-surface-container transition-all group">
                      <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{p.pattern ?? p._id ?? p}</span>
                      {p.count && <p className="text-xs text-outline mt-0.5">{p.count} questions</p>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-on-surface">
                  {searchText ? 'Search Results' : 'Question Feed'}
                  {questions.length > 0 && <span className="text-outline font-normal text-sm ml-2">({questions.length})</span>}
                </h2>
              </div>

              {loading || isSearching ? (
                <div className="space-y-3">{[1,2,3,4,5].map(i => <QuestionSkeleton key={i}/>)}</div>
              ) : questions.length === 0 ? (
                <div className="text-center py-16">
                  <span className="material-symbols-outlined text-4xl text-outline block mb-3 opacity-30">search_off</span>
                  <p className="text-on-surface-variant mb-1">No questions match your filters.</p>
                  <p className="text-xs text-outline">Try seeding the database first in Settings → "Seed Questions Now"</p>
                  <button onClick={clearFilters} className="mt-3 text-primary font-semibold text-sm hover:underline">Clear filters</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {questions.map(q => (
                    <FullQuestionCard key={q._id} question={q} onAskAI={(q) => {
                      setAiInput(`Explain the approach for: ${q.title}`)
                      setAiOpen(true)
                    }} />
                  ))}
                  {pagination?.hasNextPage && (
                    <button onClick={() => setPage(p => p + 1)}
                      className="w-full py-3 bg-surface-container-low rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all">
                      Load more →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── AI Focus Panel (in-flow, not fixed) ─────────────────────────── */}
          {aiOpen && (
            <div className="w-80 shrink-0 border-l border-outline-variant/10 bg-surface-container-low flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-outline-variant/5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <h2 className="text-sm font-headline font-extrabold">AI Focus</h2>
                </div>
                <button onClick={() => setAiOpen(false)} className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-high transition-all">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {aiMessages.length === 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-on-surface-variant text-center py-2 opacity-60">Ask me anything about patterns or problems</p>
                    {['Explain sliding window technique', 'When to use BFS vs DFS?', 'Best approach for DP problems?'].map((s, i) => (
                      <button key={i} onClick={() => quickAsk(s)}
                        className="w-full text-left p-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs text-on-surface-variant border border-outline-variant/5 transition-all">
                        "{s}"
                      </button>
                    ))}
                  </div>
                ) : (
                  aiMessages.map((m, i) => (
                    <div key={i} className={`p-3 rounded-xl text-xs leading-relaxed ${m.role === 'user' ? 'bg-primary/10 border border-primary/20 text-on-surface ml-4' : 'bg-surface-container border border-outline-variant/10 text-on-surface-variant'}`}>
                      <span className={`block text-[10px] font-black mb-1 uppercase ${m.role === 'user' ? 'text-primary' : 'text-secondary'}`}>{m.role === 'user' ? 'You' : 'AI'}</span>
                      <span className="whitespace-pre-wrap">{m.text}</span>
                    </div>
                  ))
                )}
                {aiLoading && (
                  <div className="flex items-center gap-2 p-3 bg-surface-container rounded-xl">
                    <span className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin" />
                    <span className="text-xs text-outline">Thinking…</span>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-outline-variant/5">
                <div className="relative">
                  <input
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendAiQuestion()}
                    placeholder="Ask about patterns…"
                    className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl py-2.5 px-3 pr-10 text-sm text-on-surface placeholder:text-outline/40 focus:border-primary/50 outline-none"
                  />
                  <button onClick={sendAiQuestion} disabled={aiLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary text-on-primary rounded-lg hover:brightness-110 disabled:opacity-40">
                    {aiLoading
                      ? <span className="w-3 h-3 border border-on-primary/30 border-t-on-primary rounded-full animate-spin block" />
                      : <span className="material-symbols-outlined text-sm">send</span>
                    }
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FullQuestionCard({ question, onAskAI }) {
  const [bookmarked, setBookmarked] = useState(question.isBookmarked ?? false)
  const [solved, setSolved]         = useState(question.isSolved ?? false)
  const [expanded, setExpanded]     = useState(false)

  const trackActivity = async (type) => {
    try { await api.post(`/questions/${question._id}/activity`, { activityType: type }) } catch {}
  }

  const leetcodeUrl = question.externalLink || question.link || (question.leetcodeId ? `https://leetcode.com/problems/${question.leetcodeId}` : null)
  const companies   = Array.isArray(question.company) ? question.company : (question.company ? [question.company] : [])
  const stages      = Array.isArray(question.stage)   ? question.stage   : (question.stage   ? [question.stage]   : [])
  const tagList     = question.tags ?? question.topics ?? []

  return (
    <div className={`group bg-surface-container-lowest rounded-2xl border border-transparent hover:border-outline-variant/10 hover:bg-surface-container-low transition-all duration-200 ${solved ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between p-5">
        <div className="flex-1 min-w-0 pr-4">
          {/* Badges row */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${difficultyColor(question.difficulty)}`}>
              {question.difficulty ?? 'Medium'}
            </span>
            {question.pattern && (
              <span className="text-[10px] px-2 py-0.5 bg-surface-container-high rounded text-on-surface-variant">{question.pattern}</span>
            )}
            {companies.slice(0, 2).map(c => (
              <span key={c} className="text-[10px] px-2 py-0.5 bg-secondary/10 text-secondary rounded font-semibold">{c}</span>
            ))}
            {stages.slice(0, 2).map(s => (
              <span key={s} className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded">{s}</span>
            ))}
          </div>

          {/* Title */}
          <h4 onClick={() => setExpanded(e => !e)}
            className={`font-bold text-sm cursor-pointer text-on-surface group-hover:text-primary transition-colors leading-snug ${solved ? 'line-through text-on-surface-variant' : ''}`}>
            {question.title}
          </h4>

          {/* Description */}
          {expanded && question.description && (
            <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">{question.description}</p>
          )}

          {/* Tags */}
          {tagList.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tagList.slice(0, 4).map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 bg-surface-container-high rounded text-outline">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {leetcodeUrl ? (
            <a href={leetcodeUrl} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-primary text-xs font-bold hover:underline">
              Solve <span className="material-symbols-outlined text-xs">open_in_new</span>
            </a>
          ) : <span className="text-xs text-outline/40">No link</span>}

          <div className="flex gap-2">
            <button onClick={() => { setSolved(s => !s); trackActivity('solved') }}
              className={`transition-colors ${solved ? 'text-primary' : 'text-outline hover:text-on-surface'}`} title="Mark solved">
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: solved ? "'FILL' 1" : "'FILL' 0" }}>task_alt</span>
            </button>
            <button onClick={() => { setBookmarked(b => !b); trackActivity('bookmarked') }}
              className={`transition-colors ${bookmarked ? 'text-secondary' : 'text-outline hover:text-on-surface'}`} title="Bookmark">
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: bookmarked ? "'FILL' 1" : "'FILL' 0" }}>bookmark</span>
            </button>
            <button onClick={() => onAskAI(question)} className="text-outline hover:text-primary transition-colors" title="Ask AI about this">
              <span className="material-symbols-outlined text-lg">smart_toy</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
