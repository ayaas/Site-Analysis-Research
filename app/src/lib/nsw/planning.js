// Planning controls — NSW Planning Portal (ePlanning) Principal Planning layers.
// Each is an LEP-derived control read at the confirmed point. Empty result =
// genuinely no mapped control there (shown as "Not available"), never a guess.
import { queryAtPoint } from './client.js'
import { LAYERS } from './endpoints.js'

const attrsAt = async (layer, lngLat, label) => {
  const res = await queryAtPoint(layer, lngLat, { outFields: '*', label })
  return res.features?.[0]?.attributes || null
}

/** Read zoning, height, min lot size, FSR and heritage for a [lng, lat]. */
export async function planningAtPoint(lngLat) {
  const [zoning, height, minLot, fsr, heritage] = await Promise.allSettled([
    attrsAt(LAYERS.zoning, lngLat, 'zoning'),
    attrsAt(LAYERS.height, lngLat, 'height'),
    attrsAt(LAYERS.minLotSize, lngLat, 'minLotSize'),
    attrsAt(LAYERS.fsr, lngLat, 'fsr'),
    attrsAt(LAYERS.heritage, lngLat, 'heritage'),
  ])
  const val = (r) => (r.status === 'fulfilled' ? r.value : null)
  const z = val(zoning), h = val(height), m = val(minLot), f = val(fsr), he = val(heritage)

  // The LEP name is the single best citation for these controls.
  const epi = z?.EPI_NAME || h?.EPI_NAME || f?.EPI_NAME || m?.EPI_NAME || null

  return {
    epi,
    zoning: z ? { label: z.SYM_CODE, class: z.LAY_CLASS } : null,
    height: h?.MAX_B_H != null ? { value: h.MAX_B_H, units: h.UNITS || 'm' } : null,
    minLotSize: m?.LOT_SIZE != null ? { value: m.LOT_SIZE, units: m.UNITS || 'm²' } : null,
    fsr: f?.FSR != null ? { value: f.FSR, label: f.LABEL } : null,
    heritage: he ? { name: he.H_NAME, class: he.LAY_CLASS, significance: he.SIG } : null,
    // Mark which layers actually answered, so the UI can tell "no control" from "service down".
    _errors: {
      zoning: zoning.status === 'rejected',
      height: height.status === 'rejected',
      minLotSize: minLot.status === 'rejected',
      fsr: fsr.status === 'rejected',
      heritage: heritage.status === 'rejected',
    },
  }
}
