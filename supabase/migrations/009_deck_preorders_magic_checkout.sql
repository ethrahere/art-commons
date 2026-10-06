-- Pre-orders now collect a delivery method with a fee — either inside Razorpay
-- Magic Checkout or, until that's enabled on the account, on our own form.
-- total_amount_paise is what was actually paid, i.e.
-- unit_price_paise * quantity + shipping_fee_paise.

alter table public.deck_preorders
  add column shipping_method    text,
  add column shipping_fee_paise int     default 0     not null,
  add column newsletter_opt_in  boolean default false not null;
