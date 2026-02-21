import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function checkLogs() {
    // Audit logs might show something if the app logged it
    const { data: logs, error } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(5);

    console.log('Recent App Audit Logs:', logs);
}

checkLogs();
