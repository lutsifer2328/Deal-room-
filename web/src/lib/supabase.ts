
import { createClient } from '@supabase/supabase-js'

// FALLBACK: Hardcoded values because Vercel Env Vars are failing to load
// These are public values (Anon Key is safe to expose in client bundle)
const HARDCODED_URL = 'https://qolozennlzllvrqmibls.supabase.co'
const HARDCODED_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NTE1MjcsImV4cCI6MjA4NTQyNzUyN30.vu549GpXoQGGMwVs92PB4IC8IL9hniLWS9FDLsl28M8'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || HARDCODED_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || HARDCODED_ANON

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase Env Vars Missing! (Even hardcoded fallback failed?)')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Debugging
console.log('✅ Supabase Client Initialized with:', supabaseUrl.substring(0, 20) + '...');

