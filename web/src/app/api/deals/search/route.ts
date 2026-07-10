import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/apiAuth';

export async function GET(request: Request) {
    try {
        // SECURITY: the global deal index bypasses RLS to show ALL deals, so it is
        // strictly staff-only. Verify the caller server-side; never trust query params.
        const auth = await requireStaff();
        if (!auth.ok) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const supabaseAdmin = auth.caller.admin;

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const query = searchParams.get('q') || '';

        // Validation
        if (limit > 100) return NextResponse.json({ error: 'Limit too high' }, { status: 400 });

        // Calculate range
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        console.log(`Global Index Search: page=${page}, q=${query}`);

        // Base Query
        let dbQuery = supabaseAdmin
            .from('deals')
            .select('*', { count: 'exact' })
            .range(from, to)
            .order('created_at', { ascending: false });

        if (query) {
            dbQuery = dbQuery.ilike('title', `%${query}%`);
        }

        const { data, error, count } = await dbQuery;

        if (error) throw error;

        return NextResponse.json({
            data,
            meta: {
                total: count,
                page,
                limit,
                totalPages: Math.ceil((count || 0) / limit)
            }
        });

    } catch (error: any) {
        console.error('Search API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
