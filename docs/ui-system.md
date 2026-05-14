# MemberHub UI System

MemberHub uses a restrained product UI system so forked verticals stay coherent. Follow this file before changing component styles.

## Typography

- Body copy: 14px, regular weight.
- Small labels and metadata: 12px to 13px, medium weight only when needed.
- Page title: 24px desktop, 22px mobile.
- Section title: 24px desktop, 22px mobile.
- Hero title: 42px desktop, 30px mobile.
- Card title: 16px.
- Avoid heavy body text. Use semibold only for headings, prices, metrics, and compact labels.
- Letter spacing stays `0`.

## Controls

- Default control height: 38px.
- Small control height: 34px.
- Control radius: 8px.
- Button text weight: semibold, never extra bold.
- Icons inside buttons: 16px, 2px stroke.
- Select, input, and button surfaces should share the same border, radius, height, and text scale.

## Cards And Panels

- Card radius: 8px.
- Section and panel borders use `--border`.
- Avoid nested card styling unless the inner item is a repeated list row.
- Use low shadows only on hover or popovers.

## Color

- Primary actions: black background with white text.
- Secondary actions: white background, neutral border, dark text.
- Accent is reserved for domain highlights and status markers.
- Muted body text uses `--text-muted`; do not fake hierarchy with heavy font weights.

## Product Copy

- Public-facing copy should be written from the final creator/operator to their members, students, readers, or subscribers.
- Admin copy should describe the operator's own daily work: publishing, member care, moderation, billing review, and community operations.
- Avoid agency/client sales language in the app UI. Keep fork, install, integration, and implementation wording inside repo documentation or setup files.

## AI Agent Notes

- Prefer changing `src/styles.css` design tokens before adding one-off classes.
- shadcn/ui primitives live in `src/components/ui/*`, but this project currently uses a plain CSS product system instead of relying on Tailwind utility generation.
- New controls should reuse `.primary-button`, `.secondary-button`, `.ghost-button`, `.pill`, `.status-pill`, and the `--control-*` / `--font-*` tokens.
