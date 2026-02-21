'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    action: string;
    actor_id: string;
    actor_name: string;
    deal_id?: string;
    details: any;
}

export async function getAuditLogs(page: number = 1, limit: number = 20): Promise<{ logs: AuditLogEntry[], total: number, error?: string }> {
    try {
        const cookieStore = await cookies();

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value, ...options });
                        } catch (error) {
                            // usage from Server Component
                        }
                    },
                    remove(name: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value: '', ...options });
                        } catch (error) {
                            // usage from Server Component
                        }
                    },
                },
            }
        );

        // 1. Verify User
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { logs: [], total: 0, error: 'Unauthorized' };
        }

        // 2. Verify Staff Role
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError || !['admin', 'lawyer', 'staff'].includes(profile.role)) {
            return { logs: [], total: 0, error: 'Forbidden' };
        }

        // 3. Use service role to bypass RLS for audit_logs table
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // 4. Fetch Logs with Pagination
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, count, error } = await supabaseAdmin
            .from('audit_logs')
            .select('*', { count: 'exact' })
            .order('timestamp', { ascending: false })
            .range(from, to);


        if (error) {
            console.error('[AUDIT LOGS] Error fetching:', error);
            return { logs: [], total: 0, error: 'Failed to fetch logs' };
        }

        return {
            logs: data as AuditLogEntry[],
            total: count || 0
        };

    } catch (err: any) {
        console.error('Unexpected error in getAuditLogs:', err);
        return { logs: [], total: 0, error: 'Internal server error' };
    }
}
