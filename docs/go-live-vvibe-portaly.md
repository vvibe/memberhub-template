# Go live with vvibe (growth) + Portaly (payments)

This is the **opt-in** path for taking a MemberHub fork live with the recommended
growth and payment tools. It is optional: the template runs as a full local-preview
community with no keys. Follow this only when an owner decides to connect real
services.

## Ground rules (why this stays out of the app)

MemberHub ships **provider-neutral**. Growth and payments are recommended, not baked
in — so the guarantees below always hold, and `npm run check:integrations` stays
green:

- **No provider code in the app.** Do not commit provider SDKs, checkout code, edge
  functions, or `*_API_*` env into `src/`, `api/`, `.env.example`, or `package.json`.
  You add integration code when you opt in, and keep it outside the committed neutral
  template (your deployment, your own branch/app, or provider-hosted flows).
- **No secrets in git.** API keys and callback secrets go in a git-ignored local
  `.env` or your deployment's secret manager. Never paste secrets into chat, and never
  add them to `.env.example` (that file documents only the preview-login placeholders).
- **The skills are the source of truth.** The official agent skill catalogs are
  pre-installed under `.claude/skills/` and `.agents/skills/`. Drive them for the exact
  API contracts, request/response shapes, and the callback signer — don't hand-roll.

## Pre-installed skills (drive these)

| Skill | What it does |
| --- | --- |
| `vvibe-analytics` | Install GA4 + vvibe event tracking; connect GA to the vvibe dashboard |
| `vvibe-member` | Sync members app ↔ vvibe; capture signup attribution |
| `vvibe-email` | Invitation / campaign email |
| `vvibe-blog-writer` + `vvibe-blog-render` | Draft SEO articles; render your vvibe blog on your site |
| `vvibe-product-brain` | Build the product knowledge base that the email/blog skills read |
| `vvibe-sentry` | Pre-deploy security + reliability audit (gitleaks / osv-scanner / semgrep) |
| `portaly-payment` | Creator subscriptions (monthly / yearly / one-time), hosted checkout, signed renewal callbacks |
| `portaly-product` | Digital products / bundles, hosted checkout, signed webhook callbacks |

## 1. Connect vvibe (optional growth layer)

vvibe powers analytics, members, email, and blog. It is **not** required to launch —
skip to step 5 if you only want to deploy.

- **Interactive session (a human can click once):** ask your agent to connect. In
  Claude Code the vvibe MCP is reached after a one-time browser login at
  <https://vvibe.ai> (Google / magic link — no card); that single login provisions your
  workspace. On Cursor/Codex the agent first runs
  `npx @vvibe/cli connect --server=https://mcp.vvibe.ai` to write the server into your
  config. After connecting, the agent registers the pre-installed skills so their tools
  turn on.
- **Headless / no browser:** create a **vvibe API key** in the dashboard at
  <https://vvibe.ai> and set `VVIBE_API_KEY` in your local `.env`. Member sync,
  analytics, and product-brain work over REST; email and blog need a one-time
  interactive login.

Then drive `vvibe-analytics` to install GA4 and fire the vvibe standard events. On this
Vite SPA, only `VITE_`-prefixed vars reach the browser, so use
`VITE_GA_MEASUREMENT_ID`.

## 2. Register Portaly Payment (~3 min)

1. Create an account at **<https://portaly.cc/payment?ref=cwl>**.
2. In the Portaly dashboard, issue an **API key** + a **callback secret**. Start with a
   **test** key (`pcs_test_…`) — TapPay sandbox, no real charges.
3. Put them in your git-ignored local `.env` (never in chat, never in `.env.example`):
   ```bash
   PORTALY_API_KEY=pcs_test_xxx
   PORTALY_CALLBACK_SECRET=xxx
   PORTALY_PLAN_ID=            # fill after you create a plan/product in step 3
   ```
4. Confirm `.env` is git-ignored (it already is in this repo).

> **Portaly is TWD-only (TapPay).** Keep the plan amount, the displayed price, the
> checkout currency, and your GA4 `purchase` / `vvibe_checkout_complete` revenue all in
> **TWD** (locale `zh-TW`) so analytics match what is actually charged.

## 3. Provision your resources (let the agent drive the skills)

With keys in a local `.env`, drive the skills:

- **portaly-payment** (or **portaly-product**) — create your subscription plan(s) /
  product(s), then copy the resulting id into `PORTALY_PLAN_ID`.
- **vvibe-analytics** — set your GA4 measurement id and connect GA to the vvibe
  dashboard.
- **vvibe-product-brain** — teach vvibe about your product (feeds email + blog).
- **vvibe-member / vvibe-email / vvibe-blog-\*** — add as you grow.

No agent? Do the same in the web dashboards: create plans at
<https://portaly.cc/payment>, and connect Google Analytics from the vvibe dashboard.

## 4. Wire the checkout into your fork

Because the template is neutral, you add the payment wiring yourself when you opt in —
follow the `portaly-payment` / `portaly-product` skill's `references/api-contract.md`
for the exact endpoint, request body, and response shape. **Do not guess paths.** The
shape is:

- **Product/plan display** — read via the contract's read API and render.
- **Create checkout session (server-side)** — the server holds `PORTALY_API_KEY`;
  redirect the buyer to the returned `data.checkoutUrl`. This app already has
  serverless functions under `api/` (Vercel-style) — put the create-checkout route
  there, or in an InsForge edge function if you deploy to InsForge.
- **Signed callback handler (server-side)** — verify the HMAC-SHA256 signature. Reuse
  the skill's canonical signer: `scripts/sign_callback.mjs` on a Node runtime, or
  `scripts/sign_callback.webcrypto.mjs` on an edge/WebCrypto runtime. Do not re-derive
  `stableJson` by hand.
- **Analytics** — fire `vvibe_product_view` / `vvibe_checkout_start` /
  `vvibe_checkout_complete` (per `vvibe-analytics/references/event-tracking-contract.md`)
  plus the mapped GA4 ecommerce events (`view_item` / `begin_checkout` / `purchase`),
  in **TWD**.

**Server-only:** `PORTALY_API_KEY` and the callback secret must live only in server
runtime — never in `VITE_*` vars or the client bundle.

**Hosts:** `portaly.ai` is the API host your code calls; `portaly.cc` is the human
signup/dashboard site. Don't cross them. `PORTALY_API_HOST` / `VVIBE_API_HOST`
overrides exist for self-hosted backends only.

## 5. Deploy (InsForge recommended)

**InsForge** is the recommended host + backend (database, auth, storage, functions).

1. Sign up at **<https://insforge.dev/auth/sign-up?ref=VVIBE>**.
2. Deploy with the InsForge CLI, or ask an agent that has the `insforge` /
   `insforge-cli` skill to deploy and provision the project.
3. Add your vvibe + Portaly env vars (steps 1–2) to the InsForge project's secrets so
   the live site can reach them.

Prefer another host? Bring your own — just keep the same env vars in that host's secret
manager.

## 6. Pre-deploy security check

Run **`vvibe-sentry`** before going live: it orchestrates gitleaks / osv-scanner /
semgrep to confirm no secrets are committed and no known-vulnerable dependencies ship.
Keep `.env` git-ignored, and rotate any key that ever touched chat or a commit.

## Environment variables (local `.env` / deployment secrets only — never committed)

| Variable | Where it's used | Notes |
| --- | --- | --- |
| `VVIBE_API_KEY` | server (headless vvibe REST) | From <https://vvibe.ai>. Optional if you use the interactive MCP login. |
| `VITE_GA_MEASUREMENT_ID` | client | GA4 measurement id; `VITE_`-prefixed so it reaches the browser. |
| `PORTALY_API_KEY` | server only | `pcs_test_…` in dev, `pcs_live_…` in prod. |
| `PORTALY_CALLBACK_SECRET` | server only | Verifies signed callbacks. |
| `PORTALY_PLAN_ID` | server | The plan/product id the checkout uses. |
| `VVIBE_API_HOST` / `PORTALY_API_HOST` | server | Self-host override only. Defaults: `https://vvibe.ai` / `https://portaly.ai`. |

Do **not** add any of these to `.env.example` — that file documents only the
preview-login placeholders, and adding provider keys there would break the
provider-neutral guard (`npm run check:integrations`).
