# Cloudflare Workers 兑换码 · 手把手教程

目标：让「输入兑换码」走云端核销——**每个码全网只能用一次**。

你需要：一台电脑、Cloudflare 免费账号、大约 15 分钟。

---

## 第 0 步：注册 Cloudflare（没有账号才做）

1. 打开：https://dash.cloudflare.com/sign-up  
2. 用邮箱注册并验证  
3. 登录后进入控制台即可（**不用买域名**，免费 Workers 子域就够）

---

## 第 1 步：打开项目目录并安装依赖

在终端执行（路径按你本机项目位置）：

```bash
cd /Users/cici/Desktop/project/codequiz-/workers/redeem
pnpm install
```

看到依赖装完即可。

---

## 第 2 步：登录 Cloudflare（浏览器授权）

仍在 `workers/redeem` 目录下执行：

```bash
npx wrangler login
```

会发生什么：

1. 终端弹出提示，并自动打开浏览器  
2. 浏览器里点 **Allow / 允许**  
3. 终端出现类似 `Successfully logged in` 就成功了  

如果浏览器没开，把终端里那串 `https://dash.cloudflare.com/oauth/...` 复制到浏览器打开即可。

---

## 第 3 步：创建 KV 数据库（存「已用过的码」）

继续执行：

```bash
npx wrangler kv namespace create REDEEM_USED
```

终端会打印类似：

```text
{ binding = "REDEEM_USED", id = "a1b2c3d4e5f6...." }
```

**复制这个 `id=` 后面的长字符串**，先记到备忘录。

再执行（本地预览用）：

```bash
npx wrangler kv namespace create REDEEM_USED --preview
```

同样复制 preview 的 `id`。

---

## 第 4 步：把 KV id 填进配置文件

用编辑器打开：

`workers/redeem/wrangler.toml`

找到这两行：

```toml
id = "REPLACE_WITH_KV_NAMESPACE_ID"
preview_id = "REPLACE_WITH_KV_PREVIEW_ID"
```

改成你刚复制的值，例如：

```toml
id = "a1b2c3d4e5f6...."
preview_id = "f6e5d4c3b2a1...."
```

保存文件。

> 同文件里已有 `VALID_CODES=...`，这就是当前允许核销的码，可直接改。

---

## 第 5 步：先本地跑通（可选，但建议）

```bash
npx wrangler dev
```

看到类似：

```text
Ready on http://127.0.0.1:8787
```

**另开一个终端窗口**，测核销：

```bash
curl -X POST http://127.0.0.1:8787/redeem \
  -H 'content-type: application/json' \
  -d '{"code":"CODEQUIZ01"}'
```

成功应返回：

```json
{"ok":true,"code":"CODEQUIZ01"}
```

再执行同一条 curl 一次，应变成：

```json
{"ok":false,"message":"该兑换码已使用"}
```

说明核销逻辑正常。  
本地测完后，在跑 `wrangler dev` 的窗口按 `Ctrl + C` 停掉。

---

## 第 6 步：部署到 Cloudflare 云端

在 `workers/redeem` 目录：

```bash
npx wrangler deploy
```

成功后终端会给出地址，类似：

```text
https://codequiz-redeem.你的账号名.workers.dev
```

**整段复制下来**。核销完整地址是：

```text
https://codequiz-redeem.你的账号名.workers.dev/redeem
```

可用浏览器打开健康检查：

```text
https://codequiz-redeem.你的账号名.workers.dev/health
```

应看到 `{"ok":true,"service":"codequiz-redeem"}`。

再用 curl 测线上（把地址换成你的）：

```bash
curl -X POST https://codequiz-redeem.你的账号名.workers.dev/redeem \
  -H 'content-type: application/json' \
  -d '{"code":"CODEQUIZ02"}'
```

---

## 第 7 步：接到前端网页

1. 回到**项目根目录**（注意不是 workers/redeem）：

```bash
cd /Users/cici/Desktop/project/codequiz-
```

2. 新建文件 `.env.local`（没有就新建），内容只写一行（换成你的真实地址）：

```bash
VITE_REDEEM_API=https://codequiz-redeem.你的账号名.workers.dev/redeem
```

3. 重启前端：

```bash
pnpm dev
```

4. 浏览器打开本地页 → 点「开始测试」→ 输入例如 `CODEQUIZ03`  
   - 第一次：应能进入答题  
   - 换浏览器 / 清缓存再输同一码：应提示「已使用」

---

## 第 8 步：以后怎么加新兑换码

打开 `workers/redeem/wrangler.toml`，改：

```toml
VALID_CODES = "CODEQUIZ01,CODEQUIZ02,新码ABC,新码XYZ"
```

然后重新部署：

```bash
cd /Users/cici/Desktop/project/codequiz-/workers/redeem
npx wrangler deploy
```

也可以在网页控制台改，不必每次改文件：

1. https://dash.cloudflare.com/  
2. 左侧 **Workers & Pages** → 点 `codequiz-redeem`  
3. **Settings** → **Variables and Secrets**  
4. 编辑 `VALID_CODES` → Save → 如提示则重新 Deploy

---

## 常见问题

**Q：`wrangler login` 失败？**  
重开一次，或手动打开终端给出的 OAuth 链接；确认浏览器已登录 Cloudflare。

**Q：deploy 报 KV id 无效？**  
检查 `wrangler.toml` 里是不是还留着 `REPLACE_WITH_...`，必须换成真实 id。

**Q：前端还是本地校验？**  
确认 `.env.local` 在**项目根目录**，变量名是 `VITE_REDEEM_API`，改完后必须重启 `pnpm dev`。

**Q：CORS 报错？**  
Worker 已允许跨域；确认你请求的是 `/redeem` 完整 URL，且是 `POST` + JSON。

**Q：不用 VPN 时一直「校验中」，最后提示网络异常？**  
这是正常现象：`*.workers.dev` 在国内经常被拦截，挂 VPN 才能通。  
解决办法：给 Worker **绑定你自己的域名**（不要继续用 workers.dev），然后把前端的 `VITE_REDEEM_API` 改成新地址并重新构建/发布。

### 绑定自定义域名（推荐）

1. 准备一个域名，把 DNS 托管到 Cloudflare（Nameserver 指到 CF）。
2. 打开 https://dash.cloudflare.com/ → **Workers & Pages** → `codequiz-redeem`
3. **Settings** → **Domains & Routes** → **Add** → **Custom Domain**
4. 填例如 `redeem.你的域名.com` → 保存（CF 会自动加 DNS + 证书）
5. 等几分钟后，用无 VPN 访问：
   `https://redeem.你的域名.com/health`  
   应返回 JSON（含 `ok: true`）
6. 改本地 `.env.local` 和 GitHub Secret `VITE_REDEEM_API` 为：
   `https://redeem.你的域名.com/redeem`
7. 推送/重新跑 Pages 构建，让线上前端用新地址

**Q：码在本地测过，线上还能用吗？**  
本地 KV 和线上 KV 是分开的。本地测过的码，线上仍可再用一次（除非你也在线上测过）。

---

## 接口速查

| 操作 | 命令 |
| --- | --- |
| 核销 | `POST /redeem`  body: `{"code":"XXXX"}` |
| 健康检查 | `GET /health` |
