import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { dealId, userId, userEmail, userRole } = await request.json();

        // 1. Validate Internal Role
        const internalRoles = ['admin', 'lawyer', 'staff'];
        if (!internalRoles.includes(userRole)) {
            return NextResponse.json({ error: 'Unauthorized: Only internal staff can self-assign.' }, { status: 403 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SERVICE_ROLE_KEY!;
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // 2. Find or Create Global Participant
        let participantId;
        const { data: existingParticipant } = await supabaseAdmin
            .from('participants')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (existingParticipant) {
            participantId = existingParticipant.id;
        } else {
            // Create Global Participant if missing (should exist for staff usually)
            const { data: newParticipant, error: partError } = await supabaseAdmin
                .from('participants')
                .insert({
                    user_id: userId,
                    email: userEmail,
                    name: 'Internal Staff', // Should be fetched from users table ideally
                    invitation_status: 'accepted'
                })
                .select('id')
                .single();

            if (partError) throw partError;
            participantId = newParticipant.id;
        }

        // 3. Check if already in deal
        const { data: existingDealPart } = await supabaseAdmin
            .from('deal_participants')
            .select('id')
            .eq('deal_id', dealId)
            .eq('participant_id', participantId)
            .maybeSingle();

        if (existingDealPart) {
            return NextResponse.json({ message: 'Already a participant' });
        }

        // 4. Add to Deal
        // Permissions based on Role Matrix
        // Staff: View Documents only? Or Manage? 
        // RBAC: Staff = Manage Documents (Yes), Edit Timeline (No), Close Deals (No).
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
                role: userRole, // Carry over global role
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
