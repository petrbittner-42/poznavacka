import { describe, it, expect } from 'vitest'
import { normalize, levenshtein, evaluateAnswer } from './matching.js'

const items = [
  { id: 'a', name: 'smrk ztepilý', aliases: ['smrk obecný'] },
  { id: 'b', name: 'javor klen' },
  { id: 'c', name: 'javor mléč' },
  { id: 'd', name: 'buk lesní' },
  { id: 'e', name: 'dub letní' },
]
const smrk = items[0], klen = items[1], mlec = items[2], buk = items[3], dub = items[4]

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
  it('jen rod (javor) neprojde', () => expect(evaluateAnswer('javor', klen, items).correct).toBe(false))
})
