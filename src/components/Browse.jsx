import { useEffect, useState } from 'react'

const STATUS_LABEL = { known: 'umíš', learning: 'doučit', unseen: 'ještě neprocvičeno' }

/** Prohlížení sady popořadě: obrázek + název, šipky, skok na konkrétní rostlinu. */
export default function Browse({ set, statusOf }) {
  const [index, setIndex] = useState(() => {
    const saved = Number(sessionStorage.getItem(`poznavacka:browse:${set.id}`))
    return saved >= 0 && saved < set.items.length ? saved : 0
  })
  const items = set.items
  const item = items[index]
  const last = items.length - 1

  useEffect(() => {
    sessionStorage.setItem(`poznavacka:browse:${set.id}`, String(index))
  }, [index, set.id])

  // Šipky na klávesnici
  useEffect(() => {
    const h = (e) => {
      if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(last, i + 1))
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [last])

  if (!item) return <p className="muted center">Sada je prázdná.</p>

  const status = statusOf?.(item.id)

  return (
    <section className="browse">
      <div className="browse-top">
        <select
          className="browse-select"
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          aria-label="Skok na rostlinu"
        >
          {items.map((it, i) => (
            <option key={it.id} value={i}>
              {i + 1}. {it.label || it.name}
            </option>
          ))}
        </select>
        <span className="browse-counter">
          {index + 1} / {items.length}
        </span>
      </div>

      <div className="image-wrap">
        <img key={item.id} src={item.src} alt={item.label || item.name} className="quiz-image" />
      </div>

      <div className="browse-caption">
        <h2>{item.label || item.name}</h2>
        {item.aliases?.length > 0 && !item.label && <div className="muted">také: {item.aliases.join(', ')}</div>}
        {item.description && <p className="browse-desc">{item.description}</p>}
        {status && status !== 'unseen' && (
          <span className={`pill ${status}`}>{STATUS_LABEL[status]}</span>
        )}
      </div>

      <div className="browse-nav">
        <button onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0}>
          ← Předchozí
        </button>
        <button className="primary" onClick={() => setIndex(Math.min(last, index + 1))} disabled={index === last}>
          Další →
        </button>
      </div>
      {index === last && <p className="muted center small">Konec sady. Další kolo začni výběrem první položky nahoře.</p>}
    </section>
  )
}
