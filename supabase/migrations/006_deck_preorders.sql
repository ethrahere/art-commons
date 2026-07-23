-- Pre-orders for the printed 54 Hands deck (distinct from public_card_registrations,
-- which is about claiming a card slot as an artist, not buying the finished product).

create table public.deck_preorders (
  id                   uuid        default uuid_generate_v4() primary key,
  project_id           uuid        references public.projects(id) on delete cascade not null,
  name                 text        not null,
  email                text        not null,
  phone                text        not null,
  address_line1        text        not null,
  address_line2        text,
  city                 text        not null,
  state                text        not null,
  postal_code          text        not null,
  country              text        default 'India' not null,
  quantity             int         not null check (quantity > 0),
  unit_price_paise     int         not null,
  total_amount_paise   int         not null,
  razorpay_order_id    text        not null,
  razorpay_payment_id  text        not null unique,
  created_at           timestamptz default now()
);

alter table public.deck_preorders enable row level security;

-- Unlike public_card_registrations, this table holds PII (address, phone, email)
-- and is never meant to be publicly readable — insert-only from the client,
-- no select policy at all. Reads happen via the Supabase dashboard (service role).
create policy "Anyone can place a pre-order"
  on public.deck_preorders for insert
  with check (true);

create index idx_deck_preorders_project_id on public.deck_preorders(project_id);
