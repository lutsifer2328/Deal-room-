import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceKey);

async function checkDocument() {
    const docId = '59065a08-29e8-4909-a31f-fad2006fe2a1';
    console.log(`Checking document: ${docId}`);

    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', docId)
        .single();

    if (error) {
        console.error('Error fetching document:', error);
    } else {
        console.log('Document Data:', data);
        if (!data.task_id) {
            console.warn('⚠️ WARNING: task_id is NULL! This document will not appear in the task list.');
        }
    }
}

checkDocument();
