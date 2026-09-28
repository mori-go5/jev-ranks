import type { RankingCandidate, RankingDataset, RankingEntry, RankingTheme } from '#shared/types/ranking'

export const scoreCriteria = [
  'Does not fit the theme',
  'Fits the theme only slightly',
  'Fits the theme somewhat',
  'Fits the theme well',
  'Fits the theme exceptionally well',
] as const

export const maximumRawScore = scoreCriteria.length - 1

export function buildScoreQuestions(dataset: RankingDataset, theme: RankingTheme) {
  return Object.fromEntries(dataset.candidates.map(candidate => [
    candidate.id,
    {
      type: 'score' as const,
      instructions: [
        `Evaluate how well this candidate fits the ranking theme: ${theme.label}.`,
        `Candidate: ${candidate.label}.`,
        theme.instructions,
        'Use generally established information and apply the same standard to every candidate.',
        'Evaluate candidates independently; do not force unique scores.',
      ].join(' '),
      criteria: [...scoreCriteria],
    },
  ]))
}

export function buildRankingState(dataset: RankingDataset, theme: RankingTheme) {
  return {
    rankingDataset: dataset.label,
    rankingTheme: theme.label,
    rankingContext: theme.context ?? null,
    candidateLabels: dataset.candidates.map(candidate => candidate.label),
    evaluationRule: 'Evaluate every candidate independently using the same standard. Do not force unique scores.',
  }
}

export function validateScoreAnswers(
  candidates: RankingCandidate[],
  answers: unknown,
): Map<string, number> {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    throw new Error('Invalid Jev response')
  }

  const answerRecord = answers as Record<string, unknown>
  const candidateIds = new Set(candidates.map(candidate => candidate.id))
  if (Object.keys(answerRecord).length !== candidateIds.size) {
    throw new Error('Invalid Jev response')
  }

  const validated = new Map<string, number>()
  for (const candidate of candidates) {
    const answer = answerRecord[candidate.id]
    if (!answer || typeof answer !== 'object' || Array.isArray(answer)) {
      throw new Error('Invalid Jev response')
    }

    const record = answer as Record<string, unknown>
    if (record.type !== 'score' || typeof record.score !== 'number') {
      throw new Error('Invalid Jev response')
    }
    if (!Number.isFinite(record.score) || record.score < 0 || record.score > maximumRawScore) {
      throw new Error('Invalid Jev response')
    }
    if (record.probabilities !== undefined) {
      if (!record.probabilities || typeof record.probabilities !== 'object' || Array.isArray(record.probabilities)) {
        throw new Error('Invalid Jev response')
      }
      for (const probability of Object.values(record.probabilities as Record<string, unknown>)) {
        if (typeof probability !== 'number' || !Number.isFinite(probability) || probability < 0 || probability > 1) {
          throw new Error('Invalid Jev response')
        }
      }
    }
    validated.set(candidate.id, record.score)
  }

  if (Object.keys(answerRecord).some(id => !candidateIds.has(id))) {
    throw new Error('Invalid Jev response')
  }
  return validated
}

export function sortRankingEntries(candidates: RankingCandidate[], scores: Map<string, number>): RankingEntry[] {
  const sorted = candidates
    .map((candidate, index) => ({ candidate, index, rawScore: scores.get(candidate.id) }))
    .sort((left, right) => (right.rawScore ?? -1) - (left.rawScore ?? -1) || left.index - right.index)

  let previousScore: number | undefined
  let rank = 0
  return sorted.map(({ candidate, rawScore }, index) => {
    if (rawScore === undefined || !Number.isFinite(rawScore)) {
      throw new Error('Missing candidate score')
    }
    if (previousScore !== rawScore) rank = index + 1
    previousScore = rawScore
    return {
      rank,
      candidate,
      rawScore,
      displayScore: (rawScore / maximumRawScore) * 100,
    }
  })
}