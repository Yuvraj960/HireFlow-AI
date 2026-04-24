import { create } from 'zustand'
import api from '../api/axios'
import { unwrap } from '../utils/helpers'

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const res = await api.post('/auth/login', { email, password })
      const { token, user, requiresOnboarding } = res.data.data ?? res.data
      localStorage.setItem('token', token)
      set({ user, token, isAuthenticated: true, loading: false })
      return { requiresOnboarding }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed'
      set({ error: msg, loading: false })
      throw err
    }
  },

  // Register does NOT log the user in — returns payment/bypass info
  register: async (name, email, password) => {
    set({ loading: true, error: null })
    try {
      const res = await api.post('/auth/register', { name, email, password })
      set({ loading: false })
      return res.data.data ?? res.data   // { bypassPayment, subscriptionId, ... }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      set({ error: msg, loading: false })
      throw err
    }
  },

  completeOnboarding: async (profileData) => {
    set({ loading: true, error: null })
    try {
      const res = await api.post('/auth/onboarding', profileData)
      const { token, user } = res.data.data ?? res.data
      localStorage.setItem('token', token)
      set({ user, token, isAuthenticated: true, loading: false })
    } catch (err) {
      const msg = err.response?.data?.message || 'Onboarding failed'
      set({ error: msg, loading: false })
      throw err
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null, isAuthenticated: false, error: null })
  },

  loadUser: async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      set({ isAuthenticated: false, loading: false })
      return
    }
    set({ loading: true })
    try {
      const res = await api.get('/auth/me')
      const user = unwrap(res)?.user ?? unwrap(res)
      set({ user, isAuthenticated: true, loading: false })
    } catch {
      localStorage.removeItem('token')
      set({ user: null, token: null, isAuthenticated: false, loading: false })
    }
  },
}))
