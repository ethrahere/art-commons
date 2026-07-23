-- Skills & Offerings Inventory — before artists can trade, map what the network holds.
-- Each row is one artist declaring either something they offer or something they need.
-- Category is free text (not an enum) so it can grow organically, seeded from
-- an artist's bio/disciplines client-side rather than constrained server-side.

create type public.skill_kind as enum ('offer', 'need');

create table public.skill_entries (
  id          uuid        default uuid_generate_v4() primary key,
  profile_id  uuid        references public.profiles(id) on delete cascade not null,
  kind        skill_kind  not null,
  skill       text        not null,
  note        text,
  created_at  timestamptz default now()
);

alter table public.skill_entries enable row level security;

create policy "Skill entries are public"        on public.skill_entries for select using (true);
create policy "Auth users add skill entries"    on public.skill_entries for insert with check (auth.uid() = profile_id);
create policy "Owners update own skill entries" on public.skill_entries for update using (auth.uid() = profile_id);
create policy "Owners delete own skill entries" on public.skill_entries for delete using (auth.uid() = profile_id);

create index idx_skill_entries_profile_id on public.skill_entries(profile_id);
create index idx_skill_entries_skill      on public.skill_entries(skill);
