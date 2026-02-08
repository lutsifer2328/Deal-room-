import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // 1. Check public.users (CRM Source of Truth)
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('id, name, email, role, is_active, phone, agency')
            .eq('email', email)
            .single();

        if (user) {
            return NextResponse.json({
                exists: true,
                user: {
                    ...user,
                    isActive: user.is_active // Normalized for frontend
                }
            });
        }

        return NextResponse.json({ exists: false });

    } catch (error: any) {
        console.error('Check user error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to check user' },
            { status: 500 }
        );
    }
}
