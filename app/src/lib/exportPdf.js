import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

// Capture each .report-page element and place it on its own A4 page.
export async function exportReportPdf(reportRoot, filename = 'country-site-brief.pdf') {
  if (!reportRoot) return
  const pages = Array.from(reportRoot.querySelectorAll('[data-page]'))
  if (pages.length === 0) return

  const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true })
  const pw = pdf.internal.pageSize.getWidth()
  const ph = pdf.internal.pageSize.getHeight()

  // Web fonts must be fully loaded before the canvas snapshot, or html2canvas
  // falls back to a system font mid-render and the metrics it then computes
  // for our (negative) letter-spacing values overlap glyphs.
  if (document.fonts?.ready) await document.fonts.ready

  for (let i = 0; i < pages.length; i++) {
    const canvas = await html2canvas(pages[i], {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      // html2canvas measures negative letter-spacing incorrectly and renders
      // glyphs squashed together — strip it in the cloned DOM used for the
      // snapshot only; the live report/app styling is untouched.
      onclone: (doc) => {
        doc.querySelectorAll('*').forEach((el) => {
          el.style.letterSpacing = 'normal'
        })
      },
    })
    const img = canvas.toDataURL('image/jpeg', 0.92)
    // Fit width, preserve aspect ratio.
    const ratio = canvas.height / canvas.width
    const h = pw * ratio
    if (i > 0) pdf.addPage()
    pdf.addImage(img, 'JPEG', 0, 0, pw, Math.min(h, ph))
  }

  pdf.save(filename)
}

// Snapshot the Mapbox canvas to a data URL for the report cover.
export function snapshotMap(map) {
  if (!map) return null
  try {
    return map.getCanvas().toDataURL('image/png')
  } catch (e) {
    console.warn('Map snapshot failed:', e)
    return null
  }
}

// Resolve once the map has finished loading tiles — required before snapshot,
// or the captured canvas can be blank / half-rendered.
export function waitForIdle(map, timeout = 4000) {
  if (!map) return Promise.resolve()
  return new Promise((resolve) => {
    if (map.loaded() && map.areTilesLoaded()) return resolve()
    const done = () => { map.off('idle', done); clearTimeout(t); resolve() }
    const t = setTimeout(done, timeout)
    map.on('idle', done)
  })
}
