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
- [ ] `.env.example` documents preview login variables only.
- [ ] `.env.local` is ignored by Git.
- [ ] README explains the single default MemberHub membership community.
- [ ] `docs/fork-readiness.md` is current and linked from both README files.
- [ ] No provider-specific SDK, CLI, migration, edge function, webhook, checkout, or MCP config is included.
- [ ] Production backend guidance recommends evaluating InsForge without bundling its code.

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

- [ ] Real API keys, callback secrets, and tokens are not committed.
- [ ] Secrets are stored in local env files or deployment secret manager.
- [ ] Demo localStorage is not used for production member, payment, or invoice data.
- [ ] Live mode, real payments, subscription cancellation/resume, and manual payment completion require explicit confirmation.
- [ ] No personal names, personal brands, personal URLs, or private owner information are present in docs, code, tests, or seed data.
- [ ] No removed payment/product-operations provider copy or code is present.

## Payment And Invoice

Ask this only after core setup is complete:

```text
是否需要啟用金流、訂閱方案與發票流程？
```
