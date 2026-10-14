import { useMemo } from 'react'
import { computeStats, formatDay, pct } from '../stats.js'

const STATUS_LABEL = { known: 'umíš', learning: 'doučit', unseen: 'neviděno' }

export default function Stats({ set, progress, answers, onReset }) {
  const s = useMemo(() => computeStats({ items: set.items, progress, answers }), [set, progress, answers])
  const { counts, total } = s
  const w = (n) => (total ? `${(n / total) * 100}%` : '0%')

  return (
    <section className="stats">
      <h2>{set.name}</h2>

      <div className="card">
        <h3>Kde jsi</h3>
        <div className="bar" aria-label="Rozložení položek">
          <div className="seg known" style={{ width: w(counts.known) }} />
          <div className="seg learning" style={{ width: w(counts.learning) }} />
          <div className="seg unseen" style={{ width: w(counts.unseen) }} />
        </div>
        <div className="legend">
          <span>
            <i className="dot known" /> umíš <b>{counts.known}</b>
          </span>
          <span>
            <i className="dot learning" /> doučit <b>{counts.learning}</b>
          </span>
          <span>
            <i className="dot unseen" /> neviděno <b>{counts.unseen}</b>
          </span>
          <span className="muted">celkem {total} obrázků</span>
        </div>
        <p className="muted small">„Umíš“ = třikrát po sobě správně. Jedna chyba obrázek vrátí mezi „doučit“.</p>
      </div>

      <div className="card-row">
        <div className="card kpi">
          <div className="kpi-value">{pct(s.accuracyAll)}</div>
          <div className="muted">úspěšnost celkem</div>
          <div className="muted small">{s.answered} odpovědí</div>
        </div>
        <div className="card kpi">
          <div className="kpi-value">{pct(s.accuracyRecent)}</div>
          <div className="muted">posledních {s.recentCount || 20}</div>
        </div>
      </div>

      <div className="card">
        <h3>Vývoj po dnech</h3>
        {s.days.length === 0 ? (
          <p className="muted">Zatím žádné odpovědi.</p>
        ) : (
          <DayChart days={s.days} />
        )}
      </div>

      <div className="card">
        <h3>Co ti dělá největší problém</h3>
        {s.hardest.length === 0 ? (
          <p className="muted">Zatím žádné chyby. 👏</p>
        ) : (
          <ul className="hardest">
            {s.hardest.map(({ item, p }) => (
              <li key={item.id}>
                <img src={item.src} alt="" />
                <div>
                  <b>{item.label || item.name}</b>
                  <div className="muted small">
                    {p.wrong}× špatně, {p.correct}× správně · teď: {STATUS_LABEL[s.statusOf(item.id)]}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card danger-zone">
        <h3>Začít znovu</h3>
        <p className="muted small">Smaže veškerý pokrok a historii v této sadě. Všechny obrázky se budou zobrazovat stejně často.</p>
        <button className="danger" onClick={onReset}>
          Resetovat sadu
        </button>
      </div>
    </section>
  )
}

function DayChart({ days }) {
  const max = Math.max(...days.map((d) => d.total))
  const W = 320
  const H = 120
  const pad = 4
  const bw = (W - pad * 2) / days.length
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H + 24}`} width="100%" role="img" aria-label="Odpovědi po dnech">
        {days.map((d, i) => {
          const h = (d.total / max) * H
          const hc = (d.correct / max) * H
          const x = pad + i * bw
          return (
            <g key={d.day}>
              <rect x={x + 2} y={H - h} width={bw - 4} height={h} className="bar-total" rx="2" />
              <rect x={x + 2} y={H - hc} width={bw - 4} height={hc} className="bar-correct" rx="2" />
              <text x={x + bw / 2} y={H + 14} textAnchor="middle" className="axis">
                {formatDay(d.day)}
              </text>
            </g>
          )
        })}
      </svg>
      <ul className="day-list">
        {[...days].reverse().map((d) => (
          <li key={d.day}>
            <span>{formatDay(d.day)}</span>
            <span>{d.total} odp.</span>
            <b>{Math.round((d.correct / d.total) * 100)} %</b>
          </li>
        ))}
      </ul>
    </div>
  )
}
