// Výběr další položky a aktualizace vah po odpovědi.
export const KNOWN_STREAK = 3
const MIN_WEIGHT = 0.03
const MAX_WEIGHT = 10

export function emptyProgress() {
  return { weight: 1, streak: 0, correct: 0, wrong: 0, lastSeen: null }
}

/** Vrátí nový záznam pokroku položky po odpovědi. */
export function applyAnswer(progress, correct, now = Date.now()) {
  const p = { ...(progress || emptyProgress()) }
  if (correct) {
    p.streak += 1
    p.correct += 1
    p.weight = Math.max(MIN_WEIGHT, p.weight * 0.3)
  } else {
    p.streak = 0
    p.wrong += 1
    p.weight = Math.min(MAX_WEIGHT, Math.max(3, p.weight * 2.5))
  }
  p.lastSeen = now
  return p
}

/** Stav položky: 'known' | 'learning' | 'unseen'. */
export function itemStatus(progress) {
  if (!progress || progress.lastSeen == null) return 'unseen'
  return progress.streak >= KNOWN_STREAK ? 'known' : 'learning'
}

/**
 * Vážený náhodný výběr. `progressMap` = { itemId: progress }. Nikdy nevrátí `lastId`,
 * pokud je v sadě víc než jedna položka.
 */
export function pickNext(items, progressMap, lastId, rnd = Math.random) {
  let pool = items
  if (items.length > 1 && lastId) pool = items.filter((it) => it.id !== lastId)
  if (!pool.length) return null
  const weights = pool.map((it) => (progressMap[it.id] || emptyProgress()).weight)
  const total = weights.reduce((a, b) => a + b, 0)
  let r = rnd() * total
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i]
    if (r <= 0) return pool[i]
  }
  return pool[pool.length - 1]
}

/** Počty umíš / doučit / neviděno. */
export function countStatuses(items, progressMap) {
  const c = { known: 0, learning: 0, unseen: 0 }
  for (const it of items) c[itemStatus(progressMap[it.id])]++
  return c
}
