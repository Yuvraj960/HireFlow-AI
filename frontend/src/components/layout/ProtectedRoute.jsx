import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuthStore()
  const location = useLocation()

  // While loadUser is in flight, show nothing (App.jsx Suspense handles it)
  if (loading) return null

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return (
    <div className="flex bg-background min-h-screen text-on-surface font-body selection:bg-primary selection:text-on-primary">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col relative w-full h-screen overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-hidden flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default ProtectedRoute
