import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load from .env.local explicitly in case we are running via ts-node loosely
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Service Role Key in .env.local');
    process.exit(1);
}

const client = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    const email = 'test_admin@agenzia.com';
    const password = 'password123';

    console.log(`Resetting user: ${email}...`);

    // 1. Delete if exists
    const { data: usersData, error: listError } = await client.auth.admin.listUsers();

    if (listError) {
        console.error('Failed to list users:', listError);
        return;
    }

    const existing = usersData?.users.find(u => u.email === email);
    if (existing) {
        console.log(`Found existing auth user, deleting ID: ${existing.id}...`);
        await client.auth.admin.deleteUser(existing.id);

        // Also delete from public mapped
        await client.from('users').delete().eq('email', email);
        console.log(`Deleted public mapping.`);
    }

    console.log(`Creating user ${email} with password '${password}'...`);
    const { data: createData, error: createError } = await client.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: 'Test Admin User', role: 'Admin', isInternal: true }
    });

    if (createError) {
        console.error('Error creating user:', createError);
        return;
    }

    const newUserId = createData.user.id;
    console.log(`Created Auth User successfully: ${newUserId}`);

    // Create public user mapping
    const { error: insertError } = await client.from('users').insert({
        id: newUserId,
        email,
        name: 'Test Admin User',
        role: 'Admin',
        is_active: true
    });

    if (insertError) {
        console.error('Error creating public user:', insertError);
    } else {
        console.log('Successfully created public mapping.');
    }
}

main().catch(console.error);
