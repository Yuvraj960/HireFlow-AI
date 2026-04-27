import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { useProcessStore } from '../store/processStore'
import { useAuthStore } from '../store/authStore'
import { unwrap, STAGE_LABELS } from '../utils/helpers'

const SUGGESTED_PROMPTS = [
  'What questions should I focus on for this stage?',
  'Give me a mock interview question',
  'What are common mistakes at this stage?',
  'Create a 1-week study plan for me',
  'Explain the optimal approach for system design',
]

export default function AiAgent() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { processes, fetchProcesses, activeProcess, setActiveProcess } = useProcessStore()

  const [messages, setMessages]     = useState([])
  const [input, setInput]           = useState(location.state?.initialMessage ?? '')
  const [sending, setSending]       = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [selectedProcessId, setSelectedProcessId] = useState(location.state?.processId ?? null)
  const [showProcessPicker, setShowProcessPicker] = useState(false)

  const messagesEndRef = useRef(null)
  const textareaRef    = useRef(null)

  // Load processes for context picker
  useEffect(() => {
    if (!processes.length) fetchProcesses()
  }, [])

  // Set initial process from state or first active one
  useEffect(() => {
    if (selectedProcessId) {
      setActiveProcess(selectedProcessId)
    } else if (processes.length > 0 && !selectedProcessId) {
      const first = processes.find(p => !['Offer', 'Rejected'].includes(p.currentStage))
      if (first) {
        setSelectedProcessId(first._id)
        setActiveProcess(first._id)
      }
    }
  }, [processes, selectedProcessId])

  // Load chat history when processId changes
  useEffect(() => {
    if (!selectedProcessId) return
    const load = async () => {
      setLoadingHistory(true)
      try {
        const res = await api.get(`/agent/history/${selectedProcessId}`)
        const history = unwrap(res)?.messages ?? unwrap(res) ?? []
        const shaped = Array.isArray(history) ? history.map(m => ({
          id: m._id ?? Math.random(),
          role: m.role,
          content: m.content,
          ts: m.createdAt,
        })) : []

        // If it's first load and no history, show welcome message
        if (shaped.length === 0) {
          const proc = processes.find(p => p._id === selectedProcessId)
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: proc
              ? `👋 Hi ${user?.name?.split(' ')[0] ?? 'there'}! I'm your AI assistant for **${proc.company} – ${proc.role}** at the **${STAGE_LABELS[proc.currentStage] ?? proc.currentStage}** stage.\n\nHow can I help you prepare today?`
              : `👋 Hi! I'm your HireFlow AI agent. Select a hiring process above to get personalized guidance, or just ask me anything about interview preparation.`,
          }])
        } else {
          setMessages(shaped)
        }
      } catch {
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: '👋 Welcome! I\'m your HireFlow AI agent. Ask me anything about interview preparation.',
        }])
      } finally {
        setLoadingHistory(false)
      }
    }
    load()
  }, [selectedProcessId])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (messageText) => {
    const text = (messageText ?? input).trim()
    if (!text || sending) return

    const userMsg = { id: Date.now(), role: 'user', content: text, ts: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setSending(true)

    // Typing indicator
    const typingId = Date.now() + 1
    setMessages(prev => [...prev, { id: typingId, role: 'assistant', content: '__typing__' }])

    try {
      const res = await api.post('/agent/chat', {
        message: text,
        processId: selectedProcessId,
      })
      const reply = unwrap(res)?.reply ?? unwrap(res)?.message ?? 'I couldn\'t generate a response.'
      setMessages(prev => prev
        .filter(m => m.id !== typingId)
        .concat({ id: Date.now() + 2, role: 'assistant', content: reply, ts: new Date().toISOString() })
      )
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== typingId))
      toast.error(err?.response?.data?.message || 'Failed to get AI response.')
    } finally {
      setSending(false)
    }
  }, [input, sending, selectedProcessId])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const contextProcess = processes.find(p => p._id === selectedProcessId)

  return (
    <div className="flex-1 flex flex-col bg-surface-container-low overflow-hidden h-[calc(100vh-4rem)]">

      {/* Context Bar */}
      <header className="flex items-center justify-between px-6 h-14 bg-surface-container-low border-b border-outline-variant/5 z-40 shrink-0">
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-3 bg-surface-container-highest/30 px-4 py-2 rounded-full border border-outline-variant/10 cursor-pointer hover:bg-surface-container-high transition-colors"
            onClick={() => setShowProcessPicker(!showProcessPicker)}
          >
            <span className="text-[10px] uppercase tracking-widest text-secondary font-bold">Context</span>
            {contextProcess ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary">{contextProcess.company}</span>
                <span className="text-[10px] text-outline">•</span>
                <span className="text-xs text-on-surface">{contextProcess.role}</span>
                <span className="text-[10px] text-outline">•</span>
                <span className="text-xs font-semibold text-secondary">{STAGE_LABELS[contextProcess.currentStage]}</span>
              </div>
            ) : (
              <span className="text-xs text-on-surface-variant">No process selected</span>
            )}
            <span className="material-symbols-outlined text-sm text-on-surface-variant">expand_more</span>
          </div>

          {/* Process Picker Dropdown */}
          {showProcessPicker && (
            <div className="absolute top-16 left-6 w-72 bg-surface-container rounded-2xl border border-outline-variant/20 shadow-2xl z-50 overflow-hidden py-2">
              <p className="text-xs font-bold text-secondary uppercase tracking-wider px-4 py-2">Select Process Context</p>
              {processes.length === 0 ? (
                <div className="px-4 py-3 text-sm text-on-surface-variant">No processes. Create one first.</div>
              ) : (
                processes.map(p => (
                  <button
                    key={p._id}
                    onClick={() => { setSelectedProcessId(p._id); setActiveProcess(p._id); setShowProcessPicker(false) }}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-surface-container-high transition-colors ${p._id === selectedProcessId ? 'text-primary bg-primary-container/20' : 'text-on-surface'}`}
                  >
                    <div>
                      <p className="text-sm font-semibold">{p.company} · {p.role}</p>
                      <p className="text-xs text-on-surface-variant">{STAGE_LABELS[p.currentStage]}</p>
                    </div>
                    {p._id === selectedProcessId && <span className="material-symbols-outlined text-primary text-sm">check</span>}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <button onClick={() => navigate('/')} className="text-on-surface-variant hover:text-on-surface text-sm flex items-center gap-1 transition-colors">
          <span className="material-symbols-outlined text-sm">dashboard</span>
          Dashboard
        </button>
      </header>

      {/* Chat Area */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 space-y-6 custom-scrollbar" onClick={() => setShowProcessPicker(false)}>
          {loadingHistory ? (
            <div className="flex justify-center py-12">
              <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map(msg => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Right sidebar: Suggested prompts */}
        <aside className="hidden xl:flex w-64 glass-panel border-l border-outline-variant/10 flex-col p-5 gap-4 shrink-0">
          <h5 className="text-xs font-headline font-bold text-secondary uppercase tracking-widest">Suggested Prompts</h5>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {SUGGESTED_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => sendMessage(p)}
                disabled={sending}
                className="w-full text-left p-3 rounded-xl bg-surface-container hover:bg-surface-container-high transition-all border border-outline-variant/5 text-sm text-on-surface-variant disabled:opacity-40"
              >
                "{p}"
              </button>
            ))}
          </div>
          <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
              <span className="text-[10px] font-bold text-primary uppercase">Gemini Powered</span>
            </div>
            <p className="text-xs text-on-surface-variant">AI responses are personalized to your active process context.</p>
          </div>
        </aside>
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-gradient-to-t from-surface-container-low to-transparent border-t border-outline-variant/5 shrink-0">
        <div className="max-w-3xl mx-auto relative">
          <div className="glass-panel rounded-2xl border border-outline-variant/20 flex items-end p-2 focus-within:border-primary/50 transition-all bg-surface-container-lowest/80 backdrop-blur-xl gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${contextProcess ? `about ${contextProcess.company}...` : 'anything about interviews...'}`}
              rows={1}
              className="flex-1 bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-outline/50 px-3 py-2 font-body outline-none resize-none max-h-32 custom-scrollbar"
              style={{ height: 'auto' }}
            />
            <div className="flex items-center gap-1 pb-1 shrink-0">
              <button
                onClick={() => sendMessage()}
                disabled={sending || !input.trim()}
                className="bg-primary text-on-primary p-2.5 rounded-xl flex items-center justify-center hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending
                  ? <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  : <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                }
              </button>
            </div>
          </div>
          <p className="text-center text-[10px] text-outline/50 mt-2">Press Enter to send · Shift+Enter for new line · Powered by Gemini</p>
        </div>
      </div>
    </div>
  )
}

function ChatMessage({ message }) {
  if (message.content === '__typing__') {
    return (
      <div className="flex gap-4">
        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
        </div>
        <div className="glass-panel p-4 rounded-2xl border-l-2 border-primary flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    )
  }

  if (message.role === 'user') {
    return (
      <div className="flex gap-4 justify-end">
        <div className="space-y-1 text-right max-w-xl">
          <div className="bg-primary-container/40 text-on-surface p-4 rounded-2xl inline-block text-left border border-primary/10">
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>
        </div>
        <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 border border-outline-variant/30 bg-surface-container-highest flex items-center justify-center">
          <span className="material-symbols-outlined text-on-surface-variant">person</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-4">
      <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-1">
        <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
      </div>
      <div className="glass-panel p-5 rounded-2xl border-l-2 border-primary flex-1 max-w-3xl">
        <div className="prose prose-invert prose-sm max-w-none text-on-surface-variant leading-relaxed">
          <ReactMarkdown
            components={{
              h1: ({node, ...p}) => <h1 className="text-lg font-bold text-on-surface mb-3" {...p} />,
              h2: ({node, ...p}) => <h2 className="text-base font-bold text-on-surface mb-2 mt-4" {...p} />,
              h3: ({node, ...p}) => <h3 className="text-sm font-bold text-secondary mb-2 mt-3 uppercase tracking-wider" {...p} />,
              p: ({node, ...p}) => <p className="mb-3 text-sm text-on-surface-variant last:mb-0" {...p} />,
              ul: ({node, ...p}) => <ul className="space-y-1.5 mb-3" {...p} />,
              li: ({node, ...p}) => <li className="flex items-start gap-2 text-sm text-on-surface-variant"><span className="text-primary mt-1.5 shrink-0">•</span><span {...p} /></li>,
              code: ({node, inline, ...p}) => inline
                ? <code className="bg-surface-container-highest px-1.5 py-0.5 rounded text-primary text-xs font-mono" {...p} />
                : <pre className="bg-surface-container-lowest rounded-xl p-4 overflow-x-auto my-3"><code className="text-primary text-xs font-mono" {...p} /></pre>,
              strong: ({node, ...p}) => <strong className="text-on-surface font-bold" {...p} />,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
