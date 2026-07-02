# Security Review / 安全檢查

## 繁中

### 給一般 fork 使用者的結論

這個 repo 可以安全地先在本機體驗，但不要把它當成「不用設定就能直接收款上線」的產品。正式部署前，請先完成以下事項：

- 不要把真實 API key、token、callback secret、測試登入密碼 commit 到 GitHub。
- 把真實值放在 local env file 或部署平台 secret manager。
- Production 不要長期使用內建 preview login；請改接正式 auth provider。
- localStorage 只適合本機預覽，不適合保存正式會員、付款、發票或個資資料。
- 正式後端可以評估 InsForge；如果已有既有 auth/database，也可以直接使用自己的 backend。
- 這個 repo 不內建 provider SDK/CLI、migration、edge function、webhook、checkout 或 env。
- 金流屬於選配功能。只有在使用者明確同意後，才設定正式 payment provider、建立正式方案、收款、取消訂閱或補單。

### 已內建的安全保護

- `.env`, `.env.local`, `.env.*.local`, `.vercel` 都已被 `.gitignore` 排除。
- `.env.example` 只保留 preview login placeholders。
- `npm audit --audit-level=moderate` 可作為 release gate；若有漏洞，請更新依賴或在 release notes 標明風險。
- 測試登入 cookie 使用 `HttpOnly; Secure; SameSite=Lax`，登入 / 查詢 / 登出 API 都設定 `Cache-Control: no-store`。

### 上線前必做

1. 決定正式 auth/database provider。
2. 在正式後端補齊並測試權限規則，至少測試 guest、free member、paid member、admin 四種身份。
3. 把正式資料寫入正式後端，不要依賴 `src/lib/store.ts` 的 localStorage。
4. 若要保留測試登入，請只用在 reference / staging site，不要用在正式營運站。
5. 跑 `npm run check:integrations`、`npm run build`、`npm run test:qa`，全部通過才上線。

### 常見風險與處理

| 風險 | 會發生什麼 | 建議處理 |
| --- | --- | --- |
| 直接使用 localStorage | 使用者換裝置資料消失，也無法保護會員 / 付款資料 | 正式站改接正式 database |
| 權限規則未補齊 | 資料可能被錯誤開放或錯誤擋住 | 依角色逐條測試 policy |
| 真 key commit 到 GitHub | 後端、金流或通知服務可能被濫用 | 立即 rotate key，清除 Git history 或換 repo |
| 未確認就正式收款 | 錯誤方案、退款、發票與稅務問題 | 建立方案、收款、取消訂閱或補單前都要再次確認 |
| Preview login 當正式登入 | 沒有完整註冊、OAuth session、風控、角色管理 | 改用正式 auth provider |

## English

### Summary for fork users

This repo is safe to run locally first, but it is not a zero-config production payment system. Before production:

- Never commit real API keys, tokens, callback secrets, or test login passwords.
- Store real values in local env files or a deployment secret manager.
- Do not keep the built-in preview login as the long-term production auth system. Use a production auth provider.
- localStorage is only for preview data, not production members, payments, invoices, or personal data.
- Production backend planning can evaluate InsForge, or use an existing auth/database provider.
- This repo does not include provider SDK/CLI, migration, edge function, webhook, checkout, or env setup.
- Payments are optional. Configure production payment providers, official plans, payment collection, cancellation/resume, or manual completion only after explicit user confirmation.

### Built-in protections

- Local secret files are ignored by Git.
- `.env.example` only keeps preview login placeholders.
- `npm audit --audit-level=moderate` can be used as a release gate. Fix or document any remaining vulnerabilities.
- Test auth cookies are `HttpOnly; Secure; SameSite=Lax`, and auth APIs return `Cache-Control: no-store`.

### Required before launch

1. Choose a production auth/database provider.
2. Add and test access-control rules for guest, free member, paid member, and admin roles.
3. Replace localStorage state with a production backend.
4. Keep built-in test login for reference/staging only.
5. Run `npm run check:integrations`, `npm run build`, and `npm run test:qa` before launch.
