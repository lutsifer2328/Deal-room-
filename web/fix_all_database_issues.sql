-- COMPREHENSIVE FIX for User Persistence
-- Run this entire script in the Supabase SQL Editor to fix "Add User" saving issues.

-- 1. DROP FOREIGN KEY CONSTRAINT
-- This removes the requirement that every user must have an Auth account.
DO $$ 
DECLARE
    constraint_name text;
BEGIN 
    -- Find the constraint name that keys public.users to auth.users
    SELECT conname INTO constraint_name 
    FROM pg_constraint 
    WHERE conrelid = 'public.users'::regclass 
    AND confrelid = 'auth.users'::regclass
    AND contype = 'f';
    
    -- If found, drop it
    IF constraint_name IS NOT NULL THEN
        RAISE NOTICE 'Dropping constraint: %', constraint_name;
        EXECUTE 'ALTER TABLE public.users DROP CONSTRAINT ' || quote_ident(constraint_name);
    ELSE
        RAISE NOTICE 'No Foreign Key constraint found between public.users and auth.users';
    END IF;
END $$;

-- 2. UPDATE SECURITY POLICIES (RLS)
-- This allows the Dashboard to save data even if you aren't logged into Supabase Auth.

-- Enable access for anonymous users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable all access for anon" ON public.users;
CREATE POLICY "Enable all access for anon" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- Participants
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.participants;
DROP POLICY IF EXISTS "Enable all access for anon" ON public.participants;
CREATE POLICY "Enable all access for anon" ON public.participants FOR ALL USING (true) WITH CHECK (true);

-- Deals
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.deals;
DROP POLICY IF EXISTS "Enable all access for anon" ON public.deals;
CREATE POLICY "Enable all access for anon" ON public.deals FOR ALL USING (true) WITH CHECK (true);

-- Deal Participants
ALTER TABLE public.deal_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.deal_participants;
DROP POLICY IF EXISTS "Enable all access for anon" ON public.deal_participants;
CREATE POLICY "Enable all access for anon" ON public.deal_participants FOR ALL USING (true) WITH CHECK (true);

-- Tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.tasks;
DROP POLICY IF EXISTS "Enable all access for anon" ON public.tasks;
CREATE POLICY "Enable all access for anon" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

-- Documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.documents;
DROP POLICY IF EXISTS "Enable all access for anon" ON public.documents;
CREATE POLICY "Enable all access for anon" ON public.documents FOR ALL USING (true) WITH CHECK (true);

-- Agency Contracts
ALTER TABLE public.agency_contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.agency_contracts;
DROP POLICY IF EXISTS "Enable all access for anon" ON public.agency_contracts;
CREATE POLICY "Enable all access for anon" ON public.agency_contracts FOR ALL USING (true) WITH CHECK (true);

-- Standard Documents
ALTER TABLE public.standard_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.standard_documents;
DROP POLICY IF EXISTS "Enable all access for anon" ON public.standard_documents;
CREATE POLICY "Enable all access for anon" ON public.standard_documents FOR ALL USING (true) WITH CHECK (true);
