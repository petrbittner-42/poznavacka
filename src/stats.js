// Výpočty pro záložku Statistiky. Čisté funkce nad { items, progress, answers }.
import { countStatuses, itemStatus } from './scheduler.js'

export function accuracy(answers) {
  if (!answers.length) return null
  return answers.filter((a) => a.correct).length / answers.length
}

function dayKey(ts) {
  const d = new Date(ts)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** Odpovědi seskupené po dnech (vzestupně), max `maxDays` posledních dnů s aktivitou. */
export function byDay(answers, maxDays = 14) {
  const map = new Map()
  for (const a of answers) {
    const k = dayKey(a.at)
    const row = map.get(k) || { day: k, total: 0, correct: 0 }
    row.total++
    if (a.correct) row.correct++
    map.set(k, row)
  }
  return [...map.values()].sort((x, y) => x.day.localeCompare(y.day)).slice(-maxDays)
}

/** Nejproblémovější položky: nejvíc chyb, pak nejnižší streak. Jen ty s aspoň jednou chybou. */
export function hardestItems(items, progress, limit = 5) {
  return items
    .map((it) => ({ item: it, p: progress[it.id] }))
    .filter((x) => x.p && x.p.wrong > 0)
    .sort((a, b) => b.p.wrong - a.p.wrong || a.p.streak - b.p.streak || b.p.weight - a.p.weight)
    .slice(0, limit)
}

export function computeStats({ items, progress, answers }) {
  return {
    counts: countStatuses(items, progress),
    total: items.length,
    answered: answers.length,
    accuracyAll: accuracy(answers),
    accuracyRecent: accuracy(answers.slice(-20)),
    recentCount: Math.min(20, answers.length),
    days: byDay(answers),
    hardest: hardestItems(items, progress),
    statusOf: (id) => itemStatus(progress[id]),
  }
}

export function formatDay(key) {
  const [, m, d] = key.split('-')
  return `${Number(d)}. ${Number(m)}.`
}

export function pct(x) {
  return x == null ? '–' : `${Math.round(x * 100)} %`
}
