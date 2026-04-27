import { create } from 'zustand'
import api from '../api/axios'
import { unwrap } from '../utils/helpers'

export const useProcessStore = create((set, get) => ({
  processes: [],
  activeProcess: null,
  loading: false,
  error: null,

  fetchProcesses: async () => {
    set({ loading: true, error: null })
    try {
      const res = await api.get('/process')
      const payload = unwrap(res)
      // Paginated: { data: [...], pagination: {...} }  or flat array
      const processes = Array.isArray(payload) ? payload
        : Array.isArray(payload?.data) ? payload.data
        : []
      set({ processes, loading: false })
      return processes
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load processes', loading: false })
    }
  },

  createProcess: async (data) => {
    set({ loading: true, error: null })
    try {
      const res = await api.post('/process', data)
      const process = unwrap(res)?.process ?? unwrap(res)
      set((state) => ({ processes: [process, ...state.processes], loading: false }))
      return process
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to create process', loading: false })
      throw err
    }
  },

  fetchProcess: async (id) => {
    try {
      const res = await api.get(`/process/${id}`)
      const process = unwrap(res)?.process ?? unwrap(res)
      set({ activeProcess: process })
      return process
    } catch (err) {
      throw err
    }
  },

  updateStage: async (id, stage) => {
    try {
      await api.patch(`/process/${id}/stage`, { newStage: stage })
      set((state) => ({
        processes: state.processes.map((p) =>
          p._id === id ? { ...p, currentStage: stage } : p
        ),
        activeProcess:
          state.activeProcess?._id === id
            ? { ...state.activeProcess, currentStage: stage }
            : state.activeProcess,
      }))
    } catch (err) {
      throw err
    }
  },

  deleteProcess: async (id) => {
    try {
      await api.delete(`/process/${id}`)
      set((state) => ({
        processes: state.processes.filter((p) => p._id !== id),
        activeProcess: state.activeProcess?._id === id ? null : state.activeProcess,
      }))
    } catch (err) {
      throw err
    }
  },

  setActiveProcess: (id) => {
    set((state) => ({
      activeProcess: state.processes.find((p) => p._id === id) || null,
    }))
  },
}))
