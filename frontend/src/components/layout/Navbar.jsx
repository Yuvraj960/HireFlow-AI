import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function Navbar() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  return (
    <header className="flex justify-between items-center w-full px-8 h-16 bg-[#0b1326] sticky top-0 z-40 shrink-0 border-b border-outline-variant/10">
      {/* Search */}
      <div className="flex items-center flex-1 max-w-md">
        <div className="relative w-full group">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg group-focus-within:text-primary transition-colors">search</span>
          <input
            type="text"
            placeholder="Search questions, companies..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                navigate(`/questions?q=${encodeURIComponent(e.target.value.trim())}`)
              }
            }}
            className="w-full bg-surface-container-low border border-outline-variant/10 rounded-full py-2.5 pl-11 pr-4 text-on-surface placeholder:text-outline/40 focus:ring-1 focus:ring-primary/50 font-body text-sm transition-all outline-none"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 ml-6">
        {/* Notification bell */}
        <Link
          to="/notifications"
          className="relative p-2 rounded-full text-[#b8c3ff] opacity-70 hover:bg-[#2d3449] hover:opacity-100 transition-all"
          title="Notifications"
        >
          <span className="material-symbols-outlined text-xl">notifications</span>
          {/* Unread dot */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-[#0b1326]" />
        </Link>

        {/* Settings */}
        <Link
          to="/settings"
          className="p-2 rounded-full text-[#b8c3ff] opacity-70 hover:bg-[#2d3449] hover:opacity-100 transition-all"
          title="Settings"
        >
          <span className="material-symbols-outlined text-xl">settings</span>
        </Link>

        <div className="w-px h-6 bg-outline-variant/20 mx-1" />

        {/* Avatar → Profile */}
        <Link to="/profile" className="flex items-center gap-2.5 group" title="Profile">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-black text-primary group-hover:ring-2 group-hover:ring-primary/40 transition-all">
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <span className="text-sm font-semibold text-on-surface hidden lg:block">{user?.name?.split(' ')[0]}</span>
        </Link>
      </div>
    </header>
  )
}
