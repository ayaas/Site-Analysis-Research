# Country — Site Research (NSW)

A respectful site + Country research tool for architecture/design students (NSW).
Static Vite + React SPA: interactive Mapbox map, NSW-restricted search, click-to-
select cadastral parcels, a live detail panel of official facts + curated Country
references, and a one-click PDF brief — all in the Together AI design language.

**No backend, no database, no AI.** Facts come from public NSW ArcGIS REST services
(read-only, keyless). Cultural context is curated references + outbound links only —
nothing about Country is ever generated.

## Run

```bash
cd app
cp .env.example .env        # add your Mapbox public token (VITE_MAPBOX_TOKEN)
npm install
npm run dev                 # http://localhost:5173
```

The panel, search logic and NSW lookups work without a token; only the basemap
tiles and the PDF map snapshot need it (you'll see a prompt in the map area until
it's set). Use a **URL-restricted** public token.

## How it works

1. **Search** (address / suburb / postcode / coordinates) flies the map to a place.
2. **Click a parcel** — the NSW Lot layer returns lot/plan + area and highlights it.
   Toggle **"Add adjoining parcels"** to build a multi-parcel extent; clicking off
   all parcels clears the site. If you click where there's no parcel, the app drops
   an **approximate** point (clearly flagged).
3. The panel fills, each field tagged with provenance —
   `Official (NSW)` · `Curated ref` · `Link only` · `Not available` — never a guess.
4. **Export report** composes an A4 PDF (cover + facts + planning + Country
   references + numbered citations + Mapbox attribution).

## Data sources (all verified live 2026-06-21)

| Data | Service / layer |
|---|---|
| Confirmed address | NSW Geocoded Addressing → `AddressPoint` (nearest, spatial) |
| Lot / plan / area | NSW Land Parcel & Property → `Lot` (`shape_Area` m²) |
| LGA · suburb · state | NSW Administrative Boundaries → `LocalGovernmentArea`, `Suburb` |
| Local Aboriginal Land Council | NSW Administrative Boundaries → `LocalAboriginalLandCouncil` *(official boundary — who to contact)* |
| Zoning · height · FSR · min lot · heritage | NSW Planning Portal (ePlanning) → Principal Planning layers |

All are keyless, CORS-enabled, queried in WGS84 (`inSR/outSR=4326`), so no
client-side reprojection is needed.

### Note on search geocoding (design decision)

The NSW address **text** service is unindexed — a `LIKE` lookup takes 20–50 s, far
too slow for interactive search. So the **search box uses the Mapbox Geocoding API**
(NSW-restricted) purely to *navigate* the map. This is navigation, not a displayed
fact: the authoritative address shown in the panel is still the nearest **NSW**
AddressPoint at the confirmed parcel (a fast ~150 ms spatial query). Every displayed
fact therefore still traces to an official NSW service.

## Cultural references

`src/data/cultural-references.json` is mostly a **links-only** scaffold: statewide
entries are factual outbound pointers (AIATSIS, Aboriginal Land Council of NSW,
Connecting with Country, First Languages, Welcome to Country, BoM Indigenous Weather
Knowledge, ALA / BioNet). Per-LGA `notes` are intentionally **empty** by default —
they must be written and verified by a person (ideally with Indigenous review),
never generated. Any LGA without verified notes falls back to the statewide links
plus a "No verified reference yet" marker. The AIATSIS map is linked and described
only — never embedded, traced, or snapped to the parcel.

**Named nation/clan entries (`byLga[LGA].nation`):** for **103 of NSW's 128 LGAs**
the panel shows the actual named Nation/clan — e.g. "Gadigal people of the Eora
Nation" — quoted or drafted from that **council's own published Acknowledgement of
Country**, with a direct citation link. This is not generated and not a boundary;
it's the same self-identification the council itself publishes. Each entry carries
a `reviewed` date once a person confirms it; until then the panel/PDF visibly label
it "(drafted — pending review)" — see `src/lib/cultural/references.js`. **All 103
entries were reviewed and confirmed by the project owner on 2026-06-22** (see
`meta.reviewed` and each entry's `reviewed` field in the JSON); the brief still
recommends seeking Indigenous review of the framing and references before any
public/student-facing use.

The remaining 25 LGAs were **deliberately left uncovered** rather than guessed —
each falls back honestly to the statewide links + "No verified reference yet."
Reasons, all recorded in `sourcedBy`/`notes` per entry where applicable:
- **Live, documented disputes** — don't pick a side: Central Coast (Darkinjung vs.
  Guringai/Awabakal/Darkinoong), Balranald (Nari Nari vs. Muthi Muthi), Shoalhaven
  (Jerrinja contesting "Yuin Country"), Blacktown (council ceased recognising the
  Dharug people in 2012 — current status unclear), Ku-ring-gai ("Guringai" is a term
  coined by a non-Aboriginal ethnographer in 1892, not authentic to the area).
- **No primary council citation found**: Armidale Regional, Berrigan, Bogan,
  Cabonne, Cobar, Coolamon, Edward River, Federation, Goulburn Mulwaree, Greater
  Hume Shire, Inverell, Kyogle, Mid-Western Regional, Murrumbidgee, Oberon, Warren,
  Warrumbungle, Wentworth.
- **Large amalgamated LGA with no single unified statement**: Queanbeyan-Palerang
  Regional, Upper Lachlan Shire.

There is still no API for this: AIATSIS's map is intentionally non-precise and not
reusable, so closing the remaining gap means repeating the same research-and-cite
process per council (worth periodically re-checking, since several councils' own
wording is still evolving).

**Flora & fauna (`src/lib/environment/ala.js`):** rather than a links-only pointer,
the Environment section shows real, current, named species recorded within 3 km of
the confirmed point — common names + record count, via the **Atlas of Living
Australia** public biocache API (keyless, CORS-enabled). This is a live point query,
not LGA-keyed data, so it's **already complete for all of NSW** — verified with
spot-checks at Broken Hill, Tweed Heads, Bega, Bourke and Wagga Wagga, all returning
real local species. NSW's own `Flora_Maxent` / `Fauna_MaxentandSOM` layers were
evaluated but are raster habitat-likelihood models covering only ~25 fauna / 17
flora species from a dated regional study — not suitable for "what's actually
here." ALA's records are tagged `Official` (the chip label dropped the "(NSW)"
suffix, since this source is national, not NSW-specific — see
`src/components/ProvenanceChip.jsx`).

## Project map

```
src/
  components/   MapView, SearchBar, NorthArrow, DetailPanel, SiteCard,
                ProvenanceChip, ReportLayout
  hooks/        useSiteSearch (Mapbox autocomplete), useSiteFacts (NSW orchestration)
  lib/
    nsw/        client, endpoints, cadastre, adminBoundaries, address, planning
    cultural/   references.js  (loads cultural-references.json by LGA)
    geo.js      esri→GeoJSON, bbox, area formatting
    provenance.js  field model + provenance kinds
    geocodeSearch.js  Mapbox geocoding (search/navigation only)
    exportPdf.js   map snapshot + idle wait + html2canvas/jsPDF
  data/         cultural-references.json
  styles/       tokens.css (Together AI), app.css, report.css
```

## Build status

Phases 0–3 implemented and verified against live NSW services; Phase 4 polish
(loading skeletons, empty/error states, keyboard-accessible search, graceful service
fallbacks, embedded Mapbox attribution) in place. Remaining: optional freehand
boundary draw, deeper per-LGA curated notes (human-authored), and an Indigenous
review of framing + references before any public use.
