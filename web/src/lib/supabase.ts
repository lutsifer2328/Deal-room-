
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase Env Vars Missing! Check Vercel Settings.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Debugging
console.log('✅ Supabase Client Initialized');

