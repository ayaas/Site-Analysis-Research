// Official confirmed address — the nearest NSW AddressPoint to a clicked point.
// We use a fast spatial envelope query (~100 ms) rather than the text-search
// LIKE query (20–50 s, unindexed), and pick the closest point to the click.
import { arcgis, envelopeGeom } from './client.js'
import { LAYERS } from './endpoints.js'

function titleCaseAddress(s) {
  if (!s) return s
  // Keep unit separators; title-case words, leave pure numbers alone.
  return s.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase())
}

async function queryNearestAddress(lngLat, half, timeout) {
  const data = await arcgis(`${LAYERS.addressPoint}/query`, {
    geometry: envelopeGeom(lngLat, half),
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    outSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'address',
    returnGeometry: 'true',
    resultRecordCount: '30',
  }, { label: 'address', timeout })

  const feats = data.features || []
  if (feats.length === 0) return null

  const [lng, lat] = lngLat
  let best = null
  let bestD = Infinity
  for (const f of feats) {
    const g = f.geometry
    if (!g) continue
    const d = (g.x - lng) ** 2 + (g.y - lat) ** 2
    if (d < bestD) {
      bestD = d
      best = f.attributes.address
    }
  }
  return best ? titleCaseAddress(best) : null
}

/** Nearest official address string to [lng, lat], or null if none within range.
 *  This specific NSW layer has very inconsistent latency for the identical
 *  query — observed 60 ms, 1 s, and 60 s on consecutive calls to the same point.
 *  Two short attempts beat one long one: most slow calls are transient, so a
 *  fast retry usually lands well under the cost of a single 8s+ timeout. */
export async function nearestAddress(lngLat, { half = 0.0009 } = {}) {
  for (const timeout of [4000, 6000]) {
    try {
      const result = await queryNearestAddress(lngLat, half, timeout)
      if (result) return result
      return null // genuinely no address point nearby — don't retry a real miss
    } catch {
      // timeout or transient error — fall through to the next attempt
    }
  }
  return null
}
