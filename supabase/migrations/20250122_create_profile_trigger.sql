-- Create trigger to automatically create profile when user signs up
-- This ensures every user has a profile in the profiles table

-- Create function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name', null)
  )
  on conflict (id) do update
  set email = excluded.email;
  
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Also create a function to ensure default wishlist is created
create or replace function public.handle_new_profile()
returns trigger as $$
begin
  -- Create default wishlist for the new profile
  insert into public.wishlists (user_id, name, description, is_default)
  values (new.id, 'My Wishlist', 'Default wishlist', true)
  on conflict do nothing;
  
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger on profiles
drop trigger if exists on_profile_created on public.profiles;
create trigger on_profile_created
  after insert on public.profiles
  for each row
  execute function public.handle_new_profile();

-- Add comment
comment on function public.handle_new_user() is 'Automatically creates a profile when a new user signs up';
comment on function public.handle_new_profile() is 'Automatically creates a default wishlist when a profile is created';

