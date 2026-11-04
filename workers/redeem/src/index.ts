export interface Env {
  /** 已核销兑换码：key = CODE, value = ISO 时间 */
  REDEEM_USED: KVNamespace
  /** 可选：逗号分隔有效码；不配则只认 KV 里 status=valid 的码 */
  VALID_CODES?: string
  /** 可选：管理接口密钥，用于批量导入有效码 */
  ADMIN_TOKEN?: string
}

type JsonBody = {
  code?: string
  codes?: string[]
  token?: string
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

function parseValidCodes(env: Env): Set<string> {
  const raw = env.VALID_CODES?.trim()
  if (!raw) return new Set()
  return new Set(
    raw
      .split(/[,，\s]+/)
      .map((item) => normalizeCode(item))
      .filter(Boolean),
  )
}

async function isCodeValid(env: Env, code: string): Promise<boolean> {
  const listed = parseValidCodes(env)
  if (listed.size > 0) return listed.has(code)

  const record = await env.REDEEM_USED.get(`valid:${code}`)
  return record === '1'
}

async function redeem(env: Env, rawCode: string): Promise<Response> {
  const code = normalizeCode(rawCode)
  if (!code) {
    return json({ ok: false, message: '请输入兑换码' }, { status: 400 })
  }

  const valid = await isCodeValid(env, code)
  if (!valid) {
    return json({ ok: false, message: '兑换码不正确' }, { status: 400 })
  }

  const usedKey = `used:${code}`
  const already = await env.REDEEM_USED.get(usedKey)
  if (already) {
    return json({ ok: false, message: '该兑换码已使用' }, { status: 409 })
  }

  // KV 无强一致事务；常规流量下「先读后写」足够。高并发可再换 Durable Object。
  await env.REDEEM_USED.put(usedKey, new Date().toISOString())

  return json({ ok: true, code })
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

    // 默认核销：POST / 或 POST /redeem
    if (url.pathname === '/' || url.pathname === '/redeem') {
      return redeem(env, body.code ?? '')
    }

    return json({ ok: false, message: 'Not Found' }, { status: 404 })
  },
}
