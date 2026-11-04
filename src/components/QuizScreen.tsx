import { QUESTIONS } from '../data/questions'
import type { AnswerMap } from '../lib/score'

type QuizScreenProps = {
  step: number
  answers: AnswerMap
  onAnswer: (questionId: string, optionId: string) => void
  onBack: () => void
}

export function QuizScreen({ step, answers, onAnswer, onBack }: QuizScreenProps) {
  const question = QUESTIONS[step]
  const progress = ((step + 1) / QUESTIONS.length) * 100

  return (
    <section className="scroll-panel quiz-card">
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

      <div className="quiz-progress">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="quiz-step">
          {/* 第一题无上一题，保留占位避免页码跳动 */}
          <button
            type="button"
            className="step-back"
            onClick={onBack}
            disabled={step === 0}
            aria-hidden={step === 0 ? true : undefined}
            aria-label="上一题"
          >
            ‹
          </button>
          <span className="step-label">
            {String(step + 1).padStart(2, '0')} / {String(QUESTIONS.length).padStart(2, '0')}
          </span>
        </div>
      </div>
    </section>
  )
}
