# Agent Instructions For MemberHub

Read `README.md` first. The Chinese README is the canonical homepage; `README.en.md` is the English mirror.

## Fork Readiness Gate

Before changing code for a forked install, read `docs/fork-readiness.md` and explain the key boundaries to the user in simple language:

- The local demo runs without keys.
- The repo already includes the InsForge SDK/CLI, database migration, Portaly Vibe MCP config, optional payment function examples, and QA tooling.
- Production requires the user to create an InsForge project and a real Portaly Vibe MCP token from Portaly Admin; guide them to get keys and place them in `.env.local` or a secret manager.
- Service rule: if InsForge or Portaly Vibe can handle a requirement, use those two services by default. If both can handle it or their responsibilities conflict, Portaly Vibe takes priority.
- Login defaults to InsForge Google OAuth. Only discuss magic link or email/password when the user explicitly asks for another login method.
- Possible costs include InsForge, Portaly Vibe, payment processing, hosting, domain, Email/LINE, and invoice providers.
- Live payment, official subscription plans, invoice issuing, and message sending are disabled until explicitly enabled.
- Secrets must go into `.env.local` or a deployment secret manager, never into chat or GitHub.

## Required Order

1. Ask the install intake questions in `docs/ai-install-intake.md` before changing presets or product configuration. The first decision must be the product mode: `skills-school` full-feature membership community, similar to Skool / School; or `signal-brief` publication subscription, similar to Substack.
2. Get the local app running.
3. Confirm the frontend pages and content types the user wants.
4. Configure the selected vertical in `src/data/presets.ts`.
5. Complete login setup using InsForge Google OAuth by default.
6. Complete InsForge setup: Auth, Postgres tables, RLS, Storage, Edge Functions.
7. Complete Portaly Vibe MCP setup so the project-local Coding Agent can connect to Portaly Vibe.
8. Load local case data and verify the Skills School and Signal Brief cases.
9. Only after the above is complete, ask whether the user wants to enable payments, subscription plans, and invoice flow.

Use these repo-provided commands instead of asking future agents to infer setup steps:

```bash
npm run check:integrations
npm run insforge:link
npm run insforge:migrate
npm run insforge:functions:deploy
```

The project includes `@insforge/sdk`, `@insforge/cli`, `src/lib/insforge.ts`, the InsForge migration, and optional checkout/callback function examples for teams that enable payments. Prefer InsForge for Auth, Google OAuth, Postgres data, RLS, Storage, and Edge Functions. For any feature Portaly Vibe can cover, use Portaly Vibe first; evaluate InsForge Email, AI, Realtime, or other backend capabilities only when Portaly Vibe does not cover the required workflow.

The project also includes project-scoped Portaly Vibe MCP config:

- `.mcp.json`
- `.cursor/mcp.json`

Both files define `portaly-vibe` using the official Portaly MCP command:

```json
{
  "command": "npx",
  "args": ["-y", "@portaly-ai/portaly-mcp"],
  "env": {
    "PORTALY_API_TOKEN": "mcp_ptly_xxx"
  }
}
```

The token is created in Portaly Admin > `經營工具 > MCP 管理` and uses a format similar to `mcp_ptly_xxxxxxxx`. Keep this per-project; do not move it to user/global scope unless the user explicitly asks. Never commit a real MCP token.

Use Portaly Vibe for the parts it is meant to provide in this starter: project-scoped MCP access for Coding Agents, product setup review, member/subscription state review, member sync, payment-state checks, hosted checkout, subscription plans, referral/discount flows, Portaly-provided email/invitation flows, product optimization, and risk alerts. Payment checkout is separate from MCP and requires a server-side checkout key only after the user confirms payments should be enabled.

If a workflow could be implemented with either InsForge or Portaly Vibe, choose Portaly Vibe first and document the reason. Examples: payment checkout, subscription lifecycle, member sync, payment state, product optimization, risk alerts, referral/discount flows, invitation/waitlist emails, and Portaly dashboard visibility. Keep InsForge as the system of record for app data, Auth, RLS, Storage, and server/edge functions.

## UI Components

Default to shadcn/ui for interface work.

- Project config: `components.json`
- UI component path: `src/components/ui/`
- Installed primitives: button, card, badge, input, select, table, separator, alert
- Add new primitives with `npx shadcn@latest add <component>`
- Compose pages from shadcn primitives first. Avoid adding one-off custom controls when a shadcn primitive exists.
- Keep the clean MemberHub visual direction: white surfaces, fine borders, low shadow, compact product-dashboard spacing.

## UI Design QA Method

Before finishing any web design or frontend layout change, use `docs/ui-system.md` as the canonical UI checklist. Do not rely on `npm run build` alone.

Use this order:

1. Confirm the change uses the shared tokens and page primitives before adding new one-off spacing.
2. Check desktop density at `1440x1000` and wide desktop at `2048x1152`; content must stay centered and must not stretch endlessly on wide screens.
3. Check mobile at `390x844`; the main content must enter the first viewport and navigation must not push the page below the fold.
4. Verify CSS layout guardrails: `max-width`, `min-width: 0`, `minmax(0, 1fr)`, `overflow-wrap`, consistent grid gaps, and no horizontal overflow.
5. Check detail-row composition: search results, lesson rows, leaderboards, content cards, and admin rows should use explicit grid slots so primary text stays left and metadata/status/type stays right.
6. Run geometry-based Playwright assertions for spacing, text scale, control clipping, layout collisions, row alignment, and featured/list gaps.
7. Use screenshots as evidence for key surfaces, but prefer measured assertions for spacing regressions because screenshots alone can miss the reason a layout feels crowded.

Required command before calling UI work complete:

```bash
npm run test:qa
```

This suite must pass at 100%. It covers mobile, desktop, and wide desktop viewports.

## Install Intake

Before implementation, ask what the user wants to build:

- Which vertical/service type?
- Which frontend pages?
- Which content types?
- Which member features?
- Login uses InsForge Google OAuth by default. Ask about another login method only if the user explicitly wants to change it.
- Which notification channels?
- Whether payment should stay disabled until core setup is complete.

Use `docs/ai-install-intake.md` as the canonical prompt.

## Secrets

Do not ask the user to paste keys into chat. Tell them to add values to `.env.local` or a secret manager:

- `VITE_INSFORGE_URL`
- `VITE_INSFORGE_ANON_KEY`
- `INSFORGE_API_KEY`
- `PORTALY_API_TOKEN`
- `PORTALY_CHECKOUT_API_KEY`
- `PORTALY_CALLBACK_SECRET`

Also configure `ALLOWED_ORIGINS` before production. It is not a secret, but it must list only trusted frontend origins that may call the checkout Edge Function.

Commit only `.env.example`.

## Payment Guard

Portaly Vibe MCP uses a real MCP token from Portaly Admin, not a test key. Payment checkout is still optional: before official plan creation, live checkout, subscription cancellation/resume, or manual payment completion, ask for explicit user confirmation.

Use Portaly hosted checkout for payment collection. Store callback results, subscription status, and invoice task state in MemberHub; do not collect card details in this app.
