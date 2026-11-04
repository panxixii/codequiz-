export interface Env {
  REDEEM_USED: KVNamespace
  /**
   * 可选固定码（控制台 Variables）：
   * 1111:3,2222:5
   * 动态生成的码存在 KV，不必写在这里。
   */
  VALID_CODES?: string
  /** 管理页密钥：npx wrangler secret put ADMIN_TOKEN */
  ADMIN_TOKEN?: string
}

type JsonBody = {
  code?: string
  codes?: string[]
  token?: string
  limit?: number
  count?: number
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

function html(content: string, status = 200): Response {
  return new Response(content, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '')
}

function parseEnvRules(env: Env): Map<string, number> {
  const raw = env.VALID_CODES?.trim()
  const map = new Map<string, number>()
  if (!raw) return map

  for (const part of raw.split(/[,，\n]+/)) {
    const token = part.trim()
    if (!token) continue
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

function randomCode(length = 8): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  let out = ''
  for (const b of bytes) out += alphabet[b % alphabet.length]
  return out
}

async function resolveRule(env: Env, code: string): Promise<CodeRule | null> {
  const envRules = parseEnvRules(env)
  if (envRules.has(code)) {
    return { code, limit: envRules.get(code)! }
  }

  const record = await env.REDEEM_USED.get(`valid:${code}`)
  if (!record) return null
  const limit = Math.max(1, Number.parseInt(record, 10) || 1)
  return { code, limit }
}

async function getUsedCount(env: Env, code: string): Promise<number> {
  const usesRaw = await env.REDEEM_USED.get(`uses:${code}`)
  if (usesRaw != null) return Math.max(0, Number.parseInt(usesRaw, 10) || 0)

  const legacy = await env.REDEEM_USED.get(`used:${code}`)
  if (legacy) return 1
  return 0
}

function readToken(request: Request, body: JsonBody): string {
  const header = request.headers.get('Authorization')
  if (header?.toLowerCase().startsWith('bearer ')) {
    return header.slice(7).trim()
  }
  return (body.token ?? '').trim()
}

function assertAdmin(env: Env, token: string): Response | null {
  if (!env.ADMIN_TOKEN) {
    return json({ ok: false, message: '未配置 ADMIN_TOKEN，请先 wrangler secret put ADMIN_TOKEN' }, { status: 503 })
  }
  if (!token || token !== env.ADMIN_TOKEN) {
    return json({ ok: false, message: '管理密钥错误' }, { status: 401 })
  }
  return null
}

async function redeem(env: Env, rawCode: string): Promise<Response> {
  const code = normalizeCode(rawCode)
  if (!code) return json({ ok: false, message: '请输入兑换码' }, { status: 400 })

  const rule = await resolveRule(env, code)
  if (!rule) return json({ ok: false, message: '兑换码不正确' }, { status: 400 })

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

async function listCodes(env: Env): Promise<
  { code: string; limit: number; used: number; remaining: number; source: 'env' | 'kv' }[]
> {
  const result: { code: string; limit: number; used: number; remaining: number; source: 'env' | 'kv' }[] = []
  const seen = new Set<string>()

  for (const [code, limit] of parseEnvRules(env)) {
    const used = await getUsedCount(env, code)
    result.push({
      code,
      limit,
      used,
      remaining: Math.max(0, limit - used),
      source: 'env',
    })
    seen.add(code)
  }

  let cursor: string | undefined
  do {
    const page = await env.REDEEM_USED.list({ prefix: 'valid:', cursor, limit: 1000 })
    for (const key of page.keys) {
      const code = key.name.slice('valid:'.length)
      if (!code || seen.has(code)) continue
      const limitRaw = await env.REDEEM_USED.get(key.name)
      const limit = Math.max(1, Number.parseInt(limitRaw ?? '1', 10) || 1)
      const used = await getUsedCount(env, code)
      result.push({
        code,
        limit,
        used,
        remaining: Math.max(0, limit - used),
        source: 'kv',
      })
      seen.add(code)
    }
    cursor = page.list_complete ? undefined : page.cursor
  } while (cursor)

  result.sort((a, b) => a.code.localeCompare(b.code))
  return result
}

async function generateCodes(env: Env, limit: number, count: number): Promise<string[]> {
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit) || 1))
  const safeCount = Math.min(50, Math.max(1, Math.floor(count) || 1))
  const created: string[] = []

  for (let i = 0; i < safeCount; i += 1) {
    let code = randomCode(8)
    // 极端情况下撞码则重试
    for (let retry = 0; retry < 5; retry += 1) {
      const exists = await env.REDEEM_USED.get(`valid:${code}`)
      if (!exists && !parseEnvRules(env).has(code)) break
      code = randomCode(8)
    }
    await env.REDEEM_USED.put(`valid:${code}`, String(safeLimit))
    created.push(code)
  }

  return created
}

function adminPage(): string {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CodeQuiz 兑换码管理</title>
  <style>
    :root { color-scheme: light; }
    body {
      margin: 0; font-family: "Noto Serif SC", "Songti SC", serif;
      background: #1a1510; color: #2a2118;
      min-height: 100vh; display: grid; place-items: start center;
      padding: 24px 16px 48px;
    }
    .card {
      width: min(760px, 100%);
      background: linear-gradient(180deg, #ece0ba, #dcc294);
      border: 1px solid rgba(168,136,88,.65);
      border-radius: 6px; padding: 22px 20px 24px;
      box-shadow: 0 18px 40px rgba(0,0,0,.35);
    }
    h1 { margin: 0 0 6px; font-size: 1.6rem; letter-spacing: .12em; }
    .sub { margin: 0 0 18px; color: #6b5840; font-size: .9rem; }
    label { display:block; margin: 0 0 6px; color:#6b5840; font-size:.82rem; letter-spacing:.08em; }
    input, button, select {
      font: inherit; border-radius: 3px; border: 1px solid rgba(90,70,42,.28);
      min-height: 42px; padding: 8px 12px; box-sizing: border-box;
    }
    input, select { width: 100%; background: rgba(255,248,235,.7); color:#1f170f; }
    .row { display:grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .actions { display:flex; gap: 10px; flex-wrap: wrap; margin-top: 14px; }
    button {
      cursor: pointer; background: linear-gradient(180deg,#c43328,#8f1c14);
      color:#f8e7d2; border-color: rgba(143,28,20,.8); letter-spacing:.12em;
    }
    button.secondary { background: rgba(255,248,235,.45); color:#5c4a32; }
    button:disabled { opacity: .55; cursor: wait; }
    .msg { min-height: 1.3em; margin: 12px 0 0; color:#8f1c14; font-size:.9rem; }
    .msg.ok { color:#2f6b3a; }
    .toast {
      position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%) translateY(16px);
      background: rgba(12,12,12,.92); color: #f4e7c8; border: 1px solid rgba(196,165,116,.45);
      padding: 12px 18px; border-radius: 6px; opacity: 0; pointer-events: none;
      transition: opacity .2s ease, transform .2s ease; z-index: 20; max-width: min(90vw, 420px);
      text-align: center; font-size: .92rem; letter-spacing: .04em;
    }
    .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
    .toast.ok { border-color: rgba(90,160,110,.55); }
    .toast.err { border-color: rgba(196,80,70,.65); }
    .stats {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
      margin: 16px 0 8px;
    }
    .stat {
      background: rgba(255,248,235,.45); border: 1px solid rgba(90,70,42,.16);
      border-radius: 4px; padding: 10px 8px; text-align: center;
    }
    .stat .n { font-size: 1.35rem; line-height: 1.2; color: #8f1c14; letter-spacing: .04em; }
    .stat .l { margin-top: 4px; color: #6b5840; font-size: .72rem; letter-spacing: .08em; }
    table { width:100%; border-collapse: collapse; margin-top: 8px; font-size:.9rem; }
    th, td { text-align:left; padding: 8px 6px; border-bottom: 1px solid rgba(90,70,42,.16); }
    th { color:#6b5840; font-weight:600; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing:.06em; }
    .pill {
      display:inline-block; padding: 2px 8px; border-radius: 999px; font-size:.75rem;
      background: rgba(180,35,24,.1); color:#8f1c14;
    }
    .pill.ok { background: rgba(47,107,58,.12); color:#2f6b3a; }
    .created-box {
      margin-top: 12px; padding: 10px 12px; border-radius: 4px;
      background: rgba(255,248,235,.55); border: 1px dashed rgba(90,70,42,.28);
      display: none;
    }
    .created-box.show { display: block; }
    .login-only, .app-only { display:none; }
    body.is-login .login-only { display:block; }
    body.is-app .app-only { display:block; }
    @media (max-width: 640px) {
      .row, .stats { grid-template-columns: 1fr 1fr; }
    }
  </style>
</head>
<body class="is-login">
  <div class="card">
    <h1>兑换码管理</h1>
    <p class="sub">设置可用次数 → 一键生成 → 把码发给用户</p>

    <div class="login-only">
      <label>管理密钥（ADMIN_TOKEN）</label>
      <input id="token" type="password" placeholder="输入你设置的管理密钥" />
      <div class="actions">
        <button id="btn-login" type="button">进入管理台</button>
      </div>
    </div>

    <div class="app-only">
      <div class="stats" id="stats">
        <div class="stat"><div class="n" id="s-codes">0</div><div class="l">兑换码总数</div></div>
        <div class="stat"><div class="n" id="s-capacity">0</div><div class="l">总可用次数</div></div>
        <div class="stat"><div class="n" id="s-used">0</div><div class="l">已使用次数</div></div>
        <div class="stat"><div class="n" id="s-left">0</div><div class="l">剩余次数</div></div>
      </div>

      <div class="row">
        <div>
          <label>每个码可用次数</label>
          <select id="limit">
            <option value="1">1 次</option>
            <option value="3" selected>3 次</option>
            <option value="5">5 次</option>
            <option value="10">10 次</option>
            <option value="20">20 次</option>
            <option value="50">50 次</option>
          </select>
        </div>
        <div>
          <label>一次生成几个</label>
          <select id="count">
            <option value="1" selected>1 个</option>
            <option value="5">5 个</option>
            <option value="10">10 个</option>
          </select>
        </div>
      </div>
      <div class="actions">
        <button id="btn-gen" type="button">生成兑换码</button>
        <button id="btn-refresh" class="secondary" type="button">刷新列表</button>
        <button id="btn-logout" class="secondary" type="button">退出</button>
      </div>
      <div id="created" class="created-box"></div>
      <table>
        <thead>
          <tr><th>兑换码</th><th>已用/上限</th><th>剩余</th><th>来源</th></tr>
        </thead>
        <tbody id="tbody"><tr><td colspan="4">加载中…</td></tr></tbody>
      </table>
    </div>
    <div id="msg" class="msg"></div>
  </div>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>
  <script>
    const $ = (id) => document.getElementById(id)
    const tokenKey = 'codequiz.admin.token'
    let token = localStorage.getItem(tokenKey) || ''
    let toastTimer = null

    function setMsg(text, ok=false) {
      const el = $('msg')
      el.textContent = text || ''
      el.className = 'msg' + (ok ? ' ok' : '')
    }

    function toast(text, ok=true) {
      const el = $('toast')
      el.textContent = text
      el.className = 'toast show ' + (ok ? 'ok' : 'err')
      clearTimeout(toastTimer)
      toastTimer = setTimeout(() => { el.className = 'toast' }, 2200)
    }

    function showApp(on) {
      document.body.className = on ? 'is-app' : 'is-login'
    }

    function setBusy(btn, busy, busyText) {
      if (!btn.dataset.label) btn.dataset.label = btn.textContent
      btn.disabled = !!busy
      btn.textContent = busy ? busyText : btn.dataset.label
    }

    async function api(path, body) {
      const res = await fetch(path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify(body || {}),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data.ok === false) {
        throw new Error(data.message || ('请求失败 ' + res.status))
      }
      return data
    }

    function renderStats(items) {
      const totalCodes = items.length
      const capacity = items.reduce((s, i) => s + (i.limit || 0), 0)
      const used = items.reduce((s, i) => s + (i.used || 0), 0)
      const left = items.reduce((s, i) => s + (i.remaining || 0), 0)
      $('s-codes').textContent = String(totalCodes)
      $('s-capacity').textContent = String(capacity)
      $('s-used').textContent = String(used)
      $('s-left').textContent = String(left)
    }

    async function refresh() {
      const data = await api('/admin/list', {})
      const items = data.items || []
      renderStats(items)
      const rows = items.map((item) => {
        const pill = item.remaining > 0
          ? '<span class="pill ok">可用</span>'
          : '<span class="pill">已用完</span>'
        return '<tr>' +
          '<td><code>' + item.code + '</code> ' + pill + '</td>' +
          '<td>' + item.used + ' / ' + item.limit + '</td>' +
          '<td>' + item.remaining + '</td>' +
          '<td>' + (item.source === 'env' ? '控制台变量' : '管理台生成') + '</td>' +
          '</tr>'
      }).join('')
      $('tbody').innerHTML = rows || '<tr><td colspan="4">暂无兑换码</td></tr>'
    }

    $('btn-login').onclick = async () => {
      token = $('token').value.trim()
      if (!token) return setMsg('请输入管理密钥')
      setBusy($('btn-login'), true, '登录中…')
      try {
        await api('/admin/list', {})
        localStorage.setItem(tokenKey, token)
        showApp(true)
        setMsg('')
        toast('登录成功', true)
        await refresh()
      } catch (e) {
        setMsg(e.message || '登录失败')
        toast(e.message || '登录失败', false)
      } finally {
        setBusy($('btn-login'), false)
      }
    }

    $('btn-gen').onclick = async () => {
      setBusy($('btn-gen'), true, '生成中…')
      try {
        const limit = Number($('limit').value)
        const count = Number($('count').value)
        const data = await api('/admin/generate', { limit, count })
        const codes = data.codes || []
        const box = $('created')
        box.className = 'created-box show'
        box.innerHTML = '<div style="margin-bottom:6px;color:#2f6b3a;">已生成 ' + codes.length + ' 个（每个可用 ' + limit + ' 次）</div><code>' + codes.join('</code><br><code>') + '</code>'
        setMsg('')
        toast('生成成功，可复制发给用户', true)
        await refresh()
      } catch (e) {
        setMsg(e.message || '生成失败')
        toast(e.message || '生成失败', false)
      } finally {
        setBusy($('btn-gen'), false)
      }
    }

    $('btn-refresh').onclick = async () => {
      setBusy($('btn-refresh'), true, '刷新中…')
      try {
        await refresh()
        setMsg('')
        toast('列表与汇总已刷新', true)
      } catch (e) {
        setMsg(e.message || '刷新失败')
        toast(e.message || '刷新失败', false)
      } finally {
        setBusy($('btn-refresh'), false)
      }
    }

    $('btn-logout').onclick = () => {
      localStorage.removeItem(tokenKey)
      token = ''
      showApp(false)
      setMsg('')
      toast('已退出', true)
    }

    if (token) {
      showApp(true)
      refresh().catch((e) => {
        showApp(false)
        setMsg(e.message || '请重新登录')
      })
    }
  </script>
</body>
</html>`
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return json({ ok: true })

    const url = new URL(request.url)

    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
      return json({ ok: true, service: 'codequiz-redeem' })
    }

    if (request.method === 'GET' && (url.pathname === '/admin' || url.pathname === '/admin/')) {
      return html(adminPage())
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

    if (url.pathname === '/admin/list') {
      const denied = assertAdmin(env, readToken(request, body))
      if (denied) return denied
      const items = await listCodes(env)
      return json({ ok: true, items })
    }

    if (url.pathname === '/admin/generate') {
      const denied = assertAdmin(env, readToken(request, body))
      if (denied) return denied
      const codes = await generateCodes(env, Number(body.limit ?? 1), Number(body.count ?? 1))
      return json({ ok: true, codes, limit: Math.max(1, Math.floor(Number(body.limit ?? 1) || 1)) })
    }

    if (url.pathname === '/admin/import') {
      const denied = assertAdmin(env, readToken(request, body))
      if (denied) return denied
      const codes = (body.codes ?? []).map(normalizeCode).filter(Boolean)
      if (codes.length === 0) return json({ ok: false, message: 'codes 不能为空' }, { status: 400 })
      const limit = Math.max(1, Math.floor(Number(body.limit ?? 1) || 1))
      await Promise.all(codes.map((code) => env.REDEEM_USED.put(`valid:${code}`, String(limit))))
      return json({ ok: true, imported: codes.length, limit })
    }

    if (url.pathname === '/' || url.pathname === '/redeem') {
      return redeem(env, body.code ?? '')
    }

    return json({ ok: false, message: 'Not Found' }, { status: 404 })
  },
}
