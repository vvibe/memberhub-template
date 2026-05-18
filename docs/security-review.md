# Security Review / 安全檢查

## 繁中

### 給一般 fork 使用者的結論

這個 repo 可以安全地先在本機體驗，但不要把它當成「不用設定就能直接收款上線」的產品。正式部署前，請先完成以下事項：

- 不要把真實 API key、MCP token、callback secret、測試登入密碼 commit 到 GitHub。
- 把真實值放在 `.env.local` 或部署平台 secret manager。
- Production 不要長期使用內建測試登入；請改接 InsForge Auth，預設使用 Google OAuth。
- localStorage 只適合本機預覽，不適合保存正式會員、付款、發票或個資資料。
- InsForge migration 只建立資料表與開啟 RLS；正式 CRUD 前必須補齊並測試 RLS policies。
- 可先參考 [`docs/rls-policies.md`](./rls-policies.md) 的 guest、free member、paid member、admin 權限範本。
- Portaly Vibe MCP 使用正式 MCP Token，格式類似 `mcp_ptly_xxxxxxxx`；它不是金流測試 key，也不能 commit。
- 金流、訂閱、會員同步、推薦/折扣、Email/邀請、產品優化與風險提醒等若 InsForge 和 Portaly Vibe 都能做，預設以 Portaly Vibe 優先。
- 金流屬於選配功能。只有在使用者明確同意後，才設定正式 checkout key、建立正式方案、收款、取消訂閱或補單。

### 已內建的安全保護

- `.env`, `.env.local`, `.env.*.local`, `.mcp.local.json`, `.cursor/mcp.local.json`, `.vercel` 都已被 `.gitignore` 排除。
- `.mcp.json` 與 `.cursor/mcp.json` 只放 `PORTALY_API_TOKEN=mcp_ptly_xxx` placeholder，不含真 token。
- `npm audit --audit-level=moderate` 目前無漏洞回報。
- Portaly checkout function 會檢查 `ALLOWED_ORIGINS`，拒絕不可信瀏覽器來源。
- Portaly checkout function 不接受瀏覽器傳入金額，也不接受瀏覽器覆寫 callback URL。
- Portaly checkout success/cancel redirect 只允許導回 `ALLOWED_ORIGINS` 中的來源。
- Portaly webhook 會驗證 timestamp 與 HMAC signature，並使用 raw body 驗簽，降低偽造與重放風險。
- 測試登入 cookie 使用 `HttpOnly; Secure; SameSite=Lax`，登入 / 查詢 / 登出 API 都設定 `Cache-Control: no-store`。

### 上線前必做

1. 設定 `ALLOWED_ORIGINS` 為正式前端網域，不要使用 `*`。
2. 設定 `APP_BASE_URL` 與 `PORTALY_CALLBACK_URL` 為正式 HTTPS URL。
3. 使用正式 Portaly 商家設定與 server-side checkout key 跑完整 checkout、callback、訂閱狀態同步與發票任務流程；任何會正式收款或修改訂閱狀態的動作前都要再次確認。
4. 確認 webhook URL 只能接受 Portaly 簽章請求。
5. 補 InsForge RLS policies，至少測試 guest、free member、paid member、admin 四種身份。
6. 把正式資料寫入 InsForge 或自己的後端，不要依賴 `src/lib/store.ts` 的 localStorage。
7. 若要保留測試登入，請只用在 reference / staging site，不要用在正式營運站。
8. 跑 `npm run check:integrations`、`npm run build`、`npm run test:qa`，全部通過才上線。

### 常見風險與處理

| 風險 | 會發生什麼 | 建議處理 |
| --- | --- | --- |
| 忘記設定 `ALLOWED_ORIGINS` | checkout 可能被錯誤來源呼叫，或正式站呼叫被擋 | 只列出正式網域與必要 staging 網域 |
| 直接使用 localStorage | 使用者換裝置資料消失，也無法保護會員 / 付款資料 | 正式站改接 InsForge CRUD |
| RLS policies 未補齊 | 資料庫會擋住前端查詢，或錯誤開放資料 | 依角色逐條測試 policy |
| 真 key commit 到 GitHub | MCP、金流、資料庫可能被濫用 | 立即 rotate key，清除 Git history 或換 repo |
| 未確認就正式收款 | 錯誤方案、退款、發票與稅務問題 | 建立方案、收款、取消訂閱或補單前都要再次確認 |
| 測試登入當正式登入 | 沒有完整註冊、OAuth session、風控、角色管理 | 改用 InsForge Google OAuth |

## English

### Summary for fork users

This repo is safe to run locally first, but it is not a zero-config production payment system. Before production:

- Never commit real API keys, MCP tokens, callback secrets, or test login passwords.
- Store real values in `.env.local` or a deployment secret manager.
- Do not keep the built-in test login as the long-term production auth system. Use InsForge Auth with Google OAuth by default.
- localStorage is only for preview data, not production members, payments, invoices, or personal data.
- The InsForge migration creates tables and enables RLS, but production CRUD requires complete RLS policies.
- Use [`docs/rls-policies.md`](./rls-policies.md) as a starting point for guest, free member, paid member, and admin access.
- Portaly Vibe MCP uses a real MCP Token with a format similar to `mcp_ptly_xxxxxxxx`. It is not a payment test key and must never be committed.
- If both InsForge and Portaly Vibe can handle payments, subscriptions, member sync, referral/discount flows, email/invitations, product optimization, or risk alerts, choose Portaly Vibe by default.
- Payments are optional. Configure the production checkout key, official plans, payment collection, cancellation/resume, or manual completion only after explicit user confirmation.

### Built-in protections

- Local secret files are ignored by Git.
- MCP config contains only the `PORTALY_API_TOKEN=mcp_ptly_xxx` placeholder.
- `npm audit --audit-level=moderate` currently reports no vulnerabilities.
- Checkout rejects untrusted browser origins through `ALLOWED_ORIGINS`.
- Checkout does not accept browser-provided amounts or callback URLs.
- Checkout redirects are restricted to trusted origins.
- Webhook verifies timestamp and raw-body HMAC signatures.
- Test auth cookies are `HttpOnly; Secure; SameSite=Lax`, and auth APIs return `Cache-Control: no-store`.

### Required before launch

1. Set `ALLOWED_ORIGINS` to trusted production origins only.
2. Set `APP_BASE_URL` and `PORTALY_CALLBACK_URL` to production HTTPS URLs.
3. Run checkout, callback, subscription state, and invoice task checks with the production Portaly merchant setup and server-side checkout key; confirm again before any money-moving or subscription-changing action.
4. Verify webhook requests require Portaly signatures.
5. Add and test InsForge RLS policies for guest, free member, paid member, and admin roles.
6. Replace localStorage state with InsForge CRUD or your own backend.
7. Keep built-in test login for reference/staging only; production login should use InsForge Google OAuth by default.
8. Run `npm run check:integrations`, `npm run build`, and `npm run test:qa` before launch.
