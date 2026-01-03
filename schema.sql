-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create Profiles Table (extends Supabase Auth)
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text,
  avatar_url text,
  room_id uuid -- foreign key added later after rooms table exists
);

-- 2. Create Rooms Table
create table public.rooms (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  code text unique not null,
  created_by uuid references public.profiles(id)
);

-- Add foreign key to profiles now that rooms exists
alter table public.profiles 
add constraint profiles_room_id_fkey 
foreign key (room_id) references public.rooms(id);

-- 3. Create Chores Table
create table public.chores (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  status text default 'pending',
  due_date date,
  room_id uuid references public.rooms(id) not null,
  assigned_to uuid references public.profiles(id)
);

-- 4. Create Expenses Table
create table public.expenses (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  description text not null,
  amount numeric not null,
  paid_by uuid references public.profiles(id) not null,
  room_id uuid references public.rooms(id) not null,
  split_with uuid references public.profiles(id),
  type text default 'group'
);


-- 5. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.chores enable row level security;
alter table public.expenses enable row level security;

-- 6. Create Policies (Simplified for MVP: Authenticated users can do everything)
-- In a real app, you would restrict based on room_id

-- Profiles: Verified users can read everyone, update own
create policy "Public profiles are viewable by everyone" 
on public.profiles for select using ( true );

create policy "Users can update own profile" 
on public.profiles for update using ( auth.uid() = id );

create policy "Users can insert their own profile" 
on public.profiles for insert with check ( auth.uid() = id );

-- Rooms: Authenticated users can read/insert/update
create policy "Auth users can view rooms" 
on public.rooms for select to authenticated using ( true );

create policy "Auth users can insert rooms" 
on public.rooms for insert to authenticated with check ( true );

create policy "Auth users can update rooms" 
on public.rooms for update to authenticated using ( true );

-- Chores: Authenticated users can CRUD
create policy "Auth users can view chores" 
on public.chores for select to authenticated using ( true );

create policy "Auth users can insert chores" 
on public.chores for insert to authenticated with check ( true );

create policy "Auth users can update chores" 
on public.chores for update to authenticated using ( true );

-- Expenses: Authenticated users can CRUD
create policy "Auth users can view expenses" 
on public.expenses for select to authenticated using ( true );

create policy "Auth users can insert expenses" 
on public.expenses for insert to authenticated with check ( true );

-- 7. Trigger to auto-create profile on signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
