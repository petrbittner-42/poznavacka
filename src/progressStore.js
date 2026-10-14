// Ukládání pokroku: lokálně (localStorage) pro nepřihlášené, Supabase pro přihlášené.
// Obě vrstvy mají stejné rozhraní:
//   load() -> { progress: { itemId: {...} }, answers: [{ itemId, correct, at }] }
//   saveProgress(itemId, progress), addAnswer(itemId, correct, at), reset()

const MAX_LOCAL_ANSWERS = 3000

function localKey(setId) {
  return `poznavacka:${setId}`
}

export function createLocalStore(setId) {
  const key = localKey(setId)
  const read = () => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : { progress: {}, answers: [] }
    } catch {
      return { progress: {}, answers: [] }
    }
  }
  const write = (data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch {
      /* plný/zablokovaný storage – pokrok zůstane jen v paměti */
    }
  }
  return {
    kind: 'local',
    async load() {
      return read()
    },
    async saveProgress(itemId, progress) {
      const d = read()
      d.progress[itemId] = progress
      write(d)
    },
    async addAnswer(itemId, correct, at) {
      const d = read()
      d.answers.push({ itemId, correct, at })
      if (d.answers.length > MAX_LOCAL_ANSWERS) d.answers = d.answers.slice(-MAX_LOCAL_ANSWERS)
      write(d)
    },
    async reset() {
      localStorage.removeItem(key)
    },
  }
}

/** Má lokální úložiště pro sadu nějaká data? */
export function hasLocalData(setId) {
  try {
    const raw = localStorage.getItem(localKey(setId))
    if (!raw) return false
    const d = JSON.parse(raw)
    return Object.keys(d.progress || {}).length > 0
  } catch {
    return false
  }
}

function rowToProgress(r) {
  return {
    weight: r.weight,
    streak: r.streak,
    correct: r.correct,
    wrong: r.wrong,
    lastSeen: r.last_seen ? new Date(r.last_seen).getTime() : null,
  }
}

function progressToRow(userId, setId, itemId, p) {
  return {
    user_id: userId,
    set_id: setId,
    item_id: itemId,
    weight: p.weight,
    streak: p.streak,
    correct: p.correct,
    wrong: p.wrong,
    last_seen: p.lastSeen ? new Date(p.lastSeen).toISOString() : null,
  }
}

export function createRemoteStore(supabase, userId, setId) {
  const fail = (e, what) => {
    if (e) throw new Error(`${what}: ${e.message}`)
  }
  return {
    kind: 'remote',
    async load() {
      const [p, a] = await Promise.all([
        supabase.from('progress').select('*').eq('set_id', setId),
        supabase
          .from('answers')
          .select('item_id, correct, answered_at')
          .eq('set_id', setId)
          .order('answered_at', { ascending: false })
          .limit(MAX_LOCAL_ANSWERS),
      ])
      fail(p.error, 'Načtení pokroku')
      fail(a.error, 'Načtení historie')
      const progress = {}
      for (const r of p.data) progress[r.item_id] = rowToProgress(r)
      const answers = a.data
        .map((r) => ({ itemId: r.item_id, correct: r.correct, at: new Date(r.answered_at).getTime() }))
        .reverse()
      return { progress, answers }
    },
    async saveProgress(itemId, progress) {
      const { error } = await supabase.from('progress').upsert(progressToRow(userId, setId, itemId, progress))
      fail(error, 'Uložení pokroku')
    },
    async addAnswer(itemId, correct, at) {
      const { error } = await supabase.from('answers').insert({
        user_id: userId,
        set_id: setId,
        item_id: itemId,
        correct,
        answered_at: new Date(at).toISOString(),
      })
      fail(error, 'Uložení odpovědi')
    },
    async reset() {
      const a = await supabase.from('answers').delete().eq('set_id', setId).eq('user_id', userId)
      fail(a.error, 'Smazání historie')
      const p = await supabase.from('progress').delete().eq('set_id', setId).eq('user_id', userId)
      fail(p.error, 'Smazání pokroku')
    },
    /** Hromadně nahraje lokální data (použito při prvním přihlášení). */
    async importAll({ progress, answers }) {
      const rows = Object.entries(progress).map(([id, p]) => progressToRow(userId, setId, id, p))
      if (rows.length) {
        const { error } = await supabase.from('progress').upsert(rows)
        fail(error, 'Přenos pokroku')
      }
      if (answers.length) {
        const { error } = await supabase.from('answers').insert(
          answers.map((x) => ({
            user_id: userId,
            set_id: setId,
            item_id: x.itemId,
            correct: x.correct,
            answered_at: new Date(x.at).toISOString(),
          })),
        )
        fail(error, 'Přenos historie')
      }
    },
  }
}
