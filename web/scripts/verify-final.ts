import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://qolozennlzllvrqmibls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTUyNywiZXhwIjoyMDg1NDI3NTI3fQ.3M6fxzDB9YfEFsLtxkdwNbojSHpGdgMhaCdAqIxVkSw';

// Service client ONLY for setup (fetching user ID), NOT for actions being tested
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
    console.log('🚀 Starting FINAL RLS Verification (Simulating Real Users)...');

    try {
        // 1. Lawyer Login
        console.log('\nPlease ensure you have applied web/fix_rls_v2.sql before running this!');
        console.log('--- Step 1: Lawyer Login ---');
        const { client: lawyerClient, user: lawyerUser } = await createRoleClient('lawyer@agency.com', 'Password123!');
        console.log(`✅ Lawyer Logged In: ${lawyerUser?.id}`);

        // 2. Create Deal (AS LAWYER - This was blocked before)
        console.log('\n--- Step 2: Create Deal (As Lawyer) ---');
        const dealId = crypto.randomUUID();
        const { error: dErr } = await lawyerClient.from('deals').insert({
            id: dealId,
            title: 'Final RLS Verification Deal',
            status: 'active',
            price: 500000,
            created_by: lawyerUser.id
        });
        if (dErr) throw new Error(`❌ Deal Creation Blocked (Lawyer): ${dErr.message}`);
        console.log(`✅ Deal Created by Lawyer`);

        // 3. Add Buyer (As Lawyer)
        console.log('\n--- Step 3: Add Buyer Participant (As Lawyer) ---');
        const { data: buyerUser } = await serviceClient.from('users').select('id').eq('email', 'buyer_test_user@agenzia.com').single();
        if (!buyerUser) throw new Error('Buyer user not found in DB');

        let participantId = crypto.randomUUID();
        const { data: existingPart } = await lawyerClient.from('participants').select('id').eq('email', 'buyer_test_user@agenzia.com').single();
        if (existingPart) {
            participantId = existingPart.id;
            console.log(`Reference existing participant: ${participantId}`);
        } else {
            // Link to existing user
            const { error: partError } = await lawyerClient.from('participants').insert({
                id: participantId,
                user_id: buyerUser.id,
                email: 'buyer_test_user@agenzia.com',
                name: 'Test Buyer Final'
            });
            if (partError) throw new Error(`Participant creation failed: ${partError.message}`);
            console.log(`Created new participant: ${participantId}`);
        }

        // Link to Deal
        const { error: linkError } = await lawyerClient.from('deal_participants').insert({
            deal_id: dealId,
            participant_id: participantId,
            role: 'buyer',
            permissions: { canViewDocuments: true, canDownloadDocuments: true, canUploadDocuments: true }
        });
        if (linkError && !linkError.message.includes('duplicate')) throw new Error(`Link failed: ${linkError.message}`);
        console.log(`✅ Buyer Linked to Deal`);

        // 4. Create Task (As Lawyer) - Requires Tasks RLS (usually fine if Deal RLS works)
        console.log('\n--- Step 4: Assign Task (As Lawyer) ---');
        const { data: taskData, error: taskError } = await lawyerClient.from('tasks').insert({
            deal_id: dealId,
            title_en: 'Final Verification Task',
            status: 'pending',
            assigned_to: 'buyer_test_user@agenzia.com'
        }).select().single();

        if (taskError) throw new Error(`Task creation failed: ${taskError.message}`);
        const taskId = taskData.id;
        console.log(`✅ Task Assigned: ${taskId}`);

        // 5. Upload Document (AS BUYER - This was blocked before)
        console.log('\n--- Step 5: Upload Document (As Buyer) ---');
        const { client: buyerClient } = await createRoleClient('buyer_test_user@agenzia.com', 'Password123!');
        const docId = crypto.randomUUID();

        // Create dummy file
        if (!fs.existsSync(path.join(process.cwd(), 'dummy.pdf'))) {
            fs.writeFileSync(path.join(process.cwd(), 'dummy.pdf'), 'dummy content');
        }
        const fileContent = fs.readFileSync(path.join(process.cwd(), 'dummy.pdf'));
        const filePath = `${dealId}/${taskId}/${docId}-final.pdf`;

        console.log(`\n--- DEBUG: Checking Policy Conditions (As Buyer) ---`);
        console.log(`Checking Deal ID: ${dealId}`);
        console.log(`Checking Auth UID: ${buyerUser.id}`);
        // Manual check of the policy logic
        const { data: debugPolicy, error: debugErr } = await buyerClient
            .from('deal_participants')
            .select('deal_id, participant_id, participants!inner(user_id)')
            .eq('deal_id', dealId)
            .eq('participants.user_id', buyerUser.id);

        console.log(`Policy Check Verification: Found ${debugPolicy?.length} rows.`);
        if (debugErr) console.log(`Policy Check Verification Error: ${debugErr.message}`);
        if (debugPolicy && debugPolicy.length > 0) console.log(`Policy Row:`, JSON.stringify(debugPolicy[0]));
        else console.log(`❌ Policy Check FAILED: No matching row found via API.`);

        const { error: uploadError } = await buyerClient.storage
            .from('documents')
            .upload(filePath, fileContent);

        if (uploadError) throw new Error(`❌ Storage Upload Blocked (Buyer): ${uploadError.message}`);
        console.log(`✅ File Uploaded to Storage`);

        // 6. Metadata (AS BUYER - This was blocked before)
        console.log('\n--- Step 6: Create Metadata (As Buyer) ---');
        const { error: metaError } = await buyerClient.from('documents').insert({
            id: docId,
            deal_id: dealId,
            task_id: taskId,
            title_en: 'Final Verification Doc',
            title_bg: 'Final Verification Doc',
            url: filePath,
            uploaded_by: buyerUser.id,
            status: 'private'
        });
        if (metaError) throw new Error(`❌ Document Metadata Blocked (Buyer): ${metaError.message}`);
        console.log(`✅ Document Metadata Created`);

        // 7. Lawyer Review
        console.log('\n--- Step 7: Lawyer Verify ---');
        const { error: approveError } = await lawyerClient.from('documents').update({ status: 'verified' }).eq('id', docId);
        if (approveError) throw new Error(`Approval failed: ${approveError.message}`);
        console.log(`✅ Document Verified`);

        console.log('\n🎉 FULL RLS VERIFICATION SUCCESSFUL! The system is ready pending user confirmation. 🎉');

    } catch (err: any) {
        console.error('\n❌ RLS VERIFICATION FAILED:', err.message);
        process.exit(1);
    }
}

main();
