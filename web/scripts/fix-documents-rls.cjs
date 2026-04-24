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
DROP POLICY IF EXISTS documents_insert_policy ON public.documents;

CREATE POLICY documents_insert_policy ON public.documents
FOR INSERT TO authenticated
WITH CHECK (
    uploaded_by = auth.uid() AND (public.is_staff() OR public.is_deal_member(deal_id))
);

DROP POLICY IF EXISTS documents_update_policy ON public.documents;
CREATE POLICY documents_update_policy ON public.documents
FOR UPDATE TO authenticated
USING (
    public.is_staff() OR uploaded_by = auth.uid()
);
`;

async function run() {
    const projectRef = SUPABASE_URL.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
    const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

    console.log(`\n🔧 Attempting Management API: ${url}`);
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
