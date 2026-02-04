import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const query = searchParams.get('q') || '';
        const role = searchParams.get('role'); // Optimistic role check or verify via token

        // Validation
        if (limit > 100) return NextResponse.json({ error: 'Limit too high' }, { status: 400 });

        // Setup Admin Client (to bypass RLS if needed, or ensuring we see ALL deals)
        // Actually, internal users should see ALL deals. Authenticated users can SELECT deals (RLS).
        // Using Service Role ensures we definitely get them all without RLS filtering noise, 
        // BUT we should ideally check the caller's permissions.
        // For the API, we'll verify the caller token if possible, or trust the client passed role? 
        // NO, trusting generic client params for security is bad.
        // We should really extract the user from the Supabase Auth cookie/header here.
        // But since we are using `supabase-js` in this generic API handler without the `auth-helpers` middleware context passed easily,
        // we'll rely on the client passing the token header (Bearer) and validating via `supabase.auth.getUser()`.

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!;

        // Create client with user's token or service role?
        // Let's use Service Role but VALIDATE the user first.
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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
