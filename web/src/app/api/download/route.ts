import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/limiter';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const documentId = searchParams.get('id');

        if (!documentId) {
            return new NextResponse('Missing document ID', { status: 400 });
        }

        const cookieStore = await cookies();

        // 1. Create a user-context client to verify permissions via RLS
        const supabaseUser = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) { return cookieStore.get(name)?.value; },
                    set(name: string, value: string, options: CookieOptions) { /* ignored */ },
                    remove(name: string, options: CookieOptions) { /* ignored */ },
                },
            }
        );

        const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
        if (authError || !user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // 2. Rate Limit Check (60 requests per 5 minutes)
        const rateKey = `download:${user.id}`;
        const { ok } = await rateLimit(rateKey, 60, 300);
        if (!ok) {
            return new NextResponse('Rate limit exceeded. Please wait.', { status: 429 });
        }

        // 3. Fetch the document record to verify access (RLS) and get metadata
        const { data: doc, error: docError } = await supabaseUser
            .from('documents')
            .select('id, url, status, uploaded_by, deal_id, title_en')
            .eq('id', documentId)
            .single();

        if (docError || !doc) {
            return new NextResponse('Access denied or document not found', { status: 404 });
        }

        // 4. Create a Service Role client to download the file from the private bucket
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const { data: fileBlob, error: downloadError } = await supabaseAdmin
            .storage
            .from('documents')
            .download(doc.url);

        if (downloadError || !fileBlob) {
            console.error('Failed to download blob from Supabase:', downloadError);
            return new NextResponse('File could not be downloaded', { status: 500 });
        }

        // 5. Calculate proper file extension and name
        let extension = '';
        const lastDotIndex = doc.url.lastIndexOf('.');
        if (lastDotIndex !== -1 && lastDotIndex > doc.url.length - 10) {
            extension = doc.url.substring(lastDotIndex);
        }

        const finalName = doc.title_en.toLowerCase().endsWith(extension.toLowerCase())
            ? doc.title_en
            : `${doc.title_en}${extension}`;

        // 6. Stream the file to the client with proper Content-Disposition
        const buffer = await fileBlob.arrayBuffer();

        const headers = new Headers();
        headers.set('Content-Type', fileBlob.type || 'application/octet-stream');
        // Sanitize filename for ASCII fallback, use RFC 5987 filename* for full UTF-8
        const safeName = finalName.replace(/[^\w\s.\-()]/gi, '_');
        headers.set('Content-Disposition', `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(finalName)}`);

        return new NextResponse(buffer, { headers });
    } catch (err: any) {
        console.error('Unexpected error in download proxy route:', err);
        return new NextResponse('Internal server error', { status: 500 });
    }
}
