DELETE FROM public.audit_logs;
DELETE FROM public.agency_contracts;
DELETE FROM public.documents;
DELETE FROM public.deal_participants;
DELETE FROM public.tasks;
DELETE FROM public.deals;
DELETE FROM public.participants;
DELETE FROM public.rate_limits;
DELETE FROM public.users
WHERE email != 'lutsifer@gmail.com';
UPDATE public.standard_documents
SET usage_count = 0;