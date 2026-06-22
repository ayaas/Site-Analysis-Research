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

/** GET an ArcGIS endpoint with params, JSON out, timeout + error normalisation. */
export async function arcgis(url, params = {}, { timeout = DEFAULT_TIMEOUT, label } = {}) {
  const qs = new URLSearchParams({ f: 'json', ...params }).toString()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(`${url}?${qs}`, { signal: controller.signal })
    if (!res.ok) throw new ServiceError(`HTTP ${res.status}`, { layer: label })
    const data = await res.json()
    // ArcGIS returns 200 with an { error } body on failure.
    if (data.error) {
      throw new ServiceError(data.error.message || 'Service error', { layer: label })
    }
    return data
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new ServiceError('Service timed out', { layer: label, cause: err })
    }
    if (err instanceof ServiceError) throw err
    throw new ServiceError(err.message || 'Network error', { layer: label, cause: err })
  } finally {
    clearTimeout(timer)
  }
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
