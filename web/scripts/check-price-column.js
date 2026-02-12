const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://qolozennlzllvrqmibls.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw'
);

async function run() {
    // Test: try updating a deal with a price to see if column exists
    const { data, error } = await supabase.from('deals').select('id, title, price').limit(1);

    if (error) {
        if (error.message.includes('price')) {
            console.log('Column "price" does NOT exist yet. You need to add it via Supabase Dashboard SQL Editor.');
            console.log('Run this SQL: ALTER TABLE deals ADD COLUMN IF NOT EXISTS price numeric;');
        } else {
            console.log('Other error:', error.message);
        }
    } else {
        console.log('Column "price" EXISTS! Sample:', JSON.stringify(data));
    }
}

run();
