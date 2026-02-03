
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a dummy client if env vars are missing during build/dev
// This prevents build failures during static generation
const url = supabaseUrl || 'https://placeholder.supabase.co'
const key = supabaseAnonKey || 'placeholder-key'

export const supabase = createClient(url, key)

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Missing Supabase environment variables. Some features may not work.')
} else {
    // Debugging: Log the FIRST 20 chars of the URL to confirm it's correct (safe to expose URL origin)
    console.log('✅ Supabase Initialized with URL:', url.substring(0, 25) + '...');
}

