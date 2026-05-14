# MemberHub UI System

MemberHub uses a restrained product UI system so forked verticals stay coherent. Follow this file before changing component styles.

## UI QA Method

Use this method for every layout or visual change. The goal is to catch crowded desktop layouts, mobile navigation pushing content out of view, hidden overflow, and inconsistent component spacing before the change ships.

1. **Token first**: change shared CSS variables or existing primitives before adding one-off spacing.
2. **Page width first**: desktop content should be centered and capped; wide screens should add outer whitespace, not stretch cards forever.
3. **Density by viewport**: mobile is compact, desktop is comfortable, wide desktop is constrained.
4. **Layout guardrails**: use `max-width`, `min-width: 0`, `minmax(0, 1fr)`, `overflow-wrap: anywhere`, and CSS Grid instead of fragile flex width math.
5. **Measured QA**: Playwright must check geometry, not only screenshots.
6. **Visual evidence**: capture screenshots for key pages after measured tests pass.

Required viewport coverage:

- Mobile: `390x844`
- Desktop: `1440x1000`
- Wide desktop: `2048x1152`

Required Playwright checks:

- No document or body horizontal overflow.
- Mobile navigation stays compact and main content starts in the first viewport.
- Desktop workspace width is capped and centered.
- Section padding, panel padding, grid gap, and section heading spacing meet the shared density rules.
- Text uses approved font sizes, line heights, letter spacing, and weights.
- Buttons, pills, and select triggers do not clip text.
- Visible panels, rows, controls, and cards do not overlap.
- Detail rows use stable left/right columns: primary content on the left, metadata/type/status on the right.
- Course lesson rows use explicit icon/title/time grid columns, never `space-between` that visually centers the lesson title.
- Leaderboards align rank, name, and score in grid columns; the name must sit near the rank, not float in the center of a full-width row.
- Search inputs use short direct placeholder copy. Do not put examples inside the placeholder.
- Featured content needs a measurable gap before the next repeated list item.

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
- Decorative icons should be marked `aria-hidden="true"` or be part of a labeled button.
- Select, input, and button surfaces should share the same border, radius, height, and text scale.
- All interactive controls need visible `:focus-visible` or `:focus-within` states.

## Lists And Rows

- Use CSS Grid for rows that have predictable slots such as icon/title/meta, rank/name/score, or title/type.
- Avoid full-width `justify-content: space-between` when the middle text is the primary information; it often makes names and titles appear centered by accident.
- Primary row text should align left and come first in DOM order. Secondary labels, badges, status, or metadata can align right on desktop and stack on mobile.
- Keep repeated rows at a minimum 10px gap, and add a separate 12px+ gap between a featured item and the list that follows.
- Long titles and metadata must use `min-width: 0` plus wrapping or truncation so they never force horizontal overflow.

## Cards And Panels

- Card radius: 8px.
- Section and panel borders use `--border`.
- Desktop workspace max width: 1360px.
- Desktop workspace padding: 34px.
- Desktop section padding: 28px.
- Desktop panel/card padding: 22px.
- Desktop grid gap: 18px.
- Mobile workspace padding: 14px.
- Mobile section and panel/card padding: 18px.
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
- Avoid sales or implementation language in the app UI. Keep install, integration, and setup wording inside documentation or setup files.

## AI Agent Notes

- Prefer changing `src/styles.css` design tokens before adding one-off classes.
- shadcn/ui primitives live in `src/components/ui/*`, but this project currently uses a plain CSS product system instead of relying on Tailwind utility generation.
- New controls should reuse `.primary-button`, `.secondary-button`, `.ghost-button`, `.pill`, `.status-pill`, and the `--control-*` / `--font-*` tokens.
