import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        // Validate the caller is authenticated by checking the Authorization header
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY!;

        // Verify the JWT by creating a user-context client
        const supabaseUser = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
            auth: { autoRefreshToken: false, persistSession: false },
            global: { headers: { Authorization: `Bearer ${token}` } }
        });

        const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Parse the audit log entry
        const { deal_id, action, details } = await request.json();

        if (!action) {
            return NextResponse.json({ error: 'Missing required field: action' }, { status: 400 });
        }

        // Use service_role to bypass RLS and insert audit log
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // Fetch actor name from users table
        const { data: actorData } = await supabaseAdmin
            .from('users')
            .select('name')
            .eq('id', user.id)
            .single();

        const { error: insertError } = await supabaseAdmin
            .from('audit_logs')
            .insert({
                id: crypto.randomUUID(),
                deal_id: deal_id || null,
                actor_id: user.id,
                actor_name: actorData?.name || user.email || 'Unknown',
                action,
                details: details || '',
                timestamp: new Date().toISOString()
            });

        if (insertError) {
            console.error('Audit log insert error:', insertError);
            return NextResponse.json({ error: 'Failed to write audit log' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Audit log API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
