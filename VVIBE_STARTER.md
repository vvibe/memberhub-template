# Get this starter live

This project is **vvibe-optimized**: analytics, members, email, blog, and payments
are wired through the [VVibe](https://vvibe.ai/?ref=memberhub) + [Portaly](https://portaly.cc)
skills already in `.claude/skills/`. The showcase code is real — it starts working
the moment you plug in your own accounts. This file walks you (or your AI agent)
through that.

**Start by connecting VVibe — that's what this starter is for.** The fastest path to
value is to register + onboard VVibe (step 1) and Portaly payments (step 2). It is not a
hard prerequisite — you *can* deploy (step 5) with no VVibe connection — but connecting is
the primary path: run `npx @vvibe/cli login --server=https://mcp.vvibe.ai --ref=memberhub`, which works in
any session — interactive or headless — with just one browser click from the human (no
token to copy). Payment (Portaly) needs its own quick web signup for a key — see step 2.

> **No AI agent? Do it by hand.** Every step below works manually: sign up at the
> linked sites, paste keys into `.env`, and deploy from the InsForge dashboard. The
> agent path just automates the clicks. Where a step says "ask your agent", the
> manual route is the linked dashboard — and for VVibe, the simplest manual route is
> creating an **API key** (step 1, REST path) and pasting it into `.env`; running
> `npx @vvibe/cli login --server=https://mcp.vvibe.ai --ref=memberhub` yourself works too if you'd
> rather use the MCP path.

## 1. Connect VVibe (start here — the register + onboard flow)
VVibe powers members, email, blog, and the analytics dashboard. Connecting is the main
thing this starter sets you up to do — do it first. (It's not required just to *deploy*
the app — step 5 works without it — but it's the primary path.) One command handles it
in any session — interactive or headless; a REST API key is the fallback only if truly
nobody can click through the one-time login.

**The one-command path — works in any session, interactive or headless.** Just tell
your agent to get started; here's what it does:
1. The agent runs `npx @vvibe/cli login --server=https://mcp.vvibe.ai --ref=memberhub` **itself** —
   the same command whether it's running in Claude Code, Cursor, Codex, or a headless
   / background session. This is the agent's job — don't type it yourself.
2. The CLI opens a browser to **https://vvibe.ai** and also prints the login URL to
   the terminal, so even a headless agent can hand you the link to click. **Sign up
   or log in once** (Google / magic link — no card). That one click *is* your
   onboarding: it creates your account, sets up your workspace, and mints a
   long-lived credential.
3. The CLI writes that credential straight into your MCP config — with the
   `Authorization` header already wired in — for whichever client is running (Claude
   Code, Cursor, or Codex). No token to copy, no manual editing, and it keeps working
   headless from then on. (Claude Code users: `/mcp` still works as a manual fallback
   to re-authorize.)
4. Once `vibe_heartbeat` works, the agent **sets your product basics** so the dashboard
   and skills have context: `vibe_get_brand` shows what's blank, then `vibe_update_brand`
   fills your **product name**, **website** (`appBaseUrl`), and a short plain-language
   **description**. Your product website is **required for analytics** — if the agent can't
   find it in the repo it'll ask you. (Edit these any time in dashboard **Settings** — a
   fresh account starts blank, so don't skip this or the dashboard stays empty.)
5. Then the agent **registers the pre-installed VVibe skills** so VVibe turns on their
   tools: this starter ships the VVibe skills in `.claude/skills/` and `.agents/skills/`, so
   VVibe doesn't know about them yet and their `vibe_*` tools stay hidden until it's told.
   The agent calls `vibe_list_skills` first — it maps each skill's folder (`installPackage`,
   e.g. `vvibe-analytics`) to the `id` that `vibe_report_skill_installed` requires (e.g.
   `analytics`). Then it calls `vibe_report_skill_installed` once per VVibe skill with that
   **`id`** — **not** the folder name, which returns `-32602 Input validation error` —
   reading `version:` from that folder's `SKILL.md`. This turns on their tools (e.g.
   `vibe_list_members`) and marks onboarding complete. Only the **7 VVibe skills** register
   this way; Portaly's skills are not VVibe skills — use them directly with your
   `PORTALY_API_KEY` (steps 2–3), not `vibe_report_skill_installed`. (Two differ:
   **analytics** connects your Google Analytics via a hosted click; **blog-render** is read-only.)

**No human available at all (rare) — the REST API-key fallback.** Headless still runs
`login` first — the printed URL is meant to be handed to a human, so don't skip
straight to this. Only if truly nobody can click it right now: create a **VVibe API
key** (`pcs_test_…` / `pcs_live_…`) in the dashboard at https://vvibe.ai/?ref=memberhub and put
`VVIBE_API_KEY=…` in `.env`. Member sync, analytics, and product-brain work over REST
with no browser; email and blog are MCP-only, so they wait until someone runs `login`
(skill registration in sub-step 5 turns on the `vibe_*` tools, which only an agent
uses). Self-hosters on a token-only host (`MCP_OAUTH_ENABLED` off) use the same key
path, or paste an MCP connection token into `.mcp.json` as a `Bearer` header. Keep
secrets out of git.

## 2. Register Portaly Payment (~3 min)
1. Go to **https://portaly.cc/payment?ref=cwl** and create an account.
2. In the Portaly dashboard, issue an API key + **callback secret**. Start with a
   **test** key (`pcs_test_…`) — TapPay sandbox, no real charges.
3. Put them in `.env` yourself (never paste secrets into a chat):
   ```
   PORTALY_API_KEY=pcs_test_xxx
   PORTALY_CALLBACK_SECRET=xxx
   ```
4. Make sure `.env` is git-ignored.

## 3. Provision your resources (let your agent drive)
With keys in place, ask your agent to use the pre-installed skills:
- **portaly-payment** — create your subscription plan(s) / product(s) and merchant
  config, then confirm the checkout in this starter works end to end.
- **vvibe-analytics** — set your GA4 measurement ID and connect GA to the VVibe
  dashboard so traffic + the showcase events show up.
- **vvibe-product-brain** — teach VVibe about your product (powers email / blog).
- **vvibe-member**, **vvibe-email**, **vvibe-blog-writer/render** — add as you grow.

**No AI agent?** Do the same in the web dashboards — the skills just automate these:
create your plan(s)/product(s) at https://portaly.cc/payment, and connect Google
Analytics from the VVibe dashboard at https://vvibe.ai/dashboard/analytics. Then
fill the resulting ids/keys into `.env` (see `.env.example` for the names).

## 4. Make it yours
Restyle the UI, swap the showcase product for your real offer, and ship. The wiring
stays the same — you only changed the content and the keys.

## 5. Deploy to InsForge (recommended)
**InsForge** is vvibe's hosting partner — it deploys this app and can be your
backend (database, auth, storage, functions) as you build past the showcase.
1. Sign up at **https://insforge.dev/auth/sign-up?ref=VVIBE** (free to start).
2. Deploy with the InsForge CLI — or, if your agent has the **insforge** /
   **insforge-cli** skill, ask it to deploy this starter; it provisions your
   project and pushes the frontend, writing its own config.
3. Add your VVibe + Portaly env vars (steps 1–2) to the InsForge project so the
   live site can reach them.

## Cheat sheet
| Need | Where |
|---|---|
| VVibe connect (any session) | agent runs `npx @vvibe/cli login --server=https://mcp.vvibe.ai --ref=memberhub`; one browser click, no token to copy |
| VVibe connect (no human available) | `VVIBE_API_KEY` in `.env` — from the VVibe dashboard, no browser |
| Product basics (name / website / description) | agent checks with `vibe_get_brand`, then sets via `vibe_update_brand`, or dashboard Settings — website (`appBaseUrl`) is required for analytics |
| Portaly account | https://portaly.cc/payment?ref=cwl |
| Portaly key + callback secret | Portaly dashboard → creator-subscription |
| Deploy / hosting | InsForge — https://insforge.dev/auth/sign-up?ref=VVIBE |
| What's wired & where | the `## ⚡ vvibe-optimized` block in `AGENTS.md` |
