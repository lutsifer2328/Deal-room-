'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/limiter';

export async function getAgencyContractSignedUrl(contractId: string): Promise<{ url: string; error?: string }> {
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

        // 1.5 Rate Limit Check
        const { data: { user } } = await supabaseUser.auth.getUser();
        if (!user) return { url: '', error: 'Unauthorized' };

        const rateKey = `sign:${user.id}`;
        const { ok } = await rateLimit(rateKey, 60, 300); // 60 req / 5 min
        if (!ok) return { url: '', error: 'Rate limit exceeded. Please wait.' };

        // 2. Fetch the contract record to verify access (RLS)
        const { data: contract, error: contractError } = await supabaseUser
            .from('agency_contracts')
            .select('id, url, participant_id')
            .eq('id', contractId)
            .single();

        if (contractError || !contract) {
            console.error('Access denied or contract not found:', contractError);
            return { url: '', error: 'Access denied or contract not found' };
        }

        // 3. Create a Service Role client for signing
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
        const { data: signedData, error: signError } = await supabaseAdmin
            .storage
            .from('documents')
            .createSignedUrl(contract.url, 60); // 60 seconds expiry

        if (signError) {
            console.error('Failed to sign URL:', signError);
            return { url: '', error: 'Failed to generate signed URL' };
        }

        return { url: signedData.signedUrl };

    } catch (err: any) {
        console.error('Unexpected error in getAgencyContractSignedUrl:', err);
        return { url: '', error: 'Internal server error' };
    }
}
