# Contributing

MemberHub is a forkable membership and community template. Keep contributions useful for people who want to run the local preview first, then choose their own production backend and service providers.

## Scope

- Keep the default install runnable without external keys.
- Keep InsForge as a recommended production backend option in docs only.
- Do not add InsForge SDKs, CLIs, env variables, migrations, functions, or provider-specific code.
- Do not add removed payment/product-operations provider code or copy.
- Do not add personal names, personal brands, personal profile URLs, or private owner information.
- Keep payments, invoices, official email sending, and production member sync optional.

## Checks

Run the focused checks before proposing changes:

```bash
npm run check:integrations
npm run build
npm run test:qa
```

If a check cannot run because of the local environment, document the exact command and error.
