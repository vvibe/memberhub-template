-- MemberHub baseline schema for InsForge Postgres.
-- Apply with: npx @insforge/cli db migrations up

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid,
  email text not null unique,
  display_name text not null,
  role text not null default 'member',
  group_role text not null default 'member',
  bio text not null default '',
  level int not null default 1,
  points int not null default 0,
  risk text not null default 'low',
  source text,
  created_at timestamptz not null default now()
);

create table if not exists plans (
  id text primary key,
  name text not null,
  price_label text not null,
  cadence text not null,
  description text not null,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  plan_id text not null references plans(id),
  status text not null default 'free',
  current_period_end timestamptz,
  portaly_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists content_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content_type text not null,
  category text not null,
  excerpt text not null,
  body text not null,
  is_paid boolean not null default false,
  source text,
  published_at timestamptz default now()
);

create table if not exists newsletter_issues (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  segment text not null default 'all',
  status text not null default 'draft',
  send_at timestamptz,
  open_rate numeric,
  click_rate numeric,
  paid_conversions int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists media_items (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid references content_items(id) on delete cascade,
  media_type text not null,
  storage_path text,
  preview_seconds int,
  transcript text,
  access_level text not null default 'member',
  created_at timestamptz not null default now()
);

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  sort_order int not null default 0
);

create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  body text,
  transcript text,
  minutes int not null default 0,
  locked_level int,
  pinned_thread_id uuid,
  sort_order int not null default 0
);

create table if not exists course_resources (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  title text not null,
  resource_type text not null,
  access_level text not null default 'member',
  url text,
  storage_path text,
  sort_order int not null default 0
);

create table if not exists lesson_progress (
  profile_id uuid not null references profiles(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (profile_id, lesson_id)
);

create table if not exists community_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  admin_only boolean not null default false,
  sort_order int not null default 0
);

create table if not exists discussion_threads (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references community_categories(id),
  author_id uuid references profiles(id),
  title text not null,
  body text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists discussion_comments (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references discussion_threads(id) on delete cascade,
  author_id uuid references profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists reactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  reaction text not null default 'like',
  created_at timestamptz not null default now()
);

create table if not exists member_points (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  points int not null,
  reason text not null,
  source_type text not null,
  source_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  cadence text not null,
  points int not null default 0,
  starts_at timestamptz,
  ends_at timestamptz
);

create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references challenges(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (challenge_id, profile_id, created_at)
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_type text not null,
  starts_at timestamptz,
  status text not null default 'upcoming',
  audience text not null default 'subscribers',
  replay_access text not null default 'paid',
  replay_url text,
  description text not null default ''
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  channel text not null,
  trigger_key text not null,
  audience text not null default 'all',
  status text not null default 'ready',
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists payment_events (
  id uuid primary key default gen_random_uuid(),
  portaly_session_id text unique,
  profile_id uuid references profiles(id),
  plan_id text references plans(id),
  status text not null,
  amount_label text,
  invoice_status text not null default 'pending',
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id),
  code text,
  source text,
  campaign text,
  reward text,
  free_trials int not null default 0,
  paid_conversions int not null default 0,
  revenue_cents int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists moderation_items (
  id uuid primary key default gen_random_uuid(),
  item_type text not null,
  title text not null,
  subject text not null,
  status text not null default 'open',
  priority text not null default 'medium',
  action text not null default '',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists membership_questions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id),
  question text not null,
  answer text not null,
  status text not null default 'pending',
  reviewed_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists subscriber_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_date date not null default current_date,
  source text not null,
  subscribers int not null default 0,
  paid_conversions int not null default 0,
  revenue_cents int not null default 0
);

create table if not exists vibe_sync_state (
  id uuid primary key default gen_random_uuid(),
  sync_type text not null,
  status text not null,
  payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table memberships enable row level security;
alter table content_items enable row level security;
alter table newsletter_issues enable row level security;
alter table media_items enable row level security;
alter table courses enable row level security;
alter table lessons enable row level security;
alter table course_resources enable row level security;
alter table lesson_progress enable row level security;
alter table community_categories enable row level security;
alter table discussion_threads enable row level security;
alter table discussion_comments enable row level security;
alter table reactions enable row level security;
alter table member_points enable row level security;
alter table challenges enable row level security;
alter table checkins enable row level security;
alter table events enable row level security;
alter table notifications enable row level security;
alter table payment_events enable row level security;
alter table referrals enable row level security;
alter table moderation_items enable row level security;
alter table membership_questions enable row level security;
alter table subscriber_metrics enable row level security;
alter table vibe_sync_state enable row level security;
