import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY!
);

async function repairDocument() {
    const dealId = '65996e42-a304-404a-a5a6-13257cef8c76';
    const docId = '59065a08-29e8-4909-a31f-fad2006fe2a1';

    // 1. Find a task in this deal
    const { data: tasks, error: taskError } = await supabase
        .from('tasks')
        .select('id, title_en')
        .eq('deal_id', dealId)
        .limit(1);

    if (taskError || !tasks || tasks.length === 0) {
        console.error('No tasks found for deal:', dealId, taskError);
        return;
    }

    const targetTask = tasks[0];
    console.log(`Found task: ${targetTask.title_en} (${targetTask.id})`);

    // 2. Update document
    const { error: updateError } = await supabase
        .from('documents')
        .update({ task_id: targetTask.id })
        .eq('id', docId);

    if (updateError) {
        console.error('Failed to update document:', updateError);
    } else {
        console.log(`✅ Document ${docId} linked to task ${targetTask.id}. It should now be visible.`);
    }
}

repairDocument();
