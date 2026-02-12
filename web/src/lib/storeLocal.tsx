'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Deal, Task, User, AuditLogEntry, Participant, DealStep, TimelineStep, DealStatus, Role, StandardDocument, GlobalParticipant, DealParticipant, Notification } from './types';
import * as InitialData from './mockData';
import { MOCK_STANDARD_DOCUMENTS } from './mockStandardDocuments';
import { MOCK_GLOBAL_PARTICIPANTS } from './mockGlobalParticipants';
import { MOCK_DEAL_PARTICIPANTS } from './mockDealParticipants';
import { createDefaultTimeline } from './defaultTimeline';
import { getPermissionsForRole } from './permissions';

interface DataContextType {
    users: Record<string, User>;
    activeDeal: Deal;
    deals: Deal[];
    tasks: Task[];
    isInitialized: boolean;

    // Actions
    createDeal: (title: string, propertyAddress: string, participants: Omit<Participant, 'id' | 'addedAt'>[], dealNumber?: string) => string;
    addTask: (dealId: string, title: string, assignedTo: string, standardDocumentId?: string, expirationDate?: string) => Promise<void>;
    deleteTask: (taskId: string, actorId: string) => void;
    setActiveDeal: (dealId: string) => void;
    updateDealStep: (dealId: string, step: DealStep, actorId: string) => void;
    updateCurrentStepId: (dealId: string, stepId: string, actorId: string) => void;
    updateDealTimeline: (dealId: string, timeline: TimelineStep[], actorId: string) => void;
    updateDealStatus: (dealId: string, status: DealStatus, actorId: string, notes?: string) => void;
    addTaskComment: (taskId: string, authorId: string, authorName: string, text: string) => void;
    toggleCommentVisibility: (taskId: string, commentId: string) => void;

    // User Management Actions
    addUser: (fullName: string, email: string, role: Role) => string;
    updateUser: (userId: string, updates: Partial<User>) => void;
    deactivateUser: (userId: string, actorId: string) => void;

    // Participant Actions
    addParticipant: (dealId: string, participant: Omit<Participant, 'id' | 'addedAt'>) => void;
    removeParticipant: (dealId: string, participantId: string) => void;
    updateParticipant: (dealId: string, participantId: string, updates: Partial<Participant>) => void;

    // Doc Actions
    uploadDocument: (taskId: string, fileName: string, uploadedBy: string) => void;
    verifyDocument: (actorId: string, taskId: string, docId: string) => void;
    releaseDocument: (actorId: string, taskId: string, docId: string) => void;
    rejectDocument: (actorId: string, taskId: string, docId: string, reasonEn: string, reasonBg: string) => void;

    // Standard Documents Actions
    standardDocuments: StandardDocument[];
    addStandardDocument: (name: string, description: string, createdBy: string) => Promise<string>;
    updateStandardDocument: (id: string, name: string, description: string) => Promise<void>;
    deleteStandardDocument: (id: string) => Promise<void>;
    restoreStandardDocuments: () => Promise<void>;

    // Global Participants Actions
    globalParticipants: GlobalParticipant[];
    dealParticipants: DealParticipant[];
    createGlobalParticipant: (participant: Omit<GlobalParticipant, 'id' | 'createdAt' | 'updatedAt'>) => string;
    updateGlobalParticipant: (id: string, updates: Partial<GlobalParticipant>) => void;
    deleteGlobalParticipant: (id: string) => void;
    checkDuplicateEmail: (email: string) => GlobalParticipant | null;
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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
    // Shared loading state
    const [isInitialized, setIsInitialized] = useState(false);

    const [users, setUsers] = useState<Record<string, User>>(InitialData.MOCK_USERS);

    // Initialize with safe defaults for SSR
    const [deals, setDeals] = useState<Deal[]>([InitialData.MOCK_DEAL]);
    const [tasks, setTasks] = useState<Task[]>(InitialData.MOCK_TASKS);
    const [activeDealId, setActiveDealId] = useState<string>(InitialData.MOCK_DEAL.id);
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [standardDocuments, setStandardDocuments] = useState<StandardDocument[]>(MOCK_STANDARD_DOCUMENTS);
    const [globalParticipants, setGlobalParticipants] = useState<GlobalParticipant[]>(MOCK_GLOBAL_PARTICIPANTS);
    const [dealParticipants, setDealParticipants] = useState<DealParticipant[]>(MOCK_DEAL_PARTICIPANTS);

    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: 'n1',
            type: 'info',
            title: 'New Deal Assigned',
            message: 'You have been assigned to the "Luxury Apartment in Lozenets" deal.',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
            read: false,
            link: '/deal/d_123'
        },
        {
            id: 'n2',
            type: 'warning',
            title: 'Document Expiring Soon',
            message: 'The "Cadastral Sketch" for "Sunny Beach Villa" expires in 3 days.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            read: false
        },
        {
            id: 'n3',
            type: 'success',
            title: 'Deal Closed',
            message: 'The "City Center Office" deal has been successfully closed.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
            read: true,
            link: '/archive'
        }
    ]);

    // Hydrate from LocalStorage on mount
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedDeals = localStorage.getItem('agenzia_deals');
            if (savedDeals) setDeals(JSON.parse(savedDeals));

            const savedTasks = localStorage.getItem('agenzia_tasks');
            if (savedTasks) setTasks(JSON.parse(savedTasks));

            const savedActiveDealId = localStorage.getItem('agenzia_activeDealId');
            if (savedActiveDealId) setActiveDealId(savedActiveDealId);

            const savedStandardDocs = localStorage.getItem('agenzia_standardDocuments');
            if (savedStandardDocs) setStandardDocuments(JSON.parse(savedStandardDocs));

            const savedGlobalParticipants = localStorage.getItem('agenzia_globalParticipants');
            if (savedGlobalParticipants) setGlobalParticipants(JSON.parse(savedGlobalParticipants));

            const savedDealParticipants = localStorage.getItem('agenzia_dealParticipants');
            if (savedDealParticipants) setDealParticipants(JSON.parse(savedDealParticipants));

            const savedUsers = localStorage.getItem('agenzia_users');
            if (savedUsers) {
                // Merge saved users with initial mock users to ensure admin always exists
                // but saved users take precedence
                setUsers({ ...InitialData.MOCK_USERS, ...JSON.parse(savedUsers) });
            }

            setIsInitialized(true);
        }
    }, []);

    const addNotification = (type: 'info' | 'success' | 'warning' | 'error', title: string, message: string, link?: string) => {
        const newNotification: Notification = {
            id: `n_${Date.now()}`,
            type,
            title,
            message,
            timestamp: new Date().toISOString(),
            read: false,
            link
        };
        setNotifications(prev => [newNotification, ...prev]);
    };

    const markAsRead = (id: string) => {
        setNotifications(notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
        ));
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    // Persist to localStorage
    React.useEffect(() => {
        if (typeof window !== 'undefined' && isInitialized) {
            localStorage.setItem('agenzia_deals', JSON.stringify(deals));
        }
    }, [deals, isInitialized]);

    React.useEffect(() => {
        if (typeof window !== 'undefined' && isInitialized) {
            localStorage.setItem('agenzia_users', JSON.stringify(users));
        }
    }, [users, isInitialized]);

    React.useEffect(() => {
        if (typeof window !== 'undefined' && isInitialized) {
            localStorage.setItem('agenzia_tasks', JSON.stringify(tasks));
        }
    }, [tasks, isInitialized]);

    React.useEffect(() => {
        if (typeof window !== 'undefined' && isInitialized) {
            localStorage.setItem('agenzia_activeDealId', activeDealId);
        }
    }, [activeDealId, isInitialized]);

    React.useEffect(() => {
        if (typeof window !== 'undefined' && isInitialized) {
            localStorage.setItem('agenzia_standardDocuments', JSON.stringify(standardDocuments));
        }
    }, [standardDocuments, isInitialized]);

    React.useEffect(() => {
        if (typeof window !== 'undefined' && isInitialized) {
            localStorage.setItem('agenzia_globalParticipants', JSON.stringify(globalParticipants));
        }
    }, [globalParticipants, isInitialized]);

    React.useEffect(() => {
        if (typeof window !== 'undefined' && isInitialized) {
            localStorage.setItem('agenzia_dealParticipants', JSON.stringify(dealParticipants));
        }
    }, [dealParticipants, isInitialized]);

    const activeDeal = deals.find(d => d.id === activeDealId) || deals[0];

    const logAction = (dealId: string, actorId: string, action: AuditLogEntry['action'], details: string) => {
        const actor = users[actorId];
        const newLog: AuditLogEntry = {
            id: `log_${Date.now()}_${Math.random()}`,
            dealId,
            actorId,
            actorName: actor ? actor.name : 'Unknown User',
            action,
            details,
            timestamp: new Date().toISOString()
        };
        setLogs(prev => [newLog, ...prev]);
    };

    const createDeal = (title: string, propertyAddress: string, participantsInput: Omit<Participant, 'id' | 'addedAt'>[], dealNumber?: string) => {
        // Create Participant objects with IDs
        const participants: Participant[] = participantsInput.map(p => ({
            ...p,
            id: `p_${Date.now()}_${Math.random()}`,
            addedAt: new Date().toISOString()
        }));

        // Create corresponding User records for new participants
        const newUsers = { ...users };

        // Update participants with their new User IDs
        participants.forEach(p => {
            // Generate a User ID if one doesn't exist
            const userId = p.userId || `u_${p.role}_${Date.now()}_${Math.random()}`;
            p.userId = userId; // CRITICAL: Link participant to user

            if (!newUsers[userId]) {
                newUsers[userId] = {
                    id: userId,
                    name: p.fullName,
                    email: p.email,
                    role: p.role,
                    avatarUrl: `/avatars/${p.role}.png`,
                    permissions: getPermissionsForRole(p.role),
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    lastLogin: undefined
                };
            }
        });

        setUsers(newUsers);

        // Create Deal
        const buyerIds = participants.filter(p => p.role === 'buyer').map(p => p.userId!);
        const sellerIds = participants.filter(p => p.role === 'seller').map(p => p.userId!);
        const lawyerId = 'u_lawyer'; // Current user

        const defaultTimeline = createDefaultTimeline();

        const newDeal: Deal = {
            id: `d_${Date.now()}`,
            dealNumber: dealNumber || undefined,
            title,
            propertyAddress,
            status: 'active',
            timeline: defaultTimeline,
            currentStepId: defaultTimeline[0].id,
            currentStep: 'onboarding',
            participants,
            buyerIds,
            sellerIds,
            lawyerId,
            createdAt: new Date().toISOString()
        };

        setDeals([...deals, newDeal]);
        setActiveDealId(newDeal.id);

        // ===== SYNC WITH GLOBAL PARTICIPANTS SYSTEM =====
        // For each participant, check if they exist globally, if not create them
        const newGlobalParticipants = [...globalParticipants];
        const newDealParticipants = [...dealParticipants];

        participants.forEach(p => {
            // Check if global participant already exists by email
            let globalParticipant = newGlobalParticipants.find(
                gp => gp.email.toLowerCase().trim() === p.email.toLowerCase().trim()
            );

            // If not exists, create new global participant
            if (!globalParticipant) {
                globalParticipant = {
                    id: `gp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: p.fullName,
                    email: p.email,
                    phone: p.phone || undefined,
                    invitationStatus: p.hasAcceptedInvite ? 'accepted' : 'pending',
                    invitationSentAt: p.invitedAt || new Date().toISOString(),
                    invitationAcceptedAt: p.hasAcceptedInvite ? new Date().toISOString() : undefined,
                    internalNotes: '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                newGlobalParticipants.push(globalParticipant);
            }

            // Create DealParticipant link
            const dealParticipantLink: DealParticipant = {
                id: `dp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                dealId: newDeal.id,
                participantId: globalParticipant.id,
                role: p.role,
                permissions: {
                    canViewDocuments: p.canViewDocuments,
                    canDownloadDocuments: p.canDownload,
                    canUploadDocuments: true,
                    canViewTimeline: true
                },
                joinedAt: new Date().toISOString(),
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            newDealParticipants.push(dealParticipantLink);
        });

        // Update state
        setGlobalParticipants(newGlobalParticipants);
        setDealParticipants(newDealParticipants);

        logAction(newDeal.id, 'u_lawyer', 'CREATED_DEAL', `Started deal "${title}" with ${participants.length} participants`);

        return newDeal.id;
    };

    const addTask = async (dealId: string, title: string, assignedTo: string, standardDocumentId?: string, expirationDate?: string) => {
        const newTask: Task = {
            id: `t_${Date.now()}`,
            dealId: dealId,
            title_en: title,
            title_bg: title + ' (BG Translation Needed)', // Mock translation
            assignedTo: assignedTo,
            status: 'pending',
            required: true,
            documents: [],
            comments: [],
            standardDocumentId,
            expirationDate: expirationDate || undefined,
            createdAt: new Date().toISOString()
        };
        setTasks([newTask, ...tasks]);

        // Increment usage count if standard document was used
        if (standardDocumentId) {
            setStandardDocuments(standardDocuments.map(doc =>
                doc.id === standardDocumentId
                    ? { ...doc, usageCount: doc.usageCount + 1, updatedAt: new Date().toISOString() }
                    : doc
            ));
        }

        logAction(activeDeal.id, 'u_lawyer', 'ADDED_TASK', `Added task "${title}"`);
    };

    const deleteTask = (taskId: string, actorId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        setTasks(tasks.filter(t => t.id !== taskId));
        logAction(activeDeal.id, actorId, 'REMOVED_TASK', `Removed task "${task.title_en}"`);
    };

    const addParticipant = (dealId: string, participantInput: Omit<Participant, 'id' | 'addedAt'>) => {
        // Create random ID for participant entry
        const newId = `p_${Date.now()}_${Math.random()}`;

        // Check if a user with this email already exists
        const existingUser = Object.values(users).find(
            u => u.email.toLowerCase().trim() === participantInput.email.toLowerCase().trim()
        );

        // Determine final User ID and Internal Status
        let finalUserId: string;
        let isInternalStaff = false;

        if (existingUser) {
            // Case 1: Active User found by email
            finalUserId = existingUser.id;
            if (['admin', 'lawyer', 'staff'].includes(existingUser.role)) {
                isInternalStaff = true;
            }
        } else if (participantInput.userId) {
            // Case 2: Explicit User ID provided (e.g. from dropdown)
            finalUserId = participantInput.userId;
            const u = users[finalUserId];
            if (u && ['admin', 'lawyer', 'staff'].includes(u.role)) {
                isInternalStaff = true;
            }
        } else {
            // Case 3: New User needed
            finalUserId = `u_${participantInput.role}_${Date.now()}_${Math.random()}`;
        }

        const newParticipant: Participant = {
            ...participantInput,
            id: newId,
            userId: finalUserId, // CRITICAL: Link participant to user
            // If they are internal staff, set agency to Agenzia automatically if missing
            agency: isInternalStaff ? (participantInput.agency || 'Agenzia') : participantInput.agency,
            addedAt: new Date().toISOString()
        };

        // Create user record ONLY if it doesn't exist
        if (!users[finalUserId]) {
            setUsers({
                ...users,
                [finalUserId]: {
                    id: finalUserId,
                    name: participantInput.fullName,
                    email: participantInput.email,
                    role: participantInput.role,
                    avatarUrl: `/avatars/${participantInput.role}.png`,
                    permissions: getPermissionsForRole(participantInput.role),
                    isActive: true,
                    createdAt: new Date().toISOString()
                }
            });
        }

        setDeals(deals.map(d =>
            d.id === dealId
                ? { ...d, participants: [...d.participants, newParticipant] }
                : d
        ));

        // ===== SYNC WITH GLOBAL PARTICIPANTS SYSTEM =====
        // Check if global participant already exists by email
        let globalParticipant = globalParticipants.find(
            gp => gp.email.toLowerCase().trim() === participantInput.email.toLowerCase().trim()
        );

        // If not exists, create new global participant
        if (!globalParticipant) {
            globalParticipant = {
                id: `gp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId: finalUserId, // Link to internal user
                name: participantInput.fullName,
                email: participantInput.email,
                phone: participantInput.phone || undefined,
                agency: participantInput.agency, // Store agency for external brokers
                invitationStatus: participantInput.hasAcceptedInvite ? 'accepted' : 'pending',
                invitationSentAt: participantInput.invitedAt || new Date().toISOString(),
                invitationAcceptedAt: participantInput.hasAcceptedInvite ? new Date().toISOString() : undefined,
                internalNotes: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            // If they are an internal user, mark invitation as accepted
            if (participantInput.userId) {
                globalParticipant.invitationStatus = 'accepted';
                globalParticipant.invitationAcceptedAt = new Date().toISOString();
            }
            setGlobalParticipants([...globalParticipants, globalParticipant]);
        }

        // Check if this participant is already linked to this deal
        const existingLink = dealParticipants.find(
            dp => dp.dealId === dealId && dp.participantId === globalParticipant.id && dp.isActive
        );

        if (!existingLink) {
            // Create DealParticipant link only if it doesn't exist
            const dealParticipantLink: DealParticipant = {
                id: `dp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                dealId: dealId,
                participantId: globalParticipant.id,
                role: participantInput.role,
                agency: participantInput.agency, // Specific agency for this deal
                permissions: {
                    canViewDocuments: participantInput.canViewDocuments,
                    canDownloadDocuments: participantInput.canDownload,
                    canUploadDocuments: true,
                    canViewTimeline: true
                },
                joinedAt: new Date().toISOString(),
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            setDealParticipants([...dealParticipants, dealParticipantLink]);
        }
    };

    const removeParticipant = (dealId: string, participantId: string) => {
        setDeals(deals.map(d =>
            d.id === dealId
                ? {
                    ...d, participants: d.participants.map(p =>
                        p.id === participantId ? { ...p, isActive: false } : p
                    )
                }
                : d
        ));
    };

    const updateParticipant = (dealId: string, participantId: string, updates: Partial<Participant>) => {
        setDeals(deals.map(d =>
            d.id === dealId
                ? {
                    ...d,
                    participants: d.participants.map(p =>
                        p.id === participantId ? { ...p, ...updates } : p
                    )
                }
                : d
        ));
        logAction(activeDealId, 'u_lawyer', 'UPDATED_PARTICIPANT', `Updated participant: ${updates.fullName || 'details'}`);
    };

    const setActiveDeal = (dealId: string) => setActiveDealId(dealId);

    const updateDealStep = (dealId: string, step: DealStep, actorId: string) => {
        setDeals(deals.map(d =>
            d.id === dealId ? { ...d, currentStep: step } : d
        ));

        const stepLabels = {
            'onboarding': 'Onboarding',
            'documents': 'Documents',
            'preliminary_contract': 'Preliminary Contract',
            'final_review': 'Final Review',
            'closing': 'Closing'
        };
        logAction(dealId, actorId, 'UPDATED_DEAL_STEP', `Moved deal to ${stepLabels[step]} phase`);
    };

    const updateCurrentStepId = (dealId: string, stepId: string, actorId: string) => {
        setDeals(deals.map(d => {
            if (d.id === dealId) {
                const step = d.timeline.find(s => s.id === stepId);
                if (step) {
                    logAction(dealId, actorId, 'UPDATED_DEAL_STEP', `Changed phase to ${step.label}`);
                    return { ...d, currentStepId: stepId };
                }
            }
            return d;
        }));
    };

    const updateDealTimeline = (dealId: string, timeline: TimelineStep[], actorId: string) => {
        setDeals(deals.map(d => {
            if (d.id === dealId) {
                // Ensure current step is still valid
                const currentStepStillExists = timeline.find(s => s.id === d.currentStepId);
                return {
                    ...d,
                    timeline,
                    currentStepId: currentStepStillExists ? d.currentStepId : timeline[0].id
                };
            }
            return d;
        }));

        logAction(dealId, actorId, 'UPDATED_TIMELINE', `Updated deal timeline to ${timeline.length} steps`);
    };

    const updateDealStatus = (dealId: string, status: DealStatus, actorId: string, notes?: string) => {
        setDeals(deals.map(d => {
            if (d.id === dealId) {
                const updates: Partial<Deal> = { status };

                if (status === 'closed') {
                    updates.closedAt = new Date().toISOString();
                    updates.closedBy = actorId;
                    updates.closureNotes = notes;
                } else {
                    // Reopening or changing from on_hold
                    updates.closedAt = undefined;
                    updates.closedBy = undefined;
                    updates.closureNotes = undefined;
                }

                return { ...d, ...updates };
            }
            return d;
        }));

        const statusLabels = {
            active: 'Active',
            on_hold: 'On Hold',
            closed: 'Closed'
        };

        const detail = notes
            ? `Changed deal status to ${statusLabels[status]} - ${notes}`
            : `Changed deal status to ${statusLabels[status]}`;

        logAction(dealId, actorId, 'UPDATED_DEAL_STATUS', detail);
    };

    // User Management Actions
    const addUser = (fullName: string, email: string, role: Role): string => {
        const userId = `u_${role}_${Date.now()}_${Math.random()}`;
        const newUser: User = {
            id: userId,
            name: fullName,
            email,
            role,
            avatarUrl: `/avatars/${role}.png`,
            permissions: getPermissionsForRole(role),
            isActive: true,
            createdAt: new Date().toISOString(),
            lastLogin: undefined
        };
        setUsers({ ...users, [userId]: newUser });
        return userId;
    };

    const updateUser = (userId: string, updates: Partial<User>) => {
        const user = users[userId];
        if (!user) return;

        // If role is being updated, update permissions too
        if (updates.role && updates.role !== user.role) {
            updates.permissions = getPermissionsForRole(updates.role);
        }

        setUsers({
            ...users,
            [userId]: { ...user, ...updates }
        });
    };

    const deactivateUser = (userId: string, actorId: string) => {
        const user = users[userId];
        if (!user) return;

        setUsers({
            ...users,
            [userId]: { ...user, isActive: false }
        });

        // Log the action
        const detail = `Deactivated user ${user.name} (${user.email})`;
        logAction('system', actorId, 'UPDATED_DEAL_STATUS', detail); // Reusing action type for now
    };

    const addTaskComment = (taskId: string, authorId: string, authorName: string, text: string) => {
        const newComment = {
            id: `c_${Date.now()}`,
            authorId,
            authorName,
            text,
            timestamp: new Date().toISOString(),
            isVisibleToAll: true  // Default to visible
        };

        setTasks(tasks.map(t =>
            t.id === taskId
                ? { ...t, comments: [...(t.comments || []), newComment] }
                : t
        ));

        logAction(activeDealId, authorId, 'ADDED_COMMENT', `Left comment on task: "${text.substring(0, 50)}..."`);
    };

    const toggleCommentVisibility = (taskId: string, commentId: string) => {
        setTasks(tasks.map(t =>
            t.id === taskId
                ? {
                    ...t,
                    comments: t.comments.map(c =>
                        c.id === commentId
                            ? { ...c, isVisibleToAll: !c.isVisibleToAll }
                            : c
                    )
                }
                : t
        ));
    };

    // Document Handlers
    const uploadDocument = (taskId: string, fileName: string, uploadedBy: string) => {
        const newDoc = {
            id: `doc_${Date.now()}_${Math.random()}`,
            title_en: fileName,
            title_bg: fileName,
            url: '#',
            uploadedBy,
            status: 'private' as const,
            uploadedAt: new Date().toISOString()
        };

        setTasks(tasks.map(t =>
            t.id === taskId
                ? { ...t, documents: [...t.documents, newDoc], status: 'in_review' as const }
                : t
        ));

        logAction(activeDealId, uploadedBy, 'UPLOADED_DOC', `Uploaded document: ${fileName}`);

        // Find Task Name for better notification
        const taskName = tasks.find(t => t.id === taskId)?.title_en || 'Document Requirement';
        const actor = users[uploadedBy];
        const actorName = actor ? actor.name : 'Unknown User';

        // Notify
        addNotification(
            'info',
            'Document Uploaded',
            `${actorName} uploaded "${fileName}" for ${taskName}.`,
            `/deal/${activeDealId}`
        );
    };

    const updateDocStatus = (taskId: string, docId: string, updates: Partial<any>) => {
        setTasks(prev => prev.map(t => {
            if (t.id !== taskId) return t;
            return {
                ...t,
                documents: t.documents.map(d => {
                    if (d.id !== docId) return d;
                    return { ...d, ...updates };
                })
            }
        }));
    };

    const verifyDocument = (actorId: string, taskId: string, docId: string) => {
        updateDocStatus(taskId, docId, { status: 'verified', verifiedAt: new Date().toISOString() });
        logAction(activeDealId, actorId, 'VERIFIED_DOC', `Verified document ${docId}`);
    };

    const releaseDocument = (actorId: string, taskId: string, docId: string) => {
        // Update doc status
        updateDocStatus(taskId, docId, { status: 'released' });

        // Also mark the task as COMPLETED since the document is released
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, status: 'completed' } : t
        ));

        logAction(activeDealId, actorId, 'RELEASED_DOC', `Released document ${docId} for download`);
    };

    const rejectDocument = (actorId: string, taskId: string, docId: string, reasonEn: string, reasonBg: string) => {
        updateDocStatus(taskId, docId, {
            status: 'rejected',
            rejectionReason_en: reasonEn,
            rejectionReason_bg: reasonBg
        });
        logAction(activeDealId, actorId, 'REJECTED_DOC', `Rejected document with reason: ${reasonEn}`);
    };

    // Standard Documents Actions
    const addStandardDocument = async (name: string, description: string, createdBy: string): Promise<string> => {
        const id = crypto.randomUUID();
        const newDoc: StandardDocument = {
            id,
            name,
            description,
            usageCount: 0,
            createdBy,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        setStandardDocuments(prev => [...prev, newDoc]);
        return id;
    };

    const updateStandardDocument = async (id: string, name: string, description: string): Promise<void> => {
        setStandardDocuments(prev => prev.map(doc =>
            doc.id === id
                ? { ...doc, name, description, updatedAt: new Date().toISOString() }
                : doc
        ));
    };

    const deleteStandardDocument = async (id: string): Promise<void> => {
        setStandardDocuments(prev => prev.map(doc =>
            doc.id === id
                ? { ...doc, isActive: false, updatedAt: new Date().toISOString() }
                : doc
        ));
    };

    const restoreStandardDocuments = async (): Promise<void> => {
        setStandardDocuments(MOCK_STANDARD_DOCUMENTS);
    };

    // ===== GLOBAL PARTICIPANTS FUNCTIONS =====

    const createGlobalParticipant = (participant: Omit<GlobalParticipant, 'id' | 'createdAt' | 'updatedAt'>): string => {
        const newParticipant: GlobalParticipant = {
            ...participant,
            id: `gp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        setGlobalParticipants([...globalParticipants, newParticipant]);
        return newParticipant.id;
    };

    const updateGlobalParticipant = (id: string, updates: Partial<GlobalParticipant>) => {
        setGlobalParticipants(globalParticipants.map(p =>
            p.id === id
                ? { ...p, ...updates, updatedAt: new Date().toISOString() }
                : p
        ));
    };

    const deleteGlobalParticipant = (id: string) => {
        // Remove from global participants
        setGlobalParticipants(prev => prev.filter(p => p.id !== id));
        // Remove from deal links
        setDealParticipants(prev => prev.filter(dp => dp.participantId !== id));
    };

    const checkDuplicateEmail = (email: string): GlobalParticipant | null => {
        const normalized = email.toLowerCase().trim();
        return globalParticipants.find(p => p.email.toLowerCase().trim() === normalized) || null;
    };

    const getParticipantDeals = (participantId: string): Array<{ deal: Deal, dealParticipant: DealParticipant }> => {
        const participantDealLinks = dealParticipants.filter(dp => dp.participantId === participantId);

        return participantDealLinks.map(dp => {
            const deal = deals.find(d => d.id === dp.dealId);
            return { deal: deal!, dealParticipant: dp };
        }).filter(item => item.deal !== undefined);
    };

    const getRecentParticipants = (days: number = 30): GlobalParticipant[] => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return globalParticipants
            .filter(p => new Date(p.createdAt) >= cutoffDate)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    };

    // Contracts
    const addParticipantContract = (participantId: string, title: string, uploadedBy: string, file: File) => {
        setGlobalParticipants(prev => prev.map(p => {
            if (p.id !== participantId) return p;

            const newContract: import('./types').AgencyContract = {
                id: `cont_${Date.now()}_${Math.random()}`,
                participantId,
                title,
                uploadedBy,
                url: '#', // Mock URL
                uploadedAt: new Date().toISOString()
            };

            return {
                ...p,
                contracts: [...(p.contracts || []), newContract],
                updatedAt: new Date().toISOString()
            };
        }));

        logAction('system', uploadedBy, 'UPDATED_PARTICIPANT', `Uploaded contract "${title}" for participant`);
    };

    const deleteParticipantContract = (participantId: string, contractId: string) => {
        setGlobalParticipants(prev => prev.map(p => {
            if (p.id !== participantId) return p;

            return {
                ...p,
                contracts: (p.contracts || []).filter(c => c.id !== contractId),
                updatedAt: new Date().toISOString()
            };
        }));
    };

    return (
        <DataContext.Provider value={{
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
            addUser,
            updateUser,
            deactivateUser,
            addParticipant,
            removeParticipant,
            updateParticipant,
            uploadDocument,
            verifyDocument,
            releaseDocument,
            rejectDocument,
            addTaskComment,
            toggleCommentVisibility,
            logs,
            // Standard Documents
            standardDocuments,
            addStandardDocument,
            updateStandardDocument,
            deleteStandardDocument,
            restoreStandardDocuments,
            // Global Participants
            globalParticipants,
            dealParticipants,
            createGlobalParticipant,
            updateGlobalParticipant,
            deleteGlobalParticipant,
            checkDuplicateEmail,
            getParticipantDeals,
            getRecentParticipants,
            addParticipantContract,
            deleteParticipantContract,
            // Notifications
            notifications,
            addNotification,
            markAsRead,
            markAllAsRead
        }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}
