'use server';

import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Attorney control surface (server side) for per-document content access.
 *
 * Access has three levels per participant, per document:
 *   'none'     — cannot see the content
 *   'view'     — may open/preview in-app (no copy)
 *   'download' — may view AND download (take a copy)
 *
 * Every action verifies the caller is the DEAL HOST (Agenzia staff, not a party
 * to this deal) via is_deal_host() before writing. Writes go through the service
 * client and are audit-logged.
 */

export type AccessLevel = 'none' | 'view' | 'download';

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
    isHostParticipant: boolean; // Agenzia host — always full access, not toggleable
    isUploader: boolean;        // uploaded it — always full access, not toggleable
    level: AccessLevel;         // the toggle state
}

// Load the deal's participants + their access level for one document. Host only.
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
        .select('participant_id, can_download')
        .eq('document_id', documentId);
    const grantByParticipant = new Map((grants || []).map((g) => [g.participant_id, g.can_download]));

    const userIds = (dps || []).map((d) => (d.participants as any)?.user_id).filter(Boolean);
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

        let level: AccessLevel = 'none';
        if (grantByParticipant.has(p?.id)) level = grantByParticipant.get(p?.id) ? 'download' : 'view';

        return {
            participantId: p?.id,
            name: p?.name || p?.email || 'Participant',
            role: d.role,
            isHostParticipant,
            isUploader: !!isUploader,
            level,
        };
    });

    return { ok: true, documentTitle: doc.title_en, participants };
}

async function auditAccess(
    admin: SupabaseClient,
    dealId: string,
    actorId: string,
    level: AccessLevel,
    docTitle: string,
    count = 1,
) {
    try {
        const { data: actor } = await admin.from('users').select('name').eq('id', actorId).single();
        const verb = level === 'none' ? 'Closed' : level === 'download' ? 'Opened (with download)' : 'Opened (view only)';
        await admin.from('audit_logs').insert({
            deal_id: dealId,
            actor_id: actorId,
            actor_name: actor?.name || 'Staff',
            action: level === 'none' ? 'REVOKED_DOC_ACCESS' : 'GRANTED_DOC_ACCESS',
            details: `${verb} "${docTitle}" for ${count} participant${count === 1 ? '' : 's'}`,
            timestamp: new Date().toISOString(),
        });
    } catch (e) {
        console.warn('Audit log for document access failed (non-critical):', e);
    }
}

async function applyLevel(admin: SupabaseClient, documentId: string, participantIds: string[], level: AccessLevel, actorId: string):
    Promise<{ ok: boolean; error?: string }> {
    if (level === 'none') {
        const { error } = await admin.from('document_grants').delete()
            .eq('document_id', documentId).in('participant_id', participantIds);
        if (error) return { ok: false, error: error.message };
    } else {
        const rows = participantIds.map((pid) => ({
            document_id: documentId,
            participant_id: pid,
            granted_by: actorId,
            can_download: level === 'download',
        }));
        const { error } = await admin.from('document_grants').upsert(rows, { onConflict: 'document_id,participant_id' });
        if (error) return { ok: false, error: error.message };
    }
    return { ok: true };
}

async function authorizeHost(userClient: SupabaseClient, admin: SupabaseClient, documentId: string) {
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return { ok: false as const, error: 'Unauthorized' };
    const { data: doc } = await admin.from('documents').select('id, deal_id, title_en').eq('id', documentId).single();
    if (!doc) return { ok: false as const, error: 'Document not found' };
    const { data: isHost } = await userClient.rpc('is_deal_host', { deal_uuid: doc.deal_id });
    if (isHost !== true) return { ok: false as const, error: 'Forbidden' };
    return { ok: true as const, user, doc };
}

// Set one participant's access level for one document. Host only.
export async function setDocumentAccess(documentId: string, participantId: string, level: AccessLevel):
    Promise<{ ok: boolean; error?: string }> {
    const { userClient, admin } = await getClients();
    const auth = await authorizeHost(userClient, admin, documentId);
    if (!auth.ok) return auth;
    const res = await applyLevel(admin, documentId, [participantId], level, auth.user.id);
    if (!res.ok) return res;
    await auditAccess(admin, auth.doc.deal_id, auth.user.id, level, auth.doc.title_en, 1);
    return { ok: true };
}

// Bulk set access level (shortcuts). Host only.
export async function setDocumentAccessBulk(documentId: string, participantIds: string[], level: AccessLevel):
    Promise<{ ok: boolean; error?: string }> {
    const { userClient, admin } = await getClients();
    const auth = await authorizeHost(userClient, admin, documentId);
    if (!auth.ok) return auth;
    if (!participantIds.length) return { ok: true };
    const res = await applyLevel(admin, documentId, participantIds, level, auth.user.id);
    if (!res.ok) return res;
    await auditAccess(admin, auth.doc.deal_id, auth.user.id, level, auth.doc.title_en, participantIds.length);
    return { ok: true };
}
