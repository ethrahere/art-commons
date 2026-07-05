-- Public card registrations for 54 Hands (no auth required)
-- Anyone can register their name + email and receive a random card assignment.

create table public.public_card_registrations (
  id            uuid        default uuid_generate_v4() primary key,
  project_id    uuid        references public.projects(id) on delete cascade not null,
  name          text        not null,
  email         text        not null,
  card_key      text        not null,
  registered_at timestamptz default now(),
  unique (project_id, card_key)
);

alter table public.public_card_registrations enable row level security;

-- No auth needed to register
create policy "Anyone can register"
  on public.public_card_registrations for insert
  with check (true);

-- Card occupancy is public — names and card keys are visible; never select email in public queries
create policy "Card occupancy is public"
  on public.public_card_registrations for select
  using (true);

create index idx_pub_reg_project_id on public.public_card_registrations(project_id);
create index idx_pub_reg_card_key   on public.public_card_registrations(project_id, card_key);

-- Case-insensitive uniqueness on email per project (must be a separate unique index, not an inline constraint)
create unique index idx_pub_reg_email on public.public_card_registrations(project_id, lower(email));

-- Wire up the real Google Form submission URL
update public.projects
  set google_form_url = 'https://docs.google.com/forms/d/e/1FAIpQLSde4HjfCPsBOu-LutdHTfFgHfO4tsPd0BjuKUzT3bOC0yRi1A/viewform?usp=header'
  where slug = '54-hands';

-- Pre-create Volume 2 so the page can immediately open registration once Volume 1 fills up
insert into public.projects (title, slug, description, status, total_slots)
values (
  '54 Hands — Volume 2',
  '54-hands-v2',
  'The second volume of 54 Hands. 54 new cards, 54 new artists, one new deck.',
  'upcoming',
  54
);
