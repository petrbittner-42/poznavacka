import { useEffect, useMemo, useRef, useState } from 'react'
import { evaluateAnswer } from '../matching.js'
import { pickNext, countStatuses } from '../scheduler.js'
import { setNames } from '../sets.js'

export default function Quiz({ set, progress, onAnswer }) {
  const [current, setCurrent] = useState(() => pickNext(set.items, progress, null))
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null) // { correct, answer }
  const inputRef = useRef(null)
  const names = useMemo(() => setNames(set), [set])
  const counts = countStatuses(set.items, progress)

  const next = () => {
    setCurrent((prev) => pickNext(set.items, progress, prev?.id))
    setInput('')
    setResult(null)
  }

  // Při načtení sady (nebo resetu) vyber první položku.
  useEffect(() => {
    setCurrent(pickNext(set.items, progress, null))
    setInput('')
    setResult(null)
  }, [set])

  useEffect(() => {
    if (!result) inputRef.current?.focus()
  }, [current, result])

  const submit = (e) => {
    e?.preventDefault()
    if (result) return next()
    if (!input.trim() || !current) return
    const r = evaluateAnswer(input, current, set.items)
    setResult({ correct: r.correct, answer: input })
    onAnswer(current, r.correct)
  }

  // Po vyhodnocení posune Enter na další obrázek (pole je vypnuté, tak posloucháme globálně).
  useEffect(() => {
    if (!result) return
    const h = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [result])

  if (!current) return <p className="muted center">Sada je prázdná.</p>

  return (
    <section className="quiz">
      <div className="status-row">
        <span className="pill known">umíš {counts.known}</span>
        <span className="pill learning">doučit {counts.learning}</span>
        <span className="pill unseen">neviděno {counts.unseen}</span>
      </div>

      <div className="image-wrap">
        <img key={current.id} src={current.src} alt="Poznej rostlinu" className="quiz-image" />
      </div>

      <form className="answer-form" onSubmit={submit}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Napiš název rostliny…"
          autoComplete="off"
          autoCapitalize="off"
          disabled={!!result}
          aria-label="Název rostliny"
        />
        {!result && (
          <select
            className="name-select"
            value=""
            onChange={(e) => {
              setInput(e.target.value)
              inputRef.current?.focus()
            }}
            aria-label="Vybrat název ze seznamu"
          >
            <option value="">… nebo vyber ze seznamu</option>
            {names.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        )}
        {!result ? (
          <button type="submit" className="primary" disabled={!input.trim()}>
            Odpovědět
          </button>
        ) : (
          <button type="button" className="primary" onClick={next}>
            Další →
          </button>
        )}
      </form>

      {result && (
        <div className={`result ${result.correct ? 'ok' : 'bad'}`}>
          <strong>{result.correct ? 'Správně!' : 'Špatně.'}</strong>
          <div>
            Správná odpověď: <b>{current.label || current.name}</b>
            {!current.label && current.aliases?.length ? <span className="muted"> (také {current.aliases.join(', ')})</span> : null}
          </div>
          {!result.correct && (
            <div className="muted">
              Tvoje odpověď: <i>{result.answer}</i>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
