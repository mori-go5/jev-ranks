import { describe, expect, it } from 'vitest'
import { validateRankingRequest } from '../server/utils/validation'

const validRequest = {
  datasetId: 'japan-prefectures',
  themeId: 'travel',
  clientId: '123e4567-e89b-42d3-a456-426614174000',
}

describe('ranking request validation', () => {
  it('resolves a valid dataset and theme from server data', () => {
    const request = validateRankingRequest(validRequest)
    expect(request.dataset.candidates).toHaveLength(47)
    expect(request.theme.label).toBe('旅行するなら')
  })

  it('accepts a length-limited custom theme without trusting client instructions', () => {
    const request = validateRankingRequest({ ...validRequest, themeId: 'custom', customTheme: '雨の日に楽しめそうなのは' })
    expect(request.theme.label).toBe('雨の日に楽しめそうなのは')
    expect(request.theme.instructions).toContain('user-authored ranking theme')
  })

  it('builds a custom dataset from 3 to 30 unique items', () => {
    const request = validateRankingRequest({
      ...validRequest,
      datasetId: 'custom',
      themeId: 'favorite',
      customItems: ['コーヒー', '紅茶', '緑茶'],
    })
    expect(request.dataset.candidates.map(candidate => candidate.label)).toEqual(['コーヒー', '紅茶', '緑茶'])
  })

  it('normalizes custom input before checking duplicates', () => {
    expect(() => validateRankingRequest({
      ...validRequest,
      datasetId: 'custom',
      themeId: 'favorite',
      customItems: ['Ａ', 'A', 'B'],
    })).toThrow()
  })

  it.each([
    { ...validRequest, datasetId: 'unknown' },
    { ...validRequest, themeId: 'unknown' },
    { ...validRequest, datasetId: 'months' },
    { ...validRequest, clientId: 'not-a-uuid' },
    { ...validRequest, candidates: ['改ざん'] },
    { ...validRequest, themeId: 'custom' },
    { ...validRequest, themeId: 'custom', customTheme: 'a' },
    { ...validRequest, datasetId: 'custom', customItems: ['1', '2'], themeId: 'favorite' },
    { ...validRequest, datasetId: 'custom', customItems: ['同じ', '同じ', '別'], themeId: 'favorite' },
    { ...validRequest, customItems: ['改ざん', '項目', 'です'] },
    { ...validRequest, themeId: 'custom', customTheme: '改行\nテーマ' },
  ])('rejects invalid or unexpected request data', (request) => {
    expect(() => validateRankingRequest(request)).toThrow()
  })
})
