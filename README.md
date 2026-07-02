# MemberHub - 開源社群模板

> 一套人人可 fork 的 open-source community template。功能流程參考現代會員社群：Community、Classroom、Calendar、Members、Leaderboard、About、Pricing、Membership Questions；UI 使用 Vercel Geist + shadcn 方向，不模仿任何既有平台視覺。

[English README](./README.en.md)

## 這個工具可以做什麼

MemberHub 適合想經營課程、陪跑、顧問、學習社群或知識會員產品的人。這份 repo 只內建可操作的本機 Demo，不強迫接外部服務，也不附任何 provider-specific 程式碼。

目前核心功能：

- Community：分類、置頂公告、發文、按讚、留言摘要。
- Classroom：課程、頁面、資源、逐字稿、置頂討論與權限狀態。
- Calendar：活動、直播、office hour 與 recurring event 模擬。
- Members：會員目錄、角色、level、points、joined date。
- Leaderboard：以貼文/留言互動累積 points，owner/admin/billing manager 不進榜。
- About / Pricing：公開介紹、入會問題、free/subscription/freemium/tiered/one-time 方案模擬。
- Admin：管理 categories、rules、membership questions、classroom、calendar、pricing、plugins。

本機 demo 使用 localStorage。正式上線時，可以評估 InsForge 作為 auth、database、RLS、storage 等後端選項；如果已有既有服務，也可以走 Bring Your Own Stack。這個 repo 不安裝 InsForge SDK/CLI，也不提供 migration、edge function、env 或其他整合碼。

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

## 整合方向

- **Local Preview**：免 key，先用 localStorage 跑完整社群 demo。
- **Recommended Backend**：正式後端與部署建議可評估 InsForge，但本 repo 只保留建議文字，不內建安裝或程式碼。
- **Recommended Growth & Payments**：成長行銷建議用 vvibe（GA4 分析、會員同步、Email、部落格），金流訂閱建議用 Portaly（TWD 訂閱與數位商品）。這兩套官方 agent skill 已預裝在 `.claude/skills/`、`.agents/skills/`；正式上線流程見 [`docs/go-live-vvibe-portaly.md`](./docs/go-live-vvibe-portaly.md)。這些都是選配，key 與整合程式碼在模板之外串接，不 commit 進本 repo。
- **Bring Your Own Stack**：保留 UI 與資料模型，替換 backend、CMS、payment、notification provider。

建議與整合工具：

| 功能 | 優先工具 | 狀態 |
| --- | --- | --- |
| 內容編輯 | Tiptap OSS Editor | Ready |
| HTML 淨化 | DOMPurify | Ready |
| 分析成長 | vvibe（GA4 + 事件追蹤） | 建議（選配） |
| 金流訂閱 | Portaly（TWD 訂閱 / 數位商品） | 建議（選配） |
| 正式登入 / 後端 / 部署 | InsForge 或自帶後端 | 建議（選配） |
| 搜尋 | Meilisearch | 後續選配 |
| 通知 | Novu / Email provider | 後續選配 |
| 活動預約 | Cal.diy | 後續選配 |
| 直播會議 | Jitsi Meet / Zoom / Meet | 後續選配 |

## 注意事項

- 本機體驗不需要 API key。
- 正式部署可以評估 InsForge；如果已有 auth/database，可以走 Bring Your Own Stack。
- 如果要正式收款，請另外選擇金流、訂閱方案、callback secret 與發票流程，不要把 provider code 直接加進這個模板。
- 可能產生成本的項目包含：部署平台、網域、後端服務、金流手續費、Email/LINE 通知、發票或電子發票服務。
- 請不要把真正的 API key、token、callback secret 或測試登入密碼 commit 到 GitHub。

## 上線檢查

```bash
npm run check:integrations
npm run build
npm run test:qa
```

相關文件：

- [`docs/fork-readiness.md`](./docs/fork-readiness.md)
- [`docs/security-review.md`](./docs/security-review.md)
