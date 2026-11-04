export interface Env {
  /** 使用次数与有效码：uses:CODE / valid:CODE / 旧版 used:CODE */
  REDEEM_USED: KVNamespace
  /**
   * 有效码配置，可在 Cloudflare 控制台 Variables 里改。
   * 格式示例：
   *   1111:3,2222:5,3333
   * 含义：
   *   1111 最多用 3 次
   *   2222 最多用 5 次
   *   3333 未写次数 = 默认 1 次
   */
  VALID_CODES?: string
  ADMIN_TOKEN?: string
}

type JsonBody = {
  code?: string
  codes?: string[]
  token?: string
}

type CodeRule = {
  code: string
  limit: number
}

function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json; charset=utf-8')
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return new Response(JSON.stringify(data), { ...init, headers })
}

function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '')
}

/** 解析 VALID_CODES：支持 1111 / 1111:3 / 中英文逗号、空格、换行 */
function parseCodeRules(env: Env): Map<string, number> {
  const raw = env.VALID_CODES?.trim()
  const map = new Map<string, number>()
  if (!raw) return map

  for (const part of raw.split(/[,，\n]+/)) {
    const token = part.trim()
    if (!token) continue

    // 允许 "1111:3" 或 "1111：3"
    const matched = /^(.+?)[:：]\s*(\d+)\s*$/.exec(token)
    if (matched) {
      const code = normalizeCode(matched[1])
      const limit = Math.max(1, Number.parseInt(matched[2], 10) || 1)
      if (code) map.set(code, limit)
      continue
    }

    const code = normalizeCode(token)
    if (code) map.set(code, 1)
  }

  return map
}

async function resolveRule(env: Env, code: string): Promise<CodeRule | null> {
  const rules = parseCodeRules(env)
  if (rules.size > 0) {
    const limit = rules.get(code)
    if (!limit) return null
    return { code, limit }
  }

  // 未配 VALID_CODES 时，认 KV 里的 valid:CODE（可选带次数 valid:CODE = "5"）
  const record = await env.REDEEM_USED.get(`valid:${code}`)
  if (!record) return null
  const limit = Math.max(1, Number.parseInt(record, 10) || 1)
  return { code, limit }
}

async function getUsedCount(env: Env, code: string): Promise<number> {
  const usesRaw = await env.REDEEM_USED.get(`uses:${code}`)
  if (usesRaw != null) {
    return Math.max(0, Number.parseInt(usesRaw, 10) || 0)
  }

  // 兼容旧版：used:CODE 表示已用完 1 次额度
  const legacy = await env.REDEEM_USED.get(`used:${code}`)
  if (legacy) return 1

  return 0
}

async function redeem(env: Env, rawCode: string): Promise<Response> {
  const code = normalizeCode(rawCode)
  if (!code) {
    return json({ ok: false, message: '请输入兑换码' }, { status: 400 })
  }

  const rule = await resolveRule(env, code)
  if (!rule) {
    return json({ ok: false, message: '兑换码不正确' }, { status: 400 })
  }

  const used = await getUsedCount(env, code)
  if (used >= rule.limit) {
    return json(
      {
        ok: false,
        message: rule.limit <= 1 ? '该兑换码已使用' : '该兑换码次数已用完',
        used,
        limit: rule.limit,
      },
      { status: 409 },
    )
  }

  const next = used + 1
  await env.REDEEM_USED.put(`uses:${code}`, String(next))

  return json({
    ok: true,
    code,
    used: next,
    limit: rule.limit,
    remaining: Math.max(0, rule.limit - next),
  })
}

async function importCodes(env: Env, body: JsonBody): Promise<Response> {
  if (!env.ADMIN_TOKEN) {
    return json({ ok: false, message: '未配置 ADMIN_TOKEN' }, { status: 503 })
  }
  if (body.token !== env.ADMIN_TOKEN) {
    return json({ ok: false, message: '无权操作' }, { status: 401 })
  }

  const codes = (body.codes ?? []).map(normalizeCode).filter(Boolean)
  if (codes.length === 0) {
    return json({ ok: false, message: 'codes 不能为空' }, { status: 400 })
  }

  // 导入时默认 1 次；若要多次，请直接在 VALID_CODES 用 码:次数
  await Promise.all(codes.map((code) => env.REDEEM_USED.put(`valid:${code}`, '1')))
  return json({ ok: true, imported: codes.length })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return json({ ok: true })
    }

    const url = new URL(request.url)

    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
      return json({ ok: true, service: 'codequiz-redeem' })
    }

    if (request.method !== 'POST') {
      return json({ ok: false, message: 'Method Not Allowed' }, { status: 405 })
    }

    let body: JsonBody = {}
    try {
      body = (await request.json()) as JsonBody
    } catch {
      return json({ ok: false, message: '请求体必须是 JSON' }, { status: 400 })
    }

    if (url.pathname === '/admin/import') {
      return importCodes(env, body)
    }

    if (url.pathname === '/' || url.pathname === '/redeem') {
      return redeem(env, body.code ?? '')
    }

    return json({ ok: false, message: 'Not Found' }, { status: 404 })
  },
}
