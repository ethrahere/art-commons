-- Lead capture for deck pre-orders paid through an external Razorpay payment link.
-- Unlike deck_preorders (a verified paid order with address + payment signature),
-- the pre-order page no longer collects a client-side payment callback to verify
-- against, so this only captures name/email/quantity interest right before the
-- buyer is sent off-site to pay.

create table public.deck_preorder_leads (
  id                uuid        default uuid_generate_v4() primary key,
  project_id        uuid        references public.projects(id) on delete cascade not null,
  name              text        not null,
  email             text        not null,
  quantity          int         not null default 1 check (quantity > 0),
  newsletter_opt_in boolean     default false not null,
  created_at        timestamptz default now()
);

alter table public.deck_preorder_leads enable row level security;

-- Same rationale as deck_preorders: holds PII (name, email), insert-only from the
-- client, no select policy. Reads happen via the Supabase dashboard (service role).
create policy "Anyone can register pre-order interest"
  on public.deck_preorder_leads for insert
  with check (true);

create index idx_deck_preorder_leads_project_id on public.deck_preorder_leads(project_id);
create index idx_deck_preorder_leads_email on public.deck_preorder_leads(email);
