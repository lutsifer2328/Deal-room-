'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from './supabase';
import { Deal, Task, User, AuditLogEntry, Participant, DealStep, TimelineStep, DealStatus, Role, StandardDocument, GlobalParticipant, DealParticipant, Notification, AgencyContract, DealDocument } from './types';
import { createDefaultTimeline } from './defaultTimeline';
import { MOCK_STANDARD_DOCUMENTS } from './mockStandardDocuments';
import { getPermissionsForRole } from './permissions';

interface DataContextType {
    users: Record<string, User>;
    activeDeal: Deal;
    deals: Deal[];
    tasks: Task[];
    isInitialized: boolean;

    // Actions
    createDeal: (title: string, propertyAddress: string, participants: Omit<Participant, 'id' | 'addedAt'>[], actorId: string, dealNumber?: string) => Promise<string>;
    addTask: (dealId: string, title: string, assignedTo: string, standardDocumentId?: string, expirationDate?: string) => void;
    deleteTask: (taskId: string, actorId: string) => void;
    setActiveDeal: (dealId: string) => void;
    updateDealStep: (dealId: string, step: DealStep, actorId: string) => void;
    updateCurrentStepId: (dealId: string, stepId: string, actorId: string) => void;
    updateDealTimeline: (dealId: string, timeline: TimelineStep[], actorId: string) => void;
    updateDealStatus: (dealId: string, status: DealStatus, actorId: string, notes?: string) => void;
    addTaskComment: (taskId: string, authorId: string, authorName: string, text: string) => void;
    toggleCommentVisibility: (taskId: string, commentId: string) => void;

    // User Management Actions
    addUser: (fullName: string, email: string, role: Role) => Promise<string | null>;
    updateUser: (userId: string, updates: Partial<User>) => void;
    deactivateUser: (userId: string, actorId: string) => void;
    deleteUser: (userId: string) => Promise<boolean>;

    // Participant Actions
    addParticipant: (dealId: string, participant: Omit<Participant, 'id' | 'addedAt'>) => void;
    removeParticipant: (dealId: string, participantId: string) => void;
    updateParticipant: (dealId: string, participantId: string, updates: Partial<Participant>) => void;

    // Doc Actions
    uploadDocument: (taskId: string, file: File, uploadedBy: string) => void;
    verifyDocument: (actorId: string, taskId: string, docId: string) => void;
    releaseDocument: (actorId: string, taskId: string, docId: string) => void;
    rejectDocument: (actorId: string, taskId: string, docId: string, reasonEn: string, reasonBg: string) => void;

    // Standard Documents Actions
    standardDocuments: StandardDocument[];
    addStandardDocument: (name: string, description: string, createdBy: string) => Promise<string>;
    updateStandardDocument: (id: string, name: string, description: string) => void;
    deleteStandardDocument: (id: string) => void;
    restoreStandardDocuments: () => void;

    // Global Participants Actions
    globalParticipants: GlobalParticipant[];
    dealParticipants: DealParticipant[];
    createGlobalParticipant: (participant: Omit<GlobalParticipant, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
    updateGlobalParticipant: (id: string, updates: Partial<GlobalParticipant>) => void;
    deleteGlobalParticipant: (id: string) => void;
    checkDuplicateEmail: (email: string) => GlobalParticipant | null;
    inviteParticipant: (email: string, name: string, role: Role) => Promise<boolean>;
    getParticipantDeals: (participantId: string) => Array<{ deal: Deal, dealParticipant: DealParticipant }>;
    getRecentParticipants: (days?: number) => GlobalParticipant[];
    addParticipantContract: (participantId: string, title: string, uploadedBy: string) => void;
    deleteParticipantContract: (participantId: string, contractId: string) => void;

    // Logs
    logs: AuditLogEntry[];

    // Notifications
    notifications: Notification[];
    addNotification: (type: 'info' | 'success' | 'warning' | 'error', title: string, message: string, link?: string) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
    const [isInitialized, setIsInitialized] = useState(false);

    // Raw Data State
    const [rawUsers, setRawUsers] = useState<User[]>([]);
    const [rawDeals, setRawDeals] = useState<any[]>([]);
    const [rawTasks, setRawTasks] = useState<any[]>([]);
    const [rawGlobalParticipants, setRawGlobalParticipants] = useState<GlobalParticipant[]>([]);
    const [rawDealParticipants, setRawDealParticipants] = useState<DealParticipant[]>([]);
    const [standardDocuments, setStandardDocuments] = useState<StandardDocument[]>(MOCK_STANDARD_DOCUMENTS);
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [agencyContracts, setAgencyContracts] = useState<AgencyContract[]>([]);

    // Computed State
    const [users, setUsers] = useState<Record<string, User>>({});
    const [deals, setDeals] = useState<Deal[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [activeDealId, setActiveDealId] = useState<string>('');
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [
                    { data: fetchedUsers },
                    { data: fetchedDeals },
                    { data: fetchedTasks },
                    { data: fetchedGPs },
                    { data: fetchedDPs },
                    { data: fetchedStdDocs },
                    { data: fetchedLogs },
                    { data: fetchedContracts }
                ] = await Promise.all([
                    supabase.from('users').select('*'),
                    supabase.from('deals').select('*'),
                    supabase.from('tasks').select('*, documents(*)'),
                    supabase.from('participants').select('*'),
                    supabase.from('deal_participants').select('*'),
                    supabase.from('standard_documents').select('*'),
                    // TEMPORARILY DISABLED - audit_logs causing 400 error
                    // supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(100),
                    Promise.resolve({ data: [] }), // Return empty array instead
                    supabase.from('agency_contracts').select('*')
                ]);

                if (fetchedUsers) setRawUsers(fetchedUsers.map(u => ({
                    id: u.id,
                    email: u.email,
                    name: u.name || 'Unknown User',
                    role: u.role,
                    permissions: getPermissionsForRole(u.role),
                    avatarUrl: u.avatar_url,
                    isActive: u.is_active !== false, // Handle null/undefined as true if needed, or stick to strict check
                    createdAt: u.created_at,
                    lastLogin: u.last_login
                })));
                if (fetchedDeals) setRawDeals(fetchedDeals);
                if (fetchedTasks) setRawTasks(fetchedTasks);
                if (fetchedGPs) setRawGlobalParticipants(fetchedGPs.map(gp => ({
                    id: gp.id,
                    userId: gp.user_id,
                    email: gp.email,
                    name: gp.name,
                    phone: gp.phone,
                    agency: gp.agency,
                    internalNotes: gp.internal_notes,
                    invitationStatus: gp.invitation_status,
                    invitationSentAt: gp.invitation_sent_at,
                    createdAt: gp.created_at,
                    updatedAt: gp.updated_at
                })));
                if (fetchedDPs) {
                    setRawDealParticipants(fetchedDPs.map(dp => ({
                        id: dp.id,
                        dealId: dp.deal_id,
                        participantId: dp.participant_id,
                        role: dp.role,
                        agency: dp.agency,
                        permissions: dp.permissions,
                        joinedAt: dp.joined_at,
                        isActive: dp.is_active !== false, // Default to true if null/undefined
                        createdAt: dp.created_at,
                        updatedAt: dp.updated_at
                    })));
                }
                // Only overwrite if DB has valid data (active docs)
                const validFetchedDocs = fetchedStdDocs ? fetchedStdDocs.filter(d => d.is_active !== false) : [];

                if (validFetchedDocs.length >= 10) {
                    // CRITICAL FIX: Ignore DB data for now and force local defaults to ensure they stay visible
                    setStandardDocuments(MOCK_STANDARD_DOCUMENTS);
                } else {
                    // If DB is empty or partial, trigger BG seed but KEEP MOCK DATA visible
                    console.log('DB missing standard docs. Retaining local defaults & seeding BG...');
                    const systemUserId = fetchedUsers && fetchedUsers.length > 0 ? fetchedUsers[0].id : null;

                    // Background Seed (Fire & Forget)
                    supabase.from('standard_documents').upsert(
                        MOCK_STANDARD_DOCUMENTS.map(d => ({
                            id: d.id,
                            name: d.name,
                            description: d.description,
                            usage_count: d.usageCount,
                            created_at: d.createdAt,
                            updated_at: d.updatedAt,
                            created_by: systemUserId || d.createdBy,
                            is_active: d.isActive
                        })),
                        { onConflict: 'id' }
                    ).then(({ error }) => {
                        if (error) console.warn('BG Seed Error:', error);
                        else console.log('BG Seed Success');
                    });
                }
                if (fetchedLogs) setLogs(fetchedLogs);
                if (fetchedContracts) setAgencyContracts(fetchedContracts);

                setIsInitialized(true);
            } catch (error) {
                console.warn('Error fetching data from Supabase:', error);
            }
        };

        fetchData();

        // Setup Realtime (Optional for later)
    }, []);

    // Compute Enriched Global Participants (contracts attached)
    const enrichedGlobalParticipants = React.useMemo(() => {
        return rawGlobalParticipants.map(gp => ({
            ...gp,
            contracts: agencyContracts.filter(c => c.participantId === gp.id)
        }));
    }, [rawGlobalParticipants, agencyContracts]);

    // Compute Derived State
    useEffect(() => {
        // Users Map
        const userMap: Record<string, User> = {};
        rawUsers.forEach(u => userMap[u.id] = u);
        setUsers(userMap);

        // Map Global Participants (Attach Contracts)
        // (enrichedGlobalParticipants is now computed via useMemo above)

        // Map Deals (Join Users & Participants)
        const computedDeals: Deal[] = rawDeals.map(d => {
            const myDPs = rawDealParticipants.filter(dp => dp.dealId === d.id);


            const participants: Participant[] = myDPs.map(dp => {
                const gp = enrichedGlobalParticipants.find(p => p.id === dp.participantId);
                const user = gp?.userId ? userMap[gp.userId] : undefined;

                return {
                    id: gp?.id || dp.participantId, // Use GP ID as Participant ID in legacy view
                    userId: gp?.userId || undefined,
                    fullName: gp?.name || 'Unknown',
                    email: gp?.email || '',
                    phone: gp?.phone || '',
                    agency: dp.agency || gp?.agency, // Deal specific agency overrides global
                    role: dp.role,
                    canViewDocuments: dp.permissions?.canViewDocuments || false,
                    canDownload: dp.permissions?.canDownloadDocuments || false,
                    isActive: dp.isActive,
                    addedAt: dp.joinedAt,
                    invitationToken: undefined,
                    invitedAt: gp?.invitationSentAt, // Legacy mapping
                    hasAcceptedInvite: gp?.invitationStatus === 'accepted'
                };
            });

            return {
                id: d.id,
                title: d.title,
                propertyAddress: d.property_address,
                status: d.status,
                closedAt: d.closed_at,
                closedBy: d.closed_by,
                closureNotes: d.closure_notes,
                timeline: d.timeline_json || createDefaultTimeline(),
                currentStepId: d.current_step_id || 'step_onboarding',
                currentStep: 'onboarding', // Legacy, derived strictly from ID in real app
                participants,
                buyerIds: participants.filter(p => p.role === 'buyer' && p.userId).map(p => p.userId!),
                sellerIds: participants.filter(p => p.role === 'seller' && p.userId).map(p => p.userId!),
                lawyerId: 'u_lawyer', // Mock
                agentId: participants.find(p => p.role === 'agent')?.userId,
                createdAt: d.created_at,
                dealNumber: undefined
            };
        });

        // Set Active Deal
        if (!activeDealId && computedDeals.length > 0) {
            setActiveDealId(computedDeals[0].id);
        }

        setDeals(computedDeals);

        // Map Tasks
        const computedTasks: Task[] = rawTasks.map(t => ({
            id: t.id,
            dealId: t.deal_id,
            title_en: t.title_en,
            title_bg: t.title_bg || t.title_en,
            description_en: t.description_en,
            description_bg: t.description_bg,
            assignedTo: t.assigned_to,
            status: t.status,
            documents: (t.documents || []).map((d: any) => ({
                id: d.id,
                title_en: d.title_en,
                title_bg: d.title_bg,
                url: d.url,
                uploadedBy: d.uploaded_by,
                status: d.status,
                uploadedAt: d.uploaded_at,
                verifiedAt: d.verified_at,
                rejectionReason_en: d.rejection_reason_en,
                rejectionReason_bg: d.rejection_reason_bg
            })),
            comments: t.comments || [],
            required: t.required,
            standardDocumentId: t.standard_document_id,
            expirationDate: t.expiration_date
        }));
        setTasks(computedTasks);

    }, [rawUsers, rawDeals, rawTasks, rawDealParticipants, activeDealId, enrichedGlobalParticipants]);

    // --- ACTIONS ---

    const activeDeal = deals.find(d => d.id === activeDealId) || deals[0] || {} as Deal;

    const logAction = async (dealId: string, actorId: string, action: AuditLogEntry['action'], details: string) => {
        const actor = users[actorId];
        const newLog: AuditLogEntry = {
            id: crypto.randomUUID(),
            dealId,
            actorId,
            actorName: actor ? actor.name : 'Unknown User',
            action,
            details,
            timestamp: new Date().toISOString()
        };
        // Optimistic
        setLogs(prev => [newLog, ...prev]);
        // DB - wrapped in try-catch since audit_logs table may not exist or have permission issues
        try {
            await supabase.from('audit_logs').insert({
                id: newLog.id,
                deal_id: dealId,
                actor_id: actorId,
                actor_name: newLog.actorName,
                action,
                details,
                timestamp: newLog.timestamp
            });
        } catch (error) {
            console.warn('Failed to log to audit_logs (table may not exist):', error);
        }
    };

    const createDeal = async (title: string, propertyAddress: string, participantsInput: Omit<Participant, 'id' | 'addedAt'>[], actorId: string, dealNumber?: string) => {
        const dealId = crypto.randomUUID();
        const defaultTimeline = createDefaultTimeline();

        // 1. Create Deal
        const dealPayload = {
            id: dealId,
            title,
            property_address: propertyAddress,
            status: 'active',
            current_step_id: defaultTimeline[0].id,
            timeline_json: defaultTimeline,
            created_at: new Date().toISOString(),
            created_by: actorId // Add creator tracking
        };

        // Optimistic Update
        setRawDeals(prev => [...prev, dealPayload]);
        setActiveDealId(dealId);

        // AWAIT deal creation to ensure FK exists
        const { error: dealError } = await supabase.from('deals').insert(dealPayload);

        if (dealError) {
            console.error('Create Deal Error', dealError);
            addNotification('error', 'Failed to create deal', dealError.message);
            return dealId; // Return anyway, local state might be optimistic
        }

        // 2. Process Participants sequentially to avoid race conditions
        for (const p of participantsInput) {
            try {
                // Ensure Global Participant Exists
                let gpId = crypto.randomUUID();
                let gpUserId = p.userId;

                // Check existing by email in current state (or fetch fresh if critical)
                // For better reliability, we should probably upsert or check DB, but using local state for now
                const existingGP = rawGlobalParticipants.find(gp => gp.email.toLowerCase() === p.email.toLowerCase());

                if (existingGP) {
                    gpId = existingGP.id;
                    if (existingGP.userId) gpUserId = existingGP.userId;
                } else {
                    // Create new Global Participant
                    // Check DB one last time to be safe? (Optional, but good for robustness)

                    const newGP = {
                        id: gpId,
                        user_id: gpUserId,
                        name: p.fullName,
                        email: p.email,
                        phone: p.phone,
                        agency: p.agency,
                        internal_notes: '',
                        invitation_status: p.hasAcceptedInvite ? 'accepted' : 'pending',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };

                    // Optimistic
                    setRawGlobalParticipants(prev => [...prev, newGP as any]);

                    const { error: gpError } = await supabase.from('participants').insert(newGP);
                    if (gpError) throw gpError;
                }

                // Create Deal Participant Link
                const dpPayload = {
                    id: crypto.randomUUID(),
                    deal_id: dealId,
                    participant_id: gpId,
                    role: p.role,
                    permissions: {
                        canViewDocuments: p.canViewDocuments !== false, // Default true
                        canDownloadDocuments: p.canDownload !== false,
                        canUploadDocuments: true,
                        canViewTimeline: true
                    },
                    joined_at: new Date().toISOString()
                };

                // Optimistic
                setRawDealParticipants(prev => [...prev, dpPayload as any]);

                const { error: dpError } = await supabase.from('deal_participants').insert(dpPayload);
                if (dpError) {
                    console.warn('⚠️ FAILED TO LINK PARTICIPANT TO DEAL ⚠️', {
                        participant: p.email,
                        role: p.role,
                        dealId,
                        error: dpError,
                        errorCode: dpError.code,
                        errorMessage: dpError.message,
                        errorDetails: dpError.details
                    });
                    // Don't throw - continue with other participants
                } else {
                    console.log('✅ Successfully linked participant:', p.email, 'with role:', p.role);
                }

            } catch (err: any) {
                console.warn('⚠️ ERROR PROCESSING PARTICIPANT ⚠️', {
                    participant: p.email,
                    role: p.role,
                    error: err,
                    errorMessage: err?.message,
                    stack: err?.stack
                });
            }
        }

        logAction(dealId, actorId || 'system', 'CREATED_DEAL', `Created deal "${title}"`);
        return dealId;
    };

    const addTask = (dealId: string, title: string, assignedTo: string, standardDocumentId?: string, expirationDate?: string) => {
        const taskId = crypto.randomUUID();
        const newTask = {
            id: taskId,
            deal_id: dealId, // explicit
            title_en: title,
            title_bg: title + ' (BG Translation Needed)',
            assigned_to: assignedTo,
            status: 'pending',
            required: true,
            standard_document_id: standardDocumentId,
            expiration_date: expirationDate,
            created_at: new Date().toISOString(),
            documents: [], // joined
            comments: []
        };
        setRawTasks(prev => [newTask, ...prev]);
        supabase.from('tasks').insert({
            id: taskId,
            deal_id: dealId,
            title_en: title,
            title_bg: title,
            assigned_to: assignedTo,
            status: 'pending',
            required: true,
            standard_document_id: standardDocumentId,
            expiration_date: expirationDate
        }).then(({ error }) => { if (error) console.warn(error); });

        logAction(dealId, 'u_lawyer', 'ADDED_TASK', `Added task "${title}"`);
    };

    // Placeholder implementations for other actions to fetch full type compliance
    // IMPORTANT: Implementing minimal core logic for the immediate task, 
    // expanding purely boilerplate functions for completion.

    const deleteTask = (taskId: string, actorId: string) => {
        setRawTasks(prev => prev.filter(t => t.id !== taskId));
        supabase.from('tasks').delete().eq('id', taskId).then();
        logAction(activeDealId, actorId, 'REMOVED_TASK', `Removed task`);
    };

    const setActiveDeal = (dealId: string) => setActiveDealId(dealId);

    const updateDealStep = (dealId: string, step: DealStep, actorId: string) => {
        /* Legacy support, updating local state only? No, DB */
        /* Currently DB has current_step_id, not DealStep enum directly usually mapped */
        // Mapping 'docs' -> 'step_docs'? 
        // For MVP, just updating structure
        // setRawDeals...
    };

    const updateCurrentStepId = (dealId: string, stepId: string, actorId: string) => {
        setRawDeals(prev => prev.map(d => d.id === dealId ? { ...d, current_step_id: stepId } : d));
        supabase.from('deals').update({ current_step_id: stepId }).eq('id', dealId).then();
        logAction(dealId, actorId, 'UPDATED_DEAL_STEP', `Changed step to ${stepId}`);
    };

    const updateDealTimeline = (dealId: string, timeline: TimelineStep[], actorId: string) => {
        setRawDeals(prev => prev.map(d => d.id === dealId ? { ...d, timeline_json: timeline } : d));
        supabase.from('deals').update({ timeline_json: timeline }).eq('id', dealId).then();
        logAction(dealId, actorId, 'UPDATED_TIMELINE', `Updated timeline`);
    };

    const updateDealStatus = (dealId: string, status: DealStatus, actorId: string, notes?: string) => {
        const updates: any = { status };
        if (status === 'closed') {
            updates.closed_at = new Date().toISOString();
            updates.closed_by = actorId;
            updates.closure_notes = notes;
        }
        setRawDeals(prev => prev.map(d => d.id === dealId ? { ...d, ...updates } : d));
        supabase.from('deals').update(updates).eq('id', dealId).then();
        logAction(dealId, actorId, 'UPDATED_DEAL_STATUS', status);
    };

    const addTaskComment = (taskId: string, authorId: string, authorName: string, text: string) => {
        const task = rawTasks.find(t => t.id === taskId);
        if (!task) return;
        const newComment = {
            id: crypto.randomUUID(),
            authorId,
            authorName,
            text,
            timestamp: new Date().toISOString(),
            isVisibleToAll: true
        };
        const updatedComments = [...(task.comments || []), newComment];
        setRawTasks(prev => prev.map(t => t.id === taskId ? { ...t, comments: updatedComments } : t));
        supabase.from('tasks').update({ comments: updatedComments }).eq('id', taskId).then();
    };

    const toggleCommentVisibility = (taskId: string, commentId: string) => {
        // Similar logic to update JSONB
    };

    const addUser = async (fullName: string, email: string, role: Role) => {
        const userId = crypto.randomUUID();
        const newUser: User = {
            id: userId,
            name: fullName,
            email: email,
            role: role, // Default role
            permissions: getPermissionsForRole(role), // Helper to get permissions based on role
            createdAt: new Date().toISOString(),
            lastLogin: undefined,
            isActive: true
        };

        try {
            // Optimistic Update
            setRawUsers(prev => [newUser, ...prev]);

            // DB Insert
            const { error } = await supabase.from('users').insert({
                id: userId,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                created_at: newUser.createdAt,
                is_active: true
            });

            if (error) throw error;

            addNotification('success', 'User Added', `${newUser.name} has been added as a ${newUser.role}.`);
            return userId;
        } catch (error: any) {
            console.error('Error adding user:', JSON.stringify(error, null, 2));
            // Rollback
            setRawUsers(prev => prev.filter(u => u.id !== userId));

            // Enhanced Error Reporting
            const errorMsg = error.message || 'Unknown error';
            const errorDetails = error.details || error.hint || '';
            const errorCode = error.code ? `(Code: ${error.code})` : '';

            addNotification('error', 'Failed to add user', `${errorMsg} ${errorCode} ${errorDetails}`);
            return null;
        }
    };
    const updateUser = async (userId: string, updates: Partial<User>) => {
        try {
            // Optimistic Update
            setRawUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));

            const { error } = await supabase.from('users').update({
                name: updates.name,
                email: updates.email,
                role: updates.role,
                is_active: updates.isActive
            }).eq('id', userId);

            if (error) throw error;
            addNotification('success', 'User Updated', 'User details saved successfully.');

        } catch (error: any) {
            console.error('Error updating user:', error);
            // Revert would be complex here without deep clone, but for now we just notify
            addNotification('error', 'Update Failed', error.message);
        }
    };
    const deactivateUser = async (userId: string, actorId: string) => {
        try {
            // Optimistic
            setRawUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: false } : u));

            const { error } = await supabase.from('users').update({ is_active: false }).eq('id', userId);
            if (error) throw error;

            addNotification('success', 'User Deactivated', 'Access revoked.');
            logAction(activeDealId, actorId, 'UPDATED_PARTICIPANT', 'Deactivated user');
        } catch (error: any) {
            console.error('Deactivate error:', error);
            setRawUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: true } : u)); // Revert
            addNotification('error', 'Failed', error.message);
        }
    };

    const deleteUser = async (userId: string) => {
        try {
            const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            setRawUsers(prev => prev.filter(u => u.id !== userId));
            addNotification('success', 'User Deleted', 'Permanently removed.');
            return true;
        } catch (error: any) {
            console.error('Delete error:', error);
            addNotification('error', 'Failed to delete', error.message);
            return false;
        }
    };

    const addParticipant = async (dealId: string, participantData: Omit<Participant, 'id' | 'addedAt'>) => {
        try {
            // 1. Check if exists globally
            let participantId = crypto.randomUUID();
            const { data: existing } = await supabase.from('participants').select('id').eq('email', participantData.email).single();

            if (existing) {
                participantId = existing.id;
                // UPDATE existing participant with latest details
                await supabase.from('participants').update({
                    name: participantData.fullName,
                    agency: participantData.agency || 'Agenzia',
                }).eq('id', participantId);

                // Update LOCAL state for Global Participants
                setRawGlobalParticipants(prev => prev.map(gp =>
                    gp.id === participantId
                        ? { ...gp, name: participantData.fullName, agency: participantData.agency || 'Agenzia' }
                        : gp
                ));
            } else {
                // Create new global participant
                const { error: createError } = await supabase.from('participants').insert({
                    id: participantId,
                    email: participantData.email,
                    name: participantData.fullName,
                    agency: participantData.agency || 'Agenzia',
                    phone: '',
                    internal_notes: ''
                });
                if (createError) throw createError;

                // Add to LOCAL state for Global Participants
                setRawGlobalParticipants(prev => [...prev, {
                    id: participantId,
                    email: participantData.email,
                    name: participantData.fullName,
                    agency: participantData.agency || 'Agenzia',
                    phone: '',
                    internal_notes: '',
                    invitationStatus: 'pending',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }]);
            }

            // 2. Link to Deal
            const { error: linkError } = await supabase.from('deal_participants').insert({
                deal_id: dealId,
                participant_id: participantId,
                role: participantData.role,
                permissions: {} // Default permissions
            });

            if (linkError) {
                // Ignore unique violation if already added
                if (linkError.code !== '23505') throw linkError;
            }

            // 3. Update Local State (Optimisticish)
            // We need to fetch the full participant details to update state correctly, or construct it
            const newParticipant: Participant = {
                id: participantId,
                fullName: participantData.fullName,
                email: participantData.email,
                role: participantData.role,
                phone: '',
                agency: participantData.agency || 'Agenzia',
                addedAt: new Date().toISOString(),
                isActive: true,
                hasAcceptedInvite: false,
                canViewDocuments: true,
                canDownload: true
            };

            const newDealParticipant: DealParticipant = {
                id: crypto.randomUUID(), // Local mock ID until refresh
                dealId: dealId,
                participantId: participantId,
                role: participantData.role,
                permissions: {
                    canViewDocuments: true,
                    canDownloadDocuments: true,
                    canUploadDocuments: false,
                    canViewTimeline: true
                },
                joinedAt: new Date().toISOString(),
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            setRawDealParticipants(prev => [...prev, newDealParticipant]);

            // No need to update 'participants' in setRawDeals anymore because 
            // the useEffect dependency on [rawGlobalParticipants, rawDealParticipants] 
            // will automatically re-compute 'computedDeals' with the correct joined data!


            addNotification('success', 'Participant Added', `${participantData.fullName} added to deal.`);

            // Try to log action, but don't fail if audit log fails
            try {
                logAction(dealId, 'current_user', 'ADDED_PARTICIPANT', `Added ${participantData.fullName}`);
            } catch (logError) {
                console.warn('Failed to log action (non-critical):', logError);
            }


        } catch (error: any) {
            console.warn('Error adding participant:', JSON.stringify(error, null, 2));
            addNotification('error', 'Failed to add participant', error.message || error.code || 'Unknown error');
        }
    };
    const removeParticipant = async (dealId: string, participantId: string) => {
        console.log('DEBUG: Store removeParticipant called', { dealId, participantId });
        try {
            // Delete from DB
            const { error, count } = await supabase.from('deal_participants')
                .delete({ count: 'exact' })
                .eq('deal_id', dealId)
                .eq('participant_id', participantId);

            console.log('DEBUG: DB Delete result:', { error, count });

            if (error) throw error;

            // Update Local State
            setRawDealParticipants(prev => prev.filter(dp => !(dp.dealId === dealId && dp.participantId === participantId)));

            addNotification('success', 'Participant Removed', 'They have been removed from this deal.');
            logAction(dealId, 'current_user', 'REMOVED_TASK', `Removed participant from deal`); // Using REMOVED_TASK as generic fallback if REMOVED_PARTICIPANT not in type yet, but we added ADDED/UPDATED. Let's use UPDATED for now or generic info. Actually we have ADDED_PARTICIPANT, maybe we need REMOVED_PARTICIPANT too.

        } catch (error: any) {
            console.warn('Error removing participant:', error);
            addNotification('error', 'Failed to remove', error.message);
        }
    };
    const updateParticipant = async (dealId: string, participantId: string, updates: Partial<Participant>) => {
        try {
            // 1. Update Deal-Specific Data (Role, Permissions)
            const dealUpdates: any = {};
            if (updates.role) dealUpdates.role = updates.role;
            if (updates.canViewDocuments !== undefined || updates.canDownload !== undefined || updates.documentPermissions) {
                // Fetch current permissions to merge? Or just overwrite specific keys if we had them separate. 
                // Currently assume 'updates' has the flattened keys, but DB has a JSONB 'permissions' column.
                // We need to construct the full permissions object or merge.
                // For now, let's just update what we have.
                const newPermissions = {
                    canViewDocuments: updates.canViewDocuments,
                    canDownloadDocuments: updates.canDownload, // Mapped name
                    canViewRoles: updates.documentPermissions?.canViewRoles
                };
                // We should probably merge with existing, but for now this is okay if we pass full state
                dealUpdates.permissions = newPermissions;
            }

            if (Object.keys(dealUpdates).length > 0) {
                const { error: dpError } = await supabase.from('deal_participants')
                    .update(dealUpdates)
                    .eq('deal_id', dealId)
                    .eq('participant_id', participantId);
                if (dpError) throw dpError;

                // Update Local Deal Participants
                setRawDealParticipants(prev => prev.map(dp => {
                    if (dp.dealId === dealId && dp.participantId === participantId) {
                        return {
                            ...dp,
                            role: updates.role || dp.role,
                            permissions: {
                                ...dp.permissions,
                                canViewDocuments: updates.canViewDocuments ?? dp.permissions.canViewDocuments,
                                canDownloadDocuments: updates.canDownload ?? dp.permissions.canDownloadDocuments,

                            }
                        };
                    }
                    return dp;
                }));
            }

            // 2. Update Global Data (Name, Email, Phone) - if changed
            const globalUpdates: any = {};
            if (updates.fullName) globalUpdates.name = updates.fullName;
            if (updates.email) globalUpdates.email = updates.email;
            if (updates.phone) globalUpdates.phone = updates.phone;
            if (updates.agency) globalUpdates.agency = updates.agency;

            if (Object.keys(globalUpdates).length > 0) {
                const { error: pError } = await supabase.from('participants')
                    .update(globalUpdates)
                    .eq('id', participantId);
                if (pError) throw pError;

                // Update Local Global Participants
                setRawGlobalParticipants(prev => prev.map(gp =>
                    gp.id === participantId ? { ...gp, ...globalUpdates } : gp
                ));
            }

            addNotification('success', 'Participant Updated', 'Changes saved successfully.');
            logAction(dealId, 'current_user', 'UPDATED_PARTICIPANT', `Updated details for participant`);

        } catch (error: any) {
            console.warn('Error updating participant:', error);
            addNotification('error', 'Update Failed', error.message);
        }
    };

    const uploadDocument = async (taskId: string, file: File, uploadedBy: string) => {
        const docId = crypto.randomUUID();
        const filePath = `${activeDealId}/${taskId}/${Date.now()}_${file.name}`;

        // 1. Upload to Storage
        const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, file);

        if (uploadError) {
            console.warn('Error uploading file:', uploadError);
            addNotification('error', 'Upload Failed', uploadError.message);
            return;
        }

        // 2. Insert Metadata into DB
        const newDoc = {
            id: docId,
            deal_id: activeDealId,
            task_id: taskId,
            title_en: file.name,
            title_bg: file.name,
            url: filePath, // Storing internal path for security
            uploaded_by: uploadedBy,
            status: 'private',
            uploaded_at: new Date().toISOString()
        };

        // Optimistic Update
        setRawTasks(prev => prev.map(t => t.id === taskId ? { ...t, documents: [...(t.documents || []), newDoc] } : t));

        const { error: dbError } = await supabase.from('documents').insert(newDoc);
        if (dbError) {
            console.warn('Error saving document metadata:', dbError);
            addNotification('error', 'Save Failed', 'File uploaded but metadata failed.');
        } else {
            logAction(activeDealId, uploadedBy, 'UPLOADED_DOC', file.name);
            addNotification('success', 'Document Uploaded', 'File saved securely.');
        }
    };

    const updateLocalDocStatus = (taskId: string, docId: string, updates: any) => {
        setRawTasks(prev => prev.map(t => {
            if (t.id !== taskId) return t;
            return {
                ...t,
                documents: t.documents.map((d: any) => d.id === docId ? { ...d, ...updates } : d)
            };
        }));
    };

    const verifyDocument = (actorId: string, taskId: string, docId: string) => {
        const updates = { status: 'verified', verified_at: new Date().toISOString() };
        updateLocalDocStatus(taskId, docId, updates);
        supabase.from('documents').update(updates).eq('id', docId).then();
        logAction(activeDealId, actorId, 'VERIFIED_DOC', `Verified document`);
    };

    const releaseDocument = (actorId: string, taskId: string, docId: string) => {
        const updates = { status: 'released' };
        updateLocalDocStatus(taskId, docId, updates);

        // Also mark task as completed?
        setRawTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
        supabase.from('tasks').update({ status: 'completed' }).eq('id', taskId).then();

        supabase.from('documents').update(updates).eq('id', docId).then();
        logAction(activeDealId, actorId, 'RELEASED_DOC', `Released document`);
    };

    const rejectDocument = (actorId: string, taskId: string, docId: string, reasonEn: string, reasonBg: string) => {
        const updates = {
            status: 'rejected',
            rejection_reason_en: reasonEn,
            rejection_reason_bg: reasonBg
        };
        updateLocalDocStatus(taskId, docId, updates);
        supabase.from('documents').update(updates).eq('id', docId).then();
        logAction(activeDealId, actorId, 'REJECTED_DOC', `Rejected document: ${reasonEn}`);
    };

    const addStandardDocument = async (name: string, description: string, createdBy: string) => {
        const id = crypto.randomUUID();
        const newDoc: StandardDocument = {
            id,
            name,
            description,
            usageCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy,
            isActive: true
        };

        const { error } = await supabase.from('standard_documents').insert({
            id,
            name,
            description,
            usage_count: 0,
            created_at: newDoc.createdAt,
            updated_at: newDoc.updatedAt,
            created_by: createdBy,
            is_active: true
        });

        if (error) {
            console.warn('Error adding standard doc:', error);
            addNotification('error', 'Failed to add', error.message);
            return '';
        }

        setStandardDocuments(prev => [...prev, newDoc]);
        addNotification('success', 'Document Added', 'New standard document created.');
        return id;
    };

    const updateStandardDocument = async (id: string, name: string, description: string) => {
        const { error } = await supabase.from('standard_documents').update({
            name,
            description,
            updated_at: new Date().toISOString()
        }).eq('id', id);

        if (error) {
            console.warn('Error updating standard doc:', error);
            addNotification('error', 'Failed to update', error.message);
            return;
        }

        setStandardDocuments(prev => prev.map(d => d.id === id ? { ...d, name, description } : d));
        addNotification('success', 'Updated', 'Document definition updated.');
    };

    const deleteStandardDocument = async (id: string) => {
        // Soft delete or hard delete? Let's do soft delete by isActive=false or hard delete.
        // User asked to "delete" usually. Let's hard delete for now to keep table clean.
        const { error } = await supabase.from('standard_documents').delete().eq('id', id);

        if (error) {
            console.warn('Error deleting standard doc:', error);
            addNotification('error', 'Failed to delete', error.message);
            return;
        }

        setStandardDocuments(prev => prev.filter(d => d.id !== id));
        addNotification('success', 'Deleted', 'Standard document removed.');
    };

    const restoreStandardDocuments = async () => {
        console.log('Restoring Standard Documents...', MOCK_STANDARD_DOCUMENTS.length);
        // Use upsert to handle existing records gracefully
        const { error: seedError } = await supabase.from('standard_documents').upsert(
            MOCK_STANDARD_DOCUMENTS.map(d => ({
                id: d.id,
                name: d.name,
                description: d.description,
                usage_count: d.usageCount,
                created_at: d.createdAt,
                updated_at: d.updatedAt,
                created_by: d.createdBy,
                is_active: d.isActive
            })),
            { onConflict: 'id' }
        );

        if (!seedError) {
            setStandardDocuments(MOCK_STANDARD_DOCUMENTS);
            addNotification('success', 'Restored', 'Standard documents restored to Database.');
        } else {
            console.warn('Failed to restore standard docs (DB Error - Handled):', seedError);

            // FALLBACK: Show them anyway so the user sees them.
            setStandardDocuments(MOCK_STANDARD_DOCUMENTS);

            const msg = seedError?.message || JSON.stringify(seedError) || 'Unknown DB Error';
            addNotification('warning', 'Restored Locally', `DB update failed, but documents loaded for this session.`);
        }
    };

    const createGlobalParticipant = async (participantInput: Omit<GlobalParticipant, 'id' | 'createdAt' | 'updatedAt' | 'invitationStatus'>) => {
        const newId = crypto.randomUUID();
        const newParticipant: GlobalParticipant = {
            id: newId,
            name: participantInput.name,
            email: participantInput.email,
            phone: participantInput.phone,
            agency: participantInput.agency,
            internalNotes: participantInput.internalNotes,
            invitationStatus: 'pending',
            invitationSentAt: undefined, // Not sent yet
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            // Optimistic Update
            setRawGlobalParticipants(prev => [newParticipant, ...prev]);

            // DB Insert
            const { error } = await supabase.from('participants').insert({
                id: newId,
                name: newParticipant.name,
                email: newParticipant.email,
                phone: newParticipant.phone,
                agency: newParticipant.agency,
                internal_notes: newParticipant.internalNotes,
                created_at: newParticipant.createdAt,
                updated_at: newParticipant.updatedAt
            });

            if (error) throw error;

            addNotification('success', 'Participant Added', `${newParticipant.name} has been added to the directory.`);
            return newId;
        } catch (error: any) {
            console.warn('Error creating global participant:', error);
            addNotification('error', 'Failed to add', error.message);
            return null;
        }
    };

    const inviteParticipant = async (email: string, name: string, role: Role) => {
        try {
            console.log('📧 Inviting user:', { email, name, role });

            // Use Next.js API route instead of Edge Function
            const response = await fetch('/api/invite-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    name,
                    role: role,
                    redirectTo: `${window.location.origin}/auth/callback`
                })
            });

            const data = await response.json();
            console.log('📧 Invite response:', { data, status: response.status });

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send invitation');
            }

            // Check if user already exists
            if (data.alreadyExists) {
                console.log('User already registered, assume invite sent/resent or already active.');
            }

            addNotification('success', 'Invitation Sent', `Invitation email sent to ${email}`);
            return true;
        } catch (error: any) {
            console.error('❌ Invite Error:', error);
            addNotification('error', 'Invitation Failed', error.message || 'Unknown error');
            return false;
        }
    };
    const updateGlobalParticipant = (id: string, updates: any) => { };
    const deleteGlobalParticipant = async (id: string) => {
        try {
            // Delete from DB
            const { error } = await supabase.from('participants').delete().eq('id', id);

            if (error) throw error;

            // Update Local State
            setRawGlobalParticipants(prev => prev.filter(p => p.id !== id));

            // Also remove from any deals in local state
            setRawDealParticipants(prev => prev.filter(dp => dp.participantId !== id));

            addNotification('success', 'Participant Deleted', 'The participant has been permanently removed.');
        } catch (error: any) {
            console.warn('Error deleting global participant:', error);
            addNotification('error', 'Failed to delete', error.message);
        }
    };
    const checkDuplicateEmail = (email: string) => {
        // Search in loaded global participants
        return enrichedGlobalParticipants.find(p => p.email.toLowerCase() === email.toLowerCase()) || null;
    };
    const getParticipantDeals = (participantId: string) => [];
    const getRecentParticipants = (days?: number) => [];
    const addParticipantContract = (participantId: string, title: string, uploadedBy: string) => { };
    const deleteParticipantContract = (participantId: string, contractId: string) => { };

    // Notifications - Local only for now
    const addNotification = (type: 'info' | 'success' | 'warning' | 'error', title: string, message: string, link?: string) => {
        const n: Notification = { id: crypto.randomUUID(), type, title, message, link, timestamp: new Date().toISOString(), read: false };
        setNotifications(prev => [n, ...prev]);
    };
    const markAsRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    const markAllAsRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    const value: DataContextType = {
        users,
        activeDeal,
        deals,
        tasks,
        isInitialized,
        createDeal,
        addTask,
        deleteTask,
        setActiveDeal,
        updateDealStep,
        updateCurrentStepId,
        updateDealTimeline,
        updateDealStatus,
        addTaskComment,
        toggleCommentVisibility,
        addUser,
        updateUser,
        deactivateUser,
        deleteUser,
        addParticipant,
        removeParticipant,
        updateParticipant,
        uploadDocument,
        verifyDocument,
        releaseDocument,
        rejectDocument,
        standardDocuments,
        addStandardDocument,
        updateStandardDocument,
        deleteStandardDocument,
        restoreStandardDocuments,
        globalParticipants: enrichedGlobalParticipants || [],
        dealParticipants: rawDealParticipants,
        createGlobalParticipant,
        updateGlobalParticipant,
        deleteGlobalParticipant,
        checkDuplicateEmail,
        inviteParticipant,
        getParticipantDeals,
        getRecentParticipants,
        addParticipantContract,
        deleteParticipantContract,
        logs,
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}
