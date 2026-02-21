
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

async function main() {
    console.log('🛡️ STARTING STRICT STAFF CLEANUP 🛡️');
    const client = createClient(supabaseUrl, supabaseKey);

    // STRICT ALLOWLIST
    // All other users with 'staff', 'admin', 'lawyer' will be demoted if not in this list.
    // (Except we usually trust current 'admin' roles unless clearly wrong, 
    // but the screenshot showed only one Admin which looked correct: lawyer@agency.com?
    // Wait, the screenshot showed 'lawyer@agency.com' has Admin badge.

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

    if (error) { console.error(error); return; }

    console.log(`Found ${orgUsers.length} users with organizational roles.`);

    for (const u of orgUsers) {
        // If email is in allowlist, SKIP
        if (ALLOWED_STAFF_EMAILS.includes(u.email.toLowerCase())) {
            console.log(`✅ KEEPING: ${u.email} (${u.role})`);
            continue;
        }

        // SAFETY: Only demote if it looks like a test user? 
        // User said: "Those are not staff."
        // So we demote EVERYONE else.

        // Special check: Do not demote the user's OWN account if they are logged in as something else?
        // But I don't know who "User" is. 'lawyer@agency.com' is in allowlist.

        console.log(`🔻 DEMOTING: ${u.email} (${u.role}) -> 'user'`);

        const { error: updateError } = await client
            .from('users')
            .update({ role: 'user' })
            .eq('id', u.id);

        if (updateError) console.error(`Failed to demote ${u.email}:`, updateError);
    }

    console.log('Cleanup complete.');
}

main();
