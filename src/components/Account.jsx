import { useState } from 'react'
import { supabase, sessionUsername, usernameToEmail, USERNAME_RE, translateAuthError } from '../supabase.js'

export default function Account({ session, onNotice }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  if (!supabase) {
    return (
      <section className="account">
        <div className="card">
          <h3>Účet</h3>
          <p className="muted">
            Přihlašování není nastavené (chybí připojení k databázi). Pokrok se ukládá jen v tomto prohlížeči.
          </p>
        </div>
      </section>
    )
  }

  if (session) {
    return (
      <section className="account">
        <div className="card">
          <h3>Přihlášen jako {sessionUsername(session)}</h3>
          <p className="muted">Pokrok se ukládá k tvému účtu. Můžeš se přihlásit i z jiného zařízení.</p>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              onNotice('Odhlášeno. Pokrok se teď ukládá jen v tomto prohlížeči.')
            }}
          >
            Odhlásit se
          </button>
        </div>
      </section>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    setErr(null)
    const u = username.trim().toLowerCase()
    if (!USERNAME_RE.test(u)) {
      setErr('Jméno: 3–20 znaků, jen malá písmena bez diakritiky, čísla a podtržítko.')
      return
    }
    if (password.length < 6) {
      setErr('Heslo musí mít alespoň 6 znaků.')
      return
    }
    setBusy(true)
    try {
      const email = usernameToEmail(u)
      const res =
        mode === 'register'
          ? await supabase.auth.signUp({ email, password, options: { data: { username: u } } })
          : await supabase.auth.signInWithPassword({ email, password })
      if (res.error) throw res.error
      if (mode === 'register' && !res.data.session) {
        throw new Error('Registrace proběhla, ale přihlášení ne – v Supabase je zřejmě zapnuté ověřování e-mailem.')
      }
      onNotice(mode === 'register' ? `Účet ${u} vytvořen a přihlášen.` : `Přihlášen jako ${u}.`)
    } catch (e2) {
      setErr(translateAuthError(e2))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="account">
      <div className="card">
        <div className="switch">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')} type="button">
            Přihlásit
          </button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')} type="button">
            Registrovat
          </button>
        </div>
        <p className="muted small">
          Žádný e-mail. Stačí si zvolit jméno a heslo, abys se mohl ke svému pokroku vrátit i z jiného zařízení.
          Bez přihlášení appka funguje taky, pokrok zůstane jen v tomto prohlížeči.
        </p>
        <form onSubmit={submit} className="auth-form">
          <label>
            Jméno
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="off"
              placeholder="např. student_01"
            />
          </label>
          <label>
            Heslo
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            />
          </label>
          {err && <div className="error inline">{err}</div>}
          <button className="primary" type="submit" disabled={busy}>
            {busy ? '…' : mode === 'register' ? 'Vytvořit účet' : 'Přihlásit se'}
          </button>
        </form>
      </div>
    </section>
  )
}
