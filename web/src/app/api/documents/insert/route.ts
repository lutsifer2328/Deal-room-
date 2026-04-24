import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { dbDoc, taskId } = body;

        if (!dbDoc || !taskId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY!)?.trim();

        if (!serviceRoleKey) {
            return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
        }

        // Use service role to bypass RLS for inserting documents and updating tasks
        const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // 1. Insert the document
        const { error: insertError } = await serviceClient
            .from('documents')
            .insert(dbDoc);

        if (insertError) {
            console.error('API: Failed to insert document:', insertError);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        // 2. Update the parent task
        const { error: taskError } = await serviceClient
            .from('tasks')
            .update({ status: 'pending_review' })
            .eq('id', taskId);

        if (taskError) {
            console.error('API: Failed to update task status:', taskError);
            // Non-critical, document was inserted
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('API: Document insert route error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
