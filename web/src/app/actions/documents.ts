'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/limiter';

export async function getDocumentSignedUrl(documentId: string, isDownload: boolean = false): Promise<{ url: string; error?: string }> {
    try {
        const cookieStore = await cookies();

        // 1. Create a user-context client to verify permissions via RLS
        const supabaseUser = createServerClient(
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
                            // The `set` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                    remove(name: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value: '', ...options });
                        } catch (error) {
                            // The `delete` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        );

        // 1.5 Rate Limit Check
        const { data: { user } } = await supabaseUser.auth.getUser();
        if (!user) return { url: '', error: 'Unauthorized' };

        const rateKey = `sign:${user.id}`;
        const { ok } = await rateLimit(rateKey, 60, 300); // 60 req / 5 min
        if (!ok) return { url: '', error: 'Rate limit exceeded. Please wait.' };

        // 2. Fetch the document record to verify access (RLS)
        const { data: doc, error: docError } = await supabaseUser
            .from('documents')
            .select('id, url, status, uploaded_by, deal_id, title_en')
            .eq('id', documentId)
            .single();

        if (docError || !doc) {
            console.error('Access denied or document not found:', docError);
            return { url: '', error: 'Access denied or document not found' };
        }

        // 3. Create a Service Role client for signing
        // (Regular users cannot sign URLs for private buckets mostly)
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

        // 4. Generate the signed URL
        let downloadConfig: string | boolean | undefined = undefined;

        if (isDownload) {
            let extension = '';
            const lastDotIndex = doc.url.lastIndexOf('.');
            if (lastDotIndex !== -1 && lastDotIndex > doc.url.length - 10) {
                extension = doc.url.substring(lastDotIndex);
            }

            const finalName = doc.title_en.toLowerCase().endsWith(extension.toLowerCase())
                ? doc.title_en
                : `${doc.title_en}${extension}`;

            downloadConfig = finalName;
        }

        const { data: signedData, error: signError } = await supabaseAdmin
            .storage
            .from('documents')
            .createSignedUrl(doc.url, 60); // 60 seconds expiry

        if (signError) {
            console.error('Failed to sign URL:', signError);
            return { url: '', error: 'Failed to generate signed URL' };
        }

        let finalUrl = signedData.signedUrl;

        // Supabase JS SDK can sometimes drop the { download } config during Signed URL generation.
        // The most bulletproof way to force the backend to return `Content-Disposition: attachment; filename="..."` 
        // is to manually append the `download` query param to the generated URL string.
        if (isDownload && downloadConfig) {
            const separator = finalUrl.includes('?') ? '&' : '?';
            finalUrl += `${separator}download=${encodeURIComponent(downloadConfig as string)}`;
        }

        return { url: finalUrl };

    } catch (err: any) {
        console.error('Unexpected error in getDocumentSignedUrl:', err);
        return { url: '', error: 'Internal server error' };
    }
}
