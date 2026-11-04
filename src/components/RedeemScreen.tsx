import { useState, type FormEvent } from 'react'
import { redeemCode } from '../lib/redeem'

type RedeemScreenProps = {
  onSuccess: (code: string) => void
}

const USING_CLOUD = Boolean(import.meta.env.VITE_REDEEM_API)

export function RedeemScreen({ onSuccess }: RedeemScreenProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (loading) return
    setError(null)
    setLoading(true)
    try {
      const result = await redeemCode(code)
      if (!result.ok) {
        setError(result.message)
        return
      }
      onSuccess(result.code)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="scroll-panel cover-panel rise-in">
      <form className="redeem-body" onSubmit={handleSubmit}>
        <p className="cover-ornament" aria-hidden>
          ◆
        </p>
        <h1 className="redeem-title">输入兑换码</h1>
        <p className="cover-line" aria-hidden />
        <p className="redeem-caption">验证通过后即可开始测试</p>
        <p className={`redeem-mode ${USING_CLOUD ? 'is-cloud' : 'is-local'}`}>
          {USING_CLOUD ? '核销方式：云端（全网一次）' : '核销方式：本地演示（仅本浏览器）'}
        </p>

        <label className="redeem-field">
          <span className="redeem-label">兑换码</span>
          <input
            className="redeem-input"
            value={code}
            onChange={(event) => {
              setCode(event.target.value)
              if (error) setError(null)
            }}
            placeholder="请输入兑换码"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="off"
            inputMode="text"
            disabled={loading}
          />
        </label>

        {error ? <p className="redeem-error">{error}</p> : <p className="redeem-error is-empty">占位</p>}

        <button type="submit" className="primary-btn" disabled={loading || !code.trim()}>
          {loading ? '校验中…' : '开始测试'}
        </button>
      </form>
    </section>
  )
}
