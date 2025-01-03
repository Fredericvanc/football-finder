-- Create profiles table
create table public.profiles (
    id uuid references auth.users on delete cascade,
    name text,
    email text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (id)
);

-- Create games table
create table public.games (
    id bigint generated by default as identity primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    title text not null,
    description text,
    location text not null,
    latitude double precision not null,
    longitude double precision not null,
    date timestamp with time zone not null,
    max_players integer not null,
    min_players integer not null default 2,
    skill_level text,
    creator_id uuid references public.profiles(id) on delete cascade not null,
    location_name text,
    whatsapp_link text,
    is_recurring boolean default false,
    recurrence_frequency text
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.games enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone"
    on public.profiles for select
    using (true);

create policy "Users can insert their own profile"
    on public.profiles for insert
    with check (auth.uid() = id);

create policy "Users can update their own profile"
    on public.profiles for update
    using (auth.uid() = id);

create policy "Games are viewable by everyone"
    on public.games for select
    using (true);

create policy "Authenticated users can create games"
    on public.games for insert
    with check (auth.role() = 'authenticated');

create policy "Game creators can update their games"
    on public.games for update
    using (auth.uid() = creator_id);

create policy "Game creators can delete their games"
    on public.games for delete
    using (auth.uid() = creator_id);

-- Create function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, email, name)
    values (new.id, new.email, new.raw_user_meta_data->>'name');
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user creation
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();
