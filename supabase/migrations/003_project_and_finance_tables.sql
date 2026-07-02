-- Art Commons — migration 003
-- New tables for: projects, finances, artworks, treasury, notifications
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Artworks ─────────────────────────────────────────────────────────────
-- Used by: /profile (portfolio), /dashboard ("Your work")

create type public.artwork_status as enum ('studio', 'listed', 'sold', 'archived');

create table public.artworks (
  id            uuid        default uuid_generate_v4() primary key,
  profile_id    uuid        references public.profiles(id) on delete cascade not null,
  title         text        not null,
  medium        text,
  year          smallint,
  dimensions    text,
  description   text,
  image_url     text,
  status        artwork_status default 'studio',
  listed_price  numeric(14, 2),
  sold_price    numeric(14, 2),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─── Treasury transactions ─────────────────────────────────────────────────
-- Used by: /treasury (ledger), /dashboard (treasury card)
-- Append-only ledger; amount is positive for inflows, negative for outflows (INR).

create type public.transaction_type as enum (
  'drop_sale',
  'artist_split',
  'supporter_contribution',
  'allocation',
  'infrastructure',
  'refund',
  'other'
);

create table public.treasury_transactions (
  id            uuid             default uuid_generate_v4() primary key,
  type          transaction_type not null,
  title         text             not null,
  description   text,
  amount        numeric(14, 2)   not null,   -- positive = inflow, negative = outflow
  project_id    uuid,                        -- FK added after projects table exists (below)
  initiated_by  uuid             references public.profiles(id) on delete set null,
  created_at    timestamptz      default now()
);

-- ─── Supporters ───────────────────────────────────────────────────────────
-- Used by: /treasury (supporter ledger), /dashboard (supporter count)

create table public.supporters (
  id            uuid           default uuid_generate_v4() primary key,
  display_name  text           not null,
  email         text,
  profile_id    uuid           references public.profiles(id) on delete set null,
  amount        numeric(14, 2) not null,
  access_level  text           not null default 'standard',  -- 'early_drop' | 'standard'
  note          text,
  created_at    timestamptz    default now()
);

-- ─── Opportunities (grants, fellowships, residencies) ──────────────────────
-- Used by: /finances, /dashboard ("Open opportunities")

create type public.opportunity_medium as enum (
  'any_medium', 'painting', 'sculpture', 'photography',
  'printmaking', 'textile', 'digital', 'residency', 'other'
);

create table public.opportunities (
  id            uuid               default uuid_generate_v4() primary key,
  title         text               not null,
  body          text,
  url           text,
  organization  text,
  location      text,
  medium        opportunity_medium default 'any_medium',
  amount_text   text,          -- display string, e.g. "$60,000" or "Fully funded"
  deadline      timestamptz,
  is_active     boolean        default true,
  created_at    timestamptz    default now(),
  updated_at    timestamptz    default now()
);

-- ─── Opportunity applications ─────────────────────────────────────────────
-- Used by: /finances (track intent + submission per user per opportunity)

create type public.application_status as enum (
  'intent', 'submitted', 'awarded', 'rejected'
);

create table public.opportunity_applications (
  id              uuid               default uuid_generate_v4() primary key,
  opportunity_id  uuid               references public.opportunities(id) on delete cascade not null,
  profile_id      uuid               references public.profiles(id) on delete cascade not null,
  status          application_status default 'intent',
  note            text,
  applied_at      timestamptz,
  created_at      timestamptz        default now(),
  updated_at      timestamptz        default now(),
  unique (opportunity_id, profile_id)
);

-- ─── Projects ─────────────────────────────────────────────────────────────
-- Used by: /projects (current), /projects/past (archive)

create type public.project_status as enum ('upcoming', 'active', 'completed', 'archived');

create table public.projects (
  id              uuid           default uuid_generate_v4() primary key,
  title           text           not null,
  slug            text           unique not null,
  description     text,
  status          project_status default 'upcoming',
  total_slots     smallint       not null default 54,
  google_form_url text,
  start_date      date,
  end_date        date,
  cover_image_url text,
  created_at      timestamptz    default now(),
  updated_at      timestamptz    default now()
);

-- Now that projects exists, wire up the FK on treasury_transactions
alter table public.treasury_transactions
  add constraint treasury_transactions_project_id_fkey
  foreign key (project_id) references public.projects(id) on delete set null;

-- ─── Project participants ─────────────────────────────────────────────────
-- Used by: /projects (participating artists panel)

create type public.participant_status as enum ('pending', 'accepted', 'rejected');

create table public.project_participants (
  id          uuid               default uuid_generate_v4() primary key,
  project_id  uuid               references public.projects(id) on delete cascade not null,
  profile_id  uuid               references public.profiles(id) on delete cascade not null,
  status      participant_status default 'pending',
  joined_at   timestamptz        default now(),
  unique (project_id, profile_id)
);

-- ─── Project card assignments ─────────────────────────────────────────────
-- Used by: /projects — card grid, "Assign random card" feature
-- card_key is e.g. "A♠", "7♥", "Q♦", "Joker Red"

create table public.project_card_assignments (
  id          uuid        default uuid_generate_v4() primary key,
  project_id  uuid        references public.projects(id) on delete cascade not null,
  profile_id  uuid        references public.profiles(id) on delete cascade not null,
  card_key    text        not null,
  assigned_at timestamptz default now(),
  unique (project_id, card_key),
  unique (project_id, profile_id)
);

-- ─── Project submissions ──────────────────────────────────────────────────
-- Used by: /projects (submission status per artist)

create type public.submission_status as enum (
  'pending', 'approved', 'rejected', 'revision_requested'
);

create table public.project_submissions (
  id                 uuid              default uuid_generate_v4() primary key,
  project_id         uuid              references public.projects(id) on delete cascade not null,
  profile_id         uuid              references public.profiles(id) on delete cascade not null,
  card_assignment_id uuid              references public.project_card_assignments(id) on delete set null,
  file_url           text,
  notes              text,
  status             submission_status default 'pending',
  submitted_at       timestamptz       default now(),
  reviewed_at        timestamptz,
  reviewed_by        uuid              references public.profiles(id) on delete set null,
  unique (project_id, profile_id)
);

-- ─── Notifications (activity feed) ────────────────────────────────────────
-- Used by: /dashboard (Activity panel)

create type public.notification_type as enum (
  'new_follower',
  'post_like',
  'post_comment',
  'treasury_split',
  'card_assigned',
  'submission_approved',
  'submission_rejected',
  'opportunity_deadline',
  'supporter_joined'
);

create table public.notifications (
  id          uuid              default uuid_generate_v4() primary key,
  user_id     uuid              references public.profiles(id) on delete cascade not null,
  type        notification_type not null,
  title       text              not null,
  body        text,
  link        text,
  is_read     boolean           default false,
  created_at  timestamptz       default now()
);

-- ─── Row Level Security ────────────────────────────────────────────────────

alter table public.artworks                  enable row level security;
alter table public.treasury_transactions     enable row level security;
alter table public.supporters                enable row level security;
alter table public.opportunities             enable row level security;
alter table public.opportunity_applications  enable row level security;
alter table public.projects                  enable row level security;
alter table public.project_participants      enable row level security;
alter table public.project_card_assignments  enable row level security;
alter table public.project_submissions       enable row level security;
alter table public.notifications             enable row level security;

-- artworks: public read, owner write
create policy "Artworks are public"           on public.artworks for select using (true);
create policy "Artists manage own artworks"   on public.artworks for insert with check (auth.uid() = profile_id);
create policy "Artists update own artworks"   on public.artworks for update using (auth.uid() = profile_id);
create policy "Artists delete own artworks"   on public.artworks for delete using (auth.uid() = profile_id);

-- treasury_transactions: authenticated members read; no direct insert (service role / admin)
create policy "Members read treasury"         on public.treasury_transactions for select using (auth.role() = 'authenticated');
create policy "Members record transactions"   on public.treasury_transactions for insert with check (auth.role() = 'authenticated');

-- supporters: members read
create policy "Members read supporters"       on public.supporters for select using (auth.role() = 'authenticated');
create policy "Members add supporters"        on public.supporters for insert with check (auth.role() = 'authenticated');

-- opportunities: public read (active only), authenticated full read
create policy "Active opportunities public"   on public.opportunities for select using (is_active = true or auth.role() = 'authenticated');
create policy "Members manage opportunities"  on public.opportunities for insert with check (auth.role() = 'authenticated');
create policy "Members update opportunities"  on public.opportunities for update using (auth.role() = 'authenticated');

-- opportunity_applications: own only
create policy "Own applications only"         on public.opportunity_applications for select using (auth.uid() = profile_id);
create policy "Members apply"                 on public.opportunity_applications for insert with check (auth.uid() = profile_id);
create policy "Members update own apps"       on public.opportunity_applications for update using (auth.uid() = profile_id);

-- projects: public read, authenticated write
create policy "Projects are public"           on public.projects for select using (true);
create policy "Members create projects"       on public.projects for insert with check (auth.role() = 'authenticated');
create policy "Members update projects"       on public.projects for update using (auth.role() = 'authenticated');

-- project_participants: public read, authenticated write
create policy "Participants public"           on public.project_participants for select using (true);
create policy "Members add participants"      on public.project_participants for insert with check (auth.role() = 'authenticated');
create policy "Members update participants"   on public.project_participants for update using (auth.role() = 'authenticated');

-- project_card_assignments: public read (open tracking), authenticated write
create policy "Card assignments public"       on public.project_card_assignments for select using (true);
create policy "Members assign cards"          on public.project_card_assignments for insert with check (auth.role() = 'authenticated');

-- project_submissions: own read + insert; all authenticated can read project submissions
create policy "Members read submissions"      on public.project_submissions for select using (auth.role() = 'authenticated');
create policy "Artists submit own work"       on public.project_submissions for insert with check (auth.uid() = profile_id);
create policy "Artists update own submission" on public.project_submissions for update using (auth.uid() = profile_id);

-- notifications: own only
create policy "Own notifications only"        on public.notifications for select using (auth.uid() = user_id);
create policy "Mark notifications read"       on public.notifications for update using (auth.uid() = user_id);

-- ─── updated_at triggers ──────────────────────────────────────────────────

create trigger artworks_updated_at
  before update on public.artworks
  for each row execute procedure public.handle_updated_at();

create trigger opportunities_updated_at
  before update on public.opportunities
  for each row execute procedure public.handle_updated_at();

create trigger opportunity_applications_updated_at
  before update on public.opportunity_applications
  for each row execute procedure public.handle_updated_at();

create trigger projects_updated_at
  before update on public.projects
  for each row execute procedure public.handle_updated_at();

-- ─── Indexes ───────────────────────────────────────────────────────────────

create index idx_artworks_profile_id          on public.artworks(profile_id);
create index idx_artworks_status              on public.artworks(status);

create index idx_treasury_type               on public.treasury_transactions(type);
create index idx_treasury_created_at         on public.treasury_transactions(created_at desc);
create index idx_treasury_project_id         on public.treasury_transactions(project_id);

create index idx_supporters_created_at       on public.supporters(created_at desc);

create index idx_opportunities_medium        on public.opportunities(medium);
create index idx_opportunities_deadline      on public.opportunities(deadline);
create index idx_opportunities_is_active     on public.opportunities(is_active);

create index idx_opp_apps_profile_id         on public.opportunity_applications(profile_id);
create index idx_opp_apps_opportunity_id     on public.opportunity_applications(opportunity_id);

create index idx_projects_status             on public.projects(status);
create index idx_projects_slug               on public.projects(slug);

create index idx_participants_project_id     on public.project_participants(project_id);
create index idx_participants_profile_id     on public.project_participants(profile_id);

create index idx_card_assignments_project    on public.project_card_assignments(project_id);
create index idx_card_assignments_profile    on public.project_card_assignments(profile_id);

create index idx_submissions_project_id      on public.project_submissions(project_id);
create index idx_submissions_profile_id      on public.project_submissions(profile_id);
create index idx_submissions_status          on public.project_submissions(status);

create index idx_notifications_user_id       on public.notifications(user_id);
create index idx_notifications_is_read       on public.notifications(is_read);
create index idx_notifications_created_at    on public.notifications(created_at desc);

-- ─── Seed: 54 Hands project ────────────────────────────────────────────────
-- Insert the first project so the /projects page can query real data.

insert into public.projects (title, slug, description, status, total_slots, google_form_url, start_date, end_date)
values (
  '54 Hands',
  '54-hands',
  'A playing card deck featuring original artwork from 54 artists — one piece per card, one template by the Holding.',
  'active',
  54,
  null,   -- replace with real Google Form URL
  '2026-06-01',
  '2026-07-31'
);
