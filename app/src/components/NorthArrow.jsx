// Static north arrow overlay + click-to-reset bearing/pitch.
export default function NorthArrow({ onReset }) {
  return (
    <button
      className="north-arrow"
      onClick={onReset}
      title="Reset north"
      aria-label="Reset map to north"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2 L13 11 L10 9 L7 11 Z" fill="#fc4c02" />
        <path d="M10 18 L7 11 L10 13 L13 11 Z" fill="#010120" />
        <text x="10" y="8" textAnchor="middle" fontSize="5" fontFamily="monospace" fill="#010120">N</text>
      </svg>
    </button>
  )
}
