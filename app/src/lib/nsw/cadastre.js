// Cadastral parcel lookup — NSW Land Parcel & Property (Lot layer).
import { arcgis, pointGeom } from './client.js'
import { LAYERS } from './endpoints.js'
import { esriRingsToGeoJson } from '../geo.js'

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
