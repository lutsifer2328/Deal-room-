import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Shared authentication/authorization helpers for API route handlers.
 *
 * Why this exists:
 *   Several API routes use the Supabase SERVICE ROLE key, which bypasses all
 *   Row Level Security. Without a caller check, anyone on the internet could
 *   invoke them (e.g. create an admin account, delete users, read PII). These
 *   helpers cryptographically verify the caller via getUser() and resolve their
 *   real role from the database — never trusting client-supplied role/identity.
 *
 * This mirrors the proven pattern already used in /api/deals/join.
 */

const STAFF_ROLES = ['admin', 'lawyer', 'staff'] as const;

export interface Caller {
    userId: string;
    email: string;
    name: string | null;
    role: string;
    isStaff: boolean;
    /** Service-role client (bypasses RLS) — use only after authorization passes. */
    admin: SupabaseClient;
    /** User-scoped client (subject to RLS as the caller). */
    userClient: SupabaseClient;
}

export type AuthResult =
    | { ok: true; caller: Caller }
    | { ok: false; status: number; error: string };

/**
 * Verify the caller has a valid session and resolve their DB profile.
 * Returns the caller (with both admin and user-scoped clients) or an error.
 */
export async function authenticateCaller(): Promise<AuthResult> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

    if (!supabaseUrl || !anonKey || !serviceKey) {
        return { ok: false, status: 500, error: 'Server configuration error' };
    }

    // Read the caller's session from cookies (the app uses cookie-based auth
    // via @supabase/ssr createBrowserClient).
    const cookieStore = await cookies();
    const userClient = createServerClient(supabaseUrl, anonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    });
                } catch {
                    // Called from a context where cookies can't be set — safe to ignore
                    // for a read-only auth check.
                }
            },
        },
    });

    // getUser() validates the JWT against the auth server — do not trust getSession() alone.
    const { data: { user }, error } = await userClient.auth.getUser();
    if (error || !user) {
        return { ok: false, status: 401, error: 'Unauthorized: please sign in' };
    }

    const admin = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    // Resolve the caller's REAL role from the DB — never from client input.
    const { data: dbUser, error: dbErr } = await admin
        .from('users')
        .select('role, email, name, is_active')
        .eq('id', user.id)
        .single();

    if (dbErr || !dbUser) {
        return { ok: false, status: 403, error: 'User record not found' };
    }

    if (dbUser.is_active === false) {
        return { ok: false, status: 403, error: 'Account is deactivated' };
    }

    return {
        ok: true,
        caller: {
            userId: user.id,
            email: dbUser.email,
            name: dbUser.name ?? null,
            role: dbUser.role,
            isStaff: STAFF_ROLES.includes(dbUser.role),
            admin,
            userClient,
        },
    };
}

/**
 * Require the caller to be authenticated staff (admin/lawyer/staff, active).
 * Use for internal-only endpoints (invite, delete user, global search, etc.).
 */
export async function requireStaff(): Promise<AuthResult> {
    const result = await authenticateCaller();
    if (!result.ok) return result;
    if (!result.caller.isStaff) {
        return { ok: false, status: 403, error: 'Forbidden: staff access required' };
    }
    return result;
}
