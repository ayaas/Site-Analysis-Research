// Public NSW ArcGIS REST layer endpoints (read-only, keyless, CORS-enabled).
// Layer IDs + field names verified live 2026-06-21 against each MapServer.

const SPATIAL = 'https://portal.spatial.nsw.gov.au/server/rest/services'
const EPLANNING = 'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning'

export const LAYERS = {
  // NSW_Geocoded_Addressing_Theme → AddressPoint (official address strings)
  addressPoint: `${SPATIAL}/NSW_Geocoded_Addressing_Theme/MapServer/1`,

  // NSW_Land_Parcel_Property_Theme → Lot (cadastral parcels)
  lot: `${SPATIAL}/NSW_Land_Parcel_Property_Theme/MapServer/8`,

  // NSW_Administrative_Boundaries_Theme
  lga: `${SPATIAL}/NSW_Administrative_Boundaries_Theme/MapServer/8`,
  suburb: `${SPATIAL}/NSW_Administrative_Boundaries_Theme/MapServer/2`,
  lalc: `${SPATIAL}/NSW_Administrative_Boundaries_Theme/MapServer/1`, // LocalAboriginalLandCouncil

  // ePlanning Principal Planning (LEP-derived controls)
  zoning: `${EPLANNING}/Planning_Portal_Principal_Planning/MapServer/19`, // Land Zoning Map
  height: `${EPLANNING}/Planning_Portal_Principal_Planning/MapServer/14`, // Height of Buildings
  minLotSize: `${EPLANNING}/Planning_Portal_Principal_Planning/MapServer/22`, // Minimum Lot Size
  fsr: `${EPLANNING}/Planning_Portal_Principal_Planning/MapServer/11`, // Floor Space Ratio
  heritage: `${EPLANNING}/Planning_Portal_Principal_Planning/MapServer/16`, // EPI Heritage
}

// Human-readable source labels for provenance + citations.
export const SOURCES = {
  address: 'NSW Geocoded Addressing (Spatial Services)',
  cadastre: 'NSW Land Parcel & Property (Spatial Services)',
  admin: 'NSW Administrative Boundaries (Spatial Services)',
  planning: 'NSW Planning Portal — ePlanning (Principal Planning)',
}
