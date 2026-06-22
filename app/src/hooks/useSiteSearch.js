// Debounced place search for the search box. Drives map navigation only.
import { useEffect, useRef, useState } from 'react'
import { searchPlaces } from '../lib/geocodeSearch.js'

export function useSiteSearch(query, { debounce = 250 } = {}) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 3) {
      setResults([])
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    const timer = setTimeout(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const r = await searchPlaces(q, controller.signal)
        setResults(r)
        setError(null)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('Search unavailable')
          setResults([])
        }
      } finally {
        setLoading(false)
      }
    }, debounce)

    return () => clearTimeout(timer)
  }, [query, debounce])

  return { results, loading, error }
}
