import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

const STYLES = {
  streets: 'mapbox://styles/mapbox/light-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
}

const NSW_CENTER = [147.0, -32.5]

const PARCEL_SRC = 'site-parcel'
const PARCEL_FILL = 'site-parcel-fill'
const PARCEL_LINE = 'site-parcel-line'

export default function MapView({ styleKey, onMapReady, onParcelClick, flyTarget, parcelData, marker, picking }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const clickRef = useRef(onParcelClick)
  clickRef.current = onParcelClick

  // Init once
  useEffect(() => {
    if (!TOKEN || !containerRef.current || mapRef.current) return
    mapboxgl.accessToken = TOKEN

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: STYLES[styleKey] || STYLES.streets,
      center: NSW_CENTER,
      zoom: 5.2,
      preserveDrawingBuffer: true, // required for PDF snapshot
      attributionControl: true,
    })

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true, showCompass: true }), 'bottom-right')
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left')

    function addParcelLayers() {
      if (map.getSource(PARCEL_SRC)) return
      map.addSource(PARCEL_SRC, { type: 'geojson', data: emptyFC() })
      map.addLayer({
        id: PARCEL_FILL, type: 'fill', source: PARCEL_SRC,
        paint: { 'fill-color': '#fc4c02', 'fill-opacity': 0.18 },
      })
      map.addLayer({
        id: PARCEL_LINE, type: 'line', source: PARCEL_SRC,
        paint: { 'line-color': '#fc4c02', 'line-width': 2 },
      })
    }

    map.on('load', () => {
      addParcelLayers()
      onMapReady && onMapReady(map)
    })
    // Re-add custom layers after a basemap style switch.
    map.on('style.load', addParcelLayers)

    map.on('click', (e) => {
      clickRef.current && clickRef.current([e.lngLat.lng, e.lngLat.lat])
    })

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Style toggle
  useEffect(() => {
    const map = mapRef.current
    if (map) map.setStyle(STYLES[styleKey] || STYLES.streets)
  }, [styleKey])

  // Cursor feedback for parcel-pick mode
  useEffect(() => {
    const map = mapRef.current
    if (map) map.getCanvas().style.cursor = picking ? 'crosshair' : ''
  }, [picking])

  // Push parcel highlight geometry
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const src = map.getSource(PARCEL_SRC)
    if (src) src.setData(parcelData || emptyFC())
  }, [parcelData])

  // Confirmed-site marker
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (markerRef.current) { markerRef.current.remove(); markerRef.current = null }
    if (marker) {
      const el = document.createElement('div')
      el.className = 'site-marker'
      markerRef.current = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(marker)
        .addTo(map)
    }
  }, [marker])

  // Fly to a search/confirm target
  useEffect(() => {
    const map = mapRef.current
    if (map && flyTarget?.lngLat) {
      map.flyTo({ center: flyTarget.lngLat, zoom: flyTarget.zoom || 17, essential: true })
    }
  }, [flyTarget])

  if (!TOKEN) {
    return (
      <div className="map-fallback">
        <div className="card">
          <div className="eyebrow" style={{ color: 'var(--accent-mint)' }}>Map not configured</div>
          <h3 style={{ fontWeight: 500, margin: '12px 0 8px' }}>Add your Mapbox token</h3>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: '#cfcfe0', margin: 0 }}>
            Copy <code>.env.example</code> to <code>.env</code> and set{' '}
            <code>VITE_MAPBOX_TOKEN</code>, then restart the dev server. The rest of the
            interface works without it.
          </p>
        </div>
      </div>
    )
  }

  return <div ref={containerRef} className="map-canvas" />
}

function emptyFC() {
  return { type: 'FeatureCollection', features: [] }
}
