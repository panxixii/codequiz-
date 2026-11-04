/**
 * 校验计分设计（只做确认，不做调参）：
 *  1. 每位人物走自己的理想路径 → 成为第一名且匹配度恰为 99.99
 *  2. 任意两位人物的理想路径互不相同（至少差 MIN_GAP 题）
 *  3. 穷举全部 4^10 组答案：MATCH_FLOOR 与穷举最低值一致；每个人物都能成为第一名；第一名占比不被少数人垄断
 *  4. 2000+ 组确定性随机答案用真实 calculateResult：匹配度落在 0.01–99.99、跨越多个十分位档、非理想路径不出现 99.99
 * 任一项不通过则 exit 1。运行：node scripts/verify-reachability.mjs
 */
import { loadTs, MIN_GAP } from './lib/quiz-model.mjs'

const { QUESTIONS } = loadTs('src/data/questions.ts')
const { FIGURE_LIST } = loadTs('src/data/figures.ts')
const { IDEAL_PATHS } = loadTs('src/data/idealPaths.ts')
const { calculateResult, MATCH_FLOOR, agreementToPercent } = loadTs('src/lib/score.ts')

const failures = []
const check = (ok, msg) => { if (!ok) failures.push(msg) }
const NQ = QUESTIONS.length
const NF = FIGURE_LIST.length
const LET = 'abcd'
const toAnswers = (p) => Object.fromEntries(QUESTIONS.map((q, i) => [q.id, p[i]]))
const ids = FIGURE_LIST.map((f) => f.id)

// --- 1. 理想路径 → 第一名 99.99
console.log('人物 id            理想路径(q01→q10)  第一名      匹配度')
let reach999 = 0
for (const f of FIGURE_LIST) {
  const p = IDEAL_PATHS[f.id]
  const r = calculateResult(toAnswers(p))
  const ok = r.primary.id === f.id && r.matchPercent === 99.99
  if (ok) reach999++
  check(ok, `${f.id} 理想路径得到 ${r.primary.id} ${r.matchPercent}`)
  console.log(`${f.id.padEnd(18)} ${[...p].join(' ')}  ${r.primary.id.padEnd(11)} ${r.matchPercent.toFixed(2)}${ok ? '' : '  ✗'}`)
}

// --- 2. 路径可区分
let minGap = NQ
for (let i = 0; i < NF; i++)
  for (let j = i + 1; j < NF; j++) {
    const a = IDEAL_PATHS[ids[i]], b = IDEAL_PATHS[ids[j]]
    minGap = Math.min(minGap, [...a].filter((c, k) => c !== b[k]).length)
  }
check(minGap >= MIN_GAP, `理想路径最小差异 ${minGap} < ${MIN_GAP}`)

// --- 3. 穷举（与 score.ts 同一公式的快速版本：逐题贴合度查表累加）
const vec = (q, o) => {
  const w = QUESTIONS[q].options[o].weights
  return Object.keys({ ...w }).length ? w : {}
}
const cos = (a, b) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  let d = 0, na = 0, nb = 0
  for (const k of keys) { const x = a[k] ?? 0, y = b[k] ?? 0; d += x * y; na += x * x; nb += y * y }
  return d / Math.sqrt(na * nb)
}
// table[q][o][f] = 用户第 q 题选 o 时人物 f 的该题贴合度
const table = QUESTIONS.map((_, q) => [0, 1, 2, 3].map((o) => Float64Array.from(ids, (id) => {
  const io = LET.indexOf(IDEAL_PATHS[id][q])
  return io === o ? 1 : cos(vec(q, o), vec(q, io))
})))
const TR = ['creativity', 'resilience', 'wisdom', 'courage', 'empathy', 'discipline', 'exploration', 'expression', 'aesthetics', 'pragmatism']
const centerArr = (v) => { const m = v.reduce((a, b) => a + b, 0) / v.length; return v.map((x) => x - m) }
const figC = FIGURE_LIST.map((f) => { const c = centerArr(TR.map((k) => f.traits[k])); const n = Math.hypot(...c); return c.map((x) => x / n) })
const optVec = QUESTIONS.map((q) => q.options.map((o) => TR.map((k) => o.weights[k] ?? 0)))
const userPartial = Array.from({ length: NQ + 1 }, () => new Float64Array(TR.length))
const primaryCount = new Array(NF).fill(0)
const tieCount = { n: 0 }
let floor = Infinity
const hist = new Array(10).fill(0)
const partial = Array.from({ length: NQ + 1 }, () => new Float64Array(NF))
const EPS = 1e-9
;(function dfs(q) {
  if (q === NQ) {
    const s = partial[NQ]
    let best = -1
    for (let f = 0; f < NF; f++) if (s[f] > best) best = s[f]
    const tied = []
    for (let f = 0; f < NF; f++) if (s[f] > best - EPS) tied.push(f)
    let bi = tied[0]
    if (tied.length > 1) {
      // 与 score.ts 相同的并列决胜：居中特质余弦，再按姓名
      tieCount.n++
      const u = centerArr([...userPartial[NQ]])
      const un = Math.hypot(...u) || 1
      let bt = -Infinity
      for (const f of tied) {
        const t = figC[f].reduce((acc, x, i) => acc + x * u[i], 0) / un
        if (t > bt + EPS || (t > bt - EPS && FIGURE_LIST[f].name.localeCompare(FIGURE_LIST[bi].name, 'zh') < 0)) { bt = t; bi = f }
      }
    }
    primaryCount[bi]++
    const a = best / NQ
    if (a < floor) floor = a
    return
  }
  for (let o = 0; o < 4; o++) {
    const prev = partial[q], next = partial[q + 1], row = table[q][o]
    for (let f = 0; f < NF; f++) next[f] = prev[f] + row[f]
    const uv = optVec[q][o]
    for (let i = 0; i < TR.length; i++) userPartial[q + 1][i] = userPartial[q][i] + uv[i]
    dfs(q + 1)
  }
})(0)
const totalCombos = 4 ** NQ
floor = Math.round(floor * 1e6) / 1e6
check(Math.abs(floor - MATCH_FLOOR) < 1e-6, `MATCH_FLOOR=${MATCH_FLOOR} 与穷举最低值 ${floor} 不一致`)
const reachable = primaryCount.filter((c) => c > 0).length
check(reachable === NF, `仅 ${reachable}/${NF} 人物可成为第一`)
const maxShare = Math.max(...primaryCount) / totalCombos
const maxId = ids[primaryCount.indexOf(Math.max(...primaryCount))]
check(reach999 === NF, `仅 ${reach999}/${NF} 人物理想路径为 99.99`)
check(maxShare < 0.1, `第一名被 ${maxId} 垄断 ${(maxShare * 100).toFixed(2)}%`)

// --- 4. 真实 calculateResult 随机抽样
let seed = 20240607
const rand = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32)
const RUNS = 3000
const pcts = []
const sampleCount = {}
for (let i = 0; i < RUNS; i++) {
  const p = QUESTIONS.map(() => LET[Math.floor(rand() * 4)]).join('')
  const r = calculateResult(toAnswers(p))
  pcts.push(r.matchPercent)
  sampleCount[r.primary.id] = (sampleCount[r.primary.id] ?? 0) + 1
  const isIdeal = IDEAL_PATHS[r.primary.id] === p
  check(r.matchPercent >= 0.01 && r.matchPercent <= 99.99, `越界 ${p} → ${r.matchPercent}`)
  check(isIdeal === (r.matchPercent === 99.99), `${p} 非理想路径却得 99.99（或反之）`)
  check(Math.round(r.matchPercent * 100) === r.matchPercent * 100 || Number(r.matchPercent.toFixed(2)) === r.matchPercent, `${p} 非两位小数`)
}
for (const p of pcts) hist[Math.min(9, Math.floor(((p - 0.01) / 99.98) * 10))]++
const min = Math.min(...pcts), max = Math.max(...pcts)
const mean = pcts.reduce((a, b) => a + b, 0) / RUNS
const sampleMax = Math.max(...Object.values(sampleCount))
check(min < 10, `随机匹配度最低值 ${min} 未触及低段（应 <10）`)
check(max > 70, `随机匹配度最高值 ${max} 未触及高段（应 >70）`)
check(hist.filter((c) => c > 0).length >= 7, `随机匹配度仅覆盖 ${hist.filter((c) => c > 0).length}/10 档（应 ≥7）`)
check(Math.max(...hist) / RUNS < 0.5, '随机匹配度过度集中在单一区间')
// 极端：最差组合应映射到 0.01
check(agreementToPercent(MATCH_FLOOR) === 0.01, '最低贴合度未映射到 0.01')

console.log('\n=== 汇总 ===')
console.log(`理想路径 → 本人第一且 99.99：${reach999}/${NF}`)
console.log(`理想路径两两最少相差 ${minGap} 题`)
console.log(`穷举 ${totalCombos} 组：可成为第一的人物 ${reachable}/${NF}；其中贴合度并列、靠特质余弦决胜的组合 ${tieCount.n}；第一名最大占比 ${(maxShare * 100).toFixed(2)}%（${maxId}）；最小占比 ${(Math.min(...primaryCount) / totalCombos * 100).toFixed(3)}%`)
console.log(`穷举最低第一名贴合度 = ${floor}（score.ts MATCH_FLOOR = ${MATCH_FLOOR}）`)
console.log(`随机 ${RUNS} 次（真实 calculateResult）：min ${min.toFixed(2)} max ${max.toFixed(2)} mean ${mean.toFixed(2)}；出现过的第一名 ${Object.keys(sampleCount).length}/${NF}；最大占比 ${(sampleMax / RUNS * 100).toFixed(2)}%`)
console.log('匹配度 10 档直方图（0.01→99.99）：')
hist.forEach((c, i) => {
  const lo = 0.01 + i * 9.998
  console.log(`  ${lo.toFixed(2)}–${(lo + 9.998).toFixed(2)}  ${String(c).padStart(5)}  ${'#'.repeat(Math.round((c / RUNS) * 100))}`)
})
if (failures.length) {
  console.error(`\n✗ ${failures.length} 项未通过：`)
  for (const f of failures.slice(0, 30)) console.error('  - ' + f)
  process.exit(1)
}
console.log('\n✓ 全部通过')
