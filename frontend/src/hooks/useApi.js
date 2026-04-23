import { useState, useEffect, useCallback } from 'react'

/**
 * Generic data-fetching hook.
 * @param {Function} apiFn  - async function that returns the response
 * @param {Array}    deps   - dependency array to re-run the fetch
 * @param {boolean}  immediate - whether to run on mount (default true)
 */
export const useApi = (apiFn, deps = [], immediate = true) => {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError]     = useState(null)

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiFn(...args)
      setData(result)
      return result
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Something went wrong')
      throw err
    } finally {
      setLoading(false)
    }
  }, deps) // eslint-disable-line

  useEffect(() => {
    if (immediate) execute()
  }, deps) // eslint-disable-line

  return { data, loading, error, refetch: execute }
}
