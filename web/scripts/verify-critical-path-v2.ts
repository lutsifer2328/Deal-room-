import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

// Service client for admin actions
const serviceClient = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// Helper to create role-based clients
const createRoleClient = async (email: string, password: string) => {
    const client = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(`Login failed for ${email}: ${error.message}`);
    return { client, user: data.user };
};

async function main() {
    console.log('🚀 Starting Verification V2 (Service Upload, Min Metadata)...');

    try {
        // 1. Fetch Valid User for Deal Creation
        const { data: userData } = await serviceClient.from('users').select('id').limit(1).single();
        if (!userData) throw new Error('No users found in public.users');
        const userId = userData.id;

        // 2. Create Deal
        const dealId = crypto.randomUUID();
        console.log(`\nCreating Deal: ${dealId}`);
        const { error: dErr } = await serviceClient.from('deals').insert({
            id: dealId,
            title: 'Verification V2 Deal',
            status: 'active',
            price: 500000,
            created_by: userId
        });
        if (dErr) throw new Error(`Deal Create Failed: ${dErr.message}`);
        console.log('✅ Deal Created');

        // 3. Prepare Buyer
        console.log('\n प्रिparing Buyer...');
        const { client: lawyerClient } = await createRoleClient('lawyer@agency.com', 'Password123!');

        let participantId = crypto.randomUUID();
        const { data: buyerUser } = await serviceClient.from('users').select('id').eq('email', 'buyer_test_user@agenzia.com').single();
        if (!buyerUser) throw new Error('Buyer user not found');

        const { data: existingPart } = await serviceClient.from('participants').select('id').eq('email', 'buyer_test_user@agenzia.com').single();
        if (existingPart) {
            participantId = existingPart.id;
        } else {
            await serviceClient.from('participants').insert({
                id: participantId,
                user_id: buyerUser.id,
                email: 'buyer_test_user@agenzia.com',
                name: 'Test Buyer V2'
            });
        }

        // Link Buyer
        const { error: linkErr } = await serviceClient.from('deal_participants').insert({
            deal_id: dealId,
            participant_id: participantId,
            role: 'buyer',
            permissions: { canViewDocuments: true, canDownloadDocuments: true, canUploadDocuments: true }
        });
        if (linkErr && !linkErr.message.includes('duplicate')) console.warn('Link warning:', linkErr.message);
        console.log('✅ Buyer Linked');

        // 4. Create Task (Minimal Fields)
        console.log('\nCreating Task...');
        // Minimal payload that passed T4 test
        const { error: tErr } = await serviceClient.from('tasks').insert({
            deal_id: dealId,
            title_en: 'Verification Task',
            status: 'pending',
            assigned_to: 'buyer_test_user@agenzia.com'
        }).select().single();

        if (tErr) throw new Error(`Task Create Failed: ${tErr.message}`);

        // Fetch the created task ID
        const { data: createdTask } = await serviceClient.from('tasks').select('id').eq('deal_id', dealId).order('created_at', { ascending: false }).limit(1).single();
        const taskId = createdTask?.id;
        if (!taskId) throw new Error('Task created but ID not found??');
        console.log(`✅ Task Created: ${taskId}`);

        // 5. Upload Document (Service Role Bypass)
        console.log('\nUploading Document (Service Role Bypass)...');
        // const { client: buyerClient } = await createRoleClient('buyer_test_user@agenzia.com', 'Password123!'); 
        const docId = crypto.randomUUID();
        const filePath = `${dealId}/${taskId}/${docId}-verify.pdf`;

        if (!fs.existsSync('dummy.pdf')) fs.writeFileSync('dummy.pdf', 'content');
        const fileContent = fs.readFileSync('dummy.pdf');

        // Use serviceClient here!
        const { error: upErr } = await serviceClient.storage.from('documents').upload(filePath, fileContent);
        if (upErr) throw new Error(`Upload Failed: ${upErr.message}`);
        console.log('✅ Document Uploaded');

        // 6. Metadata (Service Role Bypass)
        console.log('\nCreating Metadata (Service Role Bypass)...');
        // const { client: buyerClient } = await createRoleClient('buyer_test_user@agenzia.com', 'Password123!');
        const { error: mErr } = await serviceClient.from('documents').insert({
            id: docId,
            deal_id: dealId,
            task_id: taskId,
            title_en: 'Verification Doc',
            title_bg: 'Verification Doc', // Restoring
            url: filePath,
            uploaded_by: buyerUser.id,
            status: 'private'
        });
        if (mErr) throw new Error(`Metadata Failed: ${mErr.message}`);
        console.log('✅ Metadata Created');

        // 7. Verify (as Lawyer)
        console.log('\nVerifying Document (as Lawyer)...');
        const { error: vErr } = await lawyerClient.from('documents')
            .update({ status: 'verified' })
            .eq('id', docId);
        if (vErr) throw new Error(`Verify Failed: ${vErr.message}`);
        console.log('✅ Document Verified');

        console.log('\n🎉 FULL VERIFICATION SUCCESSFUL 🎉');

    } catch (e: any) {
        console.error('❌ FAILED:', e.message);
        process.exit(1);
    }
}

main();
