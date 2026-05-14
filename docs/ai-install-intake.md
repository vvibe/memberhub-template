# AI Install Intake

When an AI agent helps a user install or fork MemberHub, ask these questions before changing product configuration or generating new presets.

Use the user's answers to update `src/data/presets.ts`, labels, plans, seed content, and launch checklist.

## Before You Ask

Tell the user these facts first in simple language:

- The local experience can run without keys.
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

1. 你要選哪一種產品模式？
   - A. 全功能會員社群：類 Skool / School，適合課程、社群、打卡、活動、會員目錄與陪跑服務。
   - B. 出版訂閱通訊：類 Substack，適合 Newsletter、部落格、公開文章、付費文章、付費牆與讀者訂閱。
2. 你要做哪一種會員或訂閱服務？例如設計教學、健身教練、財經 newsletter、料理社群、語言課、企業內訓。
3. 你需要哪些前台頁面？全功能會員社群可選首頁、內容列表、Newsletter、課程頁、社群頁、會員目錄、全站搜尋、活動頁、方案頁、登入頁；出版訂閱通訊通常只需要首頁、文章列表、文章頁、訂閱頁、Newsletter、登入與讀者後台。
4. 你需要哪些內容類型？例如文章、影片、Podcast、直播回放、下載資源、課程單元、逐字稿、課程模板、打卡挑戰、討論串、Newsletter。
5. 你需要哪些會員功能？全功能會員社群可選免費會員、月費、年費、終身方案、課程進度、積分等級、排行榜、會員目錄、推薦碼、付費會員贈閱、會員自助；出版訂閱通訊通常保留免費讀者、月訂閱、付費文章、付費牆、Newsletter、推薦贈閱與讀者自助。
6. 登入方式要用什麼？建議先用 Google OAuth；也可以用 email magic link 或 email/password。
7. 是否需要 Email 或 LINE 通知？如果需要，通知哪些事件？
8. 是否需要入會問題、管理員審核、檢舉處理或 AutoMod 風險佇列？出版訂閱通訊通常不需要入會審核，除非你要做封閉式會員制。
9. 先不啟用金流可以嗎？我會等前台、登入、內容、會員流程完成後，再問是否啟用 Portaly 金流、訂閱與發票。
10. 你已經有 InsForge、Portaly Vibe、Email/LINE、發票服務或網域嗎？沒有也可以先跑本機體驗。
```

## Output The Agent Should Produce

After the user answers, the agent should summarize:

- Selected product mode: `skills-school` for full-feature membership community, or `signal-brief` for publication subscription.
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

- Product mode: choose `skills-school` if the user teaches, coaches, runs a member community, or needs courses/community/check-ins/events; choose `signal-brief` if the user primarily publishes articles/newsletters and wants paid posts.
- Full-feature membership community defaults: home, content, newsletter, courses, community, members, search, events, pricing, login; article, video, podcast, resource, lesson, transcript, discussion, webinar replay, newsletter issue; free, monthly, yearly, lifetime, progress tracking, comments, points, leaderboard, member directory, referral/gift campaigns.
- Publication subscription defaults: blog-style home, public posts, paid posts, article reader, paragraph paywall, subscribe page, newsletter archive, reader account, publisher admin; free reader and monthly subscription; no course, community, check-in, event, or member-directory modules unless the user explicitly asks.
- Login: InsForge Google OAuth.
- Payment: disabled during initial install; ask again after core setup.
