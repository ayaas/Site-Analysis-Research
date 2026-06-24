// Nearby general points of interest around the confirmed site, refetched
// whenever the site or the chosen radius changes. Deliberately excludes
// Aboriginal cultural/heritage sites — see lib/poi.js.
import { useEffect, useState } from 'react'
import { poiNear } from '../lib/poi.js'

export function useNearbyPlaces(center, radiusM) {
  const [state, setState] = useState({ status: 'idle', places: [] })

  useEffect(() => {
    if (!center) {
      setState({ status: 'idle', places: [] })
      return
    }
    let cancelled = false
    setState((prev) => ({ status: 'loading', places: prev.places }))

    // A wider radius should be allowed to surface more places, not the same
    // fixed cap as the tightest radius — scale linearly across the slider's
    // 100–200m range, from 20 results up to 30.
    const limit = Math.round(20 + ((radiusM - 100) / 100) * 10)
    poiNear(center, radiusM, limit)
      .then((places) => {
        if (!cancelled) setState({ status: 'ready', places })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', places: [] })
      })

    return () => {
      cancelled = true
    }
  }, [center, radiusM])

  return state
}
