-- Fix Storage RLS for 'documents' bucket
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Storage Policies
drop policy if exists "Authenticated can upload documents" on storage.objects;
create policy "Authenticated can upload documents"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'documents' );

drop policy if exists "Authenticated can view documents" on storage.objects;
create policy "Authenticated can view documents"
on storage.objects for select
to authenticated
using ( bucket_id = 'documents' );

-- Fix Documents Table RLS
alter table public.documents enable row level security;

drop policy if exists "Enable insert for authenticated users" on public.documents;
create policy "Enable insert for authenticated users"
on public.documents for insert
to authenticated
with check ( true );

drop policy if exists "Enable select for deal participants" on public.documents;
create policy "Enable select for deal participants"
on public.documents for select
to authenticated
using (
  exists (
    select 1 from deal_participants dp
    join participants p on dp.participant_id = p.id
    where dp.deal_id = documents.deal_id
    and p.user_id = auth.uid()
  )
  or
  exists (
    select 1 from users
    where users.id = auth.uid()
    and users.role in ('admin', 'staff')
  )
);

drop policy if exists "Enable update for creators/admins" on public.documents;
create policy "Enable update for creators/admins"
on public.documents for update
to authenticated
using (
    auth.uid() = uploaded_by
    or exists (
        select 1 from users
        where users.id = auth.uid()
        and users.role in ('admin', 'staff', 'lawyer')
    )
);
