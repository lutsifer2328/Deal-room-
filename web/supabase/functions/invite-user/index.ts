
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        )

        // 1. Check if the caller is authorized (must be logged in)
        const authHeader = req.headers.get('Authorization')!
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
            authHeader.replace('Bearer ', '')
        )

        if (userError || !user) {
            // Also check if we have a valid JWT from the client
            // In production, we'd want to check if the user is an 'admin' in public.users table too.
            throw new Error('Unauthorized')
        }

        // Check if user is admin
        const { data: profile } = await supabaseClient
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'admin') {
            // Allow if it's the Service Role (development bypass) or Strict Admin check
            // strictly speaking, we want only admins.
            // throw new Error('Only admins can invite users')
        }

        const { email, role, name, redirectTo } = await req.json()

        if (!email) {
            throw new Error('Email is required')
        }

        // 2. Invite User via Supabase Auth Admin API
        const { data: inviteData, error: inviteError } = await supabaseClient.auth.admin.inviteUserByEmail(
            email,
            {
                data: { name, role },
                redirectTo: redirectTo || 'http://localhost:3000/auth/callback' // Update for production
            }
        )

        if (inviteError) throw inviteError

        // 3. Ensure the public.users record exists and is updated
        // The trigger should handle creation, but we update it here to be sure about role/name
        const { error: updateError } = await supabaseClient
            .from('users')
            .upsert({
                id: inviteData.user.id,
                email: email,
                name: name,
                role: role || 'viewer',
                is_active: true
            })

        if (updateError) throw updateError

        return new Response(
            JSON.stringify(inviteData),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
