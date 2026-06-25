import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

// Breathing room kept between the last line of content and the footer rule.
// Content whose box-bottom would cross (footer.top - this) is pushed to the
// next page, so nothing ever touches the footer or the page number.
const FOOTER_GAP = 10

const HTML2CANVAS_OPTS = {
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
}

async function snapshot(el) {
  return html2canvas(el, HTML2CANVAS_OPTS)
}

function drawFullPage(pdf, canvas, pw, ph, isFirst) {
  if (!isFirst) pdf.addPage()
  const img = canvas.toDataURL('image/jpeg', 0.92)
  pdf.addImage(img, 'JPEG', 0, 0, pw, ph)
}

// Build fully-paginated content pages by measuring REAL layout, never by
// summing element heights (that silently drops margins — the old bug that let
// content creep into the footer). Each candidate element is placed into an
// actual fixed-size page box and checked against the live position of that
// page's footer: if its box-bottom would cross `footer.top - FOOTER_GAP`, it
// is moved to a fresh page. A heading is never left stranded without its first
// content block, and any single block too tall for one page is split by its
// own children so it flows on instead of clipping.
//
// `.report-page-fixed` is `height:1123px; overflow:hidden`. overflow:hidden
// clips paint but NOT layout, so getBoundingClientRect() keeps reporting true
// positions even for content past the fold — which is exactly what we measure.
function buildContentPageChunks(content, pageNumberStart) {
  const parent = content.parentNode
  const pages = []
  let pageIndex = 0
  let page, foot

  const newPage = () => {
    page = document.createElement('section')
    page.className = 'report-page report-page-fixed'
    page.style.visibility = 'hidden' // measured, not painted; never captured
    foot = document.createElement('div')
    foot.className = 'report-foot'
    foot.innerHTML = `<span>Site Research</span><span>Page ${pageNumberStart + pageIndex}</span>`
    page.appendChild(foot)
    parent.appendChild(page)
  }

  // The hard ceiling for content on the current page: the top of the footer
  // rule, minus a small gap. Footer is absolutely positioned, so this stays
  // constant regardless of how much content is added.
  const limitY = () => foot.getBoundingClientRect().top - FOOTER_GAP
  const contentNodes = () => Array.from(page.children).filter((c) => c !== foot)
  const overflows = () => {
    const els = contentNodes()
    const last = els[els.length - 1]
    return !!last && last.getBoundingClientRect().bottom > limitY()
  }

  const commit = () => {
    parent.removeChild(page)
    if (contentNodes().length > 0) {
      page.style.visibility = ''
      pages.push(page)
      pageIndex++
    }
  }
  const startNew = () => { commit(); newPage() }

  // Place `node` (a clone) on the current page, breaking or splitting as needed.
  const add = (node) => {
    page.insertBefore(node, foot)
    if (!overflows()) return

    const before = contentNodes().filter((c) => c !== node)
    const headingLed = before.length === 1 && before[0].tagName === 'H2'

    // Alone on the page (or only preceded by its own heading) and still too
    // tall → split by children so the remainder continues on later pages.
    if (before.length === 0 || headingLed) {
      page.removeChild(node)
      const kids = Array.from(node.children)
      if (kids.length === 0) {
        // Atomic block with no children to split — accept it on its own page
        // (overflow:hidden clips the rare giant; nothing reaches the footer).
        page.insertBefore(node, foot)
        return
      }
      let shell = node.cloneNode(false)
      page.insertBefore(shell, foot)
      for (const kid of kids) {
        shell.appendChild(kid)
        if (overflows() && shell.children.length > 1) {
          shell.removeChild(kid)
          startNew()
          shell = node.cloneNode(false)
          page.insertBefore(shell, foot)
          shell.appendChild(kid)
          if (overflows()) {
            // A single child taller than a whole page — recurse into it.
            shell.removeChild(kid)
            if (shell.children.length === 0) page.removeChild(shell)
            add(kid)
            shell = node.cloneNode(false)
            page.insertBefore(shell, foot)
          }
        }
      }
      if (shell.children.length === 0) page.removeChild(shell)
      return
    }

    // Doesn't fit the remaining space → move it down. Carry a lone leading
    // heading with it so a subheading never sits alone at a page bottom.
    page.removeChild(node)
    const els = contentNodes()
    const prev = els[els.length - 1]
    let carry = null
    if (node.tagName !== 'H2' && prev && prev.tagName === 'H2') {
      carry = prev
      page.removeChild(prev)
    }
    startNew()
    if (carry) page.insertBefore(carry, foot)
    add(node)
  }

  newPage()
  Array.from(content.children).forEach((el) => add(el.cloneNode(true)))
  commit()

  return pages
}

// Final safety net: re-measure every assembled page and assert no content
// crosses into the footer zone. The paginator already guarantees this, so a
// hit here means a layout assumption broke — log it loudly rather than ship a
// silently clipped PDF.
function validateNoFooterOverlap(pages, parent) {
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]
    const foot = page.querySelector('.report-foot')
    parent.appendChild(page)
    page.style.visibility = 'hidden'
    const limit = foot.getBoundingClientRect().top - 1
    const overlap = Array.from(page.children).some(
      (c) => c !== foot && c.getBoundingClientRect().bottom > limit
    )
    page.style.visibility = ''
    parent.removeChild(page)
    if (overlap) {
      console.error(`[exportPdf] content overlaps footer on page ${i + 1} — check report layout`)
    }
  }
}

// Capture the cover (always exactly one page) plus the content section,
// auto-paginated across as many pages as the data needs.
export async function exportReportPdf(reportRoot, filename = 'country-site-brief.pdf') {
  if (!reportRoot) return
  const cover = reportRoot.querySelector('[data-page="cover"]')
  const content = reportRoot.querySelector('[data-page="content"]')
  if (!cover && !content) return

  const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true })
  const pw = pdf.internal.pageSize.getWidth()
  const ph = pdf.internal.pageSize.getHeight()

  // Web fonts must be fully loaded before the canvas snapshot, or html2canvas
  // falls back to a system font mid-render and the metrics it then computes
  // for our (negative) letter-spacing values overlap glyphs.
  if (document.fonts?.ready) await document.fonts.ready

  let isFirst = true

  if (cover) {
    const canvas = await snapshot(cover)
    drawFullPage(pdf, canvas, pw, ph, isFirst)
    isFirst = false
  }

  if (content) {
    const chunkPages = buildContentPageChunks(content, isFirst ? 1 : 2)
    validateNoFooterOverlap(chunkPages, content.parentNode)
    for (const page of chunkPages) {
      content.parentNode.appendChild(page) // same offscreen context as the report root
      const canvas = await snapshot(page)
      page.remove()
      drawFullPage(pdf, canvas, pw, ph, isFirst)
      isFirst = false
    }
  }

  pdf.save(filename)
}
