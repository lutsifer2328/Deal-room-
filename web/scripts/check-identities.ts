import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    console.log('🔍 Checking Test Identities...\n');

    // 1. Fetch all users and participants to memory (small dataset)
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
    const { data: dbUsers } = await supabase.from('users').select('*');
    const { data: participants } = await supabase.from('participants').select('*');

    // Helper to find
    const findAuth = (roleOrEmail: string) => authUsers.find(u => u.email?.includes(roleOrEmail) || u.user_metadata?.role === roleOrEmail);
    const findDB = (role: string) => dbUsers?.find(u => u.role === role);
    const findPart = (email: string) => participants?.find(p => p.email === email);

    // Checks
    const roles = ['admin', 'lawyer', 'staff', 'buyer', 'seller'];

    for (const role of roles) {
        console.log(`--- Checking Role: ${role.toUpperCase()} ---`);
        const dbUser = findDB(role);
        if (dbUser) {
            console.log(`✅ DB User found: ${dbUser.email} (ID: ${dbUser.id})`);
            const authUser = authUsers.find(u => u.id === dbUser.id);
            if (authUser) console.log(`   ✅ Linked Auth User found: ${authUser.email}`);
            else console.log(`   ❌ MISSING Linked Auth User!`);
        } else {
            // For buyer/seller, they are participants, not necessarily 'users' with role 'buyer' in public.users
            // But the spec says global roles. Let's check if we have any user with this rule.
            if (role === 'buyer' || role === 'seller') {
                console.log(`ℹ️ No DB User with global role '${role}' (Expected for external participants)`);
            } else {
                console.log(`❌ DB User MISSING for role: ${role}`);
            }
        }

        // Check participants for buyer/seller
        if (role === 'buyer' || role === 'seller') {
            const potentialPart = participants?.find(p => p.email?.includes(role));
            if (potentialPart) {
                console.log(`✅ Participant found for '${role}': ${potentialPart.email}`);
            } else {
                console.log(`⚠️ No participant found with email containing '${role}'`);
            }
        }
        console.log('');
    }
}

main().catch(console.error);
