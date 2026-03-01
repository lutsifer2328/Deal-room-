import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const joinSchema = z.object({
    dealId: z.string().min(1, "Deal ID is required")
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = joinSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
        }

        const { dealId } = parsed.data;

        // 1. Cryptographically verify user identity using getUser()
        const cookieStore = await cookies();
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const supabaseUser = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) => {
                                cookieStore.set(name, value, options)
                            })
                        } catch (error) {
                            // Ignore error for Server Components
                        }
                    },
                },
            }
        );

        const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized: Invalid session' }, { status: 401 });
        }

        const userId = user.id;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY!;
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // 2. Lookup the actual role on the server instead of trusting client payload
        const { data: dbUser, error: userError } = await supabaseAdmin
            .from('users')
            .select('role, email, name')
            .eq('id', userId)
            .single();

        if (userError || !dbUser) {
            return NextResponse.json({ error: 'User record not found' }, { status: 403 });
        }

        const { role: userRole, email: userEmail, name: userName } = dbUser;

        // 3. Validate Internal Role
        const internalRoles = ['admin', 'lawyer', 'staff'];
        if (!internalRoles.includes(userRole)) {
            return NextResponse.json({ error: 'Unauthorized: Only internal staff can self-assign.' }, { status: 403 });
        }

        // 4. Validate Deal exists
        const { data: existingDeal, error: dealError } = await supabaseAdmin
            .from('deals')
            .select('id')
            .eq('id', dealId)
            .single();

        if (dealError || !existingDeal) {
            return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
        }

        // 5. Find or Create Global Participant
        let participantId;
        const { data: existingParticipant } = await supabaseAdmin
            .from('participants')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (existingParticipant) {
            participantId = existingParticipant.id;
        } else {
            // Create Global Participant if missing
            const { data: newParticipant, error: partError } = await supabaseAdmin
                .from('participants')
                .insert({
                    user_id: userId,
                    email: userEmail,
                    name: userName || 'Internal Staff',
                    invitation_status: 'accepted'
                })
                .select('id')
                .single();

            if (partError) throw partError;
            participantId = newParticipant.id;
        }

        // 6. Check if already in deal
        const { data: existingDealPart } = await supabaseAdmin
            .from('deal_participants')
            .select('id')
            .eq('deal_id', dealId)
            .eq('participant_id', participantId)
            .maybeSingle();

        if (existingDealPart) {
            return NextResponse.json({ message: 'Already a participant' });
        }

        // 7. Add to Deal
        const permissions = {
            canViewDocuments: true,
            canDownloadDocuments: true,
            canUploadDocuments: true,
            canViewTimeline: true
        };

        const { error: joinError } = await supabaseAdmin
            .from('deal_participants')
            .insert({
                deal_id: dealId,
                participant_id: participantId,
                role: userRole,
                permissions: permissions,
                joined_at: new Date().toISOString(),
                is_active: true
            });

        if (joinError) throw joinError;

        console.log(`✅ User ${userEmail} (${userRole}) self-assigned to deal ${dealId}`);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Self-Assign API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
