// Jednorázový pomocník: vygeneruje zástupné SVG obrázky pro ukázkovou sadu.
import { writeFileSync, mkdirSync } from 'node:fs'
const dir = 'public/sets/rostliny-1/img'
mkdirSync(dir, { recursive: true })
const items = [
  ['smrk-ztepily-1', '#2f6b3a'], ['borovice-lesni-1', '#8a6d3b'], ['javor-klen-1', '#c0392b'],
  ['javor-mlec-1', '#e67e22'], ['buk-lesni-1', '#7d5a3c'], ['dub-letni-1', '#4b6043'],
  ['lipa-srdcita-1', '#9acd32'], ['briza-belokora-1', '#bdc3c7'],
]
items.forEach(([id, color], i) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
<rect width="800" height="600" fill="${color}"/>
<text x="400" y="290" font-family="sans-serif" font-size="56" fill="#fff" text-anchor="middle">Ukázkový obrázek ${i + 1}</text>
<text x="400" y="350" font-family="sans-serif" font-size="28" fill="#ffffffcc" text-anchor="middle">(nahraď fotkou rostliny)</text>
</svg>`
  writeFileSync(`${dir}/${id}.svg`, svg)
})
console.log('OK', items.length)
