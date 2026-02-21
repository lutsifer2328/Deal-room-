import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

if (!supabaseUrl || !supabaseKey) { console.error('Missing keys'); process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const TEST_USERS = [
    { email: 'lawyer@agency.com', password: 'Password123!', role: 'lawyer', name: 'Test Lawyer' },
    { email: 'staff@agency.com', password: 'Password123!', role: 'staff', name: 'Test Staff' },
    // Buyers and Sellers start as 'viewer' or just authenticated until assigned to a deal
    { email: 'buyer_test_user@agenzia.com', password: 'Password123!', role: 'viewer', name: 'Test Buyer' },
    { email: 'seller_test_user@agenzia.com', password: 'Password123!', role: 'viewer', name: 'Test Seller' }
];

async function main() {
    console.log('🚀 Setting up Test Identities...');

    for (const user of TEST_USERS) {
        console.log(`\nProcessing ${user.email} (${user.role})...`);

        // 1. Check if Auth User exists
        const { data: { users: foundUsers } } = await supabase.auth.admin.listUsers();
        let authUser = foundUsers.find(u => u.email === user.email);

        if (!authUser) {
            console.log('   Creating Auth User...');
            const { data, error } = await supabase.auth.admin.createUser({
                email: user.email,
                password: user.password,
                email_confirm: true,
                user_metadata: { role: user.role, name: user.name, full_name: user.name }
            });
            if (error) { console.error('   ❌ Failed to create auth user:', error.message); continue; }
            authUser = data.user;
            console.log(`   ✅ Auth User Created: ${authUser?.id}`);
        } else {
            console.log(`   ✅ Auth User Exists: ${authUser.id}`);
        }

        if (!authUser) continue;

        // 2. Check/Create Public User
        const { data: dbUser } = await supabase.from('users').select('*').eq('id', authUser.id).single();

        if (!dbUser) {
            console.log('   Creating Public User Profile...');
            const { error: dbError } = await supabase.from('users').insert({
                id: authUser.id,
                email: user.email,
                role: user.role, // This sets their global role
                name: user.name,
                is_active: true,
                created_at: new Date().toISOString()
            });
            if (dbError) console.error('   ❌ Failed to create DB profile:', dbError.message);
            else console.log('   ✅ DB Profile Created.');
        } else {
            console.log('   ✅ DB Profile Exists.');
        }
    }
}

main().catch(console.error);
