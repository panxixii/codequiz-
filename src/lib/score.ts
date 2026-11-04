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

  // 友好策略：把相似度映射到 62–91，避免极端百分比
  const matchPercent = Math.min(91, Math.max(62, Math.round(top.score * 100 * 0.85 + 18)))

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
