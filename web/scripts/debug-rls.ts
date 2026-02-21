import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

function log(msg: string) {
    console.log(msg);
    fs.appendFileSync('scripts/debug-rls.log', msg + '\n');
}

const createRoleClient = async (email: string, password: string) => {
    const client = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) return { client, user: null, error };
    return { client, user: data.user, error: null };
};

async function main() {
    fs.writeFileSync('scripts/debug-rls.log', ''); // Clear log
    log('🕵️‍♀️ Debugging RLS Policies...');

    // 1. Lawyer Probe
    log('\n--- Probe 1: Lawyer Permissions ---');
    const { client: lawyerClient, user: lawyerUser, error: lErr } = await createRoleClient('lawyer@agency.com', 'Password123!');
    if (!lawyerUser) {
        log('Lawyer login failed: ' + lErr?.message);
    } else {
        log(`Lawyer Logged In: ${lawyerUser.id}`);
        // Test: Can I see myself in public.users?
        const { data: myself, error: meErr } = await lawyerClient.from('users').select('*').eq('id', lawyerUser.id).single();
        if (meErr) log('❌ Lawyer CANNOT read public.users (Self): ' + meErr.message);
        else log('✅ Lawyer can read public.users (Self): ' + myself?.role);
    }

    // 2. Buyer Probe
    log('\n--- Probe 2: Buyer Permissions ---');
    const { client: buyerClient, user: buyerUser, error: bErr } = await createRoleClient('buyer_test_user@agenzia.com', 'Password123!');
    if (!buyerUser) {
        log('Buyer login failed: ' + bErr?.message);
    } else {
        log(`Buyer Logged In: ${buyerUser.id}`);
        // Test: Can I see myself?
        const { data: myself, error: meErr } = await buyerClient.from('users').select('*').eq('id', buyerUser.id).single();
        if (meErr) log('❌ Buyer CANNOT read public.users (Self): ' + meErr.message);
        else log('✅ Buyer can read public.users (Self): ' + myself?.role);

        // Test: Can I upload? (Mock)
        // We know this fails, but let's confirm error message if possible without file
        const { error: upErr } = await buyerClient.storage.from('documents').upload('probe.txt', 'test');
        if (upErr) log('❌ Buyer CANNOT upload: ' + upErr.message);
        else log('✅ Buyer CAN upload');
    }

    // 3. Service Probe (Reference)
    log('\n--- Probe 3: Service Role ---');
    const serviceClient = createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: allUsers } = await serviceClient.from('users').select('email, role').limit(5);
    log('Service Role sees users: ' + allUsers?.map(u => `${u.email} (${u.role})`).join(', '));
}

main();
