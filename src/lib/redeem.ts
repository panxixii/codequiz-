import { REDEEM_CODES } from '../data/redeemCodes'

export type RedeemResult =
  | { ok: true; code: string }
  | { ok: false; message: string }

const USED_KEY = 'codequiz.redeem.used'
const REQUEST_TIMEOUT_MS = 12_000

function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '')
}

function readUsedCodes(): Set<string> {
  try {
    const raw = localStorage.getItem(USED_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((item): item is string => typeof item === 'string'))
  } catch {
    return new Set()
  }
}

function markCodeUsed(code: string) {
  const used = readUsedCodes()
  used.add(code)
  localStorage.setItem(USED_KEY, JSON.stringify([...used]))
}

function isWorkersDevUrl(api: string): boolean {
  try {
    return new URL(api).hostname.endsWith('.workers.dev')
  } catch {
    return api.includes('.workers.dev')
  }
}

/** 本地校验；若配置了 VITE_REDEEM_API 则走云函数核销 */
export async function redeemCode(raw: string): Promise<RedeemResult> {
  const code = normalizeCode(raw)
  if (!code) {
    return { ok: false, message: '请输入兑换码' }
  }

  const api = import.meta.env.VITE_REDEEM_API as string | undefined
  if (api) {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    try {
      const response = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
        signal: controller.signal,
      })
      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; message?: string }
        | null
      if (!response.ok || !data?.ok) {
        return { ok: false, message: data?.message || '兑换码无效或已使用' }
      }
      return { ok: true, code }
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === 'AbortError'
      if (isWorkersDevUrl(api)) {
        return {
          ok: false,
          message: aborted
            ? '校验超时：兑换服务在国内常无法直连，请给 Worker 绑定自定义域名'
            : '无法连接兑换服务（*.workers.dev 在国内常被拦截），请绑定自定义域名后重试',
        }
      }
      return {
        ok: false,
        message: aborted ? '校验超时，请检查网络后重试' : '网络异常，请稍后重试',
      }
    } finally {
      window.clearTimeout(timer)
    }
  }

  const valid = REDEEM_CODES.map((item) => item.toUpperCase())
  if (!valid.includes(code)) {
    return { ok: false, message: '兑换码不正确' }
  }

  const used = readUsedCodes()
  if (used.has(code)) {
    return { ok: false, message: '该兑换码已使用' }
  }

  markCodeUsed(code)
  return { ok: true, code }
}
