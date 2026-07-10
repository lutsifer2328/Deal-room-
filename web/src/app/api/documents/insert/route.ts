import { NextResponse } from 'next/server';
import { authenticateCaller } from '@/lib/apiAuth';

/**
 * Inserts a document row and advances the parent task to 'pending_review'.
 *
 * Uses the service role (participants cannot update task status under RLS), so the
 * caller MUST be authorized here:
 *   - staff may insert for any task, OR
 *   - a participant may insert ONLY for a task assigned to them.
 * The uploader is always forced to the authenticated user (no client spoofing).
 */
export async function POST(request: Request) {
    try {
        // 1. Authenticate the caller (participant or staff).
        const auth = await authenticateCaller();
        if (!auth.ok) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { caller } = auth;
        const admin = caller.admin;

        const body = await request.json();
        const { dbDoc, taskId } = body;

        if (!dbDoc || !taskId || !dbDoc.deal_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 2. Load the task and confirm it belongs to the claimed deal.
        const { data: task, error: taskLoadError } = await admin
            .from('tasks')
            .select('id, deal_id, assigned_participant_id')
            .eq('id', taskId)
            .single();

        if (taskLoadError || !task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }
        if (task.deal_id !== dbDoc.deal_id) {
            return NextResponse.json({ error: 'Task does not belong to this deal' }, { status: 400 });
        }

        // 3. Authorization: staff, or the participant this task is assigned to.
        if (!caller.isStaff) {
            const { data: participant } = await admin
                .from('participants')
                .select('id')
                .eq('user_id', caller.userId)
                .maybeSingle();

            const isAssignee =
                participant &&
                task.assigned_participant_id &&
                task.assigned_participant_id === participant.id;

            if (!isAssignee) {
                return NextResponse.json(
                    { error: 'Forbidden: this task is not assigned to you' },
                    { status: 403 }
                );
            }
        }

        // 4. Force server-controlled fields — never trust client-supplied identity.
        const safeDoc = {
            ...dbDoc,
            task_id: taskId,
            uploaded_by: caller.userId,
        };

        // 5. Insert the document.
        const { error: insertError } = await admin.from('documents').insert(safeDoc);
        if (insertError) {
            console.error('API: Failed to insert document:', insertError);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        // 6. Advance the parent task to pending review.
        const { error: taskError } = await admin
            .from('tasks')
            .update({ status: 'pending_review' })
            .eq('id', taskId);

        if (taskError) {
            console.error('API: Failed to update task status:', taskError);
            // Non-critical, document was inserted.
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('API: Document insert route error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
