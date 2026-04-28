import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import React, { Suspense, useEffect } from 'react'
import { useAuthStore } from './store/authStore'

// Layout
import ProtectedRoute from './components/layout/ProtectedRoute'

// Pages — lazy loaded
const Dashboard     = React.lazy(() => import('./pages/Dashboard'))
const ProcessDetail = React.lazy(() => import('./pages/ProcessDetail'))
const Questions     = React.lazy(() => import('./pages/Questions'))
const Experiences   = React.lazy(() => import('./pages/Experiences'))
const Agent         = React.lazy(() => import('./pages/AiAgent'))
const Login         = React.lazy(() => import('./pages/Login'))
const Register      = React.lazy(() => import('./pages/Register'))
const Onboarding    = React.lazy(() => import('./pages/Onboarding'))
const Profile       = React.lazy(() => import('./pages/Profile'))
const Settings      = React.lazy(() => import('./pages/Settings'))
const Notifications = React.lazy(() => import('./pages/Notifications'))

function AppLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <span className="material-symbols-outlined text-primary text-5xl animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
        <p className="text-on-surface-variant text-sm">Loading HireFlow AI...</p>
      </div>
    </div>
  )
}

function App() {
  const { loadUser } = useAuthStore()
  useEffect(() => { loadUser() }, [])

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#222a3d',
            color: '#dae2fd',
            border: '1px solid rgba(139,146,149,0.2)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#00daf3', secondary: '#00363d' } },
          error:   { iconTheme: { primary: '#ffb4ab', secondary: '#690005' } },
        }}
      />
      <Suspense fallback={<AppLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login"      element={<Login />} />
          <Route path="/register"   element={<Register />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/"                element={<Dashboard />} />
            <Route path="/questions"       element={<Questions />} />
            <Route path="/process/:id"     element={<ProcessDetail />} />
            <Route path="/experiences"     element={<Experiences />} />
            <Route path="/agent"           element={<Agent />} />
            <Route path="/profile"         element={<Profile />} />
            <Route path="/settings"        element={<Settings />} />
            <Route path="/notifications"   element={<Notifications />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App
