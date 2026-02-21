import { createClient } from '@supabase/supabase-js';

// Use service role for rate limiting to ensure bypass of RLS (internal system table)
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

export interface RateLimitResult {
    ok: boolean;
    remaining: number;
    reset?: Date;
}

/**
 * Rate limit check backed by Postgres.
 * @param key Unique key for the limit (e.g. "invite:user_123")
 * @param limit Max requests allowed in the window
 * @param windowSeconds Window size in seconds
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    const now = new Date();
    const windowStartThreshold = new Date(now.getTime() - windowSeconds * 1000);

    // 1. Upsert logic:
    // If key exists and window_start > threshold, increment count.
    // Else, reset count to 1 and update window_start.
    // We can do this in SQL or logic. Logic is easier to debug here.

    try {
        // Fetch current state
        const { data: current, error: fetchError } = await supabaseAdmin
            .from('rate_limits')
            .select('*')
            .eq('key', key)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "Row not found"
            console.error('Rate limit fetch error:', fetchError);
            return { ok: true, remaining: limit - 1 }; // Fail open if DB issue? Or close? Let's fail open to not block users on error.
        }

        if (current) {
            const windowStart = new Date(current.window_start);

            if (windowStart > windowStartThreshold) {
                // Window is still active
                if (current.count >= limit) {
                    return { ok: false, remaining: 0, reset: new Date(windowStart.getTime() + windowSeconds * 1000) };
                }

                // Increment
                const { error: incError } = await supabaseAdmin
                    .from('rate_limits')
                    .update({
                        count: current.count + 1,
                        updated_at: now.toISOString()
                    })
                    .eq('key', key);

                if (incError) console.error('Rate limit inc error:', incError);

                return { ok: true, remaining: limit - (current.count + 1) };
            } else {
                // Window expired, reset
                const { error: resetError } = await supabaseAdmin
                    .from('rate_limits')
                    .update({
                        count: 1,
                        window_start: now.toISOString(),
                        updated_at: now.toISOString()
                    })
                    .eq('key', key);

                if (resetError) console.error('Rate limit reset error:', resetError);

                return { ok: true, remaining: limit - 1 };
            }
        } else {
            // Create new entry
            const { error: createError } = await supabaseAdmin
                .from('rate_limits')
                .insert({
                    key,
                    count: 1,
                    window_start: now.toISOString(),
                    updated_at: now.toISOString()
                });

            if (createError) {
                // Handle race condition (unique violation) treated as increment
                if (createError.code === '23505') {
                    // Retry once recursively (simple retry)
                    return rateLimit(key, limit, windowSeconds);
                }
                console.error('Rate limit create error:', createError);
            }

            return { ok: true, remaining: limit - 1 };
        }

    } catch (err) {
        console.error('Rate limit exception:', err);
        return { ok: true, remaining: 1 }; // Fail open
    }
}
