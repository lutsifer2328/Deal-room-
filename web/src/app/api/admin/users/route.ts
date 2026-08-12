import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/apiAuth';

/**
 * GET /api/admin/users
 *
 * Returns the platform user list enriched with `last_sign_in_at`, which lives in
 * `auth.users` and is NOT exposed to the browser's anon client (RLS + schema).
 * We read it here with the service role after verifying the caller is staff.
 */
export async function GET() {
    const auth = await requireStaff();
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const admin = auth.caller.admin;

    const { data: users, error } = await admin
        .from('users')
        .select('id, name, email, role, is_active')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('admin/users: failed to fetch users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Build id → last_sign_in_at from auth.users. listUsers is paginated; at
    // agency scale this is almost always a single page, but we loop to be safe.
    const lastSignInById = new Map<string, string | null>();
    let page = 1;
    const perPage = 1000;
    for (;;) {
        const { data: authList, error: authErr } = await admin.auth.admin.listUsers({ page, perPage });
        if (authErr || !authList) {
            // Non-fatal: fall back to null last-login rather than failing the whole list.
            console.error('admin/users: listUsers failed:', authErr);
            break;
        }
        for (const u of authList.users) {
            lastSignInById.set(u.id, u.last_sign_in_at ?? null);
        }
        if (authList.users.length < perPage) break;
        page += 1;
    }

    const enriched = (users ?? []).map((u) => ({
        ...u,
        last_sign_in_at: lastSignInById.get(u.id) ?? null,
    }));

    return NextResponse.json({ users: enriched });
}
