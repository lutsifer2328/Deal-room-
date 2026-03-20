'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { supabase } from './supabase';
import { Deal, Task, User, AuditLogEntry, Participant, DealStep, TimelineStep, DealStatus, Role, StandardDocument, GlobalParticipant, DealParticipant, Notification, AgencyContract, DealDocument } from './types';
import { createDefaultTimeline } from './defaultTimeline';
import { MOCK_STANDARD_DOCUMENTS } from './mockStandardDocuments';
import { getPermissionsForRole } from './permissions';
import toast from 'react-hot-toast';
import {
    workflowVerifyDocument,
    workflowRejectDocument,
    workflowReleaseDocument
} from '@/app/actions/document-workflow';

interface DataContextType {
    users: Record<string, User>;
    activeDeal: Deal;
    deals: Deal[];
    tasks: Task[];
    isInitialized: boolean;

    // Actions
    createDeal: (title: string, propertyAddress: string, participants: Omit<Participant, 'id' | 'addedAt'>[], actorId: string, dealNumber?: string, price?: number) => Promise<string>;
    updateDeal: (dealId: string, updates: { title?: string; propertyAddress?: string; price?: number }) => Promise<void>;
    addTask: (dealId: string, title: string, assignedToEmail: string, assignedParticipantId: string, standardDocumentId?: string, expirationDate?: string, customId?: string) => Promise<void>;
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
    deleteDocument: (taskId: string, docId: string, filePath: string) => Promise<void>;

    // Standard Documents Actions
    standardDocuments: StandardDocument[];
    addStandardDocument: (name: string, description: string, createdBy: string) => Promise<string>;
    updateStandardDocument: (id: string, name: string, description: string) => Promise<void>;
    deleteStandardDocument: (id: string) => Promise<void>;
    restoreStandardDocuments: () => Promise<void>;

    // Global Participants Actions
    globalParticipants: GlobalParticipant[];
    rawDealParticipants: DealParticipant[];
    dealParticipants: DealParticipant[];
    createGlobalParticipant: (participant: Omit<GlobalParticipant, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
    updateGlobalParticipant: (id: string, updates: Partial<GlobalParticipant>) => void;
    deleteGlobalParticipant: (id: string) => void;
    checkDuplicateEmail: (email: string) => GlobalParticipant | null;
    inviteParticipant: (dealId: string, email: string, name: string, role: Role, isInternal?: boolean, resend?: boolean) => Promise<boolean>;
    getParticipantDeals: (participantId: string) => Array<{ deal: Deal, dealParticipant: DealParticipant }>;
    getRecentParticipants: (days?: number) => GlobalParticipant[];
    addParticipantContract: (participantId: string, title: string, uploadedBy: string, file: File) => void;
    deleteParticipantContract: (participantId: string, contractId: string) => void;

    // Logs
    logs: AuditLogEntry[];

    // Notifications
    notifications: Notification[];
    addNotification: (type: 'info' | 'success' | 'warning' | 'error', title: string, message: string, link?: string) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    refreshData: () => Promise<void>;
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
    const [rawDocuments, setRawDocuments] = useState<any[]>([]);

    // Refs
    const lastFetchRef = useRef<number>(0);
    const channelRef = useRef<any>(null);
    const [users, setUsers] = useState<Record<string, User>>({});
    const [deals, setDeals] = useState<Deal[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [activeDealId, setActiveDealId] = useState<string>('');
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Fetch Data
    const isFetchingRef = useRef<boolean>(false);
    const fetchData = async () => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        try {
            // ONLY fetch data if the user is authenticated, to prevent 400 error loops on the login page
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (!sessionData.session) {
                console.log('[DEBUG] No active session found. Skipping data fetch structure.');
                setIsInitialized(true); // Let the app load (which will redirect to login)
                return;
            }

            const [
                { data: fetchedUsers },
                { data: fetchedDeals },
                { data: fetchedTasks },
                { data: fetchedGPs },
                { data: fetchedDPs },
                { data: fetchedStdDocs },
                { data: fetchedLogs },
                { data: fetchedContracts },
                { data: fetchedDocuments }
            ] = await Promise.all([
                supabase.from('users').select('*').order('created_at', { ascending: false }),
                supabase.from('deals').select('*'),
                supabase.from('tasks').select('*'), // Removed documents(*) join
                supabase.from('participants').select('*'),
                supabase.from('deal_participants').select('*'),
                supabase.from('standard_documents').select('*'),
                supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(100),
                supabase.from('agency_contracts').select('*'),
                supabase.from('documents').select('*') // Direct fetch
            ]);

            if (fetchedUsers) setRawUsers(fetchedUsers.map(u => ({
                id: u.id,
                email: u.email,
                name: u.name || 'Unknown User',
                role: u.role,
                permissions: getPermissionsForRole(u.role),
                avatarUrl: u.avatar_url,
                isActive: u.is_active !== false,
                createdAt: u.created_at,
                lastLogin: u.last_login
            })));
            if (fetchedDeals) setRawDeals(fetchedDeals);
            if (fetchedTasks) setRawTasks(fetchedTasks);
            if (fetchedDocuments) {
                console.log(`[DEBUG] Fetched ${fetchedDocuments.length} documents from DB.`);
                setRawDocuments(fetchedDocuments);
            }
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
            // Don't filter by is_active for now to ensure visibility
            const validFetchedDocs = (fetchedStdDocs || []).map(d => ({
                id: d.id,
                name: d.name,
                description: d.description,
                usageCount: d.usage_count,
                createdAt: d.created_at,
                updatedAt: d.updated_at,
                createdBy: d.created_by,
                isActive: d.is_active
            }));

            // Use real database documents if available
            if (validFetchedDocs.length > 0) {
                setStandardDocuments(validFetchedDocs);
            } else {
                // If DB is empty, we MUST seed it immediately and wait for it
                console.log('DB missing standard docs. Seeding now...');
                const systemUserId = fetchedUsers && fetchedUsers.length > 0 ? fetchedUsers[0].id : null;

                try {
                    // Await the seed operation so we can show data immediately
                    const { error } = await supabase.from('standard_documents').upsert(
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
                    );

                    if (error) {
                        console.warn('BG Seed Error:', error);
                        // Fallback to mock if seed fails
                        setStandardDocuments(MOCK_STANDARD_DOCUMENTS);
                    } else {
                        console.log('BG Seed Success');
                        // Set state to mock docs since we just inserted them
                        setStandardDocuments(MOCK_STANDARD_DOCUMENTS);
                    }
                } catch (e) {
                    console.error('Seeding exception:', e);
                    setStandardDocuments(MOCK_STANDARD_DOCUMENTS);
                }
            }
            if (fetchedLogs) setLogs(fetchedLogs);
            if (fetchedContracts) setAgencyContracts(fetchedContracts.map((c: any) => ({
                id: c.id,
                participantId: c.participant_id,
                title: c.title,
                url: c.url,
                uploadedBy: c.uploaded_by,
                uploadedAt: c.uploaded_at
            })));

            setIsInitialized(true);
        } catch (error: any) {
            // Gracefully handle signal abortions (common in React Strict Mode or on navigation)
            if (error.name === 'AbortError' || error.message?.includes('AbortError')) {
                console.log('[DEBUG] Data fetch aborted (routine).');
                return;
            }
            console.warn('Error fetching data from Supabase:', error);
        } finally {
            isFetchingRef.current = false;
        }
    };

    useEffect(() => {
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
                    fullName: gp?.name || user?.name || 'Unknown',
                    email: gp?.email || user?.email || '',
                    phone: gp?.phone || '',
                    agency: dp.agency || gp?.agency, // Deal specific agency overrides global
                    role: dp.role,
                    canViewDocuments: dp.permissions?.canViewDocuments || false,
                    canDownload: dp.permissions?.canDownloadDocuments || false,
                    isActive: dp.isActive,
                    isUserActive: user ? user.isActive : true,
                    addedAt: dp.joinedAt,
                    invitationToken: undefined,
                    invitedAt: gp?.invitationSentAt, // Legacy mapping
                    hasAcceptedInvite: gp?.invitationStatus === 'accepted'
                };
            });

            const timeline = d.timeline_json || createDefaultTimeline();
            const currentStepId = d.current_step_id || 'step_1';
            const currentStepObj = timeline.find((t: any) => t.id === currentStepId) || timeline[0] || { label: 'Onboarding' };
            const currentStepVal = currentStepObj.label.toLowerCase().replace(/ /g, '_');

            return {
                id: d.id,
                title: d.title,
                propertyAddress: d.property_address,
                status: d.status,
                closedAt: d.closed_at,
                closedBy: d.closed_by,
                closureNotes: d.closure_notes,
                timeline: timeline,
                currentStepId: currentStepId,
                currentStep: currentStepVal as any, // Dynamically computed from timeline
                participants,
                buyerIds: participants.filter(p => p.role === 'buyer' && p.userId).map(p => p.userId!),
                sellerIds: participants.filter(p => p.role === 'seller' && p.userId).map(p => p.userId!),
                lawyerId: 'u_lawyer', // Mock
                agentId: participants.find(p => p.role === 'agent')?.userId,
                price: d.price ? Number(d.price) : undefined,
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
        const computedTasks: Task[] = rawTasks.map(t => {
            const taskDocs = rawDocuments.filter(d => d.task_id === t.id);
            return {
                id: t.id,
                dealId: t.deal_id,
                title_en: t.title_en,
                title_bg: t.title_bg || t.title_en,
                description_en: t.description_en,
                description_bg: t.description_bg,
                assignedTo: t.assigned_to,
                status: t.status,
                documents: taskDocs.map((d: any) => ({
                    id: d.id,
                    title_en: d.title_en,
                    title_bg: d.title_bg || d.title_en,
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
                expirationDate: t.expiration_date,
                createdAt: t.created_at
            };
        });
        setTasks(computedTasks);

    }, [rawUsers, rawDeals, rawTasks, rawDealParticipants, activeDealId, enrichedGlobalParticipants, rawDocuments]);

    // --- Realtime Subscriptions ---
    useEffect(() => {
        if (!activeDealId) return;

        // Cleanup previous channel if exists
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
        }

        const channel = supabase.channel(`deal-room-${activeDealId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'documents',
                    filter: `deal_id=eq.${activeDealId}`
                },
                (payload) => {
                    console.log('Realtime Document Update:', payload);
                    if (payload.eventType === 'INSERT') {
                        setRawDocuments(prev => {
                            if (prev.find(d => d.id === payload.new.id)) return prev;
                            return [...prev, payload.new];
                        });
                    } else if (payload.eventType === 'UPDATE') {
                        setRawDocuments(prev => prev.map(d => d.id === payload.new.id ? payload.new : d));
                    } else if (payload.eventType === 'DELETE') {
                        setRawDocuments(prev => prev.filter(d => d.id !== payload.old.id));
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tasks',
                    filter: `deal_id=eq.${activeDealId}`
                },
                (payload) => {
                    console.log('Realtime Task Update:', payload);
                    if (payload.eventType === 'INSERT') {
                        setRawTasks(prev => {
                            if (prev.find(t => t.id === payload.new.id)) return prev;
                            return [...prev, payload.new];
                        });
                    } else if (payload.eventType === 'UPDATE') {
                        setRawTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new : t));
                    } else if (payload.eventType === 'DELETE') {
                        setRawTasks(prev => prev.filter(t => t.id !== payload.old.id));
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`Realtime connected for deal ${activeDealId}`);
                } else if (status === 'CHANNEL_ERROR') {
                    console.error(`Realtime channel error for deal ${activeDealId}`);
                } else if (status === 'TIMED_OUT') {
                    console.warn(`Realtime timed out for deal ${activeDealId}`);
                } else if (status === 'CLOSED') {
                    console.warn(`Realtime channel closed for deal ${activeDealId}`);
                }
            });

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [activeDealId]);

    // --- Focus Re-sync ---
    useEffect(() => {
        let focusTimeout: NodeJS.Timeout | null = null;

        const handleFocus = () => {
            if (focusTimeout) clearTimeout(focusTimeout);

            // Debounce the focus event by 500ms to prevent rapid-fire getSession calls
            // that cause Supabase GoTrue to deadlock in localStorage locks.
            focusTimeout = setTimeout(() => {
                const now = Date.now();
                if (now - lastFetchRef.current > 60000) {
                    console.log('Window focus: refreshing data...');
                    fetchData();
                    lastFetchRef.current = now;
                }
            }, 500);
        };

        window.addEventListener('focus', handleFocus);
        return () => {
            window.removeEventListener('focus', handleFocus);
            if (focusTimeout) clearTimeout(focusTimeout);
        };
    }, []); // Safely empty, fetchData is stable

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
        // Optimistic update for UI
        setLogs(prev => [newLog, ...prev]);
        // Server-side audit log via API route (uses service_role to bypass RLS)
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                fetch('/api/audit-log', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({ deal_id: dealId, action, details })
                }).catch(err => console.warn('Audit log API call failed (non-critical):', err));
            }
        } catch (error) {
            console.warn('Failed to send audit log (non-critical):', error);
        }
    };

    // DEBUG: Raw Fetch fallback to bypass client library issues
    const createDeal = async (title: string, propertyAddress: string, participantsInput: Omit<Participant, 'id' | 'addedAt'>[], actorId: string, dealNumber?: string, price?: number) => {
        try {
            const dealId = crypto.randomUUID();
            const defaultTimeline = createDefaultTimeline();
            const validCreatorId = actorId && actorId !== 'unknown' && actorId.length > 20 ? actorId : null;

            // 0. Get Token (Try LocalStorage manually to bypass broken SDK)
            let token: string | undefined;
            // 0. Get Token via SDK (Reliable)
            const { data: { session } } = await supabase.auth.getSession();
            token = session?.access_token;

            if (!token) throw new Error("No session token available! Please sign in again.");

            // 1. Create Deal Payload
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const dealPayload: any = {
                id: dealId,
                title,
                property_address: propertyAddress,
                status: 'active',
                current_step_id: defaultTimeline[0].id,
                timeline_json: defaultTimeline,
                created_at: new Date().toISOString(),
                created_by: validCreatorId,
                price: price || null
            };
            if (dealNumber) { /* dealPayload.crm_id = dealNumber; */ }

            // Optimistic Update
            setRawDeals(prev => [...prev, dealPayload as Deal]);
            setActiveDealId(dealId);

            // 2. RAW FETCH EXECUTION
            console.log('⚡ Attempting CREATE via RAW FETCH...');
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !supabaseAnonKey) {
                throw new Error("Supabase environment variables are not configured correctly.");
            }

            const response = await fetch(`${supabaseUrl}/rest/v1/deals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${token}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(dealPayload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                // Check for AbortError simulation
                if (response.status === 499) throw new Error("Client Closed Request"); // Nginx code for client disconnect

                throw new Error(`DB Error (${response.status}): ${errorText}`);
            }

            // Success (no body due to return=minimal usually, or verify)
            console.log('✅ RAW FETCH SUCCESS');
            const dealError = null; // shim

            // 2. Process Participants sequentially...
            // (Function continues below)

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

                        // Optimistic (Map to camelCase for the UI store array)
                        const optimisticGP = {
                            id: newGP.id,
                            userId: newGP.user_id,
                            email: newGP.email,
                            name: newGP.name,
                            phone: newGP.phone,
                            agency: newGP.agency,
                            internalNotes: newGP.internal_notes,
                            invitationStatus: newGP.invitation_status,
                            invitationSentAt: undefined,
                            createdAt: newGP.created_at,
                            updatedAt: newGP.updated_at
                        };
                        setRawGlobalParticipants(prev => [...prev, optimisticGP as any]);

                        const { error: gpError } = await supabase.from('participants').insert(newGP);
                        if (gpError) {
                            // If user exists (409 Conflict), try to fetch the existing one and link
                            if (gpError.code === '23505' || gpError.code === '409') { // Unique Violation
                                console.log('Participant exists (409), fetching ID...');
                                const { data: existingUser } = await supabase
                                    .from('participants')
                                    .select('id')
                                    .eq('email', p.email)
                                    .single();

                                if (existingUser) {
                                    gpId = existingUser.id;
                                    console.log('Resolved existing participant ID:', gpId);
                                } else {
                                    // Should not happen if 409
                                    throw gpError;
                                }
                            } else {
                                throw gpError;
                            }
                        }
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

                    // Optimistic (Map to camelCase for the UI store array)
                    const optimisticDP = {
                        id: dpPayload.id,
                        dealId: dpPayload.deal_id,
                        participantId: dpPayload.participant_id,
                        role: dpPayload.role,
                        agency: p.agency, // Use from input
                        permissions: dpPayload.permissions,
                        isActive: true, // Required for UI filters
                        joinedAt: dpPayload.joined_at,
                        createdAt: dpPayload.joined_at,
                        updatedAt: dpPayload.joined_at
                    };
                    setRawDealParticipants(prev => [...prev, optimisticDP as any]);

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
        } catch (error: any) {
            console.error('🔥 CRITICAL ERROR IN CREATE_DEAL 🔥', error);
            addNotification('error', 'System Error', error.message || 'Unknown error occurred');
            throw error;
        }
    };

    const addTask = async (dealId: string, title: string, assignedToEmail: string, assignedParticipantId: string, standardDocumentId?: string, expirationDate?: string, customId?: string) => {
        const normalizedAssignedTo = assignedToEmail.toLowerCase().trim();
        const taskId = customId || crypto.randomUUID();

        // No need to lookup participant, we have it explicitly
        // Logic simplified to use passed ID directly
        // const assignedParticipantId = matchedParticipant?.id || null; // <--- REMOVE THIS

        // We ensure assignedParticipantId is passed, or handle if it's empty string/null
        const finalParticipantId = assignedParticipantId || null;

        // We need to construct the "Raw" task (DB shape) for the optimistic update
        // because the main useEffect maps rawTasks (DB shape) to Task (Client shape)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newRawTask: any = {
            id: taskId,
            deal_id: dealId,
            title_en: title,
            title_bg: title, // Fallback
            assigned_to: normalizedAssignedTo,
            assigned_participant_id: finalParticipantId,
            status: 'pending',
            required: true,
            standard_document_id: standardDocumentId,
            expiration_date: expirationDate,
            created_at: new Date().toISOString(),
            documents: [], // DB shape usually has join, but here it's fine
            comments: []
        };

        try {
            const { error } = await supabase.from('tasks').insert({
                id: taskId,
                deal_id: dealId,
                title_en: title,
                title_bg: title,
                assigned_to: normalizedAssignedTo,
                assigned_participant_id: finalParticipantId,
                status: 'pending',
                required: true,
                standard_document_id: standardDocumentId,
                expiration_date: expirationDate,
                created_at: newRawTask.created_at
            });

            if (error) {
                // IDEMPOTENCY CHECK: If conflict (409/23505), check if it's the same task ID
                if (error.code === '23505' || error.code === '409') {
                    console.log('[DEBUG] Task creation 409 Conflict. Checking if task exists...', taskId);

                    // If we passed a customID, we likely double-submitted. 
                    // Verify if the task exists in DB with this ID.
                    const { data: existing } = await supabase.from('tasks').select('id').eq('id', taskId).single();
                    if (existing) {
                        console.log('[DEBUG] Task already exists. Treating as success.');
                        // Ensure local state has it (in case of race where optimistic update missed)
                        setRawTasks(prev => {
                            if (prev.find(t => t.id === taskId)) return prev;
                            return [newRawTask, ...prev];
                        });
                        addNotification('info', 'Task Exists', 'Requirement already created.');
                        return; // Exit success
                    } else {
                        // Conflict was NOT on ID (maybe unique title constraint?)
                        console.warn('[DEBUG] Conflict was NOT on ID. Re-throwing.', error);
                        throw error;
                    }
                }
                throw error;
            }

            // Success path
            setRawTasks(prev => [newRawTask, ...prev]);
            logAction(dealId, 'u_lawyer', 'ADDED_TASK', `Added task "${title}"`);
            addNotification('success', `Task added: ${title} | Задачката е добавена: ${title}`, '');

            if (!finalParticipantId) {
                console.warn(`Task created but assigned_participant_id is NULL (no participant found for email: ${normalizedAssignedTo}). Participant won't see this task until linked.`);
                addNotification('warning', 'Assignment Warning', `No participant found for "${normalizedAssignedTo}". The participant won't see this task until they are invited and linked.`);
            } else {
                // Determine participant name if possible (best effort lookup from local store)
                const matchedParticipant = enrichedGlobalParticipants.find((p: any) => p.id === finalParticipantId);
                const participantName = matchedParticipant?.name || normalizedAssignedTo.split('@')[0];

                // Trigger task notification email
                fetch('/api/notify/task', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        dealId,
                        participantEmail: normalizedAssignedTo,
                        participantName: participantName
                    })
                }).catch(err => console.error('Failed to trigger task notification:', err));
            }
        } catch (error: any) {
            console.error('Failed to add task (FULL ERROR):', JSON.stringify(error, null, 2));
            addNotification('error', 'Failed to create task | Неуспешно създаване на задача', error.message || 'Database error');
            throw error;
        }
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

    const updateDealTimeline = async (dealId: string, timeline: TimelineStep[], actorId: string) => {
        setRawDeals(prev => prev.map(d => d.id === dealId ? { ...d, timeline_json: timeline } : d));
        await supabase.from('deals').update({ timeline_json: timeline }).eq('id', dealId);
        logAction(dealId, actorId, 'UPDATED_TIMELINE', `Updated timeline`);

        // Trigger timeline notification email
        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;

            if (token) {
                // Find all active participants in this deal to notify
                const dealParticipants = rawDealParticipants
                    .filter((dp: any) => dp.deal_id === dealId && dp.is_active);

                // Map to their global participant records to get emails
                const emailsToNotify: { email: string, name: string }[] = [];

                dealParticipants.forEach((dp: any) => {
                    const gp = enrichedGlobalParticipants.find((p: any) => p.id === dp.participant_id);
                    if (gp && gp.email) {
                        emailsToNotify.push({
                            email: gp.email,
                            name: gp.name || gp.email.split('@')[0]
                        });
                    }
                });

                if (emailsToNotify.length > 0) {
                    fetch('/api/notify/timeline', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            dealId,
                            participantEmails: emailsToNotify
                        })
                    }).catch(err => console.error('Failed to trigger timeline notification:', err));
                }
            }
        } catch (e) {
            console.error('Error triggering timeline notification:', e);
        }
    };

    const updateDealStatus = async (dealId: string, status: DealStatus, actorId: string, notes?: string) => {
        try {
            // Optimistic Update
            setRawDeals(prev => prev.map(d => d.id === dealId ? { ...d, status } : d));
            if (activeDealId === dealId) {
                // Force update active deal if needed, though computed should handle it
            }

            const { error } = await supabase.from('deals').update({
                status: status,
                // notes: notes // If we had a notes column
            }).eq('id', dealId);

            if (error) {
                throw error;
            }

            addNotification('success', 'Status Updated', `Deal is now ${status}`);
            logAction(dealId, actorId, 'UPDATED_DEAL_STATUS', `Changed status to ${status}`);

        } catch (error: any) {
            console.error('Failed to update deal status:', error);
            // Revert
            // setRawDeals(...) // Complex to revert without previous state, simplified for now
            addNotification('error', 'Update Failed', error.message);
        }
    };

    const updateDeal = async (dealId: string, updates: { title?: string; propertyAddress?: string; price?: number }) => {
        try {
            // Optimistic Update
            setRawDeals(prev => prev.map(d => d.id === dealId ? {
                ...d,
                ...(updates.title !== undefined && { title: updates.title }),
                ...(updates.propertyAddress !== undefined && { property_address: updates.propertyAddress }),
                ...(updates.price !== undefined && { price: updates.price })
            } : d));

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const dbUpdates: any = {};
            if (updates.title !== undefined) dbUpdates.title = updates.title;
            if (updates.propertyAddress !== undefined) dbUpdates.property_address = updates.propertyAddress;
            if (updates.price !== undefined) dbUpdates.price = updates.price;

            const { error } = await supabase.from('deals').update(dbUpdates).eq('id', dealId);
            if (error) throw error;

            addNotification('success', 'Deal Updated', 'Deal details have been saved.');
        } catch (error: any) {
            console.error('Failed to update deal:', error);
            addNotification('error', 'Update Failed', error.message);
            fetchData(); // Revert by refetching
        }
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
        const tempId = crypto.randomUUID();
        const newUser: User = {
            id: tempId,
            name: fullName,
            email: email,
            role: role,
            permissions: getPermissionsForRole(role),
            createdAt: new Date().toISOString(),
            lastLogin: undefined,
            isActive: true
        };

        try {
            // Optimistic Update
            setRawUsers(prev => [newUser, ...prev]);

            // Call API to invite user (System Invite)
            const response = await fetch('/api/invite-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    fullName,
                    role,
                    isInternal: true,
                    // No dealId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to invite user');
            }

            // Sync with backend immediately to ensure accurate state
            await fetchData();

            addNotification('success', 'User Invited', `${newUser.name} has been invited as a ${newUser.role}.`);
            toast.success(`${newUser.name} has been invited as ${newUser.role}`);
            return data.userId || tempId;

        } catch (error: any) {
            console.error('Error adding user:', error);
            // Rollback
            setRawUsers(prev => prev.filter(u => u.id !== tempId));

            const errorMsg = error.message || 'Unknown error';
            addNotification('error', 'Failed to invite user', errorMsg);
            toast.error(`Failed to invite user: ${errorMsg}`);
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
            toast.success('User details saved');

        } catch (error: any) {
            console.error('Error updating user:', error);
            // Revert would be complex here without deep clone, but for now we just notify
            addNotification('error', 'Update Failed', error.message);
            toast.error(`Update failed: ${error.message}`);
        }
    };
    const deactivateUser = async (userId: string, actorId: string) => {
        try {
            // Optimistic
            setRawUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: false } : u));

            const { error } = await supabase.from('users').update({ is_active: false }).eq('id', userId);
            if (error) throw error;

            addNotification('success', 'User Deactivated', 'Access revoked.');
            toast.success('User deactivated — access revoked');
            logAction(activeDealId, actorId, 'UPDATED_PARTICIPANT', 'Deactivated user');
        } catch (error: any) {
            console.error('Deactivate error:', error);
            setRawUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: true } : u)); // Revert
            addNotification('error', 'Deactivation Failed', error.message);
            toast.error(`Deactivation failed: ${error.message}`);
        }
    };

    const deleteUser = async (userId: string) => {
        try {
            const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            if (data.deactivated) {
                // User was auto-deactivated instead of deleted (has deal associations)
                await fetchData(); // Refresh to show updated status
                addNotification('info', 'User Deactivated', data.message);
                toast.success('User deactivated — they appear as "FORMER STAFF" in their deals');
            } else {
                setRawUsers(prev => prev.filter(u => u.id !== userId));
                addNotification('success', 'User Deleted', 'Permanently removed.');
                toast.success('User permanently deleted');
            }
            return true;
        } catch (error: any) {
            console.error('Delete error:', error);
            addNotification('error', 'Failed to delete', error.message);
            toast.error(`Delete failed: ${error.message}`);
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
            // Find current participant to merge permissions correctly
            const currentDP = rawDealParticipants.find(dp => dp.dealId === dealId && dp.participantId === participantId);
            if (!currentDP) {
                console.warn('Participant not found for update:', participantId);
                return;
            }

            // 1. Update Deal-Specific Data (Role, Permissions)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const dealUpdates: any = {};
            if (updates.role) dealUpdates.role = updates.role;

            if (updates.canViewDocuments !== undefined || updates.canDownload !== undefined || updates.documentPermissions) {
                // Merge with existing permissions
                const currentPerms = currentDP.permissions || {};

                const newPermissions = {
                    canViewDocuments: updates.canViewDocuments !== undefined ? updates.canViewDocuments : currentPerms.canViewDocuments,
                    canDownloadDocuments: updates.canDownload !== undefined ? updates.canDownload : currentPerms.canDownloadDocuments, // Note: Mapped name in DB is often check
                    canViewRoles: updates.documentPermissions?.canViewRoles ?? currentPerms.canViewRoles ?? []
                };

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
                                ...(dp.permissions || {}),
                                canViewDocuments: dealUpdates.permissions?.canViewDocuments ?? dp.permissions?.canViewDocuments ?? false,
                                canDownloadDocuments: dealUpdates.permissions?.canDownloadDocuments ?? dp.permissions?.canDownloadDocuments ?? false,
                                canViewRoles: dealUpdates.permissions?.canViewRoles ?? dp.permissions?.canViewRoles ?? []
                            }
                        };
                    }
                    return dp;
                }));
            }

            // 2. Update Global Data (Name, Email, Phone) - if changed
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        console.log(`[DEBUG] uploadDocument called for task ${taskId}, file: ${file.name}, by: ${uploadedBy}`);
        if (!taskId) {
            addNotification('error', 'Upload Error', 'You must upload a document under a specific task.');
            return;
        }

        try {
            // 1. Upload to Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const filePath = `${activeDealId}/${taskId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file);

            if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);



            // 2. Insert into 'documents' table (Required for Signed URLs)
            const docId = crypto.randomUUID();
            const now = new Date().toISOString();

            // Create Document Object (Optimistic)
            const newDoc: DealDocument = {
                id: docId,
                title_en: file.name,
                title_bg: file.name,
                url: filePath, // Store path, NOT public URL
                uploadedBy: uploadedBy,
                status: 'private',
                uploadedAt: now
            };

            const dbDoc = {
                id: docId,
                deal_id: activeDealId,
                task_id: taskId,
                url: filePath,
                title_en: file.name,
                title_bg: file.name,
                uploaded_by: uploadedBy,
                status: 'private',
                uploaded_at: now
            };

            const { error: insertError } = await supabase
                .from('documents')
                .insert(dbDoc);

            if (insertError) {
                console.error('Failed to insert into documents table:', insertError);
                throw new Error(`DB Insert failed: ${insertError.message}`);
            }

            // --- TEMP DISABLED FOR DEBUGGING LAG ---
            // 3. Update parent task to pending_review
            // const { error: taskError } = await supabase
            //     .from('tasks')
            //     .update({ status: 'pending_review' })
            //     .eq('id', taskId);
            //
            // if (taskError) {
            //     console.error('Failed to update task status:', taskError);
            // }
            // ----------------------------------------

            // 4. Optimistic Update (Raw Documents & Tasks)
            setRawDocuments(prev => [...prev, dbDoc]);
            setRawTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'pending_review' } : t));

            addNotification('success', 'Document uploaded to vault | Документът е качен в трезора', '');
            logAction(activeDealId, uploadedBy, 'UPLOADED_DOC', file.name);
            console.log('[DEBUG] Document inserted successfully:', dbDoc);

        } catch (error: any) {
            console.error('Upload error:', error);
            addNotification('error', 'Upload failed: File too large | Неуспешно качване: Файлът е твърде голям', error.message);
        }
    };

    const updateLocalDocRow = (docId: string, updates: any) => {
        setRawDocuments(prev => prev.map(d => d.id === docId ? { ...d, ...updates } : d));
    };

    const deleteDocument = async (taskId: string, docId: string, filePath: string) => {
        // Optimistic: remove doc and revert task if no docs remain
        setRawDocuments(prev => {
            const remaining = prev.filter(d => d.id !== docId);
            const taskDocCount = remaining.filter(d => d.task_id === taskId).length;
            if (taskDocCount === 0) {
                setRawTasks(t => t.map(task => task.id === taskId ? { ...task, status: 'pending' } : task));
            }
            return remaining;
        });

        try {
            const { error: storageError } = await supabase.storage
                .from('documents')
                .remove([filePath]);
            if (storageError) throw storageError;

            const { error: dbError } = await supabase
                .from('documents')
                .delete()
                .eq('id', docId);
            if (dbError) throw dbError;

            addNotification('success', 'Document removed | Документът е премахнат', '');
        } catch (error: any) {
            await fetchData();
            addNotification('error', 'Delete failed | Неуспешно изтриване', error.message);
        }
    };

    const verifyDocument = async (actorId: string, taskId: string, docId: string) => {
        // Optimistic update
        updateLocalDocRow(docId, { status: 'verified', verified_at: new Date().toISOString() });
        setRawTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));

        try {
            await workflowVerifyDocument(docId, activeDealId);
            logAction(activeDealId, actorId, 'VERIFIED_DOC', `Verified document`);
        } catch (error: any) {
            console.error('Verify failed:', error);
            addNotification('error', 'Verify Failed', error.message);
            // Revert? (Ideally yes, but let's rely on refresh/realtime correction for now)
            fetchData();
        }
    };

    const releaseDocument = async (actorId: string, taskId: string, docId: string) => {
        // Optimistic
        updateLocalDocRow(docId, { status: 'released' });
        setRawTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));

        try {
            await workflowReleaseDocument(docId, activeDealId);
            logAction(activeDealId, actorId, 'RELEASED_DOC', `Released document`);
        } catch (error: any) {
            console.error('Release failed:', error);
            addNotification('error', 'Release Failed', error.message);
            fetchData();
        }
    };

    const rejectDocument = async (actorId: string, taskId: string, docId: string, reasonEn: string, reasonBg: string) => {
        // Optimistic
        updateLocalDocRow(docId, {
            status: 'rejected',
            rejection_reason_en: reasonEn,
            rejection_reason_bg: reasonBg
        });

        try {
            await workflowRejectDocument(docId, activeDealId, reasonEn, reasonBg);
            logAction(activeDealId, actorId, 'REJECTED_DOC', `Rejected document: ${reasonEn}`);
        } catch (error: any) {
            console.error('Reject failed:', error);
            addNotification('error', 'Reject Failed', error.message);
            fetchData();
        }
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

        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
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

                if (error) throw error;

                // Success
                setStandardDocuments(prev => [...prev, newDoc]);
                addNotification('success', 'Document Added', 'New standard document created.');
                return id;

            } catch (err: any) {
                attempts++;
                console.warn(`Attempt ${attempts} failed:`, err);

                if (attempts === maxAttempts) {
                    addNotification('error', 'Failed to add', err.message || 'Network error');
                    return '';
                }

                // Wait before retrying (exponential backoff: 500ms, 1000ms, 2000ms)
                await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempts - 1)));
            }
        }
        return '';
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

    const inviteParticipant = async (dealId: string, email: string, name: string, role: Role, isInternal: boolean = false, resend: boolean = false) => {
        try {
            console.log('📧 Inviting user via /api/participants/invite:', { dealId, email, name, role, resend });

            if (!dealId) throw new Error('Deal ID is required to invite user');

            const response = await fetch('/api/participants/invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    dealId,
                    email,
                    name,
                    participantRole: role,
                    resend
                })
            });

            const data = await response.json();
            console.log('📧 Invite response:', { data, status: response.status });

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send invitation');
            }

            // Always show success (idempotent endpoint)
            const toastMsg = data.message === 'resent'
                ? `Invitation resent to ${email}`
                : data.message === 'already-linked'
                    ? `${email} is already linked — invite resent`
                    : `Invitation sent to ${email}`;
            addNotification('success', 'Invite sent successfully | Поканата е изпратена успешно', toastMsg);

            // Optimistically update the UI to show the 'Resend' state internally
            setRawGlobalParticipants(prev => prev.map(p => {
                if (p.email.toLowerCase() === email.toLowerCase()) {
                    return {
                        ...p,
                        invitationSentAt: new Date().toISOString(),
                        invitationStatus: (resend ? 'resent' : 'invited') as "invited" | "resent" | "pending" | "accepted" | "declined"
                    };
                }
                return p;
            }));

            // Then asynchronously fetch true data from server to guarantee sync
            fetchData();

            return true;
        } catch (error: any) {
            console.error('❌ Invite Error:', error);
            addNotification('error', 'Error sending invite | Грешка при изпращане на поканата', error.message || 'Unknown error');
            return false;
        }
    };
    const updateGlobalParticipant = async (id: string, updates: any) => {
        try {
            // Map camelCase to snake_case for DB
            const dbUpdates: Record<string, any> = {};
            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.email !== undefined) dbUpdates.email = updates.email;
            if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
            if (updates.agency !== undefined) dbUpdates.agency = updates.agency;
            if (updates.internalNotes !== undefined) dbUpdates.internal_notes = updates.internalNotes;
            if (updates.invitationStatus !== undefined) dbUpdates.invitation_status = updates.invitationStatus;
            dbUpdates.updated_at = new Date().toISOString();

            const { error } = await supabase.from('participants').update(dbUpdates).eq('id', id);
            if (error) throw error;

            // Optimistic local update
            setRawGlobalParticipants(prev => prev.map(p =>
                p.id === id ? { ...p, ...updates, updatedAt: dbUpdates.updated_at } : p
            ));
        } catch (error: any) {
            console.warn('Error updating global participant:', error);
            addNotification('error', 'Update Failed', error.message);
        }
    };
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
    const getParticipantDeals = (participantId: string) => {
        const participantDealLinks = rawDealParticipants.filter(dp => dp.participantId === participantId);
        return participantDealLinks.map(dp => {
            const deal = deals.find(d => d.id === dp.dealId);
            return { deal: deal!, dealParticipant: dp };
        }).filter(item => item.deal !== undefined);
    };
    const getRecentParticipants = (days: number = 30) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        return enrichedGlobalParticipants
            .filter(p => new Date(p.createdAt) >= cutoffDate)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    };
    const addParticipantContract = async (participantId: string, title: string, uploadedBy: string, file: File) => {
        try {
            const contractId = crypto.randomUUID();
            const filePath = `contracts/${participantId}/${Date.now()}_${file.name}`;

            // 1. Upload file to Storage
            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const newContract: AgencyContract = {
                id: contractId,
                participantId,
                title,
                uploadedBy,
                url: filePath,
                uploadedAt: new Date().toISOString()
            };

            // 2. Insert metadata into DB
            const { error: dbError } = await supabase.from('agency_contracts').insert({
                id: newContract.id,
                participant_id: participantId,
                title,
                uploaded_by: uploadedBy,
                url: filePath,
                uploaded_at: newContract.uploadedAt
            });

            if (dbError) throw dbError;

            // Optimistic local update
            setAgencyContracts(prev => [...prev, newContract]);
            addNotification('success', 'Contract Uploaded', `"${title}" has been added successfully.`);
        } catch (error: any) {
            console.warn('Error adding contract:', error);
            addNotification('error', 'Upload Failed', error.message);
        }
    };
    const deleteParticipantContract = async (participantId: string, contractId: string) => {
        try {
            const { error } = await supabase.from('agency_contracts').delete().eq('id', contractId);
            if (error) throw error;

            // Optimistic local update
            setAgencyContracts(prev => prev.filter(c => c.id !== contractId));
            addNotification('success', 'Contract Deleted', 'The contract has been removed.');
        } catch (error: any) {
            console.warn('Error deleting contract:', error);
            addNotification('error', 'Delete Failed', error.message);
        }
    };

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
        updateDeal,
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
        deleteDocument,
        standardDocuments,
        addStandardDocument,
        updateStandardDocument,
        deleteStandardDocument,
        restoreStandardDocuments,
        globalParticipants: enrichedGlobalParticipants || [],
        rawDealParticipants: rawDealParticipants,
        dealParticipants: rawDealParticipants, // Alias or distinct depending on future
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
        markAllAsRead,
        refreshData: fetchData
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
