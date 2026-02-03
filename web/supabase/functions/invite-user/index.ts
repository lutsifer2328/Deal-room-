import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // 1. Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Init Supabase with Service Role Key for admin operations
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SERVICE_ROLE_KEY') ?? '',
        )

        console.log('⚠️ WARNING: User verification is DISABLED for testing');

        // 2. Parse Request
        const { email, role, name, redirectTo } = await req.json()
        if (!email) throw new Error('Email is required')

        // 3. Invite User (Send Email)
        let inviteData;
        try {
            const result = await supabaseAdmin.auth.admin.inviteUserByEmail(
                email,
                {
                    data: { name, role },
                    redirectTo: redirectTo || 'http://localhost:3000/auth/callback'
                }
            )

            if (result.error) {
                // Check if it's a "user already exists" error
                if (result.error.message?.includes('already been registered') ||
                    result.error.message?.includes('already exists')) {
                    // User already invited - this is OK, just return success
                    return new Response(
                        JSON.stringify({
                            message: 'User already has access to the system',
                            alreadyExists: true
                        }),
                        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
                    )
                }
                throw result.error
            }

            inviteData = result.data
        } catch (error: any) {
            // Also catch network/unknown errors
            if (error.message?.includes('already been registered') ||
                error.message?.includes('already exists')) {
                return new Response(
                    JSON.stringify({
                        message: 'User already has access to the system',
                        alreadyExists: true
                    }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
                )
            }
            throw error
        }

        // 4. Update Public Profile
        const { error: updateError } = await supabaseAdmin
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
        console.error('Function Error:', error.message)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
