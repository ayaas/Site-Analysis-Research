// Shared ArcGIS REST client. All NSW services are public, keyless, CORS-enabled
// (verified 2026-06-21). We only ever read — query/identify, never write.

export class ServiceError extends Error {
  constructor(message, { layer, cause } = {}) {
    super(message)
    this.name = 'ServiceError'
    this.layer = layer
    this.cause = cause
  }
}

const DEFAULT_TIMEOUT = 12000

async function arcgisOnce(url, params, timeout, label) {
  const qs = new URLSearchParams({ f: 'json', ...params }).toString()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(`${url}?${qs}`, { signal: controller.signal })
    if (!res.ok) throw new ServiceError(`HTTP ${res.status}`, { layer: label })
    const data = await res.json()
    if (data.error) throw new ServiceError(data.error.message || 'Service error', { layer: label })
    return data
  } catch (err) {
    if (err.name === 'AbortError') throw new ServiceError('Service timed out', { layer: label, cause: err })
    if (err instanceof ServiceError) throw err
    throw new ServiceError(err.message || 'Network error', { layer: label, cause: err })
  } finally {
    clearTimeout(timer)
  }
}

/**
 * GET an ArcGIS endpoint with params, JSON out, timeout + error normalisation.
 * Retries once on timeout or transient network errors — the NSW ArcGIS services
 * have highly variable latency and most slow calls recover on a second attempt.
 */
export async function arcgis(url, params = {}, { timeout = DEFAULT_TIMEOUT, label, retries = 1 } = {}) {
  let lastErr
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 800))
    try {
      return await arcgisOnce(url, params, timeout, label)
    } catch (err) {
      lastErr = err
      // Only retry on timeout or network errors — a real service error (404,
      // auth, bad query) won't fix itself on retry.
      const retryable = err.message?.includes('timed out') || err.message?.includes('Network error') || err.message?.includes('fetch')
      if (!retryable) throw err
    }
  }
  throw lastErr
}

/** Esri point-geometry JSON for a [lng, lat] in WGS84. */
export function pointGeom([lng, lat]) {
  return JSON.stringify({ x: lng, y: lat, spatialReference: { wkid: 4326 } })
}

/** Esri envelope around a [lng, lat] with a half-size in degrees. */
export function envelopeGeom([lng, lat], half = 0.0009) {
  return JSON.stringify({
    xmin: lng - half, ymin: lat - half, xmax: lng + half, ymax: lat + half,
    spatialReference: { wkid: 4326 },
  })
}

/** Run a spatial point-intersects query against a MapServer layer. */
export function queryAtPoint(layerUrl, lngLat, { outFields = '*', returnGeometry = false, label } = {}) {
  return arcgis(`${layerUrl}/query`, {
    geometry: pointGeom(lngLat),
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    outSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields,
    returnGeometry: String(returnGeometry),
  }, { label })
}
