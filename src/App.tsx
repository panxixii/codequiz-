import { useState } from 'react'
import { StartScreen } from './components/StartScreen'
import { RedeemScreen } from './components/RedeemScreen'
import { QuizScreen } from './components/QuizScreen'
import { ResultScreen } from './components/ResultScreen'
import { pickRandomBackground } from './data/backgrounds'
import { QUESTIONS } from './data/questions'
import { calculateResult, type AnswerMap, type QuizResult } from './lib/score'

type Phase = 'start' | 'redeem' | 'quiz' | 'result'

export default function App() {
  const [phase, setPhase] = useState<Phase>('start')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [result, setResult] = useState<QuizResult | null>(null)
  const [redeemedCode, setRedeemedCode] = useState<string | null>(null)
  const [backgroundUrl] = useState(() => pickRandomBackground())

  function resetAll() {
    setPhase('start')
    setStep(0)
    setAnswers({})
    setResult(null)
    setRedeemedCode(null)
  }

  function handleStart() {
    setPhase('redeem')
  }

  function handleRedeemSuccess(code: string) {
    setRedeemedCode(code)
    setPhase('quiz')
    setStep(0)
    setAnswers({})
    setResult(null)
  }

  function handleBack() {
    if (step === 0) {
      // 已核销的码不退回输码页，避免重复消耗；回首页需重新兑码
      setPhase('start')
      return
    }
    setStep((current) => current - 1)
  }

  function handleAnswer(questionId: string, optionId: string) {
    const nextAnswers = { ...answers, [questionId]: optionId }
    setAnswers(nextAnswers)

    if (step >= QUESTIONS.length - 1) {
      setResult(calculateResult(nextAnswers))
      setPhase('result')
      return
    }

    window.setTimeout(() => {
      setStep((current) => current + 1)
    }, 160)
  }

  return (
    <div
      className="app-shell"
      style={{ ['--page-bg' as string]: `url('${backgroundUrl}')` }}
    >
      <main className="app-frame">
        {phase === 'start' ? <StartScreen onStart={handleStart} /> : null}
        {phase === 'redeem' ? <RedeemScreen onSuccess={handleRedeemSuccess} /> : null}
        {phase === 'quiz' && redeemedCode ? (
          <QuizScreen step={step} answers={answers} onAnswer={handleAnswer} onBack={handleBack} />
        ) : null}
        {phase === 'result' && result ? (
          <ResultScreen result={result} onRetake={resetAll} />
        ) : null}
      </main>
    </div>
  )
}
