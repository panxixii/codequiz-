# CodeQuiz

你最像哪位历史人物？—— MVP：裸链接测验 + 兑换码门槛。

## 本地运行

```bash
pnpm install
pnpm dev
```

构建：

```bash
pnpm build
pnpm preview
```

## MVP 范围

- 打开链接 → 输入兑换码 → 答题出结果
- 10 题情景选择 → 特质匹配历史人物
- 结果正面解读，支持导出结果图 / 复制分享文案

兑换码云端核销（Cloudflare Workers）见 [workers/redeem/README.md](./workers/redeem/README.md)。

详见 [docs/PRD.md](./docs/PRD.md)。
