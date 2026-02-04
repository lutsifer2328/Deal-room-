import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SERVICE_ROLE_KEY) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SERVICE_ROLE_KEY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // 1. Delete from Auth (This usually cascades to public.users if set up, but let's be explicit)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authError) {
            console.error('❌ Auth Delete Error:', authError);
            // If user not found in auth, maybe they are only in public? Continue...
            if (!authError.message?.includes('not found')) {
                throw authError;
            }
        }

        // 2. Delete from Public (If cascade didn't catch it or for cleanup)
        const { error: dbError } = await supabaseAdmin.from('users').delete().eq('id', userId);

        if (dbError) {
            console.error('❌ DB Delete Error:', dbError);
            // Verify if it's already gone
            if (!dbError.message?.includes('does not exist')) {
                throw dbError;
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('❌ Delete User API Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 });
    }
}
