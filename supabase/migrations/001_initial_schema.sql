-- Art Commons — initial schema

create extension if not exists "uuid-ossp";

-- ─── Profiles ──────────────────────────────────────────────────────────────

create table public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  username      text unique not null,
  display_name  text,
  bio           text,
  avatar_url    text,
  location      text,
  website       text,
  disciplines   text[]   default '{}',
  social_links  jsonb    default '{}',
  is_verified   boolean  default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─── Community posts ───────────────────────────────────────────────────────

create type public.post_category as enum (
  'general', 'feedback', 'advice', 'resources', 'financial', 'showcase'
);

create table public.posts (
  id          uuid default uuid_generate_v4() primary key,
  author_id   uuid references public.profiles(id) on delete cascade not null,
  title       text not null,
  content     text not null,
  category    post_category default 'general',
  is_pinned   boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ─── Comments ──────────────────────────────────────────────────────────────

create table public.comments (
  id          uuid default uuid_generate_v4() primary key,
  post_id     uuid references public.posts(id) on delete cascade not null,
  author_id   uuid references public.profiles(id) on delete cascade not null,
  content     text not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ─── Financial resources ───────────────────────────────────────────────────

create type public.resource_category as enum (
  'grant', 'supply', 'financial_aid', 'tool', 'workshop', 'other'
);

create table public.resources (
  id            uuid default uuid_generate_v4() primary key,
  title         text not null,
  description   text,
  url           text,
  category      resource_category default 'other',
  submitted_by  uuid references public.profiles(id) on delete set null,
  is_approved   boolean default false,
  deadline      timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─── Social graph ──────────────────────────────────────────────────────────

create table public.follows (
  follower_id   uuid references public.profiles(id) on delete cascade,
  following_id  uuid references public.profiles(id) on delete cascade,
  created_at    timestamptz default now(),
  primary key (follower_id, following_id)
);

-- ─── Post likes ────────────────────────────────────────────────────────────

create table public.post_likes (
  user_id     uuid references public.profiles(id) on delete cascade,
  post_id     uuid references public.posts(id) on delete cascade,
  created_at  timestamptz default now(),
  primary key (user_id, post_id)
);

-- ─── Row Level Security ────────────────────────────────────────────────────

alter table public.profiles   enable row level security;
alter table public.posts       enable row level security;
alter table public.comments    enable row level security;
alter table public.resources   enable row level security;
alter table public.follows     enable row level security;
alter table public.post_likes  enable row level security;

-- profiles
create policy "Profiles are public"         on public.profiles for select using (true);
create policy "Users insert own profile"    on public.profiles for insert with check (auth.uid() = id);
create policy "Users update own profile"    on public.profiles for update using (auth.uid() = id);

-- posts
create policy "Posts are public"            on public.posts for select using (true);
create policy "Auth users create posts"     on public.posts for insert with check (auth.uid() = author_id);
create policy "Authors update own posts"    on public.posts for update using (auth.uid() = author_id);
create policy "Authors delete own posts"    on public.posts for delete using (auth.uid() = author_id);

-- comments
create policy "Comments are public"         on public.comments for select using (true);
create policy "Auth users create comments"  on public.comments for insert with check (auth.uid() = author_id);
create policy "Authors update own comments" on public.comments for update using (auth.uid() = author_id);
create policy "Authors delete own comments" on public.comments for delete using (auth.uid() = author_id);

-- resources
create policy "Approved resources public"   on public.resources for select using (is_approved = true or auth.uid() = submitted_by);
create policy "Auth users submit resources" on public.resources for insert with check (auth.uid() = submitted_by);

-- follows
create policy "Follows are public"          on public.follows for select using (true);
create policy "Users can follow"            on public.follows for insert with check (auth.uid() = follower_id);
create policy "Users can unfollow"          on public.follows for delete using (auth.uid() = follower_id);

-- likes
create policy "Likes are public"            on public.post_likes for select using (true);
create policy "Auth users can like"         on public.post_likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike"            on public.post_likes for delete using (auth.uid() = user_id);

-- ─── Auto-create profile on signup ────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    lower(regexp_replace(
      coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
      '[^a-z0-9_]', '_', 'g'
    )),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── updated_at triggers ──────────────────────────────────────────────────

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at  before update on public.profiles  for each row execute procedure public.handle_updated_at();
create trigger posts_updated_at     before update on public.posts      for each row execute procedure public.handle_updated_at();
create trigger comments_updated_at  before update on public.comments   for each row execute procedure public.handle_updated_at();
create trigger resources_updated_at before update on public.resources  for each row execute procedure public.handle_updated_at();

-- ─── Indexes ───────────────────────────────────────────────────────────────

create index idx_profiles_username      on public.profiles(username);
create index idx_posts_author_id        on public.posts(author_id);
create index idx_posts_category         on public.posts(category);
create index idx_posts_created_at       on public.posts(created_at desc);
create index idx_comments_post_id       on public.comments(post_id);
create index idx_follows_following_id   on public.follows(following_id);
create index idx_resources_category     on public.resources(category);
create index idx_resources_is_approved  on public.resources(is_approved);
