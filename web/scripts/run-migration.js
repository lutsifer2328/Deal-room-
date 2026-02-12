const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const getEnv = (key) => {
    const match = envContent.match(new RegExp(`${key}=(.+)`));
    return match ? match[1].trim() : null;
};

const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const SERVICE_ROLE_KEY = getEnv('SERVICE_ROLE_KEY') || getEnv('SUPABASE_SERVICE_ROLE_KEY');

async function run() {
    // Use the Supabase SQL endpoint (available since pg-meta v0.77)
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'GET',
        headers: {
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        }
    });

    // Try a workaround: create an RPC function first, then call it
    // Actually, simplest approach: just try to update a deal with price=null 
    // If it fails, the column doesn't exist. If it succeeds, it does.

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // First check if column exists
    const { data, error } = await supabase.from('deals').select('id, price').limit(1);

    if (error && error.message.includes('price')) {
        console.log('Column does not exist. Creating via workaround...');

        // Create a temporary function to run DDL
        const createFnRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
            }
        });
        console.log('Cannot create column via REST API. Please run manually.');
        console.log('SQL: ALTER TABLE deals ADD COLUMN IF NOT EXISTS price numeric;');
    } else if (error) {
        console.log('Unexpected error:', error.message);
    } else {
        console.log('SUCCESS: Column "price" already exists!');
        console.log('Sample data:', JSON.stringify(data));
    }
}

run();
