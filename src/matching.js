// Vyhodnocení odpovědi s tolerancí na překlepy, velikost písmen a diakritiku.

/** Malá písmena, bez diakritiky, bez interpunkce, jedna mezera mezi slovy. */
export function normalize(s) {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Levenshteinova vzdálenost dvou řetězců. */
export function levenshtein(a, b) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
    }
    prev = cur
  }
  return prev[b.length]
}

function wordTolerance(len) {
  if (len <= 3) return 0
  if (len <= 6) return 1
  return 2
}

/**
 * Je zadaný (normalizovaný) text přijatelnou variantou (normalizovaného) názvu?
 * Projde, když sedí po slovech v rámci tolerance, nebo celý řetězec v rámci floor(délka/6), max 3.
 */
export function isCloseEnough(input, target) {
  if (!input || !target) return false
  if (input === target) return true
  const iw = input.split(' ')
  const tw = target.split(' ')
  if (iw.length === tw.length) {
    const okWords = tw.every((w, i) => levenshtein(iw[i], w) <= wordTolerance(w.length))
    if (okWords) return true
  }
  const allowed = Math.min(3, Math.floor(target.length / 6))
  return levenshtein(input, target) <= allowed
}

/** Nejmenší vzdálenost zadaného textu k názvu nebo některému aliasu položky. */
function distanceToItem(input, item) {
  const names = [item.name, ...(item.aliases || [])].map(normalize)
  return Math.min(...names.map((n) => levenshtein(input, n)))
}

/**
 * Vyhodnotí odpověď na položku `item` v kontextu celé sady (`items`).
 * Vrací { correct, matchedName }.
 * Pojistka proti záměně: když je odpověď blíž k JINÉ rostlině (jiný název), je to chyba.
 */
export function evaluateAnswer(rawInput, item, items) {
  const input = normalize(rawInput)
  if (!input) return { correct: false, matchedName: null }
  const candidates = [item.name, ...(item.aliases || [])]
  const matched = candidates.find((c) => isCloseEnough(input, normalize(c)))
  if (!matched) return { correct: false, matchedName: null }

  const own = distanceToItem(input, item)
  const others = (items || []).filter((o) => normalize(o.name) !== normalize(item.name))
  const closerOther = others.some((o) => distanceToItem(input, o) < own)
  if (closerOther) return { correct: false, matchedName: null }
  return { correct: true, matchedName: matched }
}
