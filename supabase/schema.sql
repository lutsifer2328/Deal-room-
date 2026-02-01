-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. ENUMS
create type app_role as enum ('admin', 'lawyer', 'staff', 'viewer', 'buyer', 'seller', 'agent', 'notary', 'bank_representative');
create type deal_status as enum ('active', 'on_hold', 'closed');
create type document_status as enum ('private', 'verified', 'released', 'rejected');

-- 2. USERS (Public Profile)
create table public.users (
  id uuid references auth.users not null primary key,
  email text not null,
  name text,
  role app_role default 'viewer',
  avatar_url text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_login timestamp with time zone
);

-- Trigger to handle new user signup automatically
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.users (id, email, name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'name', 'viewer');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. PARTICIPANTS (Global Registry)
create table public.participants (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id), -- Optional link to internal user
  name text not null,
  email text not null unique,
  phone text,
  agency text,
  invitation_status text default 'pending', -- 'pending', 'accepted', 'declined'
  internal_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. AGENCY CONTRACTS
create table public.agency_contracts (
  id uuid default uuid_generate_v4() primary key,
  participant_id uuid references public.participants(id) not null,
  title text not null,
  url text not null,
  uploaded_by uuid references public.users(id),
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. DEALS
create table public.deals (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  property_address text,
  status deal_status default 'active',
  current_step_id text,
  timeline_json jsonb, -- Stores the full timeline structure
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  closed_at timestamp with time zone,
  closed_by uuid references public.users(id),
  closure_notes text
);

-- 6. DEAL PARTICIPANTS (Junction)
create table public.deal_participants (
  id uuid default uuid_generate_v4() primary key,
  deal_id uuid references public.deals(id) not null,
  participant_id uuid references public.participants(id) not null,
  role app_role not null,
  permissions jsonb default '{}'::jsonb,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(deal_id, participant_id)
);

-- 7. STANDARD DOCUMENTS (Catalog)
create table public.standard_documents (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  usage_count int default 0,
  created_by uuid references public.users(id),
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. TASKS
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  deal_id uuid references public.deals(id) not null,
  title_en text not null,
  title_bg text,
  description_en text,
  description_bg text,
  assigned_to app_role not null,
  status text default 'pending', -- 'pending', 'in_review', 'completed'
  required boolean default false,
  standard_document_id uuid references public.standard_documents(id),
  expiration_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. DOCUMENTS
create table public.documents (
  id uuid default uuid_generate_v4() primary key,
  task_id uuid references public.tasks(id), -- Can be null if generic deal doc? No, logic assumes tasks usually.
  deal_id uuid references public.deals(id) not null, -- Denormalized for RLS
  title_en text not null,
  title_bg text,
  url text not null,
  status document_status default 'private',
  uploaded_by uuid references public.users(id),
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null,
  verified_at timestamp with time zone,
  rejection_reason_en text,
  rejection_reason_bg text
);

-- 10. AUDIT LOGS
create table public.audit_logs (
  id uuid default uuid_generate_v4() primary key,
  deal_id uuid references public.deals(id),
  actor_id uuid references public.users(id),
  actor_name text,
  action text not null,
  details text,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ROW LEVEL SECURITY (RLS) POLICIES
alter table public.users enable row level security;
alter table public.participants enable row level security;
alter table public.agency_contracts enable row level security;
alter table public.deals enable row level security;
alter table public.deal_participants enable row level security;
alter table public.tasks enable row level security;
alter table public.documents enable row level security;
alter table public.audit_logs enable row level security;
alter table public.standard_documents enable row level security;

-- Simple Policy for Review Stage: Allow authenticated users to see almost everything
-- refined policies will be implemented later.
create policy "Allow logged-in read access" on public.users for select using (auth.role() = 'authenticated');
create policy "Allow logged-in read access" on public.participants for select using (auth.role() = 'authenticated');
create policy "Allow logged-in read access" on public.deals for select using (auth.role() = 'authenticated');
create policy "Allow logged-in read access" on public.deal_participants for select using (auth.role() = 'authenticated');
create policy "Allow logged-in read access" on public.tasks for select using (auth.role() = 'authenticated');
create policy "Allow logged-in read access" on public.documents for select using (auth.role() = 'authenticated');
create policy "Allow logged-in read access" on public.standard_documents for select using (auth.role() = 'authenticated');
create policy "Allow logged-in read access" on public.audit_logs for select using (auth.role() = 'authenticated');

-- Enable full access for now (Development Mode)
-- In production, strict rules are needed.
create policy "Enable all access for authenticated users" on public.users for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.deals for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.participants for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.deal_participants for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.tasks for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.documents for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.standard_documents for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.audit_logs for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.agency_contracts for all using (auth.role() = 'authenticated');
