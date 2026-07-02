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
- **Recommended InsForge + V Vibe**: use InsForge for Auth / DB / RLS and Portaly V Vibe for product operations and optional checkout.
- **Bring Your Own Stack**: keep the UI and data model, then replace auth, database, payment, CMS, or notifications.

Payments, invoices, official email sending, and production member sync stay optional until you explicitly enable them.

## Project Structure

```text
src/
  App.tsx                 # Complete public/member/admin UI
  data/presets.ts         # Default MemberHub community preset
  lib/store.ts            # localStorage preview state
  lib/insforge.ts         # InsForge browser SDK client factory
  lib/portaly.ts          # Portaly payment status helper
  styles.css              # Product UI styles
docs/
  ai-install-intake.md
  fork-readiness.md
  launch-checklist.md
  mcp-setup.md
  rls-policies.md
  security-review.md
```

## Checks

```bash
npm run check:integrations
npm run build
npm run test:qa
```

The local experience does not require API keys. Do not commit real API keys, MCP tokens, callback secrets, or test login passwords.
