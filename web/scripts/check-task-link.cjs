const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const { writeFileSync } = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sRole = createClient(supabaseUrl, supabaseKey);

(async () => {
    let result = '';

    // Find Tommy's document
    const { data: docs } = await sRole
        .from('documents')
        .select('*')
        .ilike('title_en', '%210577319.jpg%');

    result += `TOMMYS DOCUMENT:\n${JSON.stringify(docs, null, 2)}\n\n`;

    if (docs && docs.length > 0) {
        const doc = docs[0];
        if (doc.task_id) {
            // Check the task
            const { data: task } = await sRole
                .from('tasks')
                .select('*')
                .eq('id', doc.task_id)
                .single();

            result += `PARENT TASK:\n${JSON.stringify(task, null, 2)}\n\n`;
        } else {
            result += 'Document has NO task_id linked.\n';
        }
    }

    writeFileSync('task_link_debug.txt', result);
    console.log('Done task link debug');
})();
