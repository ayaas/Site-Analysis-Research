// General points of interest near a confirmed site (parks, schools, shops,
// landmarks) — pulled from Mapbox's own street-level POI tiles via the
// Tilequery API. This is map navigation/context data, not an official NSW
// register, so it's surfaced as a plain "nearby places" list, never tagged
// official. Deliberately excludes anything Aboriginal-cultural/heritage —
// AHIMS site locations are access-restricted by design (see Country tab),
// so they are never plotted here even approximately.
const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
const TILESET = 'mapbox.mapbox-streets-v8'

// Each place gets its own colour, shared between the panel list and the map
// pins so a reader can match one to the other at a glance.
const PLACE_COLORS = [
  '#fc4c02', '#1d4ed8', '#0f6e56', '#b45309',
  '#9333ea', '#dc2626', '#0891b2', '#65a30d',
]

export function colorForIndex(i) {
  return PLACE_COLORS[i % PLACE_COLORS.length]
}

function titleCase(s) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// Coarse buckets for the Nearby-tab filter — Mapbox's own POI `class` values
// are much finer-grained than this, so a handful of raw classes map onto
// each bucket. Anything unrecognised falls into "Other" rather than being
// dropped, so the count shown always matches what's actually plotted.
export const BUCKETS = ['Food & drink', 'Shopping', 'Arts & entertainment', 'Buildings & landmarks', 'Education', 'Health', 'Other']

const BUCKET_RULES = [
  [/food_and_drink/, 'Food & drink'],
  [/shopping/, 'Shopping'],
  [/arts_and_entertainment/, 'Arts & entertainment'],
  [/landmark|historic|structure|place_like|park_like/, 'Buildings & landmarks'],
  [/education/, 'Education'],
  [/medical/, 'Health'],
]

function bucketFor(rawClass) {
  const c = (rawClass || '').toLowerCase()
  for (const [re, bucket] of BUCKET_RULES) {
    if (re.test(c)) return bucket
  }
  return 'Other'
}

/** Nearby POIs within `radiusM` of [lng, lat]. Returns [{ name, category, bucket, distanceM, center }]. */
export async function poiNear([lng, lat], radiusM = 200, limit = 20) {
  if (!TOKEN) return []

  const url = new URL(`https://api.mapbox.com/v4/${TILESET}/tilequery/${lng},${lat}.json`)
  url.searchParams.set('radius', String(radiusM))
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('layers', 'poi_label')
  url.searchParams.set('access_token', TOKEN)

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Tilequery HTTP ${res.status}`)
  const data = await res.json()

  return (data.features || [])
    .filter((f) => f.properties?.name)
    .map((f) => {
      const rawClass = f.properties.class || f.properties.type
      return {
        name: f.properties.name,
        category: titleCase(rawClass || 'Place'),
        bucket: bucketFor(rawClass),
        distanceM: Math.round(f.properties.tilequery?.distance ?? 0),
        center: f.geometry?.coordinates || null,
      }
    })
    .sort((a, b) => a.distanceM - b.distanceM)
}
