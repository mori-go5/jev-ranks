import type { RankingCandidate } from '#shared/types/ranking'

export const MIN_CUSTOM_ITEMS = 3
export const MAX_CUSTOM_ITEMS = 30
export const MAX_CUSTOM_ITEM_LENGTH = 40

export function parseCustomItems(value: string): string[] {
  return value.split(/\r?\n/).map(item => item.trim().normalize('NFKC')).filter(Boolean)
}

export function validateCustomItemLabels(labels: string[]): string | null {
  if (labels.length < MIN_CUSTOM_ITEMS) return `${MIN_CUSTOM_ITEMS}項目以上入力してください。`
  if (labels.length > MAX_CUSTOM_ITEMS) return `${MAX_CUSTOM_ITEMS}項目以内で入力してください。`
  if (labels.some(label => label.length > MAX_CUSTOM_ITEM_LENGTH)) return `1項目は${MAX_CUSTOM_ITEM_LENGTH}文字以内にしてください。`
  if (labels.some(label => /\p{Cc}/u.test(label))) return '改行などの制御文字は使用できません。'
  if (new Set(labels).size !== labels.length) return '同じ項目が重複しています。'
  return null
}

export function makeCustomCandidates(labels: string[]): RankingCandidate[] {
  return labels.map((label, index) => ({ id: `custom-${String(index + 1).padStart(2, '0')}`, label }))
}
