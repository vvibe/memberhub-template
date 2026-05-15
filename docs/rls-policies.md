# RLS Policy Template / RLS 權限範本

## 繁中

這份檔案是給正式接 InsForge Auth 時使用的 RLS policy 起點。請先確認你的 Auth provider 會把使用者 id 對應到 `profiles.auth_user_id`，再依照實際會員方案、內容類型與後台角色微調。

不要直接關閉 RLS。Postgres 在 RLS 開啟但沒有 policy 時會採用 default deny，這會讓一般使用者看不到資料，但比誤開資料安全。正式上線前，請至少測試 guest、free member、paid member、admin 四種身份。

```sql
-- MemberHub RLS starter policies.
-- Review and adapt before applying to production.

create or replace function memberhub_current_profile_id()
returns uuid
language sql
stable
as $$
  select id
  from profiles
  where auth_user_id = (select auth.uid())
  limit 1
$$;

create or replace function memberhub_is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from profiles
    where auth_user_id = (select auth.uid())
      and role = 'admin'
  )
$$;

create or replace function memberhub_has_paid_membership()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from memberships
    where profile_id = memberhub_current_profile_id()
      and status in ('active', 'paid', 'trialing')
      and (current_period_end is null or current_period_end > now())
  )
$$;

-- Public readable content.
create policy "public can read active plans"
on plans for select
to anon, authenticated
using (is_active = true);

create policy "public can read free content"
on content_items for select
to anon, authenticated
using (is_paid = false);

create policy "paid members can read paid content"
on content_items for select
to authenticated
using (is_paid = false or memberhub_has_paid_membership() or memberhub_is_admin());

-- Profile ownership.
create policy "members can read own profile"
on profiles for select
to authenticated
using (auth_user_id = (select auth.uid()) or memberhub_is_admin());

create policy "members can update own profile"
on profiles for update
to authenticated
using (auth_user_id = (select auth.uid()) or memberhub_is_admin())
with check (auth_user_id = (select auth.uid()) or memberhub_is_admin());

-- Member-owned rows.
create policy "members can read own membership"
on memberships for select
to authenticated
using (profile_id = memberhub_current_profile_id() or memberhub_is_admin());

create policy "members can read own lesson progress"
on lesson_progress for select
to authenticated
using (profile_id = memberhub_current_profile_id() or memberhub_is_admin());

create policy "members can insert own lesson progress"
on lesson_progress for insert
to authenticated
with check (profile_id = memberhub_current_profile_id());

create policy "members can read own checkins"
on checkins for select
to authenticated
using (profile_id = memberhub_current_profile_id() or memberhub_is_admin());

create policy "members can insert own checkins"
on checkins for insert
to authenticated
with check (profile_id = memberhub_current_profile_id());

-- Community.
create policy "members can read community categories"
on community_categories for select
to authenticated
using (admin_only = false or memberhub_is_admin());

create policy "members can read threads"
on discussion_threads for select
to authenticated
using (true);

create policy "members can create threads"
on discussion_threads for insert
to authenticated
with check (author_id = memberhub_current_profile_id());

create policy "members can read comments"
on discussion_comments for select
to authenticated
using (true);

create policy "members can create comments"
on discussion_comments for insert
to authenticated
with check (author_id = memberhub_current_profile_id());

-- Admin-only operational data.
create policy "admins can manage newsletter issues"
on newsletter_issues for all
to authenticated
using (memberhub_is_admin())
with check (memberhub_is_admin());

create policy "admins can manage payments"
on payment_events for all
to authenticated
using (memberhub_is_admin())
with check (memberhub_is_admin());

create policy "admins can manage notifications"
on notifications for all
to authenticated
using (memberhub_is_admin())
with check (memberhub_is_admin());

create policy "admins can manage sync state"
on vibe_sync_state for all
to authenticated
using (memberhub_is_admin())
with check (memberhub_is_admin());
```

## 上線前測試

- Guest 可以讀公開文章與公開方案，但不能讀會員資料、付款資料、後台資料。
- Free member 可以讀公開內容、自己的 profile、自己的 membership 狀態。
- Paid member 可以讀付費內容、自己的課程進度、自己的打卡紀錄。
- Admin 可以管理文章、方案、Newsletter、付款事件、通知與同步狀態。
- Webhook 與後台 server-side jobs 應使用 server-side key，不要從瀏覽器呼叫 admin-only 寫入。

## English

Use this file as a starting point when connecting real InsForge Auth. Confirm that your auth provider maps user ids into `profiles.auth_user_id`, then adapt the policies for your actual plans, content model, and admin roles.

Do not disable RLS for convenience. With RLS enabled and no policy, Postgres denies access by default. This may block reads, but it is safer than exposing member or payment data. Before launch, test guest, free member, paid member, and admin access.
