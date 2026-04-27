import { useState } from 'react'
import { Link } from 'react-router-dom'
import { timeAgo } from '../utils/helpers'

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'stage', icon: 'trending_up', color: 'text-primary', title: 'Time to follow up on Google — SDE1', body: 'You applied 5 days ago. Consider sending a follow-up email.', time: Date.now() - 3600000 * 2, link: '/', read: false },
  { id: 2, type: 'ai', icon: 'auto_awesome', color: 'text-secondary', title: 'AI Insight: New pattern detected', body: 'Sliding Window questions are trending at Amazon OA rounds this week.', time: Date.now() - 3600000 * 8, link: '/questions', read: false },
  { id: 3, type: 'question', icon: 'quiz', color: 'text-tertiary', title: '3 new questions added for your targets', body: 'New System Design questions for Google and Microsoft added to the database.', time: Date.now() - 86400000, link: '/questions', read: true },
  { id: 4, type: 'experience', icon: 'work_history', color: 'text-primary', title: 'New experience shared for Amazon SDE2', body: 'A community member shared their Round 2 experience. Check it out.', time: Date.now() - 86400000 * 2, link: '/experiences', read: true },
  { id: 5, type: 'weekly', icon: 'analytics', color: 'text-secondary', title: 'Your weekly summary is ready', body: 'You tracked 2 processes and solved 0 questions this week. Let\'s step it up!', time: Date.now() - 86400000 * 3, link: '/', read: true },
]

export default function Notifications() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const [filter, setFilter] = useState('all')

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  const markRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))

  const unreadCount = notifications.filter(n => !n.read).length
  const filtered = filter === 'unread' ? notifications.filter(n => !n.read) : notifications

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6 overflow-y-auto flex-1 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-extrabold text-on-surface">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-on-surface-variant text-sm mt-1">{unreadCount} unread</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-surface-container-high rounded-xl p-1">
            {['all', 'unread'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold capitalize transition-all ${filter === f ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                {f}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-sm text-primary font-semibold hover:underline">
              Mark all read
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl text-outline block mb-3 opacity-30">notifications_off</span>
          <p className="text-on-surface-variant">No {filter === 'unread' ? 'unread ' : ''}notifications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(notif => (
            <Link
              key={notif.id}
              to={notif.link}
              onClick={() => markRead(notif.id)}
              className={`group block p-5 rounded-2xl border transition-all ${notif.read ? 'bg-surface-container-lowest border-transparent hover:bg-surface-container-low hover:border-outline-variant/10' : 'bg-surface-container-low border-primary/10 hover:border-primary/30'}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center shrink-0 ${!notif.read ? 'ring-2 ring-primary/20' : ''}`}>
                  <span className={`material-symbols-outlined ${notif.color} text-xl`} style={{ fontVariationSettings: "'FILL' 1" }}>{notif.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-bold ${notif.read ? 'text-on-surface-variant' : 'text-on-surface'}`}>{notif.title}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-outline">{timeAgo(notif.time)}</span>
                      {!notif.read && <span className="w-2 h-2 bg-primary rounded-full" />}
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{notif.body}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-outline/40 pt-4">
        Real-time notifications coming soon. Showing curated alerts for now.
      </p>
    </div>
  )
}
