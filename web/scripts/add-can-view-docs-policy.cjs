const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const getEnv = (key) => {
    const match = envContent.match(new RegExp(`${key}=(.+)`));
    return match ? match[1].trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '') : null;
};

const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('SERVICE_ROLE_KEY');

const SQL = `
-- Drop existing potential view policies
DROP POLICY IF EXISTS tasks_can_view_docs ON public.tasks;
DROP POLICY IF EXISTS docs_can_view_docs ON public.documents;

-- Add policy for Tasks: if user is in deal_participants for this deal and has canViewDocuments = true
CREATE POLICY tasks_can_view_docs ON public.tasks 
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.deal_participants dp
    JOIN public.participants p ON p.id = dp.participant_id
    WHERE dp.deal_id = public.tasks.deal_id
    AND p.user_id = auth.uid()
    AND dp.permissions->>'canViewDocuments' = 'true'
  )
);

-- Add policy for Documents: if user is in deal_participants for this deal and has canViewDocuments = true
CREATE POLICY docs_can_view_docs ON public.documents 
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.deal_participants dp
    JOIN public.participants p ON p.id = dp.participant_id
    WHERE dp.deal_id = public.documents.deal_id
    AND p.user_id = auth.uid()
    AND dp.permissions->>'canViewDocuments' = 'true'
  )
);
`;

async function run() {
    const projectRef = SUPABASE_URL.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
    const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

    console.log(`\\n🔧 Attempting Management API: ${url}`);
    let res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
        body: JSON.stringify({ query: SQL })
    });

    if (res.ok) {
        console.log('✅ Applied via Management API');
        return;
    }
    console.log(`ℹ️  Management API ${res.status}: ${await res.text()}`);
}

run().catch(console.error);
