
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

async function main() {
    console.log('🔍 Auditing Staff Roles...');
    const client = createClient(supabaseUrl, supabaseKey);

    // 1. Get all users with 'staff' role
    const { data: staffUsers, error: uError } = await client
        .from('users')
        .select('id, email, role')
        .eq('role', 'staff');

    if (uError) { console.error(uError); return; }

    console.log(`Found ${staffUsers.length} users with role='staff'. Checking if they are actually participants...`);

    // 2. Check which of these emails exist in 'participants' table as non-internal?
    // Actually, internal staff CAN be in participants table too.
    // But usually external participants are NOT 'staff' in public.users.

    // Let's look for users who look like external tests (yahoo, gmail, or test emails)
    // Or check if they have a participant record that is NOT linked to an internal role?
    // The Spec says: "Internal staff may also appear as participants".

    // Heuristic: If their email domain is NOT 'agency.com' (assuming agency is internal) 
    // AND they were likely targeted by my previous 'fix-viewers' script.

    // Let's just list them for now to see.
    console.table(staffUsers.map(u => ({ id: u.id, email: u.email, role: u.role })));

    // 3. Fix: Downgrade known test/external emails to 'user'
    const knownExternalDomains = ['yahoo.com', 'gmail.com', 'test.com', 'agenzia.com']; // agenzia.com might be internal?
    // User said: "All test participants added in deals".

    // I will look for any user that is NOT 'admin', 'lawyer' (we are only looking at staff)
    // and see if we should demote them.

    const potentialExternal = staffUsers.filter(u => {
        // Exclude likely real staff if we can identify them?
        // For now, let's just output the list so I can ask the user or make a safe decision.
        return true;
    });
}

main();
