const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://qolozennlzllvrqmibls.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase.rpc('get_table_columns', { tname: 'deals' });
    if (error) {
        // Fallback to a direct query on a mock table or similar if possible
        // But since we can't run arbitrary SQL easily without RPC, let's try a simpler approach
        // We'll just fetch ONE row and look at the keys
        const { data: row, error: rowError } = await supabase.from('deals').select('*').limit(1);
        if (rowError) {
            console.error('Error fetching row:', rowError);
        } else {
            console.log('Keys in deals row:', Object.keys(row[0] || {}));
        }
    } else {
        console.log('Columns from RPC:', data);
    }
}

checkSchema();
