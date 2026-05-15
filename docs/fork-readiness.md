# Fork Readiness / 安裝前先看

## 繁中

### 這個 repo 可以直接做什麼

- 可以在本機免 key 跑完整體驗：登入、內容、付費牆、課程進度、社群、打卡、Newsletter、會員自助與後台。
- 內建兩組正式案例：Skills School 學習社群與 Signal Brief 內容訂閱站。
- Fork 時應先選產品模式：`skills-school` 是全功能會員社群，類 Skool / School；`signal-brief` 是出版訂閱通訊，類 Substack。
- 可以先用 localStorage 驗證產品流程，再把資料層換成 InsForge。
- 已包含 Portaly Vibe MCP 專案設定、InsForge migration、選配金流 function 範例、Playwright QA。

### Fork 後需要先準備什麼

- Node `^22.13.0 || ^20.12.0`。
- 正式部署需要 InsForge 專案與 Portaly Vibe MCP token。Portaly Vibe MCP token 是從 Portaly 後台 `經營工具 > MCP 管理` 建立的正式 MCP Token，格式類似 `mcp_ptly_xxxxxxxx`。
- 如果要讓 Coding Agent 使用 Portaly Vibe MCP，請把 `PORTALY_API_TOKEN` 放在本機設定或 secret manager，不要放到 GitHub。
- 如果要通知會員，需準備 Email provider 或 LINE Messaging API。
- 如果要正式開立發票，需準備 Portaly、發票服務商或既有商家發票系統。

### 不會自動啟用的功能

- 不會自動啟用 live 金流。
- 不會自動建立正式收款方案。
- 不會自動開立正式發票。
- 不會自動寄送 Email 或 LINE 訊息。
- 不會自動把 localStorage 資料變成 production database。

AI Agent 必須先完成本機體驗、前台、登入、InsForge、Portaly Vibe MCP 設定，再詢問：

```text
是否需要啟用金流、訂閱方案與發票流程？
```

### 可能產生成本

- InsForge：Auth、Postgres、Edge Functions、Storage 等用量。
- Portaly Vibe：MCP 或其他 Portaly 服務用量，依實際方案為準。
- 金流手續費：刷卡、第三方支付、跨境付款或退款可能由金流商收取。
- 部署平台：Vercel、Cloudflare、Zeabur 或其他 hosting。
- 網域與 DNS。
- Email / LINE：寄信量、LINE Messaging API、簡訊或第三方通知服務。
- 發票 / 電子發票：發票服務商、字軌、加值中心或會計流程。

建議 README 或設定文件都要主動揭露這些項目，避免使用者以為下載後完全零成本上線。

### 安全注意

- 真實 API key、callback secret、MCP token 不可 commit 到 GitHub。
- 只提交 `.env.example`，真實值放 `.env.local` 或部署平台 secret manager。
- `ALLOWED_ORIGINS` 要改成正式網域；不要在 production 保留不需要的測試來源。
- 若啟用金流，checkout 只能由受信任前端來源呼叫，不能使用 `*` CORS。
- 若啟用付款 callback，必須驗證 signature 與 timestamp，避免重放或偽造請求。
- RLS 必須依照會員身份、內容權限與 admin 角色測試；不要為了省事關閉 RLS。
- localStorage 只適合本機驗證，不適合保存正式會員、付款或發票資料。
- Live mode、正式付款、取消訂閱、恢復訂閱、手動補單都需要使用者再次明確同意。

### 產品模式選擇

| 模式 | 適合誰 | 會啟用的主要功能 |
| --- | --- | --- |
| `skills-school` 全功能會員社群 | 課程、教練、陪跑、社群、挑戰活動、會員制學習產品 | 課程進度、社群討論、打卡挑戰、活動、會員目錄、Newsletter、方案與完整營運後台 |
| `signal-brief` 出版訂閱通訊 | Newsletter、專欄、研究報告、付費文章、個人出版站 | 公開文章、付費文章、段落付費牆、限時免費公開、Newsletter、訂閱方案、讀者與出版後台 |

### Fork 後最小流程

```bash
npm ci
cp .env.example .env.local
npm run dev
npm run check:integrations
npm run build
npm run test:qa
```

Production 前再做：

- 建立 InsForge project。
- 套用 `migrations/20260511210000_memberhub.sql`。
- 補齊並測試 RLS policies。
- 需要金流時，再部署選配的 checkout/callback functions。
- 把 `.env.local` 的正式值放到部署平台 secret manager。
- 使用正式 Portaly 商家設定與 server-side checkout key 跑完整 checkout、付款狀態同步、訂閱與發票任務流程；任何會正式收款或修改訂閱狀態的動作前都要再次確認。
- 確認 `npm run test:qa` 100% 通過後再上線。

### 常見卡關

- 沒有 key 不能上 production：本機體驗可免 key；production 必須先申請 InsForge 與 Portaly。
- 登入無法使用：先確認 InsForge Auth provider、redirect URL、allowed domain。
- 金流呼叫被擋：檢查 `ALLOWED_ORIGINS` 是否包含目前前端網域。
- 付款 callback 失敗：檢查 `PORTALY_CALLBACK_SECRET`、timestamp、signature 與 callback URL。
- 會員看不到付費內容：檢查 membership 狀態、content paywall 設定與 RLS policy。
- UI QA 失敗：先修 console error、橫向 overflow、過大字級與不一致元件，再重跑 `npm run test:qa`。

## English

### What works immediately

- The local experience runs without keys and includes login, content, paywalls, course progress, community, check-ins, newsletters, member self-service, and admin operations.
- Two production-style product modes can be adapted quickly: `skills-school` for a full-feature membership community, similar to Skool / School; and `signal-brief` for a publication subscription site, similar to Substack.
- You can validate product flows with localStorage first, then replace the data layer with InsForge.
- The repo includes project-scoped Portaly Vibe MCP config, an InsForge migration, optional payment function examples, and Playwright QA.

### What you need before production

- Node `^22.13.0 || ^20.12.0`.
- An InsForge project and Portaly Vibe account/key.
- A real Portaly MCP token from Portaly Admin > `經營工具 > MCP 管理`, stored as `PORTALY_API_TOKEN`, if your Coding Agent should connect to Portaly Vibe MCP.
- An email provider or LINE Messaging API if member notifications are enabled.
- Portaly, an invoice provider, or an existing merchant invoice system if official invoices are required.

### What is not enabled automatically

- Live payments.
- Official paid plans.
- Official invoice issuing.
- Email or LINE sending.
- Production database persistence for localStorage data.

The AI agent must finish the local experience, frontend, login, InsForge, and Portaly Vibe MCP setup first, then ask whether to enable payments, subscription plans, and invoice flow.

### Possible costs

- InsForge usage: Auth, Postgres, Edge Functions, Storage.
- Portaly Vibe usage: MCP or other Portaly services depending on the plan.
- Payment processing fees for cards, third-party payment methods, cross-border payments, or refunds.
- Hosting such as Vercel, Cloudflare, Zeabur, or another provider.
- Domain and DNS.
- Email / LINE / SMS / notification providers.
- Invoice or e-invoice providers and accounting operations.

### Security notes

- Never commit real API keys, callback secrets, or MCP tokens.
- Commit only `.env.example`; store real values in `.env.local` or a deployment secret manager.
- Set `ALLOWED_ORIGINS` to your production domain and remove unneeded test origins before launch.
- If payments are enabled, checkout should only accept trusted frontend origins.
- If payment callbacks are enabled, requests must verify signature and timestamp.
- RLS must be tested for membership state, content access, and admin roles. Do not disable RLS for convenience.
- localStorage is for local validation only, not production member/payment/invoice records.
- Live mode, real payment collection, subscription cancellation/resume, and manual payment completion require explicit user confirmation.

### Product Mode Choice

| Mode | Best for | Main modules |
| --- | --- | --- |
| `skills-school` full-feature membership community | Courses, coaching, cohorts, community, challenges, and learning memberships | Course progress, community discussions, check-ins, events, member directory, newsletter, plans, and full operations admin |
| `signal-brief` publication subscription | Newsletters, columns, research reports, paid posts, and personal publications | Public posts, paid posts, paragraph paywalls, limited-free publishing, newsletters, subscription plans, readers, and publisher admin |

### Minimum fork flow

```bash
npm ci
cp .env.example .env.local
npm run dev
npm run check:integrations
npm run build
npm run test:qa
```

Before production:

- Create an InsForge project.
- Apply `migrations/20260511210000_memberhub.sql`.
- Complete and test RLS policies.
- If payments are needed, deploy the optional checkout/callback functions.
- Move real env values into the deployment secret manager.
- Use the production Portaly merchant setup and server-side checkout key for checkout, payment status sync, subscription, and invoice task flow; confirm again before any money-moving or subscription-changing action.
- Launch only after `npm run test:qa` passes at 100%.
