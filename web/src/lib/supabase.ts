import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Missing Supabase environment variables.\n' +
        'Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY ' +
        'are set in your .env.local (local) or Vercel Environment Variables (production).'
    )
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        // NOTE: Do NOT override the lock function.
        // The default Supabase lock prevents race conditions during
        // auth operations like updateUser. Overriding it with a no-op
        // causes deadlocks under certain browser conditions (e.g. when
        // password manager extensions are active), leading to hangs.
    },
})
