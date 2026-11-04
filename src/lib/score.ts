import { FIGURE_LIST, type Figure, type FigureId } from '../data/figures'
import { QUESTIONS } from '../data/questions'
import { IDEAL_PATHS } from '../data/idealPaths'
import {
  TRAIT_IDS,
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

function optionTraits(questionIndex: number, optionId: string | undefined): TraitVector | null {
  const option = QUESTIONS[questionIndex].options.find((item) => item.id === optionId)
  return option ? addTraits(emptyTraits(), option.weights) : null
}

function buildUserTraits(answers: AnswerMap): TraitVector {
  let traits = emptyTraits()
  QUESTIONS.forEach((question, qi) => {
    const option = optionTraits(qi, answers[question.id])
    if (option) traits = addTraits(traits, option)
  })
  return traits
}

/** 减去自身均值后的余弦：消除「特质全为正 → 余弦普遍偏高、偏爱平均型人物」的偏差 */
function centeredCosine(a: TraitVector, b: TraitVector): number {
  const center = (v: TraitVector) => {
    const mean = TRAIT_IDS.reduce((sum, key) => sum + v[key], 0) / TRAIT_IDS.length
    return addTraits(emptyTraits(), Object.fromEntries(TRAIT_IDS.map((k) => [k, v[k] - mean])))
  }
  return cosineSimilarity(center(a), center(b))
}

/**
 * 题目贴合度：用户在第 q 题选的选项 与 人物理想选项 的特质余弦。
 * 选得一样 = 1；不同但特质相近（如主/副特质重合）得部分分；毫不相干 = 0。
 */
function figureAgreement(answers: AnswerMap, idealPath: string): number {
  let total = 0
  QUESTIONS.forEach((question, qi) => {
    const mine = optionTraits(qi, answers[question.id])
    const ideal = optionTraits(qi, idealPath[qi])
    if (!mine || !ideal) return
    total += answers[question.id] === idealPath[qi] ? 1 : cosineSimilarity(mine, ideal)
  })
  return total / QUESTIONS.length
}

/**
 * 任意一组答案下「第一名贴合度」的最低可能值（全部 4^10 组答案穷举得出）。
 * 由 scripts/verify-reachability.mjs 计算并校验；人物或题目权重变动后需同步更新。
 */
export const MATCH_FLOOR = 0.4

/**
 * 匹配度 70.00–99.99（两位小数）：按第一名贴合度在 [MATCH_FLOOR, 1] 上线性映射。
 * 只有完全走对该人物的理想路径（贴合度 = 1）才是 99.99。
 */
export function agreementToPercent(agreement: number): number {
  if (agreement >= 1 - 1e-9) return 99.99
  const t = Math.min(1, Math.max(0, (agreement - MATCH_FLOOR) / (1 - MATCH_FLOOR)))
  const percent = Math.round((70 + 29.99 * t) * 100) / 100
  return Math.min(99.98, Math.max(70, percent))
}

/**
 * 每位人物 = 一条理想答题路径（其特质向量即该路径累加的特质）。
 * 主排序：逐题贴合度均值；并列时按居中特质余弦、再按姓名决出。
 */
export function calculateResult(answers: AnswerMap): QuizResult {
  const userTraits = buildUserTraits(answers)
  const ranked = FIGURE_LIST.map((figure) => ({
    figure,
    score: figureAgreement(answers, IDEAL_PATHS[figure.id]),
    tie: centeredCosine(userTraits, figure.traits),
  })).sort(
    (a, b) =>
      b.score - a.score || b.tie - a.tie || a.figure.name.localeCompare(b.figure.name, 'zh'),
  )
  const top = ranked[0]
  const second = ranked[1]
  const scores = Object.fromEntries(
    ranked.map((item) => [item.figure.id, item.score]),
  ) as Record<FigureId, number>

  const matchPercent = agreementToPercent(top.score)

  const showSecondary =
    second && top.score > 0 && top.score - second.score <= 0.03 ? second.figure : null

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
