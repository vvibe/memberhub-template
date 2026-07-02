# Fork Readiness / 安裝前先看

## 繁中

MemberHub 現在只保留一個預設版本：全功能會員社群。使用者 fork 後直接從這個版本開始調整品牌、課程、社群、活動、會員方案與後台內容。

### 可以直接做什麼

- 本機免 key 跑完整體驗：登入、內容、付費牆、課程進度、社群、會員目錄、活動、會員自助與後台。
- 先用 localStorage 驗證產品流程，再把資料層換成 InsForge 或自己的後端。
- 已包含 InsForge SDK/CLI、InsForge migration、Portaly V Vibe MCP example、選配金流 function 範例、Playwright QA。
- 正式登入推薦使用 InsForge Google OAuth；也可以走 Bring Your Own Stack 接既有 auth。

### Fork 後需要先準備什麼

- Node `^22.13.0 || ^20.12.0`。
- 推薦部署需要 InsForge 專案與 Portaly V Vibe MCP token。
- 真實 API key、callback secret、MCP token 不可 commit 到 GitHub。
- 如果要正式收款、開立發票或寄送通知，等前台、登入、內容、會員流程完成後再啟用。

### 最小流程

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
- 啟用 InsForge Google OAuth provider。
- 套用 `migrations/20260511210000_memberhub.sql`。
- 補齊並測試 RLS policies。
- 需要金流、訂閱、會員同步或 Email/邀請流程時，再設定 Portaly V Vibe 或自己的 provider。
- 把 `.env.local` 的正式值放到部署平台 secret manager。

## English

MemberHub now keeps one default version: a full membership community. Users start from this version and customize the brand, courses, community, events, member plans, and admin content.

### What works immediately

- Local preview without keys: login, content, paywalls, course progress, community, member directory, events, member self-service, and admin operations.
- Validate product flows with localStorage first, then replace the data layer with InsForge or your own backend.
- Includes the InsForge SDK/CLI, an InsForge migration, Portaly V Vibe MCP example config, optional payment function examples, and Playwright QA.
- Production login recommends InsForge Google OAuth, or your own auth when using Bring Your Own Stack.

### Minimum fork flow

```bash
npm ci
cp .env.example .env.local
npm run dev
npm run check:integrations
npm run build
npm run test:qa
```

Before production, configure InsForge, RLS, deployment secrets, and any optional payment, subscription, member sync, or notification provider.
