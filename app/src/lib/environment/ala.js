// Atlas of Living Australia — Australia's open biodiversity data aggregator
// (real recorded sightings: museum records, surveys, citizen science). Public,
// keyless, CORS-enabled biocache API. Used to show the ACTUAL names of species
// recorded near a confirmed site, not just a link to "go look it up" — while
// still linking out to ALA/BioNet for the full record set.
const ALA_WS = 'https://biocache-ws.ala.org.au/ws/occurrences/search'
const RADIUS_KM = 3

async function topNames(lngLat, kingdom, limit = 6, signal) {
  const [lng, lat] = lngLat
  const url = new URL(ALA_WS)
  url.searchParams.set('q', `kingdom:${kingdom}`)
  url.searchParams.set('lat', lat)
  url.searchParams.set('lon', lng)
  url.searchParams.set('radius', RADIUS_KM)
  url.searchParams.set('pageSize', '0')
  url.searchParams.set('facet', 'true')
  url.searchParams.set('facets', 'common_name')
  url.searchParams.set('flimit', String(limit * 3)) // over-fetch, then filter junk labels
  url.searchParams.set('fsort', 'count')

  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`ALA HTTP ${res.status}`)
  const data = await res.json()
  const facet = (data.facetResults || []).find((f) => f.fieldName === 'common_name')
  const names = (facet?.fieldResult || [])
    .filter((f) => f.label && f.label !== 'Not supplied')
    .slice(0, limit)
    .map((f) => f.label)
  return { total: data.totalRecords || 0, names }
}

/** Real species names recorded within ~3km of a confirmed point (fauna + flora). */
export async function speciesNear(lngLat, { timeout = 9000 } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const [fauna, flora] = await Promise.all([
      topNames(lngLat, 'Animalia', 6, controller.signal),
      topNames(lngLat, 'Plantae', 6, controller.signal),
    ])
    return { fauna, flora, radiusKm: RADIUS_KM }
  } finally {
    clearTimeout(timer)
  }
}

export function alaExploreUrl(lngLat) {
  const [lng, lat] = lngLat
  return `https://biocache.ala.org.au/occurrences/search?q=*:*&lat=${lat}&lon=${lng}&radius=${RADIUS_KM}`
}
