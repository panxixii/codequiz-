import { FIGURE_LIST, type Figure, type FigureId } from '../data/figures'
import { QUESTIONS } from '../data/questions'
import {
  addTraits,
  cosineSimilarity,
  emptyTraits,
  type TraitVector,
} from '../data/traits'

export type AnswerMap = Record<string, string>

export type QuizResult = {
  primary: Figure
  secondary: Figure | null
  scores: Record<FigureId, number>
  matchPercent: number
  encouragement: string
}

const ENCOURAGEMENTS = [
  '你的选择很有你的味道——这就是最动人的答案。',
  '没有标准人格，只有正在发光的你。',
  '历史人物是镜子，照见的是你已经具备的力量。',
  '测的是气质，不是命运。你依然可以成为更好的自己。',
]

function buildUserTraits(answers: AnswerMap): TraitVector {
  let traits = emptyTraits()
  for (const question of QUESTIONS) {
    const optionId = answers[question.id]
    const option = question.options.find((item) => item.id === optionId)
    if (!option) continue
    traits = addTraits(traits, option.weights)
  }
  return traits
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/** 由答案生成稳定的 0–1 抖动，同一组答案结果恒定，不同答案略有差异 */
function answerJitter(answers: AnswerMap): number {
  let hash = 2166136261
  for (const question of QUESTIONS) {
    const text = `${question.id}:${answers[question.id] ?? ''};`
    for (let i = 0; i < text.length; i++) {
      hash = Math.imul(hash ^ text.charCodeAt(i), 16777619)
    }
  }
  return ((hash >>> 0) % 1000) / 999
}

/**
 * 匹配度：综合三项，经 logistic 曲线连续映射到 0.01–99.99（两位小数）。
 * - 绝对贴合：最高余弦相似度（特质均为正，余弦天然偏高，故用 0.93–0.995 区间拉开）
 * - 相对突出：最高分在全体人物分布中的 z 分数
 * - 领先优势：相对第二名的差距
 * 再叠加小幅答案确定性抖动。
 */
function computeMatchPercent(sortedScores: number[], answers: AnswerMap): number {
  const [top, second = 0] = sortedScores
  const mean = sortedScores.reduce((sum, v) => sum + v, 0) / sortedScores.length
  const variance = sortedScores.reduce((sum, v) => sum + (v - mean) ** 2, 0) / sortedScores.length
  const z = variance > 0 ? (top - mean) / Math.sqrt(variance) : 0

  // fit / standout 不截断上限，让极端契合或极端不契合能进入曲线两端
  const fit = (top - 0.93) / (0.995 - 0.93)
  const standout = (z - 1.2) / (2.4 - 1.2)
  const lead = clamp01((top - second) / 0.02)

  const blended = fit * 0.5 + standout * 0.35 + lead * 0.15 + (answerJitter(answers) - 0.5) * 0.06
  const logistic = 1 / (1 + Math.exp(-(blended - 0.45) * 12))
  const percent = Math.round(logistic * 10000) / 100
  return Math.min(99.99, Math.max(0.01, percent))
}

/** 特质向量余弦相似度匹配；接近时带出第二名「也很像」 */
export function calculateResult(answers: AnswerMap): QuizResult {
  const userTraits = buildUserTraits(answers)

  const ranked = FIGURE_LIST.map((figure) => ({
    figure,
    score: cosineSimilarity(userTraits, figure.traits),
  })).sort((a, b) => b.score - a.score || a.figure.name.localeCompare(b.figure.name, 'zh'))

  const top = ranked[0]
  const second = ranked[1]
  const scores = Object.fromEntries(
    ranked.map((item) => [item.figure.id, item.score]),
  ) as Record<FigureId, number>

  const matchPercent = computeMatchPercent(
    ranked.map((item) => item.score),
    answers,
  )

  const showSecondary =
    second && top.score > 0 && second.score / top.score >= 0.965 ? second.figure : null

  const encouragement =
    ENCOURAGEMENTS[
      (Math.round(top.score * 1000) + Object.keys(answers).length) % ENCOURAGEMENTS.length
    ]

  return {
    primary: top.figure,
    secondary: showSecondary,
    scores,
    matchPercent,
    encouragement,
  }
}
