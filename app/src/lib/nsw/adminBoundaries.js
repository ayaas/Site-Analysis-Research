// Administrative context — LGA, suburb/postcode/state, and the official
// Local Aboriginal Land Council area (an administrative NSW boundary; this is a
// *fact* about which LALC to contact, distinct from the indicative AIATSIS map).
import { queryAtPoint } from './client.js'
import { LAYERS } from './endpoints.js'

const STATE_NAMES = { 1: 'Australian Capital Territory', 2: 'New South Wales' }

const SMALL_WORDS = new Set(['of', 'the', 'and', 'for', 'in', 'on', 'at'])
function titleCase(s) {
  if (!s) return s
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w, i) => (i > 0 && SMALL_WORDS.has(w) ? w : w.replace(/^\w/, (c) => c.toUpperCase())))
    .join(' ')
}

/** Look up LGA + suburb in parallel for a [lng, lat]. */
export async function adminAtPoint(lngLat) {
  const [lgaRes, subRes] = await Promise.allSettled([
    queryAtPoint(LAYERS.lga, lngLat, { outFields: 'lganame,councilname', label: 'lga' }),
    queryAtPoint(LAYERS.suburb, lngLat, { outFields: 'suburbname,postcode,state', label: 'suburb' }),
  ])

  const lga = lgaRes.status === 'fulfilled' ? lgaRes.value.features?.[0]?.attributes : null
  const sub = subRes.status === 'fulfilled' ? subRes.value.features?.[0]?.attributes : null

  return {
    lgaName: lga ? titleCase(lga.lganame) : null,
    councilName: lga ? titleCase(lga.councilname) : null,
    suburb: sub ? titleCase(sub.suburbname) : null,
    postcode: sub?.postcode ? String(sub.postcode) : null,
    state: sub ? STATE_NAMES[sub.state] || 'New South Wales' : 'New South Wales',
    // Raw uppercase LGA name is the join key for cultural-references.json.
    lgaKey: lga?.lganame ? lga.lganame.toUpperCase().trim() : null,
  }
}

/** Look up the official Local Aboriginal Land Council area for a [lng, lat]. */
export async function lalcAtPoint(lngLat) {
  const res = await queryAtPoint(LAYERS.lalc, lngLat, {
    outFields: 'localcouncilname,regionalcouncilname',
    label: 'lalc',
  })
  const a = res.features?.[0]?.attributes
  if (!a) return null
  return {
    localCouncil: titleCase(a.localcouncilname),
    regionalCouncil: titleCase(a.regionalcouncilname),
  }
}
