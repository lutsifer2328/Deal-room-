
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

async function main() {
    console.log('🐞 DEBUGGING ROLE UPDATE 🐞');
    const client = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    // 1. Find a 'stranger' user
    const { data: users, error: findError } = await client
        .from('users')
        .select('*')
        .ilike('email', '%stranger_%')
        .limit(1);

    if (findError) { console.error('Find Error:', findError); return; }
    if (!users || users.length === 0) { console.log('No stranger users found.'); return; }

    const targetUser = users[0];
    console.log('Target User:', targetUser);

    // 2. Try to update role to 'user'
    console.log(`Attempting to set role='user' for ${targetUser.id}...`);
    const { error: updateError } = await client
        .from('users')
        .update({ role: 'user' })
        .eq('id', targetUser.id);

    if (updateError) {
        console.error('❌ Update to "user" FAILED:', JSON.stringify(updateError, null, 2));

        // 3. Try 'viewer' if 'user' failed
        console.log(`Attempting to set role='viewer' for ${targetUser.id}...`);
        const { error: viewerError } = await client
            .from('users')
            .update({ role: 'viewer' })
            .eq('id', targetUser.id);

        if (viewerError) {
            console.error('❌ Update to "viewer" FAILED:', JSON.stringify(viewerError, null, 2));
        } else {
            console.log('✅ Update to "viewer" SUCCESS.');
        }

    } else {
        console.log('✅ Update to "user" SUCCESS.');
    }
}

main();
