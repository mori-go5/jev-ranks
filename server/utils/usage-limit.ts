import { Redis } from '@upstash/redis'

export class UsageLimitUnavailableError extends Error {}

function positiveInteger(name: string, fallback: number): number {
  const raw = process.env[name]
  const value = raw === undefined ? fallback : Number(raw)
  if (!Number.isSafeInteger(value) || value <= 0) throw new UsageLimitUnavailableError(`Invalid ${name}`)
  return value
}

// All checks and reservation happen atomically, using Redis time rather than instance clocks.
// Keys use a shared hash tag; do not change the prefix on deployment (it would reset usage).
export const RESERVE_USAGE_SCRIPT = `
local now = tonumber(redis.call('TIME')[1])
if redis.call('EXISTS', KEYS[1]) == 1 then
  return {0, math.max(1, redis.call('TTL', KEYS[1])), 1}
end
local day = math.floor(now / 86400)
local dayReset = (day + 1) * 86400
local monthReset = tonumber(ARGV[5])
-- UTC month boundaries are provided by the caller, validated against Redis time.
if now < tonumber(ARGV[4]) or now >= monthReset then return {-1, 1, 0} end
local daily = 0
if redis.call('HGET', KEYS[2], 'period') == tostring(day) then daily = tonumber(redis.call('HGET', KEYS[2], 'count') or '0') end
local monthly = 0
if redis.call('HGET', KEYS[3], 'period') == ARGV[4] then monthly = tonumber(redis.call('HGET', KEYS[3], 'count') or '0') end
if monthly >= tonumber(ARGV[2]) then return {0, monthReset - now, 3} end
if daily >= tonumber(ARGV[1]) then return {0, dayReset - now, 2} end
local burst = tonumber(redis.call('GET', KEYS[4]) or '0')
if burst >= tonumber(ARGV[3]) then
  redis.call('SET', KEYS[1], 'burst', 'EX', ARGV[6])
  return {0, tonumber(ARGV[6]), 1}
end
redis.call('HSET', KEYS[2], 'period', tostring(day), 'count', daily + 1)
redis.call('EXPIREAT', KEYS[2], dayReset + 86400)
redis.call('HSET', KEYS[3], 'period', ARGV[4], 'count', monthly + 1)
redis.call('EXPIREAT', KEYS[3], monthReset + 86400)
local count = redis.call('INCR', KEYS[4])
if count == 1 then redis.call('EXPIRE', KEYS[4], 60) end
return {1, 0, 0}
`

export async function reserveRankingUsage() {
  try {
    // Intentionally required in development too: real API spending must never bypass the guard.
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN
    if (!url || !token) throw new UsageLimitUnavailableError('Usage limiting is not configured')
    const daily = positiveInteger('RANKING_DAILY_LIMIT', 100)
    const monthly = positiveInteger('RANKING_MONTHLY_LIMIT', 2_000)
    const burst = positiveInteger('RANKING_BURST_LIMIT', 20)
    const cooldown = positiveInteger('RANKING_COOLDOWN_SECONDS', 900)
    const now = new Date()
    const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) / 1_000
    const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1) / 1_000
    const result = await new Redis({ url, token, retry: { retries: 0 } }).eval<number[]>(
      RESERVE_USAGE_SCRIPT,
      ['jev-ranks:{usage}:stop', 'jev-ranks:{usage}:daily', 'jev-ranks:{usage}:monthly', 'jev-ranks:{usage}:burst'],
      [daily, monthly, burst, start, end, cooldown],
    )
    if (!Array.isArray(result) || result.length !== 3
      || ![0, 1].includes(result[0]!) || !Number.isSafeInteger(result[1]) || result[1]! < 0
      || ![0, 1, 2, 3].includes(result[2]!)) {
      throw new UsageLimitUnavailableError('Invalid usage reservation response')
    }
    return { success: result[0] === 1, retryAfter: result[1]!, reason: result[2]! }
  }
  catch {
    throw new UsageLimitUnavailableError('Usage limiting is unavailable')
  }
}
