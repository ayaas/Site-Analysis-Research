import { useEffect, useRef, useState } from 'react'
import { useSiteSearch } from '../hooks/useSiteSearch.js'

// Search box with NSW-restricted autocomplete (Mapbox geocoding → map flyTo).
// This navigates the map only; displayed facts come from NSW services after a
// parcel is confirmed.
export default function SearchBar({ onPick }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const { results, loading, error } = useSiteSearch(q)
  const wrapRef = useRef(null)

  useEffect(() => {
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => {
    setOpen(results.length > 0)
    setActive(-1)
  }, [results])

  function pick(r) {
    if (!r?.center) return
    onPick(r)
    setQ(r.name)
    setOpen(false)
  }

  function onKeyDown(e) {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); pick(results[active] || results[0]) }
    else if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="search-wrap" ref={wrapRef}>
      <div className="search-box">
        <span aria-hidden style={{ color: 'var(--body-muted)' }}>⌕</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search address, suburb, postcode, coordinates…"
          aria-label="Search for a site in NSW"
          aria-expanded={open}
          role="combobox"
          aria-controls="search-results"
          autoComplete="off"
        />
        {loading && <span className="search-spin" aria-hidden />}
      </div>

      {open && (
        <ul className="search-results" id="search-results" role="listbox">
          {results.map((r, i) => (
            <li
              key={`${r.name}-${i}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? 'active' : ''}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => { e.preventDefault(); pick(r) }}
            >
              <span className="r-name">{r.name}</span>
              {r.place && <span className="r-place">{r.place}</span>}
            </li>
          ))}
        </ul>
      )}

      <div className="search-hint">
        {error
          ? 'Search unavailable — try coordinates like -33.87, 151.21'
          : 'NSW only. Pick a result, then click a parcel on the map to confirm your site.'}
      </div>
    </div>
  )
}
