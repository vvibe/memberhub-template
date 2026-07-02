# Fork Readiness / 安裝前先看

## 繁中

MemberHub 現在只保留一個預設版本：全功能會員社群。使用者 fork 後直接從這個版本開始調整品牌、課程、社群、活動、會員方案與後台內容。

### 可以直接做什麼

- 本機免 key 跑完整體驗：登入、內容、付費牆、課程進度、社群、會員目錄、活動、會員自助與後台。
- 先用 localStorage 驗證產品流程，再把資料層換成 InsForge 或自己的後端。
- 已包含 Tiptap、DOMPurify、shadcn/ui primitives、Playwright QA 與本機 preview auth。
- 正式後端推薦可評估 InsForge；若已有既有服務，也可以走 Bring Your Own Stack。

### Repo 邊界

- 不安裝 InsForge SDK/CLI。
- 不附 provider-specific migration、edge function、checkout、MCP、webhook 或 env。
- 不放任何個人姓名、個人品牌、個人網址或私有 owner 資訊。
- 不包含任何已移除的付款/營運 provider 敘述或程式碼。

### Fork 後需要先準備什麼

- Node `^22.13.0 || ^20.12.0`。
- 真實 API key、callback secret、token 不可 commit 到 GitHub。
- 如果要正式收款、開立發票或寄送通知，等前台、登入、內容、會員流程完成後再選擇自己的 provider。

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

- 決定是否使用 InsForge 或自己的 auth/database。
- 在外部專案或部署環境設定正式後端、RLS、storage、search、notification、payment provider。
- 把正式值放到部署平台 secret manager。

## English

MemberHub now keeps one default version: a full membership community. Users start from this version and customize the brand, courses, community, events, member plans, and admin content.

### What works immediately

- Local preview without keys: login, content, paywalls, course progress, community, member directory, events, member self-service, and admin operations.
- Validate product flows with localStorage first, then replace the data layer with InsForge or your own backend.
- Includes Tiptap, DOMPurify, shadcn/ui primitives, Playwright QA, and local preview auth.
- Production backend planning may evaluate InsForge, or use Bring Your Own Stack.

### Repository Boundary

- No InsForge SDK/CLI is installed.
- No provider-specific migration, edge function, checkout, MCP, webhook, or env is included.
- No personal names, personal brands, personal URLs, or private owner information should be added.
- No removed payment/product-ops provider copy should be added.

### Minimum fork flow

```bash
npm ci
cp .env.example .env.local
npm run dev
npm run check:integrations
npm run build
npm run test:qa
```

Before production, choose InsForge or your own auth/database provider, then configure production secrets and provider code outside this template.
