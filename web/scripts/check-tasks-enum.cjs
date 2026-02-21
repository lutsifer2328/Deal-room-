const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const { writeFileSync } = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sRole = createClient(supabaseUrl, supabaseKey);

(async () => {
    let result = '';

    // Attempt to update a task with a nonsense status to see the Postgres enum error
    // We need to fetch any task id first
    const { data: tasks } = await sRole.from('tasks').select('id').limit(1);

    if (tasks && tasks.length > 0) {
        const taskId = tasks[0].id;
        const { error } = await sRole
            .from('tasks')
            .update({ status: 'INVALID_NONSENSE_STATUS' })
            .eq('id', taskId);

        result += `Attempted nonsense status update:\n${JSON.stringify(error, null, 2)}\n\n`;

        // Also let's try 'completed' just to see what happens
        const { error: completedError } = await sRole
            .from('tasks')
            .update({ status: 'completed' })
            .eq('id', taskId);

        result += `Attempted 'completed' status update:\n${JSON.stringify(completedError, null, 2)}\n\n`;
    } else {
        result += 'No tasks found in the database.\n';
    }

    writeFileSync('task_enum_debug.txt', result);
    console.log('Done task enum debug');
})();
