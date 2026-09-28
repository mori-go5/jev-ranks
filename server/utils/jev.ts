import { typeSafeAi } from '@ai-sdk/typesafe-ai'
import { experimental_evaluate as evaluate } from 'ai'
import type { RankingDataset, RankingTheme } from '#shared/types/ranking'
import { buildRankingState, buildScoreQuestions, validateScoreAnswers } from '#shared/utils/ranking'

export const JEV_TIMEOUT_MS = 15_000

export class JevTimeoutError extends Error {}
export class JevProviderError extends Error {}
export class JevResponseError extends Error {}

export async function evaluateRanking(
  dataset: RankingDataset,
  theme: RankingTheme,
  evaluateFn: typeof evaluate = evaluate,
) {
  const startedAt = Date.now()
  const abortSignal = AbortSignal.timeout(JEV_TIMEOUT_MS)

  try {
    const result = await evaluateFn({
      model: typeSafeAi.evaluationModel('jev-latest'),
      state: buildRankingState(dataset, theme),
      questions: buildScoreQuestions(dataset, theme),
      abortSignal,
      maxRetries: 1,
    })

    return {
      scores: validateScoreAnswers(dataset.candidates, result.answers),
      decisionMs: Date.now() - startedAt,
      modelId: result.response.modelId,
    }
  }
  catch (error) {
    if (error instanceof JevResponseError) throw error
    if (abortSignal.aborted || (error instanceof Error && ['AbortError', 'TimeoutError'].includes(error.name))) {
      throw new JevTimeoutError('Jev evaluation timed out')
    }
    if (error instanceof Error && error.message === 'Invalid Jev response') {
      throw new JevResponseError('Jev returned invalid answers')
    }
    throw new JevProviderError('Jev evaluation failed')
  }
}