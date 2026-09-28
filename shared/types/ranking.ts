export type RankingCandidate = {
  id: string
  label: string
  description?: string
  metadata?: Record<string, string>
}

export type RankingTheme = {
  id: string
  label: string
  instructions: string
  context?: string
}

export type RankingDataset = {
  id: string
  label: string
  description: string
  symbol: string
  candidates: RankingCandidate[]
  themes: RankingTheme[]
  defaultThemeId: string
}

export type RankingEntry = {
  rank: number
  candidate: RankingCandidate
  rawScore: number
  displayScore: number
}

export type RankingResult = {
  version: 1
  dataset: { id: string; label: string }
  theme: { id: string; label: string }
  entries: RankingEntry[]
  stats: {
    decisions: number
    jevRequests: number
    decisionMs: number
    modelId?: string
  }
}