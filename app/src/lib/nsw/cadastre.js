// Cadastral parcel lookup — NSW Land Parcel & Property (Lot layer).
import { arcgis, pointGeom } from './client.js'
import { LAYERS } from './endpoints.js'
import { esriRingsToGeoJson } from '../geo.js'

/** Lot polygon outlines within a map viewport — for the "show every parcel
 *  boundary" overlay. Geometry only, no attribute lookups, so it stays fast
 *  even with many parcels in view. Only called at high zoom (small bbox). */
export async function lotsInBounds([west, south, east, north], { limit = 500 } = {}) {
  const data = await arcgis(`${LAYERS.lot}/query`, {
    geometry: JSON.stringify({
      xmin: west, ymin: south, xmax: east, ymax: north,
      spatialReference: { wkid: 4326 },
    }),
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    outSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'lotidstring',
    returnGeometry: 'true',
    resultRecordCount: String(limit),
  }, { label: 'cadastre', timeout: 8000 })

  const feats = data.features || []
  return {
    type: 'FeatureCollection',
    features: feats
      .map((f) => ({ type: 'Feature', geometry: esriRingsToGeoJson(f.geometry), properties: {} }))
      .filter((f) => f.geometry),
  }
}

/** Identify the Lot polygon containing a clicked [lng, lat]. */
export async function lotAtPoint(lngLat) {
  const data = await arcgis(`${LAYERS.lot}/query`, {
    geometry: pointGeom(lngLat),
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    outSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'lotidstring,planlabel,lotnumber,sectionnumber,planlotarea,shape_Area',
    returnGeometry: 'true',
  }, { label: 'cadastre' })

  const f = data.features?.[0]
  if (!f) return null
  const a = f.attributes
  return {
    id: a.lotidstring || `${a.lotnumber}//${a.planlabel}`,
    lotIdString: a.lotidstring,
    planLabel: a.planlabel,
    lotNumber: a.lotnumber,
    // planlotarea (legal area) is often null; shape_Area (m²) is always present.
    areaM2: a.planlotarea || a.shape_Area || null,
    legalArea: a.planlotarea || null,
    geometry: esriRingsToGeoJson(f.geometry),
  }
}
