-- 1. Identify and remove duplicate deal_participants first
-- (If the same participant is linked to the same deal multiple times)
DELETE FROM public.deal_participants
WHERE id IN (
    SELECT id FROM (
        SELECT id, 
               ROW_NUMBER() OVER (PARTITION BY deal_id, participant_id ORDER BY joined_at ASC) as rnum
        FROM public.deal_participants
    ) t
    WHERE t.rnum > 1
);

-- 2. Merging global participant duplicates
-- This block keeps the 'first' participant ID and updates all references to point to it, then deletes duplicates.
DO $$
DECLARE 
    r RECORD;
    keep_id UUID;
BEGIN
    FOR r IN 
        SELECT lower(email) as email, array_agg(id) as ids 
        FROM public.participants 
        GROUP BY lower(email) 
        HAVING count(*) > 1
    LOOP
        -- Pick ID to keep (first one)
        keep_id := r.ids[1];
        
        -- Update all deal_participants to point to keep_id
        UPDATE public.deal_participants 
        SET participant_id = keep_id 
        WHERE participant_id = ANY(r.ids[2:]);
        
        -- Update all agency_contracts to point to keep_id
        UPDATE public.agency_contracts
        SET participant_id = keep_id 
        WHERE participant_id = ANY(r.ids[2:]);
        
        -- Now safe to delete the others
        DELETE FROM public.participants 
        WHERE id = ANY(r.ids[2:]);
        
        RAISE NOTICE 'Merged duplicates for %', r.email;
    END LOOP;
END $$;

-- 3. Safely Add Unique Constraints (Ignore if they already exist)

-- A. Global Participants Email
DO $$
BEGIN
    ALTER TABLE public.participants 
    ADD CONSTRAINT participants_email_key UNIQUE (email);
EXCEPTION
    WHEN duplicate_table THEN 
        RAISE NOTICE 'Constraint participants_email_key already exists';
    WHEN OTHERS THEN
        RAISE NOTICE 'Constraint participants_email_key already exists or error: %', SQLERRM;
END $$;

-- B. Deal Participants Link (deal_id + participant_id)
DO $$
BEGIN
    ALTER TABLE public.deal_participants
    ADD CONSTRAINT deal_participants_unique_link UNIQUE (deal_id, participant_id);
EXCEPTION
    WHEN duplicate_table THEN 
        RAISE NOTICE 'Constraint deal_participants_unique_link already exists';
    WHEN OTHERS THEN
        RAISE NOTICE 'Constraint deal_participants_unique_link already exists or error: %', SQLERRM;
END $$;
