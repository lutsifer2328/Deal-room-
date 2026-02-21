const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const { writeFileSync } = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const sRole = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    let result = '';

    // Check task status values present in the table
    const { data: statuses, error: enumError } = await sRole.rpc('exec_sql', {
        sql: `
        SELECT enum_range(NULL::public.task_status);
        `
    });

    result += `TASK STATUS ENUM:\n${JSON.stringify(enumError || statuses, null, 2)}\n\n`;

    // Also check the structure of the tasks table to be sure
    const { data: cols } = await sRole.rpc('exec_sql', {
        sql: `
        SELECT column_name, data_type, udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'tasks';
        `
    });

    result += `TASKS COLUMNS:\n${JSON.stringify(cols, null, 2)}\n\n`;

    writeFileSync('task_debug.txt', result);
    console.log('Done task debug');
})();
