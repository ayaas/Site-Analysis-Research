// 'official' covers any live, authoritative public database (NSW spatial
// services, ePlanning, or the Atlas of Living Australia for species records)
// — the per-field "Source:" line under each value says exactly which one.
const LABELS = {
  official: 'Official',
  curated: 'Curated ref',
  link: 'Link only',
  na: 'Not available',
  loading: '…',
}

export default function ProvenanceChip({ kind = 'na' }) {
  return <span className={`chip ${kind}`}>{LABELS[kind] || LABELS.na}</span>
}
