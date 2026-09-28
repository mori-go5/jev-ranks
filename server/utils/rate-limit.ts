import { createHash } from 'node:crypto'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const WINDOW_MS = 60_000
const MAX_REQUESTS = 10
const localRequests = new Map<string, number[]>()
let productionLimiter: Ratelimit | undefined

export class RateLimitUnavailableError extends Error {}

function anonymousKey(identifier: string): string {
  return createHash('sha256').update(identifier).digest('hex')
}

export async function checkRankingRateLimit(identifier: string) {
  const key = anonymousKey(identifier)
  const isProduction = process.env.NODE_ENV === 'production'
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (isProduction) {
    if (!redisUrl || !redisToken) throw new RateLimitUnavailableError('Production rate limiting is not configured')
    try {
      productionLimiter ??= new Ratelimit({
        redis: new Redis({ url: redisUrl, token: redisToken }),
        limiter: Ratelimit.slidingWindow(MAX_REQUESTS, '1 m'),
        prefix: 'jev-ranks:ranking',
        analytics: false,
      })
      const result = await productionLimiter.limit(key)
      return {
        success: result.success,
        remaining: result.remaining,
        reset: result.reset,
      }
    }
    catch {
      throw new RateLimitUnavailableError('Production rate limiting is unavailable')
    }
  }

  const now = Date.now()
  const recentRequests = (localRequests.get(key) ?? []).filter(timestamp => now - timestamp < WINDOW_MS)
  if (localRequests.size > 2_000) {
    for (const [storedKey, timestamps] of localRequests) {
      if (timestamps.every(timestamp => now - timestamp >= WINDOW_MS)) localRequests.delete(storedKey)
    }
  }
  if (recentRequests.length >= MAX_REQUESTS) {
    localRequests.set(key, recentRequests)
    return { success: false, remaining: 0, reset: recentRequests[0]! + WINDOW_MS }
  }

  recentRequests.push(now)
  localRequests.set(key, recentRequests)
  return { success: true, remaining: MAX_REQUESTS - recentRequests.length, reset: now + WINDOW_MS }
}
