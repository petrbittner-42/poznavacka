import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Klient je null, když nejsou nastavené env proměnné — appka pak běží jen lokálně. */
export const supabase = url && key ? createClient(url, key) : null

// Supabase Auth vyžaduje e-mail; studenti ho zadávat nebudou, tak ho odvodíme ze jména.
const EMAIL_DOMAIN = 'users.poznavacka.local'
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/

export function usernameToEmail(username) {
  return `${username.trim().toLowerCase()}@${EMAIL_DOMAIN}`
}

export function sessionUsername(session) {
  return session?.user?.user_metadata?.username || session?.user?.email?.split('@')[0] || ''
}

export function translateAuthError(err) {
  const m = (err?.message || '').toLowerCase()
  if (m.includes('invalid login credentials')) return 'Špatné jméno nebo heslo.'
  if (m.includes('already registered') || m.includes('already been registered')) return 'Toto jméno už někdo používá.'
  if (m.includes('password') && m.includes('at least')) return 'Heslo musí mít alespoň 6 znaků.'
  if (m.includes('email') && (m.includes('invalid') || m.includes('valid'))) return 'Jméno obsahuje nepovolené znaky.'
  if (m.includes('rate limit')) return 'Příliš mnoho pokusů, zkus to za chvíli.'
  if (m.includes('fetch')) return 'Nepodařilo se spojit se serverem.'
  return err?.message || 'Něco se nepovedlo.'
}
