
-- 1. Check Standard Documents Data (Are they active?)
SELECT count(*) as total_docs FROM standard_documents;
SELECT id, name, is_active FROM standard_documents LIMIT 10;

-- 2. Check Tasks Policies (Is RLS blocking inserts?)
select * from pg_policies where tablename = 'tasks';

-- 3. Check Tasks Trigger (Is there a trigger modifying inserts?)
select tgname, tgtype from pg_trigger where tgrelid = 'tasks'::regclass;
