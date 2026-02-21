import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';
// Service role to read logs regardless of RLS (though table is public insert/select)
const client = createClient(supabaseUrl, supabaseKey);

async function readLogs() {
    console.log('--- Checking Active Policies on storage.objects ---');
    // We can't query pg_policies easily via JS client unless we expose it or use a raw query if enabled.
    // But we are using service role, so we might be able to use rpc if we had one.
    // Actually, let's just use the `verify-final.ts` approach of "Manual Check" but for policies?
    // No.
    // I'll try to insert a log to verify logging works.

    console.log('--- Testing Log Table ---');
    const { error: insertErr } = await client.from('rls_debug_logs').insert({ message: 'Manual Log Test' });
    if (insertErr) console.error('Log Insert Failed:', insertErr);
    else console.log('Log Insert OK');

    console.log('--- Reading Logs ---');
    const { data, error } = await client
        .from('rls_debug_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(20);

    if (error) console.error('Error reading logs:', error);
    else {
        console.log(`Found ${data.length} logs.`);
        data.forEach(log => {
            console.log(`[${log.timestamp}] User=${log.user_id} Msg=${log.message}`);
        });
    }
}

readLogs();
