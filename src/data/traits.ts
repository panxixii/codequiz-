/** 答题先累加特质，再与人物向量匹配，便于扩展到上百人 */
export const TRAIT_IDS = [
  'creativity',
  'resilience',
  'wisdom',
  'courage',
  'empathy',
  'discipline',
  'exploration',
  'expression',
  'aesthetics',
  'pragmatism',
] as const

export type TraitId = (typeof TRAIT_IDS)[number]

export type TraitVector = Record<TraitId, number>

export function emptyTraits(): TraitVector {
  return {
    creativity: 0,
    resilience: 0,
    wisdom: 0,
    courage: 0,
    empathy: 0,
    discipline: 0,
    exploration: 0,
    expression: 0,
    aesthetics: 0,
    pragmatism: 0,
  }
}

export function addTraits(base: TraitVector, delta: Partial<TraitVector>, factor = 1): TraitVector {
  const next = { ...base }
  for (const key of TRAIT_IDS) {
    next[key] += (delta[key] ?? 0) * factor
  }
  return next
}

export function cosineSimilarity(a: TraitVector, b: TraitVector): number {
  let dot = 0
  let normA = 0
  let normB = 0
  for (const key of TRAIT_IDS) {
    dot += a[key] * b[key]
    normA += a[key] * a[key]
    normB += b[key] * b[key]
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}
