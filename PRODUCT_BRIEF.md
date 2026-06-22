# Product Brief — "Country" Site Research App

**A respectful site + Country research tool for architecture and design students (NSW).**

**Status:** Draft v2.0 (for build in Claude Code)
**Date:** 21 June 2026
**Owner:** ayaa
**Stack:** Vite + React (static SPA) · Mapbox GL JS basemap · public NSW ArcGIS REST services (read-only, client-side) · client-side PDF · **no backend, no database, no AI**
**Scope of v1:** **NSW only** · architecture/design students · fully static front-end · facts from official NSW services · cultural context from curated references + outbound links (never generated)

---

## 1. One-line summary

A static map-plus-panel web app that lets a student find a site in NSW, confirm its extent on a cadastral parcel, and pull together honest, properly-attributed facts (address, LGA, planning controls) alongside curated Country context and links — then export it as a formatted PDF for studio work. No information is generated or invented; the app surfaces official data and points to authoritative sources.

## 2. Why this exists

Architecture students are increasingly expected to engage with Connection to Country as part of site analysis (e.g. the NSW *Connecting with Country* framework). Today that means hopping between AIATSIS, land council maps, the planning portal and ad-hoc searches, with no easy way to assemble a tidy, properly-attributed brief — and a real risk of treating rough cultural maps as precise fact. This tool collapses the workflow into one screen while building the right cultural safeguards in by design.

This is a **research aid, not an authority**. It helps students find and organise publicly available information and points them toward proper engagement. It does not speak for, or on behalf of, Traditional Custodians, and it does not generate cultural content.

## 3. Non-negotiable principles (these govern every design decision)

These are not aspirational — each one maps to a concrete product rule below.

| Principle | How the product enforces it |
|---|---|
| Do not invent cultural information | The app has **no generative/AI layer at all**. Cultural content is either an official data field (from a NSW service) or **curated, human-prepared reference text + outbound links** bundled with the app. If nothing is curated for a region, the field shows "No verified source — see links" rather than a guess. |
| Don't present regional boundaries as precise ownership | Country/language information is shown as **outbound links and indicative descriptions only** — never traced, snapped to the parcel, or drawn as a hard boundary. A persistent caption reads: *"Indigenous boundaries are approximate and contested — not ownership lines."* |
| Don't replace local engagement | Every report and the cultural panel carry a fixed banner pointing to the relevant Local Aboriginal Land Council and consultation guidance, plus a "Next steps: who to contact" section in the export. |
| No generic decorative Indigenous imagery | Zero stock motifs anywhere. Visual language is restrained, typographic, map-led. Any imagery must be specifically attributed to its source. |
| Make uncertainty visible | Every field shows a **provenance chip**: `Official (NSW)` / `Curated reference` / `Link only` / `Not available`. Anything that isn't an official data field is visibly marked as a pointer, not a fact. |
| Design for respectful research, not extraction | Read-only queries to public services only. No scraping behind logins, no bulk download of cultural datasets, no harvesting. The tool surfaces and links — it doesn't extract. |

> Design rule of thumb: **when in doubt, show the uncertainty and link to the source rather than smoothing it over.**

## 4. Target user & primary job

**Primary user:** an architecture/design student doing site analysis for a studio project in NSW.

**Job to be done:** *"Give me an honest, well-sourced one-pager about my site — the planning facts and the Country context — that I can cite, learn from, and bring to a tutorial, without me accidentally making something up or being disrespectful."*

**Success looks like:** a student finds their site in under a minute, understands what is an official fact vs. a pointer to follow up, and exports a PDF they're comfortable putting in their analysis with citations.

---

## 5. Core user workflow

1. **Map opens** in 2D over NSW.
2. **Search** by address, suburb, postcode, coordinates, or place name → map flies to the location.
3. **Select a cadastral parcel** by clicking it. Highlighted parcel shows lot/plan + area (from the NSW Land Parcel/Property service).
4. **Confirm site extent** — accept the parcel, select multiple adjoining parcels, or drop an approximate boundary if needed (clearly flagged as approximate).
5. **App reads official fields** for the confirmed extent directly from public NSW services (address, LGA, planning controls) and **looks up curated Country references** for the matching region/LGA.
6. **Right panel populates:** site name & address, LGA, state, then planning facts, then the curated cultural context + links, then environment links.
7. **Export PDF** — a formatted report with a site-plan map snapshot, the panel summary, all source citations/links, and the engagement/next-steps banner.

Each field appears with a "loading…" then resolves to either an official value or "Not available / see links" — never a fabricated value.

---

## 6. Data fields & where each comes from

Two clean categories: **official facts** read live from public NSW ArcGIS REST services, and **curated context** bundled as static reference data + outbound links. Nothing is generated.

### Tier A — Official facts (live, read-only from public NSW services)

All endpoints below are public, keyless ArcGIS REST services queried **directly from the browser** — no backend or proxy needed.

| Field | NSW service (endpoint root) | Service / layer |
|---|---|---|
| Address / geocoding search | `portal.spatial.nsw.gov.au/server/rest/services` | `NSW_Geocoded_Addressing_Theme` |
| Cadastral parcel (lot/plan, area, geometry) | `portal.spatial.nsw.gov.au/server/rest/services` **or** `maps.six.nsw.gov.au/arcgis/rest/services/public` | `NSW_Land_Parcel_Property_Theme` / `NSW_Cadastre` |
| LGA, suburb, state | `portal.spatial.nsw.gov.au/server/rest/services` | `NSW_Administrative_Boundaries_Theme` |
| Aerial / satellite imagery | `portal.spatial.nsw.gov.au/server/rest/services` | `NSW_Imagery_Theme` (optional basemap source) |
| Zoning / principal planning | `mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning` | `Planning_Portal_Principal_Planning` |
| Local provisions, SEPP, development control | same (ePlanning) | `Planning_Portal_Local_Provisions`, `Planning_Portal_SEPP`, `Planning_Portal_Development_Control` |
| Hazard / protection / biodiversity / tree canopy | same (ePlanning) | `Planning_Portal_Hazard`, `Planning_Portal_Protection`, `BiodiversityValuesMap`, `Planning_Portal_Tree_Canopy` |

A parcel lookup is a single `identify`/`query` call against the relevant service using the clicked point or confirmed geometry. These are lightweight, read-only requests — consistent with keeping the app effectively static.

### Tier B — Curated context (static, bundled with the app — no live calls, no generation)

| Field | How it's populated |
|---|---|
| Nation / clan / language / cultural group | A small **curated lookup** (bundled JSON) mapping LGA/region → the relevant authoritative links (AIATSIS map page, Local Aboriginal Land Council, First Languages). Shown as **links + indicative description**, never as a precise boundary. |
| Cultural significance · historical context · seasonal calendar | Curated reference links per region (Welcome to Country, Reconciliation Australia, council/library/heritage resources, BoM Indigenous Weather Knowledge). The panel presents the links and any human-written summary you choose to include — it does not fetch or generate text. |
| Flora / fauna | Outbound links to Atlas of Living Australia and NSW BioNet for the area (optionally a direct read of the public NSW `Flora_Maxent` / `Fauna_MaxentandSOM` layers if you want live species presence). |

**Reference sources to wire in as links:** NSW *Connecting with Country* framework PDF, AIATSIS (map page), Reconciliation Australia, Welcome to Country, First Languages Australia, Aboriginal Land Council of NSW (+ land-council map), NSW Planning Portal, SIX Maps.

> **Key cultural-safety constraint:** the AIATSIS map is explicitly *not* suitable for native title or land claims, its borders are *intentionally blurred*, and it is copyright-protected with no public reuse API. The app must therefore **link to it and describe regions** — never embed, trace, or snap it to the parcel. This is the single most important implementation detail.

---

## 7. Architecture & key decisions (ADRs)

### ADR-1 — Fully static front-end, no backend, no database, no AI

**Context:** You want the app to be essentially static — no stored information, no AI generation, minimal server dependency.

**Decision:** Ship a **client-only Vite + React SPA** as static files (any static host, including Vercel static hosting — no serverless functions). The only network traffic is (a) Mapbox basemap tiles and (b) read-only queries to public NSW ArcGIS REST services. No application backend, no database, no auth, no AI/LLM calls. **"Saving" = exporting the PDF report only** — there is no shareable URL and no stored state (confirmed decision).

| Becomes easier | Becomes harder |
|---|---|
| Trivial to host/deploy; nothing to secure; no running costs | No saved history (acceptable — the PDF export is the only save) |
| No API keys to hide (NSW services are keyless) | Must handle NSW service downtime gracefully in the UI |
| Fast, transparent, auditable — every fact traces to a public service | CORS must be confirmed per NSW endpoint (see ADR-2) |

> Note on "no API requests at all": fetching parcel/planning info for an *arbitrary* site inherently requires a lookup against the NSW services. These are direct, read-only, keyless browser calls — the app stays static (no backend of its own). A truly zero-request build would require pre-bundling all of NSW's cadastre/planning data, which isn't practical. If you'd prefer, we can cache the last lookup in the URL so re-opening a shared link makes no new calls.

### ADR-2 — Data access: direct browser calls to public NSW ArcGIS REST

**Decision:** Query the NSW spatial portal, SIX public cadastre, and ePlanning services directly with `query`/`identify` REST calls (`f=geojson` / `f=json`). Render the selected parcel and any planning overlays as Mapbox vector/GeoJSON layers.

**Watch-outs:** confirm CORS is permitted on each endpoint from the browser (NSW services generally allow it; if any block it, that single layer can be fetched as tiles instead). Coordinate reference system is GDA2020/GDA94 — reproject query geometry as needed. Keep requests to the confirmed extent only.

### ADR-3 — Cultural context = curated static data + links (no generation)

**Decision:** Bundle a human-maintained `cultural-references.json` **covering all NSW LGAs/regions** (confirmed scope — statewide, not a starter subset), keyed by LGA. The app derives the region from the parcel's LGA (Tier A) and renders the matching curated links + any human-written notes. There is no retrieval/summarisation/AI step. Any LGA without specific curated notes falls back to statewide general links plus a "No verified reference yet" marker, so every NSW site resolves to something honest.

**Why:** makes invented cultural content structurally impossible and keeps the app static. Directly satisfies principles 1, 2, 5, 6.

### ADR-4 — Map: Mapbox GL JS

**Decision:** Mapbox GL JS for the 2D basemap with streets + **satellite** toggle, plus the required controls: zoom, pan, rotate, **rotate/bearing reset**, **north reset**, **scale bar**, **north arrow**. NSW parcel/planning data overlays as GeoJSON layers.

**Confirmed:** Mapbox is the basemap for v1 and the API key will be provided by the owner (URL-restricted public token). A keyless MapLibre + `NSW_Imagery_Theme` path remains available later if desired, but is not pursued in v1.

**Critical build note for PDF (see ADR-5):** initialise the map with `preserveDrawingBuffer: true` — must be set at construction, can't be toggled later, or the snapshot is blank.

### ADR-5 — Client-side PDF export

**Decision:** Generate the PDF in the browser. Capture the map via `map.getCanvas().toDataURL()` (PNG), capture HTML overlays (north arrow, scale bar, markers) via `html2canvas` if needed, and compose with `jsPDF` (or `@react-pdf/renderer`): site-plan snapshot + panel summary + citations/links + engagement banner.

**Visual style (confirmed):** the PDF follows the **Together AI design language** (`DESIGN-together.ai.md`) — a simple near-black cover page (`#010120`) carrying the three-stop orange→magenta→periwinkle gradient ribbon as the only decoration, sentence-case headlines in the display sans (Inter substitute), uppercase mono eyebrows/labels (JetBrains Mono substitute) for section titles and field keys, white content pages with hairline rules, 4px radius, no drop shadows, and a single black primary accent. Clear, numbered citations. (This supersedes the earlier warm earth-tone direction — the scaffold's `report.css` will be retuned to match.)

**Must-dos:** Mapbox **attribution must travel into the PDF** (licence requirement); set `preserveDrawingBuffer:true`; wait for `map.once('idle')` before snapshot so tiles are fully loaded.

---

## 8. UI / interaction design

**Design language (confirmed):** the app UI follows the **Together AI design language** (`DESIGN-together.ai.md`) — near-black top band (`#010120`), the three-stop orange→magenta→periwinkle gradient ribbon as the single piece of brand chrome, sentence-case headlines in the display sans (Inter substitute), uppercase mono eyebrows/labels (JetBrains Mono substitute), 4px (`rounded.sm`) card/button radius, hairline borders, and no drop shadows (surface contrast carries elevation). The same system drives the PDF (see ADR-5), so app and report read as one product.

**Layout:** full-bleed map on the left (~60–65%), a scrollable detail panel on the right (~35–40%), and a collapsible **left sidebar** for settings & controls. Clean, flat, typographic — no decorative cultural imagery. Map-led, restrained palette.

**Map controls (all required):** zoom in/out, pan, rotate, **rotate/bearing reset**, **north reset**, **scale bar**, **north arrow**, style toggle (streets ↔ satellite), and a "locate parcel" cursor mode.

**Detail panel structure (top → bottom):**
1. Header: site name & address · LGA · state (Tier A, appears first)
2. Planning facts: lot/plan, area, zoning, key controls (from ePlanning)
3. **Country context** (with persistent soft-boundary + engagement banners): curated links/notes for nation/clan/language, cultural significance, historical context, seasonal calendar
4. Environment: flora/fauna links (ALA / BioNet)
5. Sources & links list + "Export PDF" button

**Uncertainty UI:** each field carries a provenance chip — `Official (NSW)` (solid), `Curated reference` (outline), `Link only` (muted), `Not available` (greyed). This is the visual heartbeat of the product: facts look like facts, pointers look like pointers.

**Polish targets (the "not AI slop" bar):** smooth `flyTo`, skeleton loading states, keyboard-accessible search, responsive panel, considered empty/error states (incl. NSW service downtime), and copy that's plain, humble and precise.

---

## 9. Suggested project structure (Vite + React, static)

```
/src
  /components
    Map/            MapView, controls (NorthArrow, ScaleBar, ResetControls), ParcelLayer, PlanningOverlay
    Panel/          SiteHeader, FactRow, ProvenanceChip, CountrySection, EnvironmentSection, SourcesList
    Sidebar/        Settings, StyleToggle, Legend
    Report/         PdfExportButton, ReportTemplate
  /lib
    nsw/            cadastre.ts, adminBoundaries.ts, geocode.ts, planning.ts  (ArcGIS REST query helpers)
    cultural/       references.ts  (loads cultural-references.json by LGA)
    pdf/            snapshot.ts (canvas→dataURL), buildPdf.ts
    provenance.ts   (field = {value, source, kind})
  /data
    cultural-references.json    (curated, human-maintained, bundled)
  /hooks            useSiteSearch, useParcelSelect, useSiteFacts
  App.tsx  main.tsx
/public
```

**Config:** one public value — the restricted **Mapbox token** (provided by the owner, URL-restricted), stored in a `.env` as `VITE_MAPBOX_TOKEN` and read client-side. No server secrets. NSW services need no key.

---

## 10. Build plan / phased roadmap

**Phase 0 — Static skeleton (build first in Claude Code)**
Vite + React + TS scaffold, Mapbox map (`preserveDrawingBuffer:true`), satellite toggle, all map controls; deploy as static site.

**Phase 1 — Find & confirm a site**
Search via `NSW_Geocoded_Addressing_Theme` → flyTo → click parcel (`NSW_Land_Parcel_Property_Theme` / SIX) → confirm extent → header fields (address/LGA/state) from `NSW_Administrative_Boundaries_Theme`.

**Phase 2 — Planning + curated context panel**
Read ePlanning layers (zoning, provisions, hazards) for the extent with provenance chips; load curated Country references for the LGA; soft-boundary + engagement banners; "Not available / see links" handling.

**Phase 3 — PDF export**
Map snapshot + panel summary + citations/links + next-steps banner, with Mapbox attribution embedded.

**Phase 4 — Polish & cultural-safety review**
Loading/empty/error states (incl. NSW downtime), accessibility, copy review; review against §3. Ideally seek Indigenous review of the framing/wording and the curated references.

**Later (post-v1):** deeper per-LGA cultural references, optional MapLibre + NSW imagery to remove the Mapbox dependency, additional NSW environment layers.

---

## 11. Key risks & mitigations

- **Treating indicative cultural regions as fact** → links + indicative descriptions only, persistent caption, provenance chips, never snap to parcel. (Highest-priority risk.)
- **AIATSIS / source licensing** → link out, don't embed copyrighted maps; respect each source's terms; no harvesting.
- **NSW service availability / CORS** → graceful UI fallbacks per layer; fetch as tiles if a query endpoint blocks CORS; show clear "service unavailable" states.
- **CRS mismatches (GDA2020/94)** → reproject query geometry; test parcel selection across regions.
- **Map blank in PDF** → `preserveDrawingBuffer:true` at init + wait for `idle` before snapshot.
- **Curated data going stale** → keep `cultural-references.json` small, dated, and easy to update; show a "references last reviewed" date.

---

## 12. Confirmed decisions

1. **Country references coverage:** the curated `cultural-references.json` covers **all NSW LGAs/regions** (statewide), with a statewide-general-links fallback for any LGA lacking specific notes.
2. **Saving:** **PDF export only** — no shareable URL, no stored state.
3. **PDF design:** follows the **Together AI design language** (`DESIGN-together.ai.md`) — dark gradient cover, mono-caps labels, display-sans headlines, hairline rules (see ADR-5).

---

### Sources

- [NSW Spatial Services portal — ArcGIS REST](https://portal.spatial.nsw.gov.au/server/rest/services) (verified: includes `NSW_Land_Parcel_Property_Theme`, `NSW_Administrative_Boundaries_Theme`, `NSW_Geocoded_Addressing_Theme`, `NSW_Imagery_Theme`)
- [SIX Maps public cadastre — ArcGIS REST](https://maps.six.nsw.gov.au/arcgis/rest/services/public) · [NSW Cadastre Web Service](https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Cadastre/MapServer)
- [NSW ePlanning spatial services — ArcGIS REST](https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning) (verified: includes `Planning_Portal_Principal_Planning`, `Planning_Portal_Local_Provisions`, `Planning_Portal_SEPP`, `Planning_Portal_Development_Control`, `BiodiversityValuesMap`)
- [AIATSIS Map of Indigenous Australia](https://aiatsis.gov.au/explore/map-indigenous-australia) · [Map copyright/permission](https://aiatsis.gov.au/form/permission/map) · [Map licensing](https://shop.aiatsis.gov.au/pages/map-licensing)
- [NSW Connecting with Country framework (PDF)](https://www.planning.nsw.gov.au/sites/default/files/2023-10/connecting-with-country.pdf) · [Aboriginal Land Council of NSW](https://alc.org.au/) · [First Languages Australia](https://firstlanguages.org.au/) · [Welcome to Country](https://welcometocountry.com/) · [Reconciliation Australia](https://reconciliation.org.au/)
- [Mapbox GL JS pricing](https://docs.mapbox.com/mapbox-gl-js/guides/pricing/) · [Printing Mapbox GL JS to PDF (Element 84)](https://element84.com/software-engineering/how-to-print-a-mapboxgl-js-map-to-a-pdf-in-react/)
