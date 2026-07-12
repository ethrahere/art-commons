-- Volume 2 already says "Volume 2" in its title, but Volume 1's title was just
-- "54 Hands" with no explicit volume marker. Make both self-identifying so the
-- projects table reads unambiguously on its own, without relying on the app
-- code's implicit "the one without a Volume suffix is Volume 1" assumption.

update public.projects
  set title = '54 Hands — Volume 1',
      description = 'The first volume of 54 Hands — 54 cards, 54 artists, one deck.'
  where slug = '54-hands';

-- public_card_registrations only stores project_id (a UUID), which doesn't say
-- anything about which volume a row belongs to at a glance in the table editor.
-- This view joins in the project's title/slug so every registration is
-- self-explanatory without a manual lookup, and it stays correct automatically
-- as new volumes are added — no hardcoded per-volume logic to maintain.
--
-- Email is deliberately excluded: public_card_registrations is publicly
-- readable (RLS "using (true)"), and per that table's own policy comment,
-- email must never appear in a publicly queryable projection of it.
create or replace view public.card_registrations_by_volume as
select
  r.id,
  p.slug   as project_slug,
  p.title  as volume,
  r.name,
  r.card_key,
  r.registered_at
from public.public_card_registrations r
join public.projects p on p.id = r.project_id
order by p.created_at, r.registered_at;
