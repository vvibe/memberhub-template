# MemberHub - Membership / Courses / Community Platform

> A forkable "Substack + Patreon + Skool" for creators: paywalled content, subscriptions, course progress, community discussions, challenges, newsletters, and webinars.

[中文 README](./README.md)

## Start Here

- You can fork the repo, run `npm ci`, then `npm run dev`. The local demo does not require API keys.
- Production requires InsForge and Portaly Vibe keys. Store real values in `.env.local` or your deployment secret manager.
- Potential costs: InsForge, Portaly Vibe / payment processing fees, hosting, domain, Email/LINE messaging, and invoice/e-invoice providers. This repo does not automatically enable any paid service.
- Live payments are disabled by default. The AI agent must finish frontend, login, InsForge, and Portaly Vibe setup first, then ask whether to enable payments, subscription plans, and invoice flow.
- Security basics: never commit real keys; set `ALLOWED_ORIGINS` to your production domain; verify RLS policies, payment webhooks, and invoice flow in test mode before launch.
- Completion gate: `npm run check:integrations`, `npm run build`, and `npm run test:qa` must pass.

Full fork checklist: [`docs/fork-readiness.md`](./docs/fork-readiness.md)

## Live Demo

- Production demo: https://memberhub-coral.vercel.app/
- Vercel project: `memberhub`
- Current default example: `SweetCrumb 烘焙研究室`, showing how a cooking / baking membership site can use the same frontend, login, member self-service, and operator admin system.

## What This Is

MemberHub is a complete open-source wheel designed for GitHub. It helps creators, coaches, teachers, consultants, and community builders fork a ready membership business system instead of starting from a generic SaaS boilerplate.

This is not only documentation or a design spec. This folder includes a runnable Vite + React service, four switchable vertical presets, demo data, paywalls, newsletters, referral gifts, global search, member directory, course resources, moderation queues, challenges, events, member self-service, a complete operator admin dashboard, an InsForge migration, and a Portaly webhook skeleton. It runs locally with mock/localStorage data first, then can be connected to InsForge and Portaly for production.

The frontend uses React throughout. UI components default to shadcn/ui primitives (`components.json` and `src/components/ui/*` are already set up). The visual direction is a clean, sharp product interface: white surfaces, fine borders, low shadows, clear hierarchy, 8px/12px radii, and black primary buttons so the template stays professional across verticals.

The default homepage README is Chinese-first for Chinese-speaking creators and vibe coders. This English file mirrors the same product and implementation intent for global builders and AI agents.

## Copywriting Perspective

All website, demo, preset, seed data, and README copy should default to the perspective of the creator, teacher, coach, consultant, or community operator who is running the final service. Public-facing copy should sound like they are speaking to their own members, students, readers, or subscribers. Admin copy should sound like the operating workspace they use every day.

Avoid writing copy as if an agency is selling this wheel to a client or handing off a project. Use template, fork, install, integration, or implementation language only inside repo documentation and AI setup instructions where builders need it.

## Who Should Use It

- Design educators: paid articles, portfolio critiques, live classes, student work walls
- Fitness coaches: monthly memberships, workout plans, check-in challenges, webinars
- Cooking or baking communities: paywalled recipes, course progress, member discussions
- Finance newsletters: free/paid posts, annual subscriptions, private community
- Language teachers: lessons, homework feedback, class discussions, progress tracking
- Wellness communities: content library, habit check-ins, monthly membership, events
- Anyone turning knowledge, coaching, content, or community into a paid subscription product

## What Creators Can Run With It

MemberHub is not only a course website. It is a verticalizable membership business system that creators and operators can use to run:

- Online course platform
- Paid newsletter platform
- Member community platform
- Coaching or accountability system
- Expert subscription library
- Consultant membership site
- Creator-owned membership service
- Internal training academy

When adapting it to a new vertical, change `src/data/presets.ts`, `src/types.ts`, the default preset in `src/lib/store.ts`, the install questions in `docs/ai-install-intake.md`, and the relevant homepage/admin copy first. Avoid rewriting core logic before the preset works.

## Quick Start

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open:

```text
http://127.0.0.1:5176/
```

Build production assets:

```bash
npm run build
```

Run the full Playwright QA suite:

```bash
npm run test:qa
```

`test:qa` builds the latest production bundle first, then runs Playwright against Vite preview. Completion requires a 100% pass rate: the suite currently covers 13 main views, desktop `1440x1000`, mobile `390x844`, console errors, horizontal overflow, shared UI tokens, typography weight/scale rules, viewport screenshots, and core interaction flows.

The demo runs without keys. Production mode requires InsForge and Portaly Vibe keys.

Recommended Node version: `^22.13.0 || ^20.12.0`.

## Demo Features You Can Actually Use

This repo is not a static showcase. Without any backend keys, the localStorage demo supports these flows:

- Sign in/out as demo member or admin
- Switch vertical presets
- Use the post editor to create a post with title, excerpt, category, content type, body, and paywall state
- New posts immediately appear in the content library, global search, and admin content operations
- Simulate joining a paid plan and unlock paywalled content
- Search the content library and global index
- Complete course lessons and persist completion state
- Complete check-in challenges and persist check-in state
- Create a newsletter issue draft
- Create a referral / gift campaign code
- Invite a demo member
- Generate a membership review task from an invited member
- Open the moderation queue from the membership questions action
- View member self-service, receipt/invoice webhook fixture, referral gifts, and admin operations dashboards

For production, replace `src/lib/store.ts` localStorage state with InsForge CRUD. Payment, subscriptions, invoices, and the Portaly Portal should only be enabled after the core flow is complete and after the AI agent asks the user whether to enable them.

## Project Structure

```text
src/
  App.tsx                 # Complete public/member/admin UI
  components/ui/          # shadcn/ui primitives: button, card, badge, input, select, table, etc.
  data/presets.ts         # Switchable verticals: baking community, design teacher, fitness coach, finance newsletter
  lib/insforge.ts         # InsForge browser SDK client factory
  lib/store.ts            # localStorage demo state; replace with InsForge DB
  lib/portaly.ts          # Portaly checkout/webhook fixture helper
  styles.css              # Product UI styles
migrations/
  20260511210000_memberhub.sql
insforge/functions/
  portaly-checkout/index.ts
  portaly-webhook/index.ts
docs/
  ai-install-intake.md
  launch-checklist.md
  mcp-setup.md
  substack-skool-feature-check.md
```

## Core Features

- Paywalled content: free previews, member-only posts, locked videos, resource downloads
- Subscription plans: monthly, yearly, lifetime, free tier, trial plans
- Newsletter: scheduled issues, free/paid segments, welcome email, Email/LINE/in-app notification state
- Growth: referral codes, paid subscriber gifts, source attribution, paid conversion records
- Course progress: sections, lessons, completion state, progress percentage, history
- Course resources: files, links, transcripts, templates, and pinned lesson discussions
- Community discussions: threads, comments, announcements, member-only spaces
- Community management: categories, pinned posts, admin-only categories, sorting, membership questions, reports, AutoMod risk, bans
- Engagement: comments, replies, likes/reactions, member profiles, in-app notifications
- Search: search posts, courses, threads, comments, and members
- Member directory: profiles, roles, levels, contribution stats, acquisition source, risk state
- Check-in challenges: daily/weekly check-ins, streaks, tasks, leaderboard
- Gamification: points, levels, leaderboards, level-unlocked courses or permissions
- Email / LINE newsletters: new content, course reminders, event notifications
- Podcast / Video / Live: video content, audio content, live sessions, replays, paid previews
- Webinars / Calendar: event pages, registrations, calendar, reminders, replay content
- Complete admin dashboard: operations overview, member table, subscription state, content schedule, course progress, community moderation, event management, payment/invoice state, integration settings
- Member self-service: update payment method, view receipt/invoice status, cancel subscription, view plan status
- Portaly Vibe panel: product optimization, member state, payment state, risk alerts

## System Architecture

Recommended stack:

- Frontend: Vite React in this template; can be adapted to Next.js React
- UI Components: shadcn/ui. `components.json` is initialized and button, card, badge, input, select, table, separator, and alert are installed.
- Backend: InsForge Auth, Postgres, RLS, Edge Functions, Storage
- Product optimization: Portaly Vibe product optimization tooling
- Payment: Portaly Vibe hosted checkout for subscriptions, one-time payments, and discount codes
- Invoice: invoice/e-invoice flow can be connected through Portaly, an invoice provider, or the creator's existing invoice system; MemberHub stores payment, invoice task, and webhook status
- Analytics: Portaly Vibe + GA4 event tracking
- Messaging: email provider, LINE Messaging API, or webhook adapter

## Preinstalled Integration Assumption

This wheel assumes Portaly Vibe product optimization tooling is already installed. The user only needs to apply for and fill in:

- InsForge project URL
- InsForge anon key
- InsForge server/API key, server-side only
- Portaly Vibe API key
- Portaly callback secret
- Allowed origins, such as the production domain and local development URLs

`npm ci` installs `@insforge/sdk`, `@insforge/cli`, and Playwright QA tooling. Forked projects do not need to guess which integration packages to add. The repo already includes the InsForge migration, browser SDK client, Portaly checkout Edge Function, Portaly callback Edge Function, AI install intake, and launch checklist.

This wheel also includes project-scoped Portaly Vibe MCP config:

- `.mcp.json`
- `.cursor/mcp.json`

The MCP server name is `portaly-vibe`, the HTTP URL is `https://mcp.portaly.ai`, and the Authorization header template is `Bearer <YOUR_TOKEN>`. After forking, replace `<YOUR_TOKEN>` with your own Portaly Vibe MCP token. Do not commit a real token to GitHub. See `docs/mcp-setup.md`.

Available commands:

```bash
npm run check:integrations
npm run insforge:link
npm run insforge:migrate
npm run insforge:functions:deploy
```

Never commit secrets to GitHub. Commit only `.env.example`; store real values in `.env.local` or a deployment secret manager.

## AI Agent Instructions

If you are an AI agent, help the user in this order:

1. Ask the intake questions in `docs/ai-install-intake.md`: service type, frontend pages, content types, member features, login method, and notification channels.
2. Confirm the app runs locally.
3. Configure frontend pages and login. The default production recommendation is InsForge Google OAuth.
4. Complete InsForge setup first: Auth, tables, RLS, Storage, Edge Functions.
5. Complete Portaly Vibe product optimization setup: member sync, product state, analytics events, security scan state.
6. Make demo seed data work and confirm three vertical presets can switch.
7. Only after everything else is installed, ask the user: "Do you want to enable payments, subscription plans, and invoice flow?"
8. If the user enables payments, default to a Portaly test key. Do not run live mode first.
9. For live mode, official plan creation, subscription cancellation/resume, or manual payment completion, ask for explicit user confirmation again.
10. Never ask the user to paste API keys or callback secrets into chat. Tell them to place secrets in `.env.local` or a secret manager themselves.

Suggested payment question after core setup:

```text
Do you want to enable payments, subscription plans, and invoice flow?

If yes, I will use Portaly Vibe hosted checkout, start with a test key, and configure monthly/yearly/lifetime plans, payment callbacks, subscription sync, and invoice task records.
```

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Purpose | Client exposed |
| --- | --- | --- |
| `VITE_INSFORGE_URL` | InsForge frontend/API base URL | Yes |
| `VITE_INSFORGE_ANON_KEY` | InsForge anon key for browser SDK | Yes |
| `INSFORGE_API_KEY` | Server-side InsForge admin/API operations | No |
| `PORTALY_API_KEY` | Portaly Vibe server-side API calls | No |
| `PORTALY_CALLBACK_SECRET` | Verify Portaly payment callbacks | No |
| `PORTALY_API_HOST` | Portaly API host, default `https://portaly.cc` | No |
| `PORTALY_MCP_TOKEN` | Portaly Vibe MCP token for local Coding Agent setup | No |
| `APP_BASE_URL` | Local or production app URL | No |
| `ALLOWED_ORIGINS` | Comma-separated browser origins allowed to call checkout function | No |
| `GA_MEASUREMENT_ID` | Optional GA4 tracking ID | Yes/optional |
| `LINE_CHANNEL_ACCESS_TOKEN` | Optional LINE notifications | No/optional |

## Suggested Data Model

- `profiles`: users and roles
- `memberships`: membership status, plan, expiration
- `plans`: free, monthly, yearly, lifetime, enterprise
- `content_items`: posts, videos, resources, paywall rules; the demo post editor maps to this table
- `media_items`: podcast, video, live replay, paid preview settings
- `newsletter_issues`: email issues, segments, schedules, opens/clicks, paid conversions
- `courses`: courses and sections
- `lessons`: lesson content, order, preview access
- `course_resources`: lesson files, links, transcripts, and templates
- `lesson_progress`: member progress
- `communities`: spaces or cohorts
- `community_categories`: discussion categories, permissions, sorting
- `discussion_threads`: threads and announcements
- `discussion_comments`: comments and replies
- `reactions`: likes, emoji reactions, point sources
- `member_points`: points, levels, leaderboards
- `challenges`: check-in challenges
- `checkins`: check-in records
- `events`: webinars, live sessions, community events, calendar
- `notifications`: email, LINE, and in-app notification logs
- `referrals`: referral codes, sources, discount attribution
- `moderation_items`: membership review, reports, AutoMod, billing disputes
- `membership_questions`: Skool-style membership questions and approvals
- `payment_events`: Portaly callbacks, payments, subscriptions, invoice task state
- `subscriber_metrics`: subscriber growth, content performance, source analytics
- `vibe_sync_state`: Portaly Vibe sync, security checks, product recommendations

## Substack / Skool Baseline Feature Check

Research and comparison are documented here:

- [Substack / Skool Competitive Feature Check](./docs/substack-skool-feature-check.md)

Conclusion: the MemberHub spec now covers the baseline features of Substack and Skool. Substack's recommendation network and Skool's discovery/affiliate network are platform network effects; MemberHub covers the self-hosted equivalent through referrals, source tracking, promo codes, sharing, and Portaly/GA4 analytics.

## Vertical Presets

Ship at least three seed presets in v1:

1. `design-teacher`: design educator membership
2. `fitness-coach`: fitness coach monthly community
3. `finance-newsletter`: paid finance newsletter

Later presets:

- `cooking-community`
- `language-teacher`
- `wellness-community`
- `b2b-training-academy`

## Launch Checklist

- Local app can sign in, browse free content, and view paywalls.
- `npm run check:integrations` passes.
- `npm run test:qa` passes at 100%.
- [`docs/fork-readiness.md`](./docs/fork-readiness.md) has been reviewed, including cost, production setup, and security boundaries.
- `ALLOWED_ORIGINS` is set to the production domain and no longer includes unnecessary test origins.
- RLS policies are tested for content permissions, membership state, and admin roles.
- Members can open courses, update progress, comment, and check in.
- Admin can create content, plans, courses, and events.
- Portaly Vibe receives member sync, product state, and analytics events.
- Payment callback fixtures update membership plan status.
- Invoice tasks or invoice status records are stored.
- README, `.env.example`, demo seed data, and screenshots are current.

## GitHub Publishing

Suggested repo name:

```text
memberhub-insforge-portaly
```

Suggested description:

```text
A forkable membership, course, and community platform powered by InsForge and Portaly Vibe.
```

Suggested topics:

```text
membership, courses, community, creator-economy, subscriptions, insforge, portaly, paid-content, newsletter, lms
```

## License

MIT
