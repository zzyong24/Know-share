# Know-share 部署指南（零氪 serverless 栈，DEC-017）

目标：把 `app/`（Next.js 16）部署到 **Vercel**，持久化用 **Neon Postgres**，计数/限流用 **Upstash Redis**，登录用 **GitHub OAuth（Auth.js v5）**。全部免费额度即可跑通。

> 顺序要点：**公开站点不依赖登录即可先上线**（匿名只读 FR-001/ASM-019）。GitHub 登录的凭据是**部署后**收尾的一步——因为 OAuth 回调地址需要部署后的正式域名。

---

## 0. 你需要的账号（都免费）

- [Vercel](https://vercel.com)（连 GitHub 仓库自动部署）
- [Neon](https://neon.tech)（serverless Postgres）
- [Upstash](https://upstash.com)（serverless Redis）
- 一个能建 OAuth App 的 GitHub 账号

---

## 1. 数据库：Neon

1. Neon 新建 project → 复制连接串（形如 `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`）。
2. 本地把它写进 `app/.env.local` 的 `DATABASE_URL=`，然后建表（二选一）：
   ```bash
   cd app
   # 方式 A（推荐首发）：直接把 schema 同步到 Neon（无迁移历史）
   npm run db:push
   # 方式 B：应用已生成的可审阅迁移（drizzle/0000_*.sql）
   npm run db:migrate
   ```
3. 建表后 Neon 里应有 18 张表（users / knowledge_modules / manifests / exchanges / …）。

> 迁移文件已生成在 `app/drizzle/`，是可审阅的纯 SQL；后续改 schema 用 `npm run db:generate` 增量产出。

---

## 2. 缓存/限流：Upstash Redis

1. Upstash 新建 Redis database（Global 或就近 region）。
2. 复制 **REST** 凭据：`UPSTASH_REDIS_REST_URL`、`UPSTASH_REDIS_REST_TOKEN`。

> 缺这两个变量时后端自动回退内存 mock（接口一致），但生产建议配上（平台聚合统计 FR-140、抗滥用限流 NFR-006 才持久）。

---

## 3. 部署到 Vercel

1. Vercel → Add New Project → Import 这个 Git 仓库。
2. **Root Directory 设为 `app`**（项目在子目录）。Framework 自动识别 Next.js，无需改 build/output。
3. 配置环境变量（Project → Settings → Environment Variables），先填这些即可首次部署：
   | 变量 | 值 |
   |---|---|
   | `DATABASE_URL` | Neon 连接串 |
   | `UPSTASH_REDIS_REST_URL` | Upstash REST URL |
   | `UPSTASH_REDIS_REST_TOKEN` | Upstash REST Token |
   | `AUTH_SECRET` | `openssl rand -base64 32` 或 `npx auth secret` 生成 |
4. Deploy。完成后记下正式域名（如 `https://know-share.vercel.app`）。

> 此时公开站点已可访问（匿名浏览发现/详情/台账/信任/API 文档）。GitHub 登录按钮在，但要等第 4 步配好凭据才能真正登录。

---

## 4. GitHub 登录（部署后收尾）

1. GitHub → Settings → Developer settings → **OAuth Apps** → New OAuth App：
   - Homepage URL：你的 Vercel 域名
   - **Authorization callback URL**：`https://<你的域名>/api/auth/callback/github`
2. 拿到 Client ID / 生成 Client Secret，回 Vercel 加环境变量并 **Redeploy**：
   | 变量 | 值 |
   |---|---|
   | `AUTH_GITHUB_ID` | OAuth App 的 Client ID |
   | `AUTH_GITHUB_SECRET` | OAuth App 的 Client Secret |
   | `NEXTAUTH_URL` | 你的正式域名 |
   | `KNOWSHARE_ADMIN_LOGINS` | 你的 GitHub 用户名（逗号分隔可多个；命中者登录即管理员） |
3. 打开站点点「用 GitHub 登录」→ 跳转 GitHub 授权 → 回跳即登录。
   - 终端用户登录是**一键全自动**的标准 OAuth，无需任何手动配置。
   - 上面这一步是**运营方一次性**设置，不是每个用户都做。

> 本地联调真实登录：把同样的 4 个变量写进 `app/.env.local`，callback 用 `http://localhost:3000/api/auth/callback/github`（可单独建一个 dev OAuth App），`npm run dev`（不带 `KNOWSHARE_DEV_SESSION`）。

---

## 5. 可选：邮件（Resend）

本版站内通知优先（ASM-048），邮件通道延后。如需启用，配 `RESEND_API_KEY` 即可（FR-120）。

---

## 环境变量总表

见 `app/.env.example`。缺任一变量都不会让 `next build` 失败（route handler 懒建客户端、动态渲染）；
未配 `DATABASE_URL/UPSTASH_*` 时本地回退 pglite/内存 mock，未配 `AUTH_GITHUB_*` 时登录按钮在但不可完成 OAuth。

## 回滚

- Vercel：一键回滚到上一 deployment。
- 数据库：Neon 分支/快照；schema 变更先 `db:generate` 审阅 SQL 再 `db:migrate`，不破坏性 push 前先 review。
