# 理想路径计分：100 位人物全部可达，且各有 99.99 满分组合

重写了 `calculateResult` 的计分方式。每位人物现在对应一条理想答题路径（`IDEAL_PATHS`，由生成脚本根据人物特质推导），主排序是逐题贴合度均值，并列时依次按居中特质余弦和姓名决出。匹配度把第一名贴合度在 `[MATCH_FLOOR=0.4, 1]` 上线性映射到 0.01–99.99，只有贴合度为 1（完全走对理想路径）才给 99.99。重新运行已提交的 `scripts/verify-reachability.mjs`，退出码 0，输出与证据笔记逐项一致。

Watch for: 随机作答时高段几乎没有样本，3000 次中最大 83.33，89.99 以上为 0（**confirmed**，非阻塞）；`MATCH_FLOOR` 是手填常量，与题目权重和人物数据耦合（**confirmed**，非阻塞）。

**Verdict**: APPROVED

## High-level view

99.99 不是按人物或答案写死的特例，而是一条通用规则：贴合度为 1 时返回 99.99，其余走线性映射。每位人物的“满分答案”来自数据表 `IDEAL_PATHS`，由生成脚本产出，计分代码里没有任何人物 id 分支。

可达性由脚本独立证明：每条理想路径经真实 `calculateResult` 都让本人排第一且为 99.99（100/100）。理想路径两两至少相差 2 题，所以没有路径被另一位人物抢走。对全部 4^10 = 1048576 组答案穷举，100/100 的人物都能成为第一，最大占比 2.15%（shunzhi），最小 0.144%，不存在被某个人物主导的情况。

随机答案的匹配度分布覆盖 0.01 到 83.33，均值 33.12，不再像之前饱和在 91%。代价是普通用户几乎看不到 80% 以上的结果，只有照着某人物的理想路径答才能到 99.99。

提交范围内没有改动 `src/components/*` 和 `src/index.css`，题目和选项文案、人物文案、`QuizResult` 类型都没变。

<details>
<summary>Issues (3)</summary>

1. **高段匹配度几乎不会随机出现** — 3000 次随机中 89.99 以上为 0，79.99 以上仅 5 次（confirmed）。若希望普通用户偶尔看到 85%+，需要调整映射曲线或降低 `MATCH_FLOOR` 之上的斜率；按当前要求（不被 99.99 主导、覆盖 0.01–99.99）不阻塞。
2. **`MATCH_FLOOR` 手填常量** — 0.4 来自穷举结果，人物或权重变动后若忘记同步会导致映射偏移，不过 verify 脚本会比对并在不一致时失败（confirmed）。改动数据后必须重跑脚本。
3. **工作区有与本次提交无关的未提交改动** — `src/components/ResultScreen.tsx`、`src/index.css`、`index.html`、`echoLines` 相关文件在工作区被修改，但不在这几个提交里（confirmed）。它们属于结果卡片排版任务，合入本修复时应分开提交，避免混入禁改范围的检查。

</details>

<details>
<summary>Details</summary>

## 题目权重改动的范围与高段稀疏

`questions.ts` 的差异只出现在选项 `weights` 上，每个选项被精简为一个主特质加一个副特质。剔除权重行后，题目与选项文案和旧版完全一致；`figures.ts` 去掉 `traits` 块后与旧版逐字相同。

随机分布的 10 档直方图呈双峰：30–40 档 1251 次，40–50 档只有 43 次，原因是贴合度由 10 题离散累加，0.4 附近取值有间隙。更值得注意的是高段：89.99 以上为 0，79.99 以上仅 5 次，因为随机作答很难接近某位人物的完整理想路径。这符合“不被 99.99 主导”的要求，但用户此前抱怨的是“太假”，如果期望普通作答偶尔出现 85%+，需要调整映射曲线（likely 需要产品取舍）。

</details>

<details>
<summary>File map</summary>

- `src/lib/score.ts` — 改为理想路径贴合度计分，新增 `MATCH_FLOOR` 与 `agreementToPercent`
- `src/data/idealPaths.ts` — 新增，100 位人物各一条理想答题路径
- `src/data/figures.ts` — 仅调整 `traits`，人物文案无变化
- `src/data/questions.ts` — 仅精简选项 `weights`，文案无变化
- `scripts/generate-figures.mjs` — 生成人物特质与理想路径
- `scripts/lib/quiz-model.mjs` — 加载 TS 模块的辅助库
- `scripts/verify-reachability.mjs` — 可达性与分布校验
- `.agents/tasks/scoring-design.md`、`reachability-verification.md` — 设计说明与证据笔记

完整差异：`git diff origin/main HEAD`

</details>
