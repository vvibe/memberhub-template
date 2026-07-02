# AI Install Intake

When an AI agent helps a user install or fork MemberHub, ask these questions before changing product configuration or generating new presets.

Use the user's answers to update `src/data/presets.ts`, labels, plans, seed content, and launch checklist.

## Before You Ask

Tell the user these facts first in simple language:

- The local experience can run without keys.
- The repo includes local preview auth, Tiptap, DOMPurify, shadcn/ui primitives, Playwright QA, and localStorage demo state.
- Production backend planning can evaluate InsForge for auth, data, RLS, and storage, but this repo intentionally does not include InsForge SDK/CLI, env, migration, or function code.
- Bring Your Own Stack is supported when the user already has auth, database, CMS, search, notification, or payment services.
- Optional services may cost money: hosting, domain, backend service, payment processing, Email/LINE, and invoice providers.
- Live payments, official subscription plans, invoice issuing, and message sending are disabled until the user explicitly asks for them.
- Do not paste secrets into chat; place them in local env files or a secret manager.

## Copywriting Rule

Default all generated copy to the final operator's perspective. If the user is building a baking community, design course, fitness membership, finance newsletter, or language school, write homepage, seed content, plan descriptions, emails, and admin labels as that creator/teacher/coach speaking to their members, students, readers, or subscribers.

Public-facing copy should speak to the operator's members, students, readers, or subscribers. Keep implementation language such as install, preset, payment integration, invoice integration, or backend setup inside setup notes and agent instructions.

Do not add personal names, personal profile URLs, private owner information, or removed provider wording.

## Required Questions

Ask in the user's language:

```text
我要先確認你想建立的 MemberHub 版本，回答簡短即可：

1. 你要做哪一種會員服務？例如設計教學、健身教練、料理社群、語言課、企業內訓或顧問陪跑。
2. 你需要哪些前台頁面？可選首頁、內容列表、課程頁、社群頁、會員目錄、活動頁、方案頁、登入頁與會員後台。
3. 你需要哪些內容類型？例如文章、影片、直播回放、下載資源、課程單元、逐字稿、課程模板、打卡挑戰或討論串。
4. 你需要哪些會員功能？可選免費會員、月費、年費、終身方案、課程進度、積分等級、排行榜、會員目錄、推薦碼、會員自助。
5. 是否需要 Email 或 LINE 通知？如果需要，通知哪些事件？
6. 是否需要入會問題、管理員審核、檢舉處理或 AutoMod 風險佇列？
7. 先不啟用金流可以嗎？我會等前台、登入、內容、會員流程完成後，再問是否啟用金流、訂閱與發票。
8. 正式後端要先評估 InsForge，還是你已有自己的 auth/database/provider？沒有外部服務也可以先跑本機體驗。
```

## Output The Agent Should Produce

After the user answers, the agent should summarize:

- Selected vertical.
- Frontend pages to enable.
- Content types to include.
- Membership features to include.
- Auth decision: keep preview auth for now, evaluate InsForge, or bring an existing auth provider.
- Notification channels.
- Payment/invoice decision status.
- Files it will edit.

## Default Recommendations

If the user is unsure, default to:

- MemberHub defaults: home, content, courses, community, members, events, pricing, login; article, video, resource, lesson, transcript, discussion, webinar replay; free, monthly, yearly, lifetime, progress tracking, comments, points, leaderboard, member directory, referral/gift campaigns.
- Auth/data: local preview first; evaluate InsForge only when planning production.
- Payment: disabled during initial install; ask again after core setup.
