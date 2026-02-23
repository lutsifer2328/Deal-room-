// apply-storage-rls-v2.cjs
// Uses Supabase Management API to execute raw SQL
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const getEnv = (key) => {
    const match = envContent.match(new RegExp(`${key}=(.+)`));
    return match ? match[1].trim() : null;
};

const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('SERVICE_ROLE_KEY');

const projectRef = SUPABASE_URL.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
console.log(`Project ref: ${projectRef}`);

const SQL = `
UPDATE storage.buckets SET public = false WHERE id = 'documents';
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Strict View Access for Documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
CREATE POLICY "Strict View Access for Documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND (
    owner = auth.uid()
    OR public.is_staff()
    OR EXISTS (SELECT 1 FROM public.documents d WHERE d.url = storage.objects.name AND public.is_deal_member(d.deal_id))
    OR EXISTS (SELECT 1 FROM public.agency_contracts c WHERE c.url = storage.objects.name)
  )
);
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');
`;

async function run() {
    // Use Supabase Management API v1 - sql endpoint
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

    // Fallback: Use pg-meta via Supabase project API
    const pgMetaUrl = `${SUPABASE_URL}/pg-meta/v0/query`;
    console.log(`\n🔧 Attempting pg-meta: ${pgMetaUrl}`);
    res = await fetch(pgMetaUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
        body: JSON.stringify({ query: SQL })
    });

    if (res.ok) {
        console.log('✅ Applied via pg-meta');
        return;
    }
    console.log(`ℹ️  pg-meta ${res.status}: ${await res.text()}`);

    // Show final instructions 
    console.log(`
╔══════════════════════════════════════════════════════════╗
║           MANUAL SQL REQUIRED                            ║   
╠══════════════════════════════════════════════════════════╣
║ Open the Supabase SQL Editor:                            ║
║ https://supabase.com/dashboard/project/${projectRef}/sql ║
║                                                          ║
║ Then paste and run the file:                             ║
║ web/phase5_001_storage_hardening.sql                     ║
╚══════════════════════════════════════════════════════════╝
    `);
}

run().catch(console.error);
