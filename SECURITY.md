# Security Notes

MemberHub is a local-first preview template. It is not a production auth, payment, invoice, or notification backend.

## Repository Boundary

- The app stores preview state in `localStorage`.
- Preview login variables are placeholders only.
- Production backend planning may evaluate InsForge for auth, database, RLS, and storage.
- This repository intentionally does not include InsForge SDK/CLI, env variables, migrations, functions, or provider-specific code.
- This repository must not include removed payment/product-operations provider code or copy.
- Do not add personal names, personal URLs, private owner data, real API keys, callback secrets, or tokens.

## Before Production

- Replace preview auth with a real auth provider.
- Replace localStorage state with a real database.
- Add and test row-level or equivalent access controls in the production backend.
- Put secrets in a deployment secret manager.
- Keep payment, subscription, invoice, email, and messaging provider code outside this template until a specific integration is intentionally created.

## Risk Register

| Risk | Impact | Required Action |
| --- | --- | --- |
| Using localStorage as production state | Data is device-local and not protected as a real backend | Replace with a production database |
| Using preview login as production auth | No real session lifecycle, OAuth, MFA, or abuse protection | Replace with a production auth provider |
| Committing provider secrets | Credentials can leak through GitHub history | Store secrets outside the repo |
| Adding provider code too early | Fork users inherit services they did not choose | Keep integrations as external decisions |
| Adding personal owner data | Forks leak private identity or branding | Use neutral demo names only |

## Validation

Run:

```bash
npm run check:integrations
npm run build
npm run test:qa
```

The integration check verifies that provider SDK/CLI packages, removed provider references, and personal owner identifiers are not present in the repo files it scans.
