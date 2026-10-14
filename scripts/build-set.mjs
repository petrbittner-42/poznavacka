// Vygeneruje set.json ze složky obrázků.
//
// Použití:
//   node scripts/build-set.mjs <id-sady> "<Název sady>"
//
// Očekává obrázky v public/sets/<id-sady>/img/. Název rostliny se bere z názvu souboru:
//   smrk_ztepily_1.jpg  ->  "smrk ztepily"   (podtržítka = mezery, číslo na konci = pořadí fotky)
// Diakritiku skript doplnit neumí – po vygenerování ji v set.json doplň ručně (nebo přidej aliasy).
// Pokud set.json už existuje, zachová ručně upravené názvy, popisky (label) a aliasy u položek se stejným id.
// Položky, ke kterým chybí soubor, ze set.json vypadnou (skript je vypíše).

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const [setId, setName] = process.argv.slice(2)
if (!setId) {
  console.error('Použití: node scripts/build-set.mjs <id-sady> "<Název sady>"')
  process.exit(1)
}

const dir = join('public', 'sets', setId)
const imgDir = join(dir, 'img')
if (!existsSync(imgDir)) {
  console.error(`Složka ${imgDir} neexistuje. Vytvoř ji a nahraj do ní obrázky.`)
  process.exit(1)
}

const jsonPath = join(dir, 'set.json')
const existing = existsSync(jsonPath) ? JSON.parse(readFileSync(jsonPath, 'utf8')) : null
const prev = new Map((existing?.items || []).map((it) => [it.id, it]))

const files = readdirSync(imgDir)
  .filter((f) => /\.(jpe?g|png|webp|svg|gif)$/i.test(f))
  .sort((a, b) => a.localeCompare(b, 'cs'))

const items = files.map((file) => {
  const base = file.replace(/\.[^.]+$/, '')
  const id = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const old = prev.get(id)
  const name = old?.name || base.replace(/[_-]?\d+$/, '').replace(/[_-]+/g, ' ').trim().toLowerCase()
  const item = { id, image: `img/${file}`, name }
  if (old?.label) item.label = old.label
  if (old?.aliases?.length) item.aliases = old.aliases
  return item
})

const set = { id: setId, name: setName || existing?.name || setId, items }
writeFileSync(jsonPath, JSON.stringify(set, null, 2) + '\n')
console.log(`Zapsáno ${jsonPath}: ${items.length} položek`)
const missing = [...prev.keys()].filter((id) => !items.some((it) => it.id === id))
if (missing.length) console.log(`Chybí soubory pro ${missing.length} položek: ${missing.join(', ')}`)

// Aktualizace public/sets/index.json
const indexPath = join('public', 'sets', 'index.json')
const index = existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, 'utf8')) : []
const row = { id: setId, name: set.name, count: items.length }
const i = index.findIndex((s) => s.id === setId)
if (i >= 0) index[i] = row
else index.push(row)
writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n')
console.log(`Aktualizován ${indexPath}`)
