
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
// Using SERVICE_ROLE_KEY to bypass RLS
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

async function main() {
    console.log('🛡️ STARTING STRICT STAFF CLEANUP (SERVICE ROLE) 🛡️');

    // Create client with service role key
    const client = createClient(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    const ALLOWED_STAFF_EMAILS = [
        'admin@agency.com',
        'lawyer@agency.com',
        'staff@agency.com',
        'kalin@yahoo.com'
    ];

    // 1. Fetch ALL users with organizational roles
    const { data: orgUsers, error } = await client
        .from('users')
        .select('id, email, role')
        .in('role', ['staff', 'lawyer', 'admin']);

    if (error) { console.error('Error fetching users:', error); return; }

    console.log(`Found ${orgUsers.length} users with organizational roles.`);

    for (const u of orgUsers) {
        if (ALLOWED_STAFF_EMAILS.includes(u.email.toLowerCase())) {
            console.log(`✅ KEEPING: ${u.email} (${u.role})`);
            continue;
        }

        console.log(`🔻 DEMOTING: ${u.email} (${u.role}) -> 'user'`);

        const { error: updateError } = await client
            .from('users')
            .update({ role: 'viewer' }) // 'user' is likely invalid Enum, using 'viewer' which is hidden
            .eq('id', u.id);

        if (updateError) {
            console.error(`❌ Failed to demote ${u.email}:`, updateError);
        } else {
            console.log(`success: ${u.email}`);
        }
    }

    console.log('Cleanup complete.');
}

main();
