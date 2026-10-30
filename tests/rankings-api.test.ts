import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../server/api/rankings.post'
const { rateLimit, reserve, evaluate, header } = vi.hoisted(() => ({
  rateLimit: vi.fn(), reserve: vi.fn(), evaluate: vi.fn(), header: vi.fn(),
}))
vi.mock('h3', () => ({
  defineEventHandler: (fn: unknown) => fn,
  createError: (data: object) => Object.assign(new Error(), data),
  getRequestHeader: () => undefined,
  getRequestIP: () => '127.0.0.1',
  readRawBody: async () => JSON.stringify({ clientId: '550e8400-e29b-41d4-a716-446655440000', datasetId: 'months', themeId: 'travel-in-japan' }),
  setResponseHeader: header,
}))
vi.mock('../server/utils/rate-limit', () => ({ checkRankingRateLimit: rateLimit, RateLimitUnavailableError: class extends Error {} }))
vi.mock('../server/utils/usage-limit', () => ({ reserveRankingUsage: reserve }))
vi.mock('../server/utils/jev', () => ({
  evaluateRanking: evaluate, JevProviderError: class extends Error {},
  JevResponseError: class extends Error {}, JevTimeoutError: class extends Error {},
}))

describe('ranking API cost guard', () => {
  beforeEach(() => { vi.clearAllMocks(); rateLimit.mockResolvedValue({ success: true }); reserve.mockResolvedValue({ success: true }) })
  it('never calls the provider when usage is exhausted', async () => {
    reserve.mockResolvedValue({ success: false, retryAfter: 900 })
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 503 })
    expect(header).toHaveBeenCalledWith({}, 'Retry-After', 900)
    expect(evaluate).not.toHaveBeenCalled()
  })
  it('never calls the provider if Redis is unavailable', async () => {
    reserve.mockRejectedValue(new Error('redis unavailable'))
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 503 })
    expect(evaluate).not.toHaveBeenCalled()
  })
  it('checks per-IP limits before consuming global budget', async () => {
    rateLimit.mockResolvedValue({ success: false, reset: Date.now() + 60000 })
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 429 })
    expect(reserve).not.toHaveBeenCalled()
    expect(evaluate).not.toHaveBeenCalled()
  })
  it('does not refund a reservation when the provider fails', async () => {
    evaluate.mockRejectedValue(new Error('provider unavailable'))
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 502 })
    expect(reserve).toHaveBeenCalledTimes(1)
    expect(evaluate).toHaveBeenCalledTimes(1)
    expect(reserve.mock.invocationCallOrder[0]).toBeLessThan(evaluate.mock.invocationCallOrder[0]!)
  })
})
