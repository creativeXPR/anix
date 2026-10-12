import { collection, getCountFromServer, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import Spinner from '../../shared/components/Spinner.jsx'
import { db } from '../../shared/firebase.js'
import { dayKey } from '../../shared/visits.js'

// Daily unique visitors (browsers) over a chosen period, compared with
// the period before it. Data comes from visits/{day}_{visitorId} (see
// shared/visits.js) — one count query per day.
const RANGES = [7, 30, 90]
const STEADY = 0.05 // within ±5% of the previous period counts as steady
const counts = new Map() // day → count, cached while /admin stays open

function lastDays(n, endOffset = 0) {
  const days = []
  for (let i = n - 1 + endOffset; i >= endOffset; i--) {
    days.push(dayKey(new Date(Date.now() - i * 86400000)))
  }
  return days
}

async function countDay(day) {
  // today is still growing — don't cache it
  if (counts.has(day) && day !== dayKey()) return counts.get(day)
  const snap = await getCountFromServer(query(collection(db, 'visits'), where('day', '==', day)))
  const n = snap.data().count
  counts.set(day, n)
  return n
}

function shortDate(day) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export default function VisitorsChart() {
  const [range, setRange] = useState(30)
  const [data, setData] = useState(null) // { range, current: [{day, n}], previous: number[] }
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const current = lastDays(range)
    const previous = lastDays(range, range)
    Promise.all([Promise.all(current.map(countDay)), Promise.all(previous.map(countDay))])
      .then(([cur, prev]) => {
        if (!cancelled) setData({ range, current: current.map((day, i) => ({ day, n: cur[i] })), previous: prev })
      })
      .catch((err) => {
        console.error('visitor counts failed', err)
        if (!cancelled) setError({ range, text: 'Could not load visitor counts.' })
      })
    return () => {
      cancelled = true
    }
  }, [range])

  return (
    <section>
      <header className="admin-header">
        <h1>Visitors</h1>
        <div className="admin-range" role="group" aria-label="Period">
          {RANGES.map((r) => (
            <button key={r} type="button" aria-pressed={range === r} onClick={() => setRange(r)}>
              {r}d
            </button>
          ))}
        </div>
      </header>
      {error?.range === range ? (
        <p className="admin-notice">{error.text}</p>
      ) : data?.range !== range ? (
        <div className="admin-loading">
          <Spinner size={32} />
        </div>
      ) : (
        <VisitorsBody range={range} data={data} />
      )}
    </section>
  )
}

function VisitorsBody({ range, data }) {
  const values = data.current.map((d) => d.n)
  const total = values.reduce((a, b) => a + b, 0)
  const prevTotal = data.previous.reduce((a, b) => a + b, 0)
  const avg = total / range
  const change = prevTotal > 0 ? (total - prevTotal) / prevTotal : null
  const trend =
    change === null
      ? { label: 'not enough history yet', tone: 'flat', arrow: '•' }
      : change > STEADY
        ? { label: 'increasing', tone: 'up', arrow: '▲' }
        : change < -STEADY
          ? { label: 'decreasing', tone: 'down', arrow: '▼' }
          : { label: 'steady', tone: 'flat', arrow: '◆' }

  // chart geometry (viewBox units; scales to the card width)
  const W = 640
  const H = 200
  const PAD = { t: 12, r: 8, b: 24, l: 32 }
  const max = Math.max(4, ...values, ...data.previous)
  const x = (i) => PAD.l + (range === 1 ? 0 : (i / (range - 1)) * (W - PAD.l - PAD.r))
  const y = (v) => PAD.t + (1 - v / max) * (H - PAD.t - PAD.b)
  const line = (vals) => vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const area = `${line(values)} L${x(range - 1)} ${y(0)} L${x(0)} ${y(0)} Z`
  const ticks = [0, Math.round(max / 2), max]
  const labelEvery = range <= 7 ? 1 : range <= 30 ? 7 : 15

  return (
    <div className="admin-card admin-visitors">
      <div className="admin-visitors__stats">
        <div>
          <b>{Math.round(avg * 10) / 10}</b>
          <span>unique visitors / day</span>
        </div>
        <div>
          <b>{values[values.length - 1]}</b>
          <span>today so far</span>
        </div>
        <div className={`admin-trend admin-trend--${trend.tone}`}>
          <b>
            {trend.arrow} {change === null ? '—' : `${change > 0 ? '+' : ''}${Math.round(change * 100)}%`}
          </b>
          <span>
            {trend.label}
            {change !== null && ` vs previous ${range} days`}
          </span>
        </div>
      </div>
      <svg className="admin-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Daily unique visitors, last ${range} days: ${trend.label}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line className="admin-chart__grid" x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} />
            <text className="admin-chart__axis" x={PAD.l - 6} y={y(t) + 4} textAnchor="end">
              {t}
            </text>
          </g>
        ))}
        {prevTotal > 0 && <path className="admin-chart__prev" d={line(data.previous)} />}
        <path className="admin-chart__area" d={area} />
        <path className="admin-chart__line" d={line(values)} />
        {data.current.map((d, i) => (
          <g key={d.day}>
            <circle className="admin-chart__dot" cx={x(i)} cy={y(d.n)} r={range <= 30 ? 3 : 2}>
              <title>
                {shortDate(d.day)}: {d.n} unique visitor{d.n === 1 ? '' : 's'}
              </title>
            </circle>
            {(range - 1 - i) % labelEvery === 0 && (
              <text className="admin-chart__axis" x={x(i)} y={H - 6} textAnchor={i === range - 1 ? 'end' : i === 0 ? 'start' : 'middle'}>
                {shortDate(d.day)}
              </text>
            )}
          </g>
        ))}
      </svg>
      <p className="admin-visitors__note">
        Solid line: this period · dashed: the {range} days before. One visitor = one browser per day (UTC); counting
        started 12 Oct 2026.
      </p>
    </div>
  )
}
