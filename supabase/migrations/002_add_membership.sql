-- Add membership fields to profiles

alter table public.profiles
  add column if not exists membership_type text not null default 'none',
  add column if not exists membership_paid_at timestamptz;

-- Update trigger to capture membership metadata set during signUp
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id, username, display_name, avatar_url,
    membership_type, membership_paid_at
  )
  values (
    new.id,
    lower(regexp_replace(
      coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
      '[^a-z0-9_]', '_', 'g'
    )),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'membership_type', 'none'),
    case
      when new.raw_user_meta_data->>'membership_type' is not null then now()
      else null
    end
  );
  return new;
end;
$$ language plpgsql security definer;
