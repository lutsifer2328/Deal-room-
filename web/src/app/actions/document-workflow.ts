'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Helper to get authenticated Supabase client
async function getSupabaseUser() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );
}

// Helper to check if user can manage documents (Admin, Lawyer, Staff)
// In a real app, we might also allow Agents or specialized roles depending on the deal.
// For now, we reuse the pattern: check if user is in 'users' table and has appropriate role.
// RLS will ultimately block the DB update if not allowed, but we fail early here.
async function checkPermissions(supabase: any, dealId: string) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    // Fetch user role
    const { data: userData, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (roleError || !userData) throw new Error('User profile not found');

    // We defer actual authorization (Verify/Reject/Release logic) to the database RLS policies.
    // The RLS allows Admins/Lawyers/Staff globally, OR Deal Members for their specific deal.
    return user.id;
}

// Helper to log audit entry (using service role or RLS-compliant insert if policy allows)
// We'll use the user client since we enabled insert for authenticated users (or stick to RLS).
// If RLS prevents it, we might need service role. Assuming RLS allows insert for these roles.
async function logAudit(supabase: any, dealId: string, actorId: string, action: string, details: string) {
    await supabase.from('audit_logs').insert({
        deal_id: dealId,
        actor_id: actorId,
        action,
        details,
        timestamp: new Date().toISOString()
    });
}

export async function workflowVerifyDocument(docId: string, dealId: string) {
    const supabase = await getSupabaseUser();
    const actorId = await checkPermissions(supabase, dealId);

    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('documents')
        .update({ status: 'verified', verified_at: now })
        .eq('id', docId)
        .select('task_id');

    if (error) throw new Error(`Verify DB error: ${error.message} (Code: ${error.code})`);
    if (!data || data.length === 0) throw new Error(`Verify failed: Document not found or you lack permission to update it.`);
    const doc = data[0];

    // Mark Task as Completed (if linked)
    if (doc.task_id) {
        const { error: taskError } = await supabase
            .from('tasks')
            .update({ status: 'completed' })
            .eq('id', doc.task_id);

        if (taskError) console.error('Failed to auto-complete task:', taskError);
    }

    await logAudit(supabase, dealId, actorId, 'VERIFIED_DOC', `Verified document ${docId}`);

    // Revalidating paths might not be enough if we rely on store.tsx, but good practice.
    revalidatePath('/app/deals');
    return doc;
}

export async function workflowRejectDocument(docId: string, dealId: string, reasonEn: string, reasonBg: string) {
    const supabase = await getSupabaseUser();
    const actorId = await checkPermissions(supabase, dealId);

    const { data, error } = await supabase
        .from('documents')
        .update({
            status: 'rejected',
            rejection_reason_en: reasonEn,
            rejection_reason_bg: reasonBg
        })
        .eq('id', docId)
        .select();

    if (error) throw new Error(`Reject DB error: ${error.message} (Code: ${error.code})`);
    if (!data || data.length === 0) throw new Error(`Reject failed: Document not found or you lack permission to update it.`);
    const doc = data[0];

    await logAudit(supabase, dealId, actorId, 'REJECTED_DOC', `Rejected document ${docId}: ${reasonEn}`);
    revalidatePath('/app/deals');
    return doc;
}

export async function workflowReleaseDocument(docId: string, dealId: string) {
    const supabase = await getSupabaseUser();
    const actorId = await checkPermissions(supabase, dealId);

    // 1. Update Document
    const { data, error: docError } = await supabase
        .from('documents')
        .update({ status: 'released' })
        .eq('id', docId)
        .select('task_id');

    if (docError) throw new Error(`Release DB error: ${docError.message} (Code: ${docError.code})`);
    if (!data || data.length === 0) throw new Error(`Release failed: Document not found or you lack permission to update it.`);
    const doc = data[0];

    // 2. Mark Task as Completed (if linked)
    if (doc.task_id) {
        const { error: taskError } = await supabase
            .from('tasks')
            .update({ status: 'completed' })
            .eq('id', doc.task_id);

        if (taskError) console.error('Failed to auto-complete task:', taskError);
    }

    await logAudit(supabase, dealId, actorId, 'RELEASED_DOC', `Released document ${docId}`);
    revalidatePath('/app/deals');
    return doc;
}
