# Agent Instructions For MemberHub

Read `README.md` first. The Chinese README is the canonical homepage; `README.en.md` is the English mirror.

## Fork Readiness Gate

Before changing code for a forked install, read `docs/fork-readiness.md` and explain the key boundaries to the user in simple language:

- The local demo runs without keys.
- Production requires InsForge setup and a Portaly Vibe MCP token.
- Possible costs include InsForge, Portaly Vibe, payment processing, hosting, domain, Email/LINE, and invoice providers.
- Live payment, official subscription plans, invoice issuing, and message sending are disabled until explicitly enabled.
- Secrets must go into `.env.local` or a deployment secret manager, never into chat or GitHub.

## Required Order

1. Ask the install intake questions in `docs/ai-install-intake.md` before changing presets or product configuration.
2. Get the local app running.
3. Confirm the frontend pages and content types the user wants.
4. Configure the selected vertical in `src/data/presets.ts`.
5. Complete login setup. Default production recommendation is InsForge Google OAuth.
6. Complete InsForge setup: Auth, Postgres tables, RLS, Storage, Edge Functions.
7. Complete Portaly Vibe MCP setup so the project-local Coding Agent can connect to Portaly Vibe.
8. Load local case data and verify the Skills School and SuperStake cases.
9. Only after the above is complete, ask whether the user wants to enable payments, subscription plans, and invoice flow.

Use these repo-provided commands instead of asking future agents to infer setup steps:

```bash
npm run check:integrations
npm run insforge:link
npm run insforge:migrate
npm run insforge:functions:deploy
```

The project includes `@insforge/sdk`, `@insforge/cli`, `src/lib/insforge.ts`, the InsForge migration, and optional checkout/callback function examples for teams that enable payments.

The project also includes project-scoped Portaly Vibe MCP config:

- `.mcp.json`
- `.cursor/mcp.json`

Both files define `portaly-vibe` with HTTP URL `https://mcp.portaly.ai` and Authorization header placeholder `Bearer <YOUR_TOKEN>`. Keep this per-project; do not move it to user/global scope unless the user explicitly asks. Never commit a real MCP token.

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
- Which login method?
- Which notification channels?
- Whether payment should stay disabled until core setup is complete.

Use `docs/ai-install-intake.md` as the canonical prompt.

## Secrets

Do not ask the user to paste keys into chat. Tell them to add values to `.env.local` or a secret manager:

- `VITE_INSFORGE_URL`
- `VITE_INSFORGE_ANON_KEY`
- `INSFORGE_API_KEY`
- `PORTALY_API_KEY`
- `PORTALY_CALLBACK_SECRET`
- `PORTALY_MCP_TOKEN`

Also configure `ALLOWED_ORIGINS` before production. It is not a secret, but it must list only trusted frontend origins that may call the checkout Edge Function.

Commit only `.env.example`.

## Payment Guard

Default to Portaly test keys while building. Before live-mode plan creation, live checkout, subscription cancellation/resume, or manual payment completion, ask for explicit user confirmation.

Use Portaly hosted checkout for payment collection. Store callback results, subscription status, and invoice task state in MemberHub; do not collect card details in this app.
