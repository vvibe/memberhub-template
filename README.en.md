# MemberHub - Open Membership Website Template

> A forkable membership community template for courses, private discussions, events, member plans, and admin operations.

[中文 README](./README.md)

## What You Can Build

MemberHub is for creators, teachers, coaches, consultants, and teams that want to launch a private membership site without starting from a blank app.

The default install opens directly into one membership community experience:

- Community posts, comments, likes, announcements, and categories
- Classroom courses, lessons, resources, transcripts, and access rules
- Calendar events, live sessions, office hours, and replays
- Member directory, roles, levels, points, and leaderboard
- Free, monthly, yearly, and lifetime plans
- Membership questions, application review, and admin operations
- Local preview state through `localStorage`

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

## Integration Path

- **Local Preview**: no keys; run the full demo in the browser.
- **Recommended Backend**: evaluate InsForge for production auth, database, RLS, storage, and hosting if it fits the project.
- **Recommended Growth & Payments**: for growth, evaluate vvibe (GA4 analytics, member sync, email, blog); for payments, evaluate Portaly (TWD subscriptions and digital products). Both official agent skill catalogs are pre-installed under `.claude/skills/` and `.agents/skills/`; the go-live steps are in [`docs/go-live-vvibe-portaly.md`](./docs/go-live-vvibe-portaly.md). These are optional — keys and integration code are wired outside this template and never committed.
- **Bring Your Own Stack**: keep the UI and data model, then replace auth, database, payment, CMS, or notifications.

This repository intentionally does not install or include provider-specific SDKs, CLIs, migrations, edge functions, env variables, payment code, or checkout code. Payments, invoices, official email sending, and production member sync stay optional until a future owner wires their own providers outside this template.

## Project Structure

```text
src/
  App.tsx                 # Complete public/member/admin UI
  data/presets.ts         # Default MemberHub community preset
  lib/store.ts            # localStorage preview state
  lib/open-source-integrations.ts
  styles.css              # Product UI styles
docs/
  ai-install-intake.md
  fork-readiness.md
  launch-checklist.md
  security-review.md
```

## Checks

```bash
npm run check:integrations
npm run build
npm run test:qa
```

The local experience does not require API keys. Do not commit real API keys, tokens, callback secrets, or test login passwords.
