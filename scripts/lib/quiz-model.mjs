import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

// esbuild 是 vite 的依赖（pnpm 下不在顶层），经 vite 的位置解析
const viteRequire = createRequire(createRequire(import.meta.url).resolve('vite/package.json'))
const { buildSync } = viteRequire('esbuild')

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')

export const TRAITS = [
  'creativity', 'resilience', 'wisdom', 'courage', 'empathy',
  'discipline', 'exploration', 'expression', 'aesthetics', 'pragmatism',
]

/** 打包 TS 源文件为 CJS 并同步执行，返回其导出 */
export function loadTs(rel) {
  const out = buildSync({
    entryPoints: [path.join(root, rel)],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    write: false,
    logLevel: 'silent',
  })
  const mod = { exports: {} }
  new Function('module', 'exports', out.outputFiles[0].text)(mod, mod.exports)
  return mod.exports
}

/** 每题每个选项的特质向量：questions[q][o] = number[10] */
export function loadQuestions() {
  return loadTs('src/data/questions.ts').QUESTIONS.map((q) =>
    q.options.map((o) => TRAITS.map((t) => o.weights[t] ?? 0)),
  )
}

/** path 形如 'abcdabcdab'：每题所选选项字母 → 累加特质向量 */
export function pathVector(questions, p) {
  const v = Array(TRAITS.length).fill(0)
  questions.forEach((opts, qi) => {
    opts['abcd'.indexOf(p[qi])].forEach((x, i) => (v[i] += x))
  })
  return v
}

const hamming = (a, b) => [...a].filter((ch, i) => ch !== b[i]).length

/**
 * 人设向量 → 理想答题路径（构造式、可解释）：
 * 1. 人设向量先减去自身均值（只看「相对更突出」的特质，消除整体偏高/偏平的影响）。
 * 2. 每题选与人设点积最大的选项（选项 = 主特质×3 + 副特质×1），即「最像他会选的那个」。
 * 3. 若与已分配人物的路径过近（相同题目答案 ≥ 10 - MIN_GAP + 1），在「代价最小」的题上改选次优项：
 *    代价 = 该题最优项得分 − 改选项得分；依次尝试改 1 题、2 题，保证任意两人路径至少差 MIN_GAP 题。
 */
export const MIN_GAP = 2
export function assignIdealPaths(personas, questions) {
  const L = 'abcd'
  const taken = []
  return personas.map((persona) => {
    const mean = persona.reduce((a, b) => a + b, 0) / persona.length
    const c = persona.map((x) => x - mean)
    const fit = questions.map((opts) => opts.map((w) => w.reduce((s, x, i) => s + x * c[i], 0)))
    const best = fit.map((f) => f.indexOf(Math.max(...f)))
    const ok = (p) => taken.every((t) => hamming(p, t) >= MIN_GAP)
    const base = best.map((o) => L[o]).join('')
    // 候选：最优路径，及改 1–2 题后的路径，按总代价升序
    const cands = [{ p: base, cost: 0 }]
    const alts = []
    fit.forEach((f, q) => f.forEach((v, o) => o !== best[q] && alts.push({ q, o, cost: f[best[q]] - v })))
    const apply = (changes) => {
      const arr = [...base]
      for (const ch of changes) arr[ch.q] = L[ch.o]
      return arr.join('')
    }
    for (const a of alts) cands.push({ p: apply([a]), cost: a.cost })
    for (let i = 0; i < alts.length; i++)
      for (let j = i + 1; j < alts.length; j++)
        if (alts[i].q !== alts[j].q) cands.push({ p: apply([alts[i], alts[j]]), cost: alts[i].cost + alts[j].cost })
    cands.sort((x, y) => x.cost - y.cost || (x.p < y.p ? -1 : 1))
    const pick = cands.find((x) => ok(x.p))
    if (!pick) throw new Error('无法为人物分配可区分的理想路径')
    taken.push(pick.p)
    return pick.p
  })
}
