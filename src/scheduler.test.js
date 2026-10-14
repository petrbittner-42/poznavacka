import { describe, it, expect } from 'vitest'
import { applyAnswer, emptyProgress, itemStatus, pickNext, countStatuses } from './scheduler.js'

describe('applyAnswer', () => {
  it('po 3 správných je váha ~0.03 a stav umíš', () => {
    let p = emptyProgress()
    p = applyAnswer(p, true); p = applyAnswer(p, true); p = applyAnswer(p, true)
    expect(p.streak).toBe(3)
    expect(p.weight).toBeCloseTo(0.03, 2)
    expect(itemStatus(p)).toBe('known')
  })
  it('po chybě váha >= 3, streak 0, stav doučit', () => {
    const p = applyAnswer(applyAnswer(emptyProgress(), true), false)
    expect(p.weight).toBeGreaterThanOrEqual(3)
    expect(p.streak).toBe(0)
    expect(p.wrong).toBe(1)
    expect(itemStatus(p)).toBe('learning')
  })
  it('neviděná položka', () => expect(itemStatus(undefined)).toBe('unseen'))
})

describe('pickNext', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
  it('nikdy nevrátí stejnou položku dvakrát po sobě', () => {
    for (let i = 0; i < 200; i++) expect(pickNext(items, {}, 'a').id).not.toBe('a')
  })
  it('preferuje těžší položky', () => {
    const pm = { a: { weight: 10 }, b: { weight: 0.03 }, c: { weight: 0.03 } }
    let a = 0
    for (let i = 0; i < 1000; i++) if (pickNext(items, pm, null).id === 'a') a++
    expect(a).toBeGreaterThan(900)
  })
  it('jediná položka se smí opakovat', () => expect(pickNext([{ id: 'x' }], {}, 'x').id).toBe('x'))
})

describe('countStatuses', () => {
  it('spočítá stavy', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const pm = { a: { streak: 3, lastSeen: 1 }, b: { streak: 1, lastSeen: 1 } }
    expect(countStatuses(items, pm)).toEqual({ known: 1, learning: 1, unseen: 1 })
  })
})
