import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/limiter';

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const userId = params.id;
        console.log('🗑️ API: Deleting user:', userId);

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Setup Admin Client
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const supabaseAdmin = createClient(
            supabaseUrl,
            serviceRoleKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // --- Rate Limit check (Admin bulk deletion protection) ---
        const reqIp = request.headers.get('x-forwarded-for') || 'unknown-ip';
        const rateKey = `delete-user:${reqIp}`;
        const { ok } = await rateLimit(rateKey, 10, 600); // Max 10 user deletions per 10 minutes

        if (!ok) {
            console.warn(`[RATE LIMIT] Too many user deletions attempted from ${reqIp}`);
            return NextResponse.json({ error: 'Too many deletions. Please wait a moment.' }, { status: 429 });
        }

        // 0. Disconnect the global participant record to prevent ON DELETE CASCADE
        // Because participants.user_id = users.id ON DELETE CASCADE,
        // deleting the user drops the participant, which breaks agency_contracts foreign keys.
        const { error: disconnectError } = await supabaseAdmin
            .from('participants')
            .update({ user_id: null })
            .eq('user_id', userId);

        if (disconnectError) {
            console.warn(`⚠️ Warning: Failed to disconnect participant from user ${userId}:`, disconnectError);
            // We proceed anyway, but log it.
        }

        // 1. Delete from Auth (This usually cascades to public.users if set up, but let's be explicit)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authError) {
            console.error('❌ Auth Delete Error:', authError);

            // If it's a foreign key cascade failure, auto-deactivate instead
            if (authError.message?.includes('Database error deleting user')) {
                // Re-connect participant records we disconnected above
                await supabaseAdmin
                    .from('participants')
                    .update({ user_id: userId })
                    .is('user_id', null);

                // Auto-deactivate instead of hard-failing
                await supabaseAdmin
                    .from('users')
                    .update({ is_active: false })
                    .eq('id', userId);

                console.log(`⚠️ User ${userId} has deal associations — auto-deactivated instead of deleted`);
                return NextResponse.json({
                    success: true,
                    deactivated: true,
                    message: 'User has deal associations and was deactivated instead. They appear as "FORMER STAFF" in their deals.'
                });
            }

            // If user not found in auth, maybe they are only in public? Continue...
            if (!authError.message?.includes('not found')) {
                throw authError;
            }
        }

        // 2. Delete from Public (If cascade didn't catch it or for cleanup)
        const { error: dbError } = await supabaseAdmin.from('users').delete().eq('id', userId);

        if (dbError) {
            console.error('❌ DB Delete Error:', dbError);
            if (dbError.code === '23503') {
                // Auto-deactivate instead of hard-failing
                await supabaseAdmin
                    .from('users')
                    .update({ is_active: false })
                    .eq('id', userId);

                console.log(`⚠️ User ${userId} has DB associations — auto-deactivated instead of deleted`);
                return NextResponse.json({
                    success: true,
                    deactivated: true,
                    message: 'User has deal associations and was deactivated instead. They appear as "FORMER STAFF" in their deals.'
                });
            }
            // Verify if it's already gone
            if (!dbError.message?.includes('does not exist')) {
                throw dbError;
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
        console.error('❌ Delete User API Error:', error);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
