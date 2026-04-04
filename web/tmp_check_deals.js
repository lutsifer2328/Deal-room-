const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://qolozennlzllvrqmibls.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDeals() {
    // Try to get all columns using a raw query if possible, or just a known RPC
    // Since we can't run raw SQL easily via the JS client without RPC, let's try to find an RPC
    const { data: cols, error: colsError } = await supabase.rpc('get_table_columns', { tname: 'deals' });
    if (colsError) {
        // If RPC isn't found, try a known one or just select all and check keys again
        const { data: row, error: rowError } = await supabase.from('deals').select('*').limit(1);
        if (rowError) {
            console.error('Error fetching row:', rowError);
        } else {
            console.log('Keys in deals row:', Object.keys(row[0] || {}));
        }
    } else {
        console.log('Columns from RPC:', cols);
    }
}
checkDeals();
