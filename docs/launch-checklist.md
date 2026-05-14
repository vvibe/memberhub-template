# MemberHub Launch Checklist

## Playwright QA Gate

- [ ] Run `npm run test:qa` before marking the site or template complete.
- [ ] Pass rate is 100%.
- [ ] All main views pass in desktop and mobile viewports.
- [ ] No console errors.
- [ ] No horizontal overflow.
- [ ] Shared UI tokens, control sizes, card radii, and typography rules remain consistent.
- [ ] Core interactions still work after visual changes.

## Core Setup

- [ ] App runs locally from a fresh clone.
- [ ] `npm run check:integrations` passes.
- [ ] `.env.example` documents every required variable.
- [ ] `.env.local` is ignored by Git.
- [ ] README starts with a clear user-facing explanation of what this project can do.
- [ ] `docs/fork-readiness.md` is current and linked from both README files.
- [ ] `.mcp.json` defines project-scoped `portaly-vibe` MCP over HTTP.
- [ ] `.cursor/mcp.json` defines project-scoped `portaly-vibe` MCP for Cursor.
- [ ] Real MCP tokens are kept out of Git.
- [ ] InsForge Auth is configured.
- [ ] InsForge database migrations are applied.
- [ ] `@insforge/sdk` and `@insforge/cli` are installed from `package.json`.
- [ ] RLS policies protect member-only content and admin tables.
- [ ] RLS policies have been tested with at least guest, free member, paid member, and admin roles.
- [ ] Local case data can be loaded.
- [ ] Skills School and Signal Brief cases can be switched without source-code rewrites.
- [ ] Admin base editing can update site title, hero copy, plans, content/paywall state, Newsletter send settings, and course/community settings only when that case enables them.
- [ ] Substack-style cases do not show unrelated course, community, check-in, member directory, or event modules in the frontend or admin.

## Cost Disclosure

- [ ] User understands local demo is free to run, but production needs external accounts.
- [ ] User understands possible costs: InsForge, Portaly Vibe, payment processing, hosting, domain, Email/LINE, invoice provider, and tax/accounting workflows.
- [ ] User understands this repo does not automatically enable paid services, live checkout, invoice issuing, or message sending.
- [ ] User has confirmed which optional services should stay disabled during initial setup.

## Security Gate

- [ ] Real API keys, callback secrets, and MCP tokens are not committed.
- [ ] Secrets are stored in `.env.local` or deployment secret manager.
- [ ] `ALLOWED_ORIGINS` includes only trusted frontend origins before production.
- [ ] Checkout Edge Function rejects untrusted browser origins.
- [ ] If payment callbacks are enabled, callback requests validate timestamp and signature.
- [ ] Demo localStorage is not used for production member, payment, or invoice data.
- [ ] Live mode, real payments, subscription cancellation/resume, and manual payment completion require explicit confirmation.

## Product Experience

- [ ] Visitor can read free preview content.
- [ ] Non-paying user sees a paywall on protected content.
- [ ] Member can access paid content.
- [ ] Skool-style member can progress through courses when courses are enabled.
- [ ] Substack-style reader can browse public posts, see paid article gates, and subscribe to paid posts.
- [ ] Member can search content, lessons/transcripts, discussions, events, and members when those modules are enabled.
- [ ] Member can view member profiles/directory if enabled.
- [ ] Newsletter issues can be drafted, scheduled, segmented, and archived.
- [ ] Member can post or reply in discussions.
- [ ] Member can complete check-ins.
- [ ] Referral/gift campaigns track source, free trials, paid conversion, and revenue.
- [ ] Admin can create or edit content, plans, course settings, newsletters, and announcements.
- [ ] Admin can review membership questions, reports, AutoMod risk, and billing disputes.

## Portaly Vibe MCP

- [ ] `.mcp.json` and `.cursor/mcp.json` define the project-scoped `portaly-vibe` MCP server.
- [ ] MCP uses HTTP URL `https://mcp.portaly.ai`.
- [ ] Real MCP token is stored locally or in a secret manager, not committed.
- [ ] Coding Agent can read the project-local MCP config before production setup.

## Payment And Invoice

Ask this only after core setup is complete:

```text
是否需要啟用金流、訂閱方案與發票流程？
```

If yes:

- [ ] Use Portaly test key first.
- [ ] Create monthly, yearly, and lifetime test plans.
- [ ] Create checkout session flow.
- [ ] Verify payment callback signature if callback functions are enabled.
- [ ] Store payment and subscription status events.
- [ ] Store invoice task or invoice status records.
- [ ] Confirm with the user before any live-mode money-moving action.
