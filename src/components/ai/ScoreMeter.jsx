import { memo } from 'react'

/**
 * ScoreMeter
 * Circular gauge visualising a 0-100 score with an animated sweep and a
 * colour that reflects how good/bad the score is.
 *
 * @param {number} score - 0 to 100
 * @param {number} [sizePx=104] - width/height of the SVG in pixels
 */
function ScoreMeter({ score = 0, sizePx = 104 }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped / 100)

  const color =
    clamped >= 70 ? '#22c55e' : // green
    clamped >= 40 ? '#eab308' : // yellow
    '#ef4444'                   // red

  const label =
    clamped >= 70 ? 'Great' :
    clamped >= 40 ? 'Mixed' :
    'Needs attention'

  return (
    <div className="flex flex-col items-center" style={{ width: sizePx }}>
      <svg
        width={sizePx}
        height={sizePx}
        viewBox="0 0 100 100"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        aria-label={`Overall satisfaction score: ${clamped} out of 100`}
      >
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          strokeWidth="8"
          className="stroke-gray-100 dark:stroke-gray-800"
        />
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.3s ease' }}
        />
        <text
          x="50" y="47"
          textAnchor="middle"
          className="fill-gray-900 dark:fill-gray-100"
          style={{ fontSize: '22px', fontWeight: 700 }}
        >
          {clamped}
        </text>
        <text
          x="50" y="63"
          textAnchor="middle"
          className="fill-gray-400 dark:fill-gray-500"
          style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.02em' }}
        >
          / 100
        </text>
      </svg>
      <span className="mt-1 text-xs font-medium" style={{ color }}>{label}</span>
    </div>
  )
}

export default memo(ScoreMeter)
