'use server';

import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Attorney control surface (server side) for per-document content access.
 *
 * Every action verifies the caller is the DEAL HOST (Agenzia staff, not a party
 * to this deal) via the is_deal_host() DB function before writing grants. Writes
 * go through the service client and are audit-logged.
 */

async function getClients(): Promise<{ userClient: SupabaseClient; admin: SupabaseClient }> {
    const cookieStore = await cookies();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const svc = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY!;
    const userClient = createServerClient(url, anon, {
        cookies: { getAll() { return cookieStore.getAll(); }, setAll() { } },
    });
    const admin = createClient(url, svc, { auth: { autoRefreshToken: false, persistSession: false } });
    return { userClient, admin };
}

export interface DocAccessParticipant {
    participantId: string;
    name: string;
    role: string;
    isHostParticipant: boolean; // Agenzia host — always has access, not toggleable
    isUploader: boolean;        // uploaded it — always has access, not toggleable
    granted: boolean;           // has an explicit grant (the toggle state)
}

// Load the deal's participants + their access state for one document. Host only.
export async function getDocumentAccess(documentId: string): Promise<
    { ok: true; documentTitle: string; participants: DocAccessParticipant[] } |
    { ok: false; error: string }
> {
    const { userClient, admin } = await getClients();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return { ok: false, error: 'Unauthorized' };

    const { data: doc } = await admin
        .from('documents')
        .select('id, deal_id, uploaded_by, owner_participant_id, title_en')
        .eq('id', documentId)
        .single();
    if (!doc) return { ok: false, error: 'Document not found' };

    const { data: isHost } = await userClient.rpc('is_deal_host', { deal_uuid: doc.deal_id });
    if (isHost !== true) return { ok: false, error: 'Forbidden' };

    const { data: dps } = await admin
        .from('deal_participants')
        .select('participant_id, role, recused, participants ( id, name, email, user_id )')
        .eq('deal_id', doc.deal_id)
        .eq('is_active', true);

    const { data: grants } = await admin
        .from('document_grants')
        .select('participant_id')
        .eq('document_id', documentId);
    const grantedSet = new Set((grants || []).map((g) => g.participant_id));

    // Which participants map to Agenzia staff accounts (potential hosts)?
    const userIds = (dps || [])
        .map((d) => (d.participants as any)?.user_id)
        .filter(Boolean);
    const { data: staffUsers } = userIds.length
        ? await admin.from('users').select('id, role').in('id', userIds)
        : { data: [] as { id: string; role: string }[] };
    const staffRoleById = new Map((staffUsers || []).map((u) => [u.id, u.role]));

    const participants: DocAccessParticipant[] = (dps || []).map((d) => {
        const p = d.participants as any;
        const globalRole = p?.user_id ? staffRoleById.get(p.user_id) : undefined;
        const isStaffGlobal = ['admin', 'lawyer', 'staff'].includes(globalRole || '');
        const isPartySeat = ['buyer', 'seller'].includes(d.role) || d.recused === true;
        const isHostParticipant = isStaffGlobal && !isPartySeat;
        const isUploader =
            (doc.owner_participant_id && p?.id === doc.owner_participant_id) ||
            (doc.uploaded_by && p?.user_id === doc.uploaded_by) || false;
        return {
            participantId: p?.id,
            name: p?.name || p?.email || 'Participant',
            role: d.role,
            isHostParticipant,
            isUploader: !!isUploader,
            granted: grantedSet.has(p?.id),
        };
    });

    return { ok: true, documentTitle: doc.title_en, participants };
}

async function auditGrant(
    admin: SupabaseClient,
    dealId: string,
    actorId: string,
    granted: boolean,
    docTitle: string,
    count = 1,
) {
    try {
        const { data: actor } = await admin.from('users').select('name').eq('id', actorId).single();
        await admin.from('audit_logs').insert({
            deal_id: dealId,
            actor_id: actorId,
            actor_name: actor?.name || 'Staff',
            action: granted ? 'GRANTED_DOC_ACCESS' : 'REVOKED_DOC_ACCESS',
            details: `${granted ? 'Opened' : 'Closed'} "${docTitle}" ${granted ? 'to' : 'from'} ${count} participant${count === 1 ? '' : 's'}`,
            timestamp: new Date().toISOString(),
        });
    } catch (e) {
        console.warn('Audit log for document access failed (non-critical):', e);
    }
}

// Grant or revoke one participant's access to one document. Host only.
export async function setDocumentAccess(documentId: string, participantId: string, granted: boolean):
    Promise<{ ok: boolean; error?: string }> {
    const { userClient, admin } = await getClients();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return { ok: false, error: 'Unauthorized' };

    const { data: doc } = await admin.from('documents').select('id, deal_id, title_en').eq('id', documentId).single();
    if (!doc) return { ok: false, error: 'Document not found' };

    const { data: isHost } = await userClient.rpc('is_deal_host', { deal_uuid: doc.deal_id });
    if (isHost !== true) return { ok: false, error: 'Forbidden' };

    if (granted) {
        const { error } = await admin
            .from('document_grants')
            .upsert({ document_id: documentId, participant_id: participantId, granted_by: user.id },
                { onConflict: 'document_id,participant_id' });
        if (error) return { ok: false, error: error.message };
    } else {
        const { error } = await admin
            .from('document_grants')
            .delete()
            .eq('document_id', documentId)
            .eq('participant_id', participantId);
        if (error) return { ok: false, error: error.message };
    }

    await auditGrant(admin, doc.deal_id, user.id, granted, doc.title_en, 1);
    return { ok: true };
}

// Bulk grant/revoke (shortcuts like "open to all" / "open to buyer side"). Host only.
export async function setDocumentAccessBulk(documentId: string, participantIds: string[], granted: boolean):
    Promise<{ ok: boolean; error?: string }> {
    const { userClient, admin } = await getClients();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return { ok: false, error: 'Unauthorized' };

    const { data: doc } = await admin.from('documents').select('id, deal_id, title_en').eq('id', documentId).single();
    if (!doc) return { ok: false, error: 'Document not found' };

    const { data: isHost } = await userClient.rpc('is_deal_host', { deal_uuid: doc.deal_id });
    if (isHost !== true) return { ok: false, error: 'Forbidden' };
    if (!participantIds.length) return { ok: true };

    if (granted) {
        const rows = participantIds.map((pid) => ({ document_id: documentId, participant_id: pid, granted_by: user.id }));
        const { error } = await admin.from('document_grants').upsert(rows, { onConflict: 'document_id,participant_id' });
        if (error) return { ok: false, error: error.message };
    } else {
        const { error } = await admin
            .from('document_grants')
            .delete()
            .eq('document_id', documentId)
            .in('participant_id', participantIds);
        if (error) return { ok: false, error: error.message };
    }

    await auditGrant(admin, doc.deal_id, user.id, granted, doc.title_en, participantIds.length);
    return { ok: true };
}
