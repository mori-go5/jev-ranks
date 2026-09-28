import { describe, expect, it } from 'vitest'
import { rankingDatasets } from '../shared/data/datasets'
import { sortRankingEntries, validateScoreAnswers } from '../shared/utils/ranking'

describe('ranking datasets', () => {
  it('contains the expected candidate counts and unique identifiers', () => {
    expect(rankingDatasets.map(dataset => dataset.candidates.length)).toEqual([47, 23, 12, 12, 8, 12, 12, 12, 12, 16])
    expect(new Set(rankingDatasets.map(dataset => dataset.id)).size).toBe(rankingDatasets.length)

    for (const dataset of rankingDatasets) {
      expect(new Set(dataset.candidates.map(candidate => candidate.id)).size).toBe(dataset.candidates.length)
      expect(new Set(dataset.themes.map(theme => theme.id)).size).toBe(dataset.themes.length)
      expect(dataset.themes.some(theme => theme.id === dataset.defaultThemeId)).toBe(true)
    }
  })
})

describe('score ranking', () => {
  const candidates = [
    { id: 'first', label: 'First' },
    { id: 'second', label: 'Second' },
    { id: 'third', label: 'Third' },
    { id: 'fourth', label: 'Fourth' },
  ]

  it('sorts raw scores and assigns stable competition ranks', () => {
    const entries = sortRankingEntries(candidates, new Map([
      ['first', 3.251],
      ['second', 3.25],
      ['third', 3.25],
      ['fourth', 1],
    ]))

    expect(entries.map(entry => [entry.candidate.id, entry.rank])).toEqual([
      ['first', 1],
      ['second', 2],
      ['third', 2],
      ['fourth', 4],
    ])
    expect(entries[0]?.displayScore).toBeCloseTo(81.275)
  })

  it('validates a complete score response and rejects incomplete or invalid answers', () => {
    expect(validateScoreAnswers(candidates.slice(0, 1), {
      first: { type: 'score', score: 2.5 },
    }).get('first')).toBe(2.5)
    expect(validateScoreAnswers(candidates.slice(0, 1), {
      first: { type: 'score', score: 2.5, probabilities: { low: 0, high: 1 } },
    }).get('first')).toBe(2.5)

    expect(() => validateScoreAnswers(candidates.slice(0, 2), {
      first: { type: 'score', score: 2 },
    })).toThrow('Invalid Jev response')
    expect(() => validateScoreAnswers(candidates.slice(0, 1), {
      first: { type: 'score', score: Number.NaN },
    })).toThrow('Invalid Jev response')
  })
})
