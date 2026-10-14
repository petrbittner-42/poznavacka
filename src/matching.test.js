import { describe, it, expect } from 'vitest'
import { normalize, levenshtein, evaluateAnswer } from './matching.js'

const items = [
  { id: 'p', name: 'pampeliška lékařská', label: 'pampeliška (smetanka) lékařská', aliases: ['smetanka lékařská'] },
  { id: 'a', name: 'smrk ztepilý', aliases: ['smrk obecný'] },
  { id: 'b', name: 'javor klen' },
  { id: 'c', name: 'javor mléč' },
  { id: 'd', name: 'buk lesní' },
  { id: 'e', name: 'dub letní' },
  { id: 'f', name: 'mák vlčí' },
  { id: 'g', name: 'mák setý' },
]
const smrk = items[1], klen = items[2], mlec = items[3], buk = items[4], dub = items[5]

describe('normalize', () => {
  it('sjednotí velikost, diakritiku a mezery', () => {
    expect(normalize('  SMRK   Ztepilý ')).toBe('smrk ztepily')
    expect(normalize('bříza, bělokorá!')).toBe('briza belokora')
  })
})

describe('levenshtein', () => {
  it('počítá vzdálenost', () => {
    expect(levenshtein('ztepily', 'stepyly')).toBe(2)
    expect(levenshtein('', 'abc')).toBe(3)
  })
})

describe('evaluateAnswer', () => {
  it('přesná shoda', () => expect(evaluateAnswer('smrk ztepilý', smrk, items).correct).toBe(true))
  it('bez diakritiky a velkými písmeny', () => expect(evaluateAnswer('SMRK ZTEPILY', smrk, items).correct).toBe(true))
  it('překlep smrk stepylý projde', () => expect(evaluateAnswer('smrk stepylý', smrk, items).correct).toBe(true))
  it('alias projde', () => expect(evaluateAnswer('smrk obecny', smrk, items).correct).toBe(true))
  it('prázdná odpověď neprojde', () => expect(evaluateAnswer('   ', smrk, items).correct).toBe(false))
  it('úplně jiný název neprojde', () => expect(evaluateAnswer('borovice', smrk, items).correct).toBe(false))
  it('javor klen místo javor mléč neprojde', () => expect(evaluateAnswer('javor klen', mlec, items).correct).toBe(false))
  it('javor mlecc (překlep) projde', () => expect(evaluateAnswer('javor mlecc', mlec, items).correct).toBe(true))
  it('dub lesní místo buk lesní neprojde (krátké slovo, nulová tolerance)', () => expect(evaluateAnswer('dub lesní', buk, items).correct).toBe(false))
  it('dub letni projde', () => expect(evaluateAnswer('dub letni', dub, items).correct).toBe(true))
  it('plné znění z dropdownu projde', () => expect(evaluateAnswer('pampeliška (smetanka) lékařská', items[0], items).correct).toBe(true))
  it('alias smetanka lekarska projde', () => expect(evaluateAnswer('smetanka lekarska', items[0], items).correct).toBe(true))
  it('obrácené pořadí slov (vlčí mák) projde', () => expect(evaluateAnswer('vlčí mák', items[6], items).correct).toBe(true))
  it('vlci mak s překlepem projde', () => expect(evaluateAnswer('vlci maak', items[6], items).correct).toBe(true))
  it('setý mák místo mák vlčí neprojde', () => expect(evaluateAnswer('setý mák', items[6], items).correct).toBe(false))
  it('jen rod (javor) neprojde', () => expect(evaluateAnswer('javor', klen, items).correct).toBe(false))
})
