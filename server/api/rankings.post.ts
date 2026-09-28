import { createError, defineEventHandler, getRequestHeader, getRequestIP, readRawBody, setResponseHeader } from 'h3'
import { evaluateRanking, JevProviderError, JevResponseError, JevTimeoutError } from '../utils/jev'
import { RateLimitUnavailableError, checkRankingRateLimit } from '../utils/rate-limit'
import { validateRankingRequest, RankingRequestError } from '../utils/validation'
import { sortRankingEntries } from '#shared/utils/ranking'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'X-Robots-Tag', 'noindex, nofollow')
  const maximumBodyBytes = 8_192
  const contentLength = Number(getRequestHeader(event, 'content-length') ?? 0)
  if (contentLength > maximumBodyBytes) throw createError({ statusCode: 413, statusMessage: 'Request too large' })

  let request: ReturnType<typeof validateRankingRequest>
  try {
    const rawBody = await readRawBody(event, 'utf8')
    if (!rawBody || new TextEncoder().encode(rawBody).byteLength > maximumBodyBytes) {
      throw new RankingRequestError('Request too large')
    }
    request = validateRankingRequest(JSON.parse(rawBody))
  }
  catch (error) {
    if (error instanceof RankingRequestError) {
      throw createError({ statusCode: 400, statusMessage: error.message })
    }
    throw createError({ statusCode: 400, statusMessage: 'Invalid ranking request' })
  }

  let limit: Awaited<ReturnType<typeof checkRankingRateLimit>>
  try {
    // 本番ではVercelが付与する接続元IPを匿名化して使い、UUIDの変更による制限回避を防ぎます。
    const forwardedIp = getRequestHeader(event, 'x-vercel-forwarded-for')?.split(',')[0]?.trim()
    const rateLimitIdentifier = forwardedIp || getRequestIP(event) || request.clientId
    limit = await checkRankingRateLimit(rateLimitIdentifier)
  }
  catch (error) {
    if (error instanceof RateLimitUnavailableError) {
      throw createError({ statusCode: 503, statusMessage: 'Ranking service temporarily unavailable' })
    }
    throw createError({ statusCode: 503, statusMessage: 'Ranking service temporarily unavailable' })
  }
  if (!limit.success) {
    setResponseHeader(event, 'Retry-After', Math.max(1, Math.ceil((limit.reset - Date.now()) / 1_000)))
    throw createError({ statusCode: 429, statusMessage: 'Too many rankings' })
  }

  try {
    const evaluation = await evaluateRanking(request.dataset, request.theme)
    return {
      version: 1 as const,
      dataset: { id: request.dataset.id, label: request.dataset.label },
      theme: { id: request.theme.id, label: request.theme.label },
      entries: sortRankingEntries(request.dataset.candidates, evaluation.scores),
      stats: {
        decisions: request.dataset.candidates.length,
        jevRequests: 1,
        decisionMs: evaluation.decisionMs,
        modelId: evaluation.modelId,
      },
    }
  }
  catch (error) {
    if (error instanceof JevTimeoutError) {
      throw createError({ statusCode: 504, statusMessage: 'Jev timed out' })
    }
    if (error instanceof JevProviderError || error instanceof JevResponseError) {
      throw createError({ statusCode: 502, statusMessage: 'Jev could not complete this ranking' })
    }
    throw createError({ statusCode: 502, statusMessage: 'Jev could not complete this ranking' })
  }
})
