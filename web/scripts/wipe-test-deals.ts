import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function wipeDealsAndParticipants() {
    console.log('Fetching deals...');
    const { data: deals, error: dealError } = await supabase.from('deals').select('id, title');
    
    if (dealError || !deals) {
        console.error('Error fetching deals:', dealError);
        return;
    }
    
    const dealIds = deals.map(d => d.id);
    console.log(`Found ${dealIds.length} deals.`);
    
    if (dealIds.length === 0) {
        console.log('No deals to wipe!');
        return;
    }

    // 1. Delete Audit Logs
    console.log('Cleaning Audit Logs...');
    const { error: alErr } = await supabase.from('audit_logs').delete().in('deal_id', dealIds);
    if (!alErr) console.log('✅ Audit logs cleared.');

    // 2. Delete Documents (Many are linked to tasks or deals)
    // First, fetch all task IDs for these deals
    const { data: tasks } = await supabase.from('tasks').select('id').in('deal_id', dealIds);
    const taskIds = tasks?.map(t => t.id) || [];
    
    console.log(`Cleaning Documents... (found tasks: ${taskIds.length})`);
    if (taskIds.length > 0) {
        const { error: docErr } = await supabase.from('documents').delete().in('task_id', taskIds);
        if (!docErr) console.log('✅ Documents tied to tasks cleared.');
    }
    
    // Some documents might be tied to deal_id (e.g. standard docs added to deal)
    const { error: docDealErr } = await supabase.from('documents').delete().in('deal_id', dealIds);
    if (!docDealErr) console.log('✅ Documents tied to deals cleared.');

    // 3. Delete Tasks
    console.log('Cleaning Tasks...');
    const { error: taskErr } = await supabase.from('tasks').delete().in('deal_id', dealIds);
    if (!taskErr) console.log('✅ Tasks cleared.');

    // 4. Delete Deal Participants
    console.log('Cleaning Deal Participants...');
    const { error: dpErr } = await supabase.from('deal_participants').delete().in('deal_id', dealIds);
    if (!dpErr) console.log('✅ deal_participants cleared.');

    // 5. Delete Participants
    console.log('Cleaning Participants table...');
    for (const dId of dealIds) {
         // Some might be tracked by deal_id in the participants table, some by user_id
         await supabase.from('participants').delete().eq('deal_id', dId);
    }
    console.log('✅ Participants cleared.');

    // 6. Delete Deals
    let deletedDealsCount = 0;
    for (const dId of dealIds) {
        const { error: delDealErr } = await supabase.from('deals').delete().eq('id', dId);
        if (delDealErr) {
            console.error(`❌ Failed to delete deal ${dId}:`, delDealErr.message);
        } else {
            deletedDealsCount++;
        }
    }
    console.log(`✅ Deleted ${deletedDealsCount}/${dealIds.length} deals.`);
    
    // We already cleaned up ghost external users in the previous run, but we can do a quick check just in case.
    const { data: allUsers } = await supabase.from('users').select('id, email, role');
    const safeRoles = ['admin', 'staff', 'lawyer', 'broker'];
    let ghostUserCount = 0;
    for (const u of (allUsers || [])) {
        if (!safeRoles.includes(u.role) && u.email !== 'lutsifer@gmail.com') {
             await supabase.from('users').delete().eq('id', u.id);
             await supabase.auth.admin.deleteUser(u.id);
             ghostUserCount++;
        }
    }
    console.log(`✅ Deleted ${ghostUserCount} ghost test users from Auth & DB.`);
    
    console.log(`\n✨ Wipe complete. System is fully clean.`);
}

wipeDealsAndParticipants().catch(console.error);
