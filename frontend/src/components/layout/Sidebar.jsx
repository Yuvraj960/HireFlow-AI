import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../lib/utils'

const NAV_LINKS = [
  { name: 'Dashboard',    path: '/',            icon: 'dashboard' },
  { name: 'Questions',    path: '/questions',   icon: 'quiz' },
  { name: 'Experiences',  path: '/experiences', icon: 'work_history' },
  { name: 'AI Agent',     path: '/agent',       icon: 'smart_toy' },
]

const BOTTOM_LINKS = [
  { name: 'Settings',  path: '/settings',  icon: 'settings' },
  { name: 'Profile',   path: '/profile',   icon: 'person' },
]

export default function Sidebar() {
  const { pathname } = useLocation()
  const { logout, user } = useAuthStore()

  const isActive = (path) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path)

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-[#0b1326] flex flex-col p-4 z-50 border-r border-outline-variant/10">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 py-4 mb-1">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-on-primary-container flex items-center justify-center shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined text-on-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[#00daf3] font-black uppercase tracking-widest text-xs">HireFlow AI</span>
          <span className="text-secondary text-[10px] opacity-60">Interview Prep</span>
        </div>
      </div>

      {/* New Process CTA */}
      <Link
        to="/?new=1"
        className="w-full py-3 px-4 bg-gradient-to-r from-primary to-on-primary-container text-on-primary font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/10 hover:brightness-110 mb-4"
      >
        <span className="material-symbols-outlined text-xl">add</span>
        <span className="text-sm">New Process</span>
      </Link>

      {/* Main Nav */}
      <nav className="flex-1 space-y-1">
        {NAV_LINKS.map(({ name, path, icon }) => {
          const active = isActive(path)
          return (
            <Link
              key={name}
              to={path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-['Manrope'] text-sm font-medium group",
                active
                  ? 'text-[#00daf3] bg-[#2d3449]'
                  : 'text-[#b8c3ff] opacity-60 hover:bg-[#131b2e] hover:text-white hover:opacity-100'
              )}
            >
              <span
                className="material-symbols-outlined text-lg transition-all"
                style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
              >
                {icon}
              </span>
              {name}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="pt-4 border-t border-outline-variant/10 space-y-1">
        {BOTTOM_LINKS.map(({ name, path, icon }) => {
          const active = isActive(path)
          return (
            <Link
              key={name}
              to={path}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-['Manrope'] text-sm font-medium",
                active
                  ? 'text-[#00daf3] bg-[#2d3449]'
                  : 'text-[#b8c3ff] opacity-60 hover:bg-[#131b2e] hover:text-white hover:opacity-100'
              )}
            >
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
              {name}
            </Link>
          )
        })}

        {/* User info + logout */}
        {user && (
          <div className="flex items-center gap-3 px-4 py-2 mt-2">
            <Link to="/profile" className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-black text-primary hover:ring-2 hover:ring-primary/40 transition-all">
              {user.name?.[0]?.toUpperCase() ?? 'U'}
            </Link>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-on-surface truncate">{user.name}</p>
              <p className="text-[10px] text-outline truncate">{user.email}</p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-lg text-outline hover:text-red-400 hover:bg-[#131b2e] transition-all"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
