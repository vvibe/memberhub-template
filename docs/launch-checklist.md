# MemberHub Launch Checklist

## Playwright QA Gate

- [ ] Run `npm run test:qa` before marking the wheel or generated website complete.
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
- [ ] README starts with the fork-critical facts: demo works without keys, production needs InsForge/Portaly, possible costs, security boundaries, and QA commands.
- [ ] `docs/fork-readiness.md` is current and linked from both README files.
- [ ] `.mcp.json` defines project-scoped `portaly-vibe` MCP over HTTP.
- [ ] `.cursor/mcp.json` defines project-scoped `portaly-vibe` MCP for Cursor.
- [ ] Real MCP tokens are kept out of Git.
- [ ] InsForge Auth is configured.
- [ ] InsForge database migrations are applied.
- [ ] `@insforge/sdk` and `@insforge/cli` are installed from `package.json`.
- [ ] RLS policies protect member-only content and admin tables.
- [ ] RLS policies have been tested with at least guest, free member, paid member, and admin roles.
- [ ] Demo seed data can be loaded.
- [ ] At least three vertical presets can be switched without source-code rewrites.

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
- [ ] Portaly webhook validates timestamp and `x-portaly-signature`.
- [ ] Demo localStorage is not used for production member, payment, or invoice data.
- [ ] Live mode, real payments, subscription cancellation/resume, and manual payment completion require explicit confirmation.

## Product Experience

- [ ] Visitor can read free preview content.
- [ ] Non-paying user sees a paywall on protected content.
- [ ] Member can access paid content.
- [ ] Member can progress through courses.
- [ ] Member can search content, lessons/transcripts, discussions, events, and members.
- [ ] Member can view member profiles/directory if enabled.
- [ ] Newsletter issues can be drafted, scheduled, segmented, and archived.
- [ ] Member can post or reply in discussions.
- [ ] Member can complete check-ins.
- [ ] Referral/gift campaigns track source, free trials, paid conversion, and revenue.
- [ ] Admin can create content, courses, plans, webinars, newsletters, and announcements.
- [ ] Admin can review membership questions, reports, AutoMod risk, and billing disputes.

## Portaly Vibe

- [ ] Portaly Vibe product optimization tooling is connected.
- [ ] Member sync events reach Portaly Vibe.
- [ ] Product analytics events reach Portaly Vibe.
- [ ] Security scan status is visible in the admin panel.
- [ ] Webhook health is visible in the admin panel.
- [ ] `insforge/functions/portaly-checkout` creates hosted checkout sessions with the server-side `PORTALY_API_KEY`.
- [ ] `insforge/functions/portaly-checkout` restricts browser callers with `ALLOWED_ORIGINS`.
- [ ] `insforge/functions/portaly-webhook` verifies `x-portaly-signature` with `PORTALY_CALLBACK_SECRET`.

## Payment And Invoice

Ask this only after core setup is complete:

```text
是否需要啟用金流、訂閱方案與發票流程？
```

If yes:

- [ ] Use Portaly test key first.
- [ ] Create monthly, yearly, and lifetime test plans.
- [ ] Create checkout session flow.
- [ ] Verify Portaly callback signature.
- [ ] Store payment and subscription callback events.
- [ ] Store invoice task or invoice status records.
- [ ] Confirm with the user before any live-mode money-moving action.
