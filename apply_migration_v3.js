const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

const supabase = createClient(supabaseUrl, serviceKey);

async function applyMigration(filePath) {
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Applying migration: ${filePath}...`);
    
    // Using execute_sql RPC
    const { data, error } = await supabase.rpc('execute_sql', { query: sql });
    
    if (error) {
        console.error('Migration failed:', JSON.stringify(error, null, 2));
        process.exit(1);
    } else {
        console.log('✅ Migration applied successfully:', data);
    }
}

const migrationPath = 'supabase/migrations/phase2_001_isolation_fix.sql';
applyMigration(migrationPath);
