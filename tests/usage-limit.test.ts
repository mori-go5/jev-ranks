import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reserveRankingUsage, UsageLimitUnavailableError } from '../server/utils/usage-limit'

const { evalMock } = vi.hoisted(() => ({ evalMock: vi.fn() }))
vi.mock('@upstash/redis', () => ({ Redis: class { eval = evalMock } }))

describe('global usage reservation', () => {
  beforeEach(() => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token')
    evalMock.mockReset().mockResolvedValue([1, 0, 0])
  })
  afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers() })

  it('reserves default limits atomically with UTC month boundaries', async () => {
    vi.useFakeTimers().setSystemTime(new Date('2026-12-31T23:59:59Z'))
    expect(await reserveRankingUsage()).toEqual({ success: true, retryAfter: 0, reason: 0 })
    expect(evalMock.mock.calls[0]![2]).toEqual([
      100, 2000, 20, Date.parse('2026-12-01T00:00:00Z') / 1000,
      Date.parse('2027-01-01T00:00:00Z') / 1000, 900,
    ])
  })
  it.each([[0, 900, 1], [0, 100, 2], [0, 1000, 3]])('returns denial %j', async (a, b, c) => {
    evalMock.mockResolvedValue([a, b, c])
    expect(await reserveRankingUsage()).toEqual({ success: false, retryAfter: b, reason: c })
  })
  it.each(['0', '-1', '1.5', '', 'NaN', 'Infinity'])('fails closed for invalid configuration %s', async (value) => {
    vi.stubEnv('RANKING_DAILY_LIMIT', value)
    await expect(reserveRankingUsage()).rejects.toBeInstanceOf(UsageLimitUnavailableError)
    expect(evalMock).not.toHaveBeenCalled()
  })
  it('fails closed without Redis even in development', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
    await expect(reserveRankingUsage()).rejects.toBeInstanceOf(UsageLimitUnavailableError)
  })
  it.each([[-1, 1, 0], null, [1], [0, -1, 2]])('fails closed on malformed or stale responses %j', async (response) => {
    evalMock.mockResolvedValue(response)
    await expect(reserveRankingUsage()).rejects.toBeInstanceOf(UsageLimitUnavailableError)
  })
  it('fails closed when Redis fails without leaking details', async () => {
    evalMock.mockRejectedValue(new Error('secret'))
    await expect(reserveRankingUsage()).rejects.toThrow('Usage limiting is unavailable')
  })
})
