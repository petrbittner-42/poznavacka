// Načítání sad obrázků ze statických souborů v public/sets/.
export async function loadSetIndex() {
  const r = await fetch('/sets/index.json')
  if (!r.ok) throw new Error('Nelze načíst seznam sad')
  return r.json()
}

export async function loadSet(setId) {
  const r = await fetch(`/sets/${setId}/set.json`)
  if (!r.ok) throw new Error(`Nelze načíst sadu ${setId}`)
  const set = await r.json()
  // Doplní absolutní cestu k obrázku, ať s ní komponenty nemusí pracovat.
  set.items = set.items.map((it) => ({
    ...it,
    aliases: it.aliases || [],
    src: `/sets/${setId}/${it.image}`,
  }))
  return set
}

/** Unikátní seznam názvů v sadě (pro rozbalovací menu), abecedně. */
export function setNames(set) {
  return [...new Set(set.items.map((it) => it.name))].sort((a, b) => a.localeCompare(b, 'cs'))
}
