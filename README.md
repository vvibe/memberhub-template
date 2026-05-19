# MemberHub - 訂閱會員 / 課程 / 社群平台

> 一套可以私有化部署的會員網站範本。你可以用它建立自己的付費內容、線上課程、會員社群、Newsletter、打卡挑戰與活動報名服務。

[English README](./README.en.md)

## 這個工具可以做什麼

MemberHub 適合想經營會員制內容、課程或社群的人。你可以把它改成自己的品牌，放到自己的網域，自己管理會員資料與內容。

它可以用來做：

- 付費文章或會員限定內容
- 線上課程與學習進度
- 私密社群討論區
- 月費、年費、終身方案
- Newsletter 與會員通知
- 打卡挑戰、積分與排行榜
- 活動、Webinar、直播回放
- 會員自助頁與營運後台

你可以先不接任何外部服務，直接在本機體驗完整流程。專案已預先放好 InsForge SDK/CLI、資料表 migration、Portaly Vibe MCP 設定、選配金流 function 範例與 QA 工具；等確認要正式使用時，AI agent 只需要引導使用者到 InsForge / Portaly 後台取得必要 key，不需要重新選服務或重搭架構。

## 注意事項

- 本機體驗不需要 API key；正式部署才需要設定 InsForge 與 Portaly Vibe MCP token。Portaly Vibe MCP 使用 Portaly 後台建立的正式 MCP Token，不是測試金流 key。
- 登入預設使用 InsForge 提供的 Google OAuth；只有使用者明確要求時，才改成 magic link 或 email/password。
- 如果要正式收款，才需要另外設定金流、訂閱方案與發票流程。
- 可能產生成本的項目包含：部署平台、網域、InsForge、Portaly Vibe、金流手續費、Email/LINE 通知、發票或電子發票服務。
- 請不要把真正的 API key、MCP token、callback secret 或測試登入密碼 commit 到 GitHub。
- 正式上線前請執行 `npm run check:integrations`、`npm run build`、`npm run test:qa`，並確認 Playwright 測試 100% 通過。

更完整的安裝前檢查：[`docs/fork-readiness.md`](./docs/fork-readiness.md)
安全檢查與上線風險：[`docs/security-review.md`](./docs/security-review.md)
RLS 權限範本：[`docs/rls-policies.md`](./docs/rls-policies.md)

## 線上預覽

- Skool 版本：https://skills-school-memberhub.vercel.app/
- Substack 版本：https://signal-brief-publication.vercel.app/
- 共用預覽：https://memberhub-coral.vercel.app/
- Vercel project: `memberhub`
- 目前包含兩個正式案例：`Skills School AI Skill 實作社群` 與 `Signal Brief 策略通訊`。

## 這是什麼

MemberHub 是一個開源的會員平台範本，目標是讓創作者、教練、老師、顧問和社群經營者，可以用比較短的時間建立自己的會員網站。

這不是只有文件或設計稿。這個專案已包含可執行的 Vite + React 服務、兩組可切換正式案例、付費牆、Newsletter、推薦贈閱、全站搜尋、會員自助與可編輯營運後台。兩個案例會各自顯示適合自己的前台與後台功能：Skool 型案例會看到課程、社群、打卡與活動；Substack 型案例只會看到文章、付費牆、訂閱、Newsletter、讀者與推薦贈閱，不會列出無關的課程或社群模組。下載後可以先用本機資料跑完整預覽，再依需求接上 InsForge 和 Portaly Vibe MCP，變成可私有化部署的正式服務。服務選型預設已決定：只要 InsForge 或 Portaly Vibe 能處理，就預設使用這兩個服務；如果兩者能力重疊或衝突，以 Portaly Vibe 優先。

Fork 後第一步先選產品模式：

- `skills-school`：全功能會員社群，類 Skool / School，適合課程、社群、打卡、活動、會員目錄與陪跑型服務。
- `signal-brief`：出版訂閱通訊，類 Substack，適合公開文章、付費文章、段落付費牆、Newsletter 與讀者訂閱。

前端統一使用 React。UI 組件預設使用 shadcn/ui primitives（`components.json` 與 `src/components/ui/*` 已建立），視覺方向是簡潔俐落的產品工具介面：白底、細線、低陰影、清楚資訊層級、8px/12px 圓角與黑色主按鈕，方便 fork 到不同領域時保留專業感。

這個 repo 的首頁先用中文，因為主要使用者會是中文創作者與 vibe coder；英文版放在 `README.en.md`，方便國際使用者、AI agent 和 GitHub 訪客理解同一套架構。

## 適合誰使用

- 設計師教學：付費文章、作品講評、直播課、學員作業牆
- 健身教練：月費會員、訓練課表、打卡挑戰、Webinar
- 料理 / 烘焙社群：食譜付費牆、課程進度、會員討論區
- 財經 newsletter：免費/付費文章、年度訂閱、專屬社群
- 語言教師：課程單元、作業回饋、班級討論、學習進度
- 心靈成長社群：內容庫、打卡、月費會員、活動報名
- 任何想把知識、陪跑、內容或社群包裝成訂閱產品的人

## 可以經營哪些服務

這個專案不是只做單一課程網站，而是可以改成不同領域的會員服務。你可以把自己的內容、課程、社群或陪跑服務經營成：

- 線上課程平台
- 付費 newsletter 平台
- 會員社群平台
- 教練陪跑系統
- 專家訂閱內容庫
- 行業顧問會員站
- 自有品牌會員服務
- 企業內訓 / 會員學院

改不同領域時，可以先在後台的「基礎編輯」調整網站名稱、首頁文案、方案、文章、課程標題與 Newsletter 發送設定；要做成正式產品時，再把這些設定同步到 `src/data/presets.ts`、InsForge 資料表或自己的 CMS，不要先重寫核心邏輯。

## 立即啟動

```bash
npm ci
cp .env.example .env.local
npm run dev
```

打開：

```text
http://127.0.0.1:5176/
```

建置 production bundle：

```bash
npm run build
```

跑完整 Playwright QA：

```bash
npm run test:qa
```

`test:qa` 會先建置最新 production bundle，再用 Vite preview 跑 Playwright。完成條件是 100% 通過：目前測試涵蓋 15 個主要 view、兩個案例的直接網址、desktop `1440x1000`、mobile `390x844`、console error、橫向溢出、共享 UI tokens、字重/字級規範、viewport screenshot、正式案例文案檢查與主要互動流程。

目前本機體驗不需要任何 key 就能跑；正式部署才需要 InsForge 設定與 Portaly Vibe MCP token。

建議 Node 版本：`^22.13.0 || ^20.12.0`。

## 本機可以實際操作的功能

這個 repo 不是靜態展示頁。下載後不接任何後端，也可以用 localStorage 操作以下流程：

- 登入 / 登出會員或管理員
- 切換不同 vertical preset
- 使用 Tiptap 免費開源富文字編輯器新增文章、摘要、分類、內文格式、內容類型與付費牆狀態
- 新文章發布後會出現在內容列表、全站搜尋與後台內容管理
- 選擇付費方案並解鎖付費牆內容
- 搜尋內容庫與全站搜尋
- 完成課程單元並保留完成狀態
- 完成打卡挑戰並保留今日打卡狀態
- 新增 Newsletter issue 草稿
- 建立推薦 / 贈閱活動碼
- 邀請會員
- 從邀請會員產生入會審核待辦
- 從「入會問題」進入後台 moderation queue
- 查看會員自助、收據/發票狀態範例、推薦贈閱與後台營運面板

正式部署時，把 `src/lib/store.ts` 的 localStorage state 替換為 InsForge CRUD，登入預設接 InsForge Google OAuth；金流、訂閱與發票流程則等核心功能完成後，再依照 README 的 AI Agent 順序詢問使用者是否啟用。

## 專案結構

```text
src/
  App.tsx                 # 完整前台/會員/後台 UI
  components/ui/          # shadcn/ui primitives：button、card、badge、input、select、table 等
  data/presets.ts         # 可切換案例：Skills School、Signal Brief
  lib/insforge.ts         # InsForge browser SDK client factory
  lib/store.ts            # localStorage 本機狀態，可替換成 InsForge DB
  lib/portaly.ts          # Portaly 金流狀態範例 helper
  styles.css              # 產品 UI 樣式
migrations/
  20260511210000_memberhub.sql
docs/
  ai-install-intake.md
  launch-checklist.md
  mcp-setup.md
  substack-skool-feature-check.md
```

## 核心功能

- 付費牆內容：免費預覽、會員限定文章、鎖定影片、資源下載
- 訂閱方案：月繳、年繳、終身買斷、免費會員、試用方案
- Newsletter：issue 排程、免費/付費分眾、歡迎信、Email/LINE/站內通知狀態
- 成長機制：推薦碼、付費會員贈閱、來源歸因、付費轉換記錄
- 課程進度：章節、單元、完成狀態、進度百分比、學習記錄
- 課程資源：檔案、連結、逐字稿、template、課程討論串連結
- 社群討論：主題串、留言、公告、會員專屬討論區
- 社群管理：分類、置頂、公告、管理員限定分類、排序、入會問題、檢舉、AutoMod 風險、封鎖
- 互動機制：留言、回覆、按讚/反應、會員個人頁、站內通知
- 搜尋：搜尋文章、課程、討論串、留言、會員
- 會員目錄：會員 profile、角色、等級、貢獻、來源、風險狀態
- 打卡挑戰：每日/每週打卡、連續天數、挑戰任務、排行榜
- 遊戲化：積分、等級、排行榜；創作者可設定發文、回文、上課、打卡等加分規則，並把文章、課程、資源、活動與社群權限綁定到不同會員等級
- Email / LINE Newsletter：新內容通知、課程提醒、活動通知
- Podcast / Video / Live：影片內容、音訊內容、直播、回放、付費預覽
- Webinar / Calendar：活動頁、報名、行事曆、提醒、回放內容
- 完整管理後台：營運總覽、會員表、訂閱狀態、內容排程、課程進度、社群審核、活動管理、金流/發票狀態、整合設定
- 會員自助：更新付款方式、查看收據/發票狀態、取消訂閱、查看會員方案
- Portaly Vibe 面板：產品優化建議、會員狀態、金流狀態、風險提醒

## 系統架構

這個專案預設使用：

- 前端：Vite + React
- UI：shadcn/ui
- 登入與資料庫：InsForge，預設登入方式是 Google OAuth
- AI 輔助產品設定：Portaly Vibe MCP
- 測試：Playwright

除非 InsForge / Portaly Vibe 目前無法覆蓋某個必要功能，或使用者明確要求替換，否則不要主動改用其他後端、金流或通知服務。這個專案的重點是先提供一套可跑、可改、可私有化部署的會員平台起點。

## 服務整合策略

這個 repo 的原則是：能預先安裝的整合都先放好，需要外部帳號或 API key 的地方，才引導使用者去申請。只要 InsForge 或 Portaly Vibe 能處理，就預設使用這兩個服務；如果兩者能力重疊或衝突，以 Portaly Vibe 優先。

- InsForge 已預留：`@insforge/sdk`、`@insforge/cli`、browser client、資料表 migration、RLS 文件、Edge Functions 部署指令。
- InsForge 預設負責：Google 登入、Auth session、Postgres 資料、RLS、Storage、Edge Functions；若 Portaly Vibe 沒有覆蓋某個必要功能，再評估 InsForge 提供的 Email、AI、Realtime 或其他 backend 能力。
- Portaly Vibe 已預留：project-scoped MCP 設定、會員/訂閱狀態同步概念、產品優化與營運檢查入口、選配 checkout/callback function 範例。
- Portaly Vibe 預設優先負責：讓 Coding Agent 讀取產品設定、協助檢查會員/訂閱/金流狀態、同步會員狀態、提供產品優化與風險提醒、處理 hosted checkout、訂閱方案、付款狀態、推薦/折扣、會員同步與 Portaly 能提供的 Email/邀請流程。
- 若金流、訂閱、會員同步、產品優化、分析、風險提醒、Email/邀請等能力在 InsForge 和 Portaly Vibe 都能做，以 Portaly Vibe 為主；InsForge 只保留資料持久化、Auth、RLS、Storage、Functions 或 Portaly 無法覆蓋的輔助能力。
- 使用者需要自己取得：InsForge project URL、InsForge anon key、server-side API key、Portaly Vibe MCP token；若要收款，再取得 Portaly checkout key 與 callback secret。

## Portaly Vibe MCP

這個專案已放入 project-scoped Portaly Vibe MCP 設定，讓支援 MCP 的 Coding Agent 可以在這個專案中連到 Portaly Vibe。

已包含：

- `.mcp.json`
- `.cursor/mcp.json`

MCP server 名稱是 `portaly-vibe`，並依照 Portaly MCP guideline 使用官方 package 啟動：

```json
{
  "command": "npx",
  "args": ["-y", "@portaly-ai/portaly-mcp"],
  "env": {
    "PORTALY_API_TOKEN": "mcp_ptly_xxx"
  }
}
```

你只需要到 Portaly 後台 `經營工具 > MCP 管理` 建立 MCP Token，並在本機把 `mcp_ptly_xxx` 換成自己的 token。不要把真 token commit 到 GitHub。更多說明見 `docs/mcp-setup.md`。

## 正式部署需要準備什麼

如果你只是想體驗本機版本，可以跳過這段。若要正式部署，通常需要：

- InsForge 專案 URL
- InsForge anon key
- InsForge server/API key（只放 server-side secrets）
- InsForge Auth 中已啟用 Google OAuth，並在 Google Cloud Console 設定正確 callback URL
- Portaly Vibe MCP token，也就是 Portaly 後台建立、格式類似 `mcp_ptly_xxxxxxxx` 的 `PORTALY_API_TOKEN`
- Allowed origins，例如 production 網域與本機開發網址

`npm ci` 會一起安裝 `@insforge/sdk`、`@insforge/cli`、Tiptap 免費開源富文字編輯器、DOMPurify 內容淨化工具與 Playwright QA 工具。InsForge migration、browser SDK client、Portaly Vibe MCP 設定、AI 安裝問答與 launch checklist 都已放在 repo 內。

金流、訂閱方案與發票屬於選配功能。若你要啟用，請使用正式 Portaly 商家設定與 server-side checkout key，並在建立正式方案或開始收款前再次確認。

可用指令：

```bash
npm run check:integrations
npm run insforge:link
npm run insforge:migrate
npm run insforge:functions:deploy
```

不要把任何 secret commit 到 GitHub。請只提交 `.env.example`，把真正的值放在 `.env.local` 或部署平台的 secret manager。

## AI Agent 必讀

如果你是 AI agent，請照這個順序協助使用者：

1. 先照 `docs/ai-install-intake.md` 詢問使用者要選哪一種產品模式：`skills-school` 全功能會員社群（類 Skool / School）或 `signal-brief` 出版訂閱通訊（類 Substack）。接著再問想建立哪種會員服務、需要哪些前台頁面、內容類型、會員功能與通知通道。登入方式不用重問，預設就是 InsForge Google OAuth；只有使用者主動要求時，才討論 magic link 或 email/password。
2. 先確認 app 可以在本機跑起來。
3. 先設定前台功能與登入功能；production 預設使用 InsForge Google OAuth。
4. 先完成 InsForge 設定：Auth、資料表、RLS、Storage、Edge Functions。
5. 先完成 Portaly Vibe MCP 設定，讓支援 MCP 的 Coding Agent 可以在此專案中讀取產品設定與協助檢查。
6. 先讓本機資料可用，並確認 Skills School 與 Signal Brief 兩個案例可以切換。
7. 在其他系統都裝好後，才詢問使用者：「是否需要啟用金流、訂閱方案與發票流程？」
8. Portaly Vibe MCP 使用正式 MCP Token；如果使用者要啟用金流，請另外設定 server-side checkout key，不要把 MCP token 當成 checkout key。
9. 如果要建立正式方案、啟用收款、取消訂閱、恢復訂閱、手動完成付款，都必須再次取得使用者明確同意。
10. 不要要求使用者把 API key 或 callback secret 貼到聊天裡；請引導他們自行放到 `.env.local` 或 secret manager。

### 安裝時 AI 必問

安裝或 fork 時，AI 需要先問：

- 要選哪一種產品模式？
  - 全功能會員社群：類 Skool / School，包含課程、社群、打卡、活動、會員目錄與完整會員營運後台。
  - 出版訂閱通訊：類 Substack，包含公開文章、付費文章、段落付費牆、Newsletter、訂閱方案與讀者後台。
- 要建立哪一種會員服務？
- 需要哪些前台頁面？
- 需要哪些內容類型？例如文章、影片、Podcast、直播回放、下載資源、課程單元、打卡挑戰、討論串、Newsletter。
- 需要哪些會員功能？例如免費會員、月費、年費、終身方案、課程進度、積分等級、排行榜、會員自助。
- 登入預設使用 InsForge Google OAuth；如果使用者有特殊需求，再確認是否改成 magic link 或 email/password。
- 是否需要 Email 或 LINE 通知？
- 金流、訂閱與發票是否先等核心功能完成後再啟用？

### 建議問使用者的金流問題

在核心系統完成後再問：

```text
是否需要啟用金流、訂閱方案與發票流程？

如果需要，我會使用你的正式 Portaly 商家設定建立月繳、年繳、終身方案、付款狀態同步與發票任務記錄；在任何會正式建立方案、啟用收款或影響訂閱狀態的動作前，我會再請你確認。
```

## 環境變數

複製 `.env.example` 成 `.env.local`：

```bash
cp .env.example .env.local
```

| Variable | Purpose | Client exposed |
| --- | --- | --- |
| `VITE_INSFORGE_URL` | InsForge frontend/API base URL | Yes |
| `VITE_INSFORGE_ANON_KEY` | InsForge anon key for browser SDK | Yes |
| `INSFORGE_API_KEY` | Server-side InsForge admin/API operations | No |
| `PORTALY_API_TOKEN` | Portaly MCP token from Portaly Admin, format similar to `mcp_ptly_xxxxxxxx` | No |
| `PORTALY_CHECKOUT_API_KEY` | Optional Portaly server-side checkout/payment API key | No |
| `PORTALY_CALLBACK_SECRET` | Verify Portaly payment callbacks | No |
| `PORTALY_API_HOST` | Portaly API host, default `https://portaly.cc` | No |
| `PORTALY_CALLBACK_URL` | Public HTTPS callback URL for Portaly webhook | No |
| `APP_BASE_URL` | Local or production app URL | No |
| `ALLOWED_ORIGINS` | Comma-separated browser origins allowed to call checkout function | No |
| `GA_MEASUREMENT_ID` | Optional GA4 tracking ID | Yes/optional |
| `LINE_CHANNEL_ACCESS_TOKEN` | Optional LINE notifications | No/optional |

## 建議資料模型

- `profiles`: 使用者基本資料與角色
- `memberships`: 會員身份、方案、狀態、到期日
- `plans`: 免費、月繳、年繳、終身、企業方案
- `content_items`: 文章、影片、下載資源、付費牆設定；發文編輯器對應這張表
- `media_items`: Podcast、Video、Live replay、付費預覽設定
- `newsletter_issues`: Email issue、分眾、排程、開信/點擊與付費轉換
- `courses`: 課程與章節集合
- `lessons`: 單元內容、排序、預覽權限
- `course_resources`: 課程檔案、連結、逐字稿與模板
- `lesson_progress`: 會員課程進度
- `communities`: 社群空間或 cohort
- `community_categories`: 討論分類、權限、排序
- `discussion_threads`: 討論串與公告
- `discussion_comments`: 留言與回覆
- `reactions`: 按讚、表情反應、積分來源
- `member_points`: 積分、等級、排行榜
- `challenges`: 打卡挑戰
- `checkins`: 打卡紀錄
- `events`: Webinar、Live、社群活動、行事曆
- `notifications`: Email、LINE、站內通知記錄
- `referrals`: 推薦碼、來源、折扣碼歸因
- `moderation_items`: 入會審核、檢舉、AutoMod、付款爭議處理
- `membership_questions`: Skool-style 入會問題與審核
- `payment_events`: Portaly callback、付款、訂閱與發票任務狀態
- `subscriber_metrics`: 訂閱者成長、內容表現、來源分析
- `vibe_sync_state`: Portaly Vibe 同步狀態、安全檢查、產品建議

## Substack / Skool 基礎功能對照

已整理研究與功能對照：

- [Substack / Skool Competitive Feature Check](./docs/substack-skool-feature-check.md)

結論：MemberHub 的規格已覆蓋 Substack 和 Skool 的基礎功能。需要注意的是，Substack 的平台推薦網路與 Skool 的平台 discovery/affiliate 屬於平台網路效應，MemberHub 以 referral、來源追蹤、推薦碼、分享與 Portaly/GA4 analytics 方式提供可自架的替代能力。

## Vertical Presets

目前內建兩組正式案例：

1. `skills-school`: 獨立的 Skool/School 類型網站案例，前台與後台包含課程、社群、打卡、活動、會員目錄、加入會員流程與社群營運。
2. `signal-brief`: 獨立的 Substack 類型網站案例，首頁以部落格文章列表呈現。免費文章可直接閱讀並提示訂閱；付費文章會依創作者設定的段落位置顯示付費牆，訂閱後才能繼續閱讀。前台與後台只包含公開文章、付費文章、付費牆、訂閱方案、Newsletter、讀者名單、推薦贈閱、付款與發票狀態。

## Fork 後如何客製

1. 先用後台「基礎編輯」調整品牌、首頁文案、方案、文章付費狀態與 Newsletter 發送設定；如果是 Skool 型案例，才需要調整課程與社群內容。
2. 如果要固定成新案例，再複製 `src/data/presets.ts` 裡任一 preset，並把後台設定同步回 seed data。
3. 新增 UI 時先使用 `src/components/ui/*` 裡的 shadcn components；需要新元件時用 `npx shadcn@latest add <component>`。
4. 確認本機預覽可以用新 preset 跑起來。
5. 套用 `migrations/20260511210000_memberhub.sql` 到 InsForge。
6. 把 `src/lib/store.ts` 的 localStorage 本機狀態換成 InsForge SDK CRUD。
7. 需要金流時，再部署選配的 checkout/callback functions。
8. 等核心流程跑通後，再接正式金流、發票與訂閱方案。

## 上線檢查

- 本機可以完成登入、瀏覽免費內容、查看付費牆。
- `npm run check:integrations` 通過。
- `npm run test:qa` 通過率 100%。
- 已閱讀 [`docs/fork-readiness.md`](./docs/fork-readiness.md)，並把可能費用、production 前置設定與安全界線說清楚。
- `ALLOWED_ORIGINS` 已改成正式網域，不保留不需要的測試來源。
- RLS policies 已依照內容權限、會員身份與 admin 角色完成測試。
- Skool 型案例的會員可以進入課程、更新進度、留言、打卡。
- Substack 型案例首頁以部落格呈現；免費文章可完整閱讀並提示訂閱，付費文章會依後台設定的段落位置顯示付費牆，訂閱後才能繼續閱讀。
- 管理員可以編輯網站名稱、首頁文案、方案、文章與 Newsletter 發送設定；課程設定只會出現在 Skool 型案例。
- Portaly Vibe 可以看到會員同步、產品狀態與分析事件。
- 付款狀態範例可以更新會員方案狀態。
- 發票任務或發票狀態有資料表記錄。
- README、`.env.example`、案例內容與 screenshots 都已更新。

## GitHub 發布建議

建議 repo 名稱：

```text
memberhub-insforge-portaly
```

建議描述：

```text
A forkable membership, course, and community platform powered by InsForge and Portaly Vibe.
```

建議 topics：

```text
membership, courses, community, creator-economy, subscriptions, insforge, portaly, paid-content, newsletter, lms
```

## License

MIT
