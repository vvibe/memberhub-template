# MemberHub Launch Checklist

## Playwright QA Gate

- [ ] Run `npm run test:qa` before marking the site or template complete.
- [ ] Pass rate is 100%.
- [ ] All main views pass in desktop and mobile viewports.
- [ ] No console errors.
- [ ] No horizontal overflow.
- [ ] Core interactions still work after visual changes.

## Core Setup

- [ ] App runs locally from a fresh clone.
- [ ] `npm run check:integrations` passes.
- [ ] `.env.example` documents every required variable.
- [ ] `.env.local` is ignored by Git.
- [ ] README explains the single default MemberHub membership community.
- [ ] `docs/fork-readiness.md` is current and linked from both README files.
- [ ] `.mcp.example.json` defines project-scoped `portaly-vibe` MCP using `npx -y @portaly-ai/portaly-mcp`.
- [ ] `.cursor/mcp.example.json` defines project-scoped `portaly-vibe` MCP for Cursor.
- [ ] Real MCP tokens are kept out of Git.
- [ ] InsForge Google OAuth is configured before production login is used.
- [ ] RLS policies protect member-only content and admin tables.

## Product Experience

- [ ] Visitor can read free preview content.
- [ ] Non-paying user sees a paywall on protected content.
- [ ] Member can access paid content.
- [ ] Member can progress through courses.
- [ ] Member can view events and replay content.
- [ ] Member can post or reply in discussions.
- [ ] Member can view member profiles/directory.
- [ ] Admin can create or edit content, plans, course settings, events, and announcements.
- [ ] Admin can review membership questions, reports, risk items, and billing disputes.

## Security Gate

- [ ] Real API keys, callback secrets, and MCP tokens are not committed.
- [ ] Secrets are stored in `.env.local` or deployment secret manager.
- [ ] `ALLOWED_ORIGINS` includes only trusted frontend origins before production.
- [ ] Demo localStorage is not used for production member, payment, or invoice data.
- [ ] Live mode, real payments, subscription cancellation/resume, and manual payment completion require explicit confirmation.

## Payment And Invoice

Ask this only after core setup is complete:

```text
是否需要啟用金流、訂閱方案與發票流程？
```
