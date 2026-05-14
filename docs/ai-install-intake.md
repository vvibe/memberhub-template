# AI Install Intake

When an AI agent helps a user install or fork MemberHub, ask these questions before changing product configuration or generating new presets.

Use the user's answers to update `src/data/presets.ts`, labels, plans, seed content, and launch checklist.

## Before You Ask

Tell the user these facts first in simple language:

- The local demo can run without keys.
- Production requires InsForge and Portaly Vibe accounts/keys.
- Optional services may cost money: hosting, domain, Portaly Vibe, payment processing, Email/LINE, and invoice providers.
- Live payments, official subscription plans, invoice issuing, and message sending are disabled until the user explicitly asks for them.
- Do not paste secrets into chat; place them in `.env.local` or a secret manager.

## Copywriting Rule

Default all generated copy to the final operator's perspective. If the user is building a baking community, design course, fitness membership, finance newsletter, or language school, write homepage, seed content, plan descriptions, emails, and admin labels as that creator/teacher/coach speaking to their members, students, readers, or subscribers.

Public-facing copy should speak to the operator's members, students, readers, or subscribers. Keep implementation language such as install, preset, payment integration, invoice integration, or InsForge setup inside setup notes and agent instructions.

## Required Questions

Ask in the user's language:

```text
我要先確認你想建立的 MemberHub 版本，回答簡短即可：

1. 你要做哪一種會員服務？例如設計教學、健身教練、財經 newsletter、料理社群、語言課、企業內訓。
2. 你需要哪些前台頁面？例如首頁、內容列表、Newsletter、課程頁、社群頁、會員目錄、全站搜尋、活動頁、方案頁、登入頁。
3. 你需要哪些內容類型？例如文章、影片、Podcast、直播回放、下載資源、課程單元、逐字稿、課程模板、打卡挑戰、討論串、Newsletter。
4. 你需要哪些會員功能？例如免費會員、月費、年費、終身方案、課程進度、積分等級、排行榜、會員目錄、推薦碼、付費會員贈閱、會員自助。
5. 登入方式要用什麼？建議先用 Google OAuth；也可以用 email magic link 或 email/password。
6. 是否需要 Email 或 LINE 通知？如果需要，通知哪些事件？
7. 是否需要入會問題、管理員審核、檢舉處理或 AutoMod 風險佇列？
8. 先不啟用金流可以嗎？我會等前台、登入、內容、會員流程完成後，再問是否啟用 Portaly 金流、訂閱與發票。
9. 你已經有 InsForge、Portaly Vibe、Email/LINE、發票服務或網域嗎？沒有也可以先跑本機 demo。
```

## Output The Agent Should Produce

After the user answers, the agent should summarize:

- Selected vertical.
- Frontend pages to enable.
- Content types to include.
- Membership features to include.
- Login method.
- Notification channels.
- Payment/invoice decision status.
- Files it will edit.

## Default Recommendations

If the user is unsure, default to:

- Frontend pages: home, content, newsletter, courses, community, members, search, events, pricing, login.
- Content types: article, video, podcast, resource, lesson, transcript, discussion, webinar replay, newsletter issue.
- Member features: free, monthly, yearly, lifetime, progress tracking, comments, points, leaderboard, member directory, referral/gift campaigns.
- Login: InsForge Google OAuth.
- Payment: disabled during initial install; ask again after core setup.
