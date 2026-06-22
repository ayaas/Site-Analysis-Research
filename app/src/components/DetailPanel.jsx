import { useState } from 'react'
import SiteCard from './SiteCard.jsx'

const TABS = [
  { key: 'official', label: 'Official' },
  { key: 'country', label: 'Country' },
  { key: 'environment', label: 'Environment' },
]

export default function DetailPanel({ site, collapsed, onToggle, onExport, exporting }) {
  const [tab, setTab] = useState('official')

  return (
    <aside className={`panel ${collapsed ? 'collapsed' : ''}`}>
      <div className="panel-head">
        <button className="collapse-btn" onClick={onToggle} aria-label="Collapse panel" title="Collapse">✕</button>
        <div className="eyebrow">Site brief · NSW</div>
        <h1 className="site-title">{site ? site.name : 'Find a site to begin'}</h1>
        <div className="site-sub">
          {site ? site.address : 'Search, then click a parcel on the map.'}
        </div>

        {site && (
          <div className="panel-tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                className={tab === t.key ? 'active' : ''}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="panel-body">
        {!site ? (
          <EmptyState />
        ) : (
          <>
            <div className="safety-banner">
              <strong>Indigenous boundaries are approximate and contested — not ownership lines.</strong>{' '}
              This tool surfaces public information and links to sources. It does not replace
              local engagement or consultation with Traditional Custodians.
            </div>

            {tab === 'official' && (
              <>
                <Section title="Official facts" fields={site.fields.official} />
                <Section title="Planning controls" fields={site.fields.planning} />
              </>
            )}

            {tab === 'country' && (
              <Section
                title="Country context · references"
                fields={site.fields.country}
                footnote={
                  site.referencesReviewed
                    ? `Curated references last reviewed ${site.referencesReviewed}.`
                    : null
                }
              />
            )}

            {tab === 'environment' && <Section title="Environment" fields={site.fields.environment} />}

            <SourceList citations={site.citations} />

            <button
              className="btn-primary"
              style={{ width: '100%', marginTop: 'var(--s-lg)' }}
              onClick={onExport}
              disabled={exporting || site.status !== 'ready'}
            >
              {exporting ? 'Preparing report…' : 'Export PDF report'}
            </button>
          </>
        )}
      </div>
    </aside>
  )
}

function Section({ title, fields, footnote }) {
  if (!fields || fields.length === 0) return null
  return (
    <section className="panel-section">
      <span className="eyebrow">{title}</span>
      {fields.map((f, i) => (
        <SiteCard key={`${f.label}-${i}`} field={f} />
      ))}
      {footnote && <div className="section-foot">{footnote}</div>}
    </section>
  )
}

function SourceList({ citations }) {
  if (!citations || citations.length === 0) return null
  return (
    <section className="panel-section">
      <span className="eyebrow">Sources &amp; citations</span>
      <ol className="source-list">
        {citations.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ol>
    </section>
  )
}

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="eyebrow" style={{ marginBottom: 'var(--s-md)' }}>No site selected</div>
      <p className="empty-note">
        Search for an address, suburb or postcode — or paste coordinates — to fly the map there.
        Then click a cadastral parcel to confirm your site. The panel will fill with official NSW
        facts and curated Country references, each marked with where it came from.
      </p>
      <ul className="empty-legend">
        <li><span className="chip official">Official</span> live from a public NSW or biodiversity database</li>
        <li><span className="chip curated">Curated ref</span> human-maintained reference</li>
        <li><span className="chip link">Link only</span> a pointer to follow up</li>
        <li><span className="chip na">Not available</span> nothing verified here</li>
      </ul>
    </div>
  )
}
