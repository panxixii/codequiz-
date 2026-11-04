import { QUESTIONS } from '../data/questions'
import type { AnswerMap } from '../lib/score'

type QuizScreenProps = {
  step: number
  answers: AnswerMap
  onAnswer: (questionId: string, optionId: string) => void
  onBack: () => void
}

const MID_NUDGES = [
  '很好，你的气质正在慢慢显影。',
  '没有对错，选最像「现在的你」就好。',
  '再几题，专属画像就齐了。',
]

export function QuizScreen({ step, answers, onAnswer, onBack }: QuizScreenProps) {
  const question = QUESTIONS[step]
  const progress = ((step + 1) / QUESTIONS.length) * 100
  const nudge = step > 0 && step % 3 === 0 ? MID_NUDGES[step % MID_NUDGES.length] : null

  return (
    <section className="scroll-panel quiz-card">
      <div className="quiz-top">
        <button
          type="button"
          className="ghost-btn"
          style={{ minHeight: '2.4rem', padding: '0.4rem 0.8rem' }}
          onClick={onBack}
        >
          {step === 0 ? '回首页' : '上一题'}
        </button>
        <span className="step-label">
          {String(step + 1).padStart(2, '0')} / {String(QUESTIONS.length).padStart(2, '0')}
        </span>
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <p className={`nudge${nudge ? '' : ' is-empty'}`} aria-hidden={nudge ? undefined : true}>
        {nudge ?? '\u00A0'}
      </p>

      <h2 className="question-title">{question.text}</h2>

      <div className="option-list">
        {question.options.map((option, index) => {
          const selected = answers[question.id] === option.id
          return (
            <button
              key={option.id}
              type="button"
              className={`option-btn${selected ? ' is-selected' : ''}`}
              onClick={() => onAnswer(question.id, option.id)}
            >
              <span className="option-index">{String.fromCharCode(65 + index)}</span>
              <span>{option.label}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
