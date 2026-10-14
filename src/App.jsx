import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadSet, loadSetIndex } from './sets.js'
import { applyAnswer, itemStatus } from './scheduler.js'
import { createLocalStore, createRemoteStore, hasLocalData } from './progressStore.js'
import { supabase, sessionUsername } from './supabase.js'
import Browse from './components/Browse.jsx'
import Quiz from './components/Quiz.jsx'
import Stats from './components/Stats.jsx'
import Account from './components/Account.jsx'
import SetPicker from './components/SetPicker.jsx'

const TABS = [
  { id: 'browse', label: 'Prohlížení' },
  { id: 'quiz', label: 'Procvičování' },
  { id: 'stats', label: 'Statistiky' },
  { id: 'account', label: 'Účet' },
]

export default function App() {
  const [tab, setTab] = useState('browse')
  const [session, setSession] = useState(undefined) // undefined = ještě nevíme
  const [setIndex, setSetIndex] = useState([])
  const [setId, setSetId] = useState(() => localStorage.getItem('poznavacka:setId') || null)
  const [set, setSet] = useState(null)
  const [progress, setProgress] = useState({})
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  // Přihlášení (jen když je Supabase nakonfigurované)
  useEffect(() => {
    if (!supabase) {
      setSession(null)
      return
    }
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // Seznam sad
  useEffect(() => {
    loadSetIndex()
      .then((idx) => {
        setSetIndex(idx)
        if (!idx.length) throw new Error('Nejsou žádné sady')
        if (!idx.some((s) => s.id === setId)) setSetId(idx[0].id)
      })
      .catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    if (setId) localStorage.setItem('poznavacka:setId', setId)
  }, [setId])

  const store = useMemo(() => {
    if (!setId || session === undefined) return null
    return session && supabase ? createRemoteStore(supabase, session.user.id, setId) : createLocalStore(setId)
  }, [setId, session])

  // Načtení sady + pokroku při změně sady nebo přihlášení
  useEffect(() => {
    if (!store) return
    let cancelled = false
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const s = await loadSet(setId)
        let data = await store.load()
        // Při prvním přihlášení přeneseme lokální pokrok na server (jen když je server prázdný).
        if (store.kind === 'remote' && Object.keys(data.progress).length === 0 && hasLocalData(setId)) {
          const local = createLocalStore(setId)
          const localData = await local.load()
          await store.importAll(localData)
          await local.reset()
          data = localData
          setNotice('Pokrok z tohoto prohlížeče byl přenesen do tvého účtu.')
        }
        if (cancelled) return
        setSet(s)
        setProgress(data.progress)
        setAnswers(data.answers)
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [store, setId])

  const handleAnswer = useCallback(
    (item, correct) => {
      const now = Date.now()
      const next = applyAnswer(progress[item.id], correct, now)
      setProgress((p) => ({ ...p, [item.id]: next }))
      setAnswers((a) => [...a, { itemId: item.id, correct, at: now }])
      Promise.all([store.saveProgress(item.id, next), store.addAnswer(item.id, correct, now)]).catch((e) =>
        setError(e.message),
      )
    },
    [progress, store],
  )

  const handleReset = useCallback(async () => {
    if (!window.confirm('Opravdu smazat veškerý pokrok v této sadě a začít znovu?')) return
    try {
      await store.reset()
      setProgress({})
      setAnswers([])
      setNotice('Pokrok smazán, začínáš od začátku.')
      setTab('quiz')
    } catch (e) {
      setError(e.message)
    }
  }, [store])

  const username = sessionUsername(session)

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <span className="logo" aria-hidden>
            🌿
          </span>
          <h1>Poznávačka</h1>
        </div>
        <div className="header-right">
          {setIndex.length > 1 && <SetPicker sets={setIndex} value={setId} onChange={setSetId} />}
          <span className="user-badge" title={session ? 'Přihlášený uživatel' : 'Nepřihlášen'}>
            {session ? username : 'anonym'}
          </span>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      {notice && (
        <div className="notice" onClick={() => setNotice(null)}>
          {notice} <span className="dismiss">✕</span>
        </div>
      )}
      {error && (
        <div className="error" onClick={() => setError(null)}>
          {error} <span className="dismiss">✕</span>
        </div>
      )}

      <main className="main">
        {loading || !set ? (
          <p className="muted center">Načítám…</p>
        ) : (
          <>
            {tab === 'browse' && <Browse set={set} statusOf={(id) => itemStatus(progress[id])} />}
            {tab === 'quiz' && <Quiz set={set} progress={progress} onAnswer={handleAnswer} />}
            {tab === 'stats' && <Stats set={set} progress={progress} answers={answers} onReset={handleReset} />}
            {tab === 'account' && <Account session={session} onNotice={setNotice} />}
          </>
        )}
      </main>
    </div>
  )
}
