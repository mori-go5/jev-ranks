import { describe, expect, it, vi } from 'vitest'
import type { experimental_evaluate as evaluate } from 'ai'
import { findDataset, findTheme } from '../shared/data/datasets'
import { JevProviderError, JevResponseError, JevTimeoutError, evaluateRanking } from '../server/utils/jev'

function responseFor(datasetId = 'japan-prefectures', answerFor: (id: string) => unknown = () => ({ type: 'score', score: 2.5 })) {
  const dataset = findDataset(datasetId)!
  return {
    answers: Object.fromEntries(dataset.candidates.map(candidate => [candidate.id, answerFor(candidate.id)])),
    response: { timestamp: new Date(), modelId: 'jev-latest' },
  } as Awaited<ReturnType<typeof evaluate>>
}

function mockEvaluator(result?: Awaited<ReturnType<typeof evaluate>>) {
  return vi.fn<(...args: Parameters<typeof evaluate>) => ReturnType<typeof evaluate>>()
    .mockResolvedValue(result ?? responseFor())
}

describe('Jev score adapter', () => {
  it('sends all 47 score questions through exactly one evaluation call', async () => {
    const dataset = findDataset('japan-prefectures')!
    const theme = findTheme(dataset, 'travel')!
    const evaluator = mockEvaluator()

    const result = await evaluateRanking(dataset, theme, evaluator)
    const call = evaluator.mock.calls[0]?.[0]

    expect(evaluator).toHaveBeenCalledTimes(1)
    expect(Object.keys(call?.questions ?? {})).toHaveLength(47)
    expect(call?.maxRetries).toBe(1)
    expect(call?.abortSignal).toBeInstanceOf(AbortSignal)
    expect(result.scores.size).toBe(47)
    expect(result.modelId).toBe('jev-latest')
  })

  it.each([
    ['missing answer', (id: string) => id === 'jp-01' ? undefined : { type: 'score', score: 2 }],
    ['NaN score', (id: string) => ({ type: 'score', score: id === 'jp-01' ? Number.NaN : 2 })],
    ['out-of-range score', (id: string) => ({ type: 'score', score: id === 'jp-01' ? 4.1 : 2 })],
    ['wrong answer type', (id: string) => ({ type: id === 'jp-01' ? 'choice' : 'score', score: 2 })],
    ['invalid probability', (id: string) => ({ type: 'score', score: 2, probabilities: id === 'jp-01' ? { low: 1.2 } : undefined })],
  ])('rejects a response with a %s', async (_case, answerFor) => {
    const dataset = findDataset('japan-prefectures')!
    const theme = findTheme(dataset, 'travel')!
    const evaluator = mockEvaluator(responseFor(dataset.id, answerFor))
    await expect(evaluateRanking(dataset, theme, evaluator)).rejects.toBeInstanceOf(JevResponseError)
  })

  it('maps provider failures and timeouts without exposing provider details', async () => {
    const dataset = findDataset('months')!
    const theme = findTheme(dataset, dataset.defaultThemeId)!
    const providerFailure = mockEvaluator().mockRejectedValue(new Error('private provider detail'))
    const timeout = mockEvaluator().mockRejectedValue(new DOMException('timeout', 'TimeoutError'))

    await expect(evaluateRanking(dataset, theme, providerFailure)).rejects.toBeInstanceOf(JevProviderError)
    await expect(evaluateRanking(dataset, theme, timeout)).rejects.toBeInstanceOf(JevTimeoutError)
  })
})