'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Deal, Task, User, AuditLogEntry, Participant, DealStep, TimelineStep, DealStatus, Role, StandardDocument } from './types';
import * as InitialData from './mockData';
import { MOCK_STANDARD_DOCUMENTS } from './mockStandardDocuments';
import { createDefaultTimeline } from './defaultTimeline';
import { getPermissionsForRole } from './permissions';

interface DataContextType {
    users: Record<string, User>;
    activeDeal: Deal;
    deals: Deal[];
    tasks: Task[];

    // Actions
    createDeal: (title: string, propertyAddress: string, participants: Omit<Participant, 'id' | 'addedAt'>[], dealNumber?: string) => string;
    addTask: (title: string, assignedTo: string, standardDocumentId?: string, expirationDate?: string) => void;
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
    addStandardDocument: (name: string, description: string, createdBy: string) => string;
    updateStandardDocument: (id: string, name: string, description: string) => void;
    deleteStandardDocument: (id: string) => void;

    // Logs
    logs: AuditLogEntry[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
    const [users, setUsers] = useState<Record<string, User>>(InitialData.MOCK_USERS);

    const [deals, setDeals] = useState<Deal[]>([InitialData.MOCK_DEAL]);

    const [tasks, setTasks] = useState<Task[]>(InitialData.MOCK_TASKS);

    const [activeDealId, setActiveDealId] = useState<string>(InitialData.MOCK_DEAL.id);

    const [logs, setLogs] = useState<AuditLogEntry[]>([]);

    const [standardDocuments, setStandardDocuments] = useState<StandardDocument[]>(MOCK_STANDARD_DOCUMENTS);

    // Persist to localStorage
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('agenzia_deals', JSON.stringify(deals));
        }
    }, [deals]);

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('agenzia_tasks', JSON.stringify(tasks));
        }
    }, [tasks]);

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('agenzia_activeDealId', activeDealId);
        }
    }, [activeDealId]);

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('agenzia_standardDocuments', JSON.stringify(standardDocuments));
        }
    }, [standardDocuments]);

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
        participants.forEach(p => {
            const userId = `u_${p.role}_${Date.now()}_${Math.random()}`;
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
        });

        setUsers(newUsers);

        // Create Deal
        const buyerIds = participants.filter(p => p.role === 'buyer').map((_, i) => `u_buyer_${Date.now()}_${i}`);
        const sellerIds = participants.filter(p => p.role === 'seller').map((_, i) => `u_seller_${Date.now()}_${i}`);
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

        logAction(newDeal.id, 'u_lawyer', 'CREATED_DEAL', `Started deal "${title}" with ${participants.length} participants`);

        return newDeal.id;
    };

    const addTask = (title: string, assignedTo: string, standardDocumentId?: string, expirationDate?: string) => {
        const newTask: Task = {
            id: `t_${Date.now()}`,
            dealId: activeDealId,
            title_en: title,
            title_bg: title + ' (BG Translation Needed)', // Mock translation
            assignedTo: assignedTo as any,
            status: 'pending',
            required: true,
            documents: [],
            comments: [],
            standardDocumentId,
            expirationDate: expirationDate || undefined
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

        logAction(activeDeal.id, 'u_lawyer', 'ADDED_TASK', `Added task "${title}" for ${assignedTo}`);
    };

    const addParticipant = (dealId: string, participantInput: Omit<Participant, 'id' | 'addedAt'>) => {
        const newParticipant: Participant = {
            ...participantInput,
            id: `p_${Date.now()}_${Math.random()}`,
            addedAt: new Date().toISOString()
        };

        setDeals(deals.map(d =>
            d.id === dealId
                ? { ...d, participants: [...d.participants, newParticipant] }
                : d
        ));
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
        updateDocStatus(taskId, docId, { status: 'released' });
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
    const addStandardDocument = (name: string, description: string, createdBy: string): string => {
        // Check for duplicate names (case-insensitive)
        const duplicate = standardDocuments.find(
            doc => doc.isActive && doc.name.toLowerCase() === name.toLowerCase()
        );
        if (duplicate) {
            throw new Error('A standard document with this name already exists');
        }

        const newDoc: StandardDocument = {
            id: `std-doc-${Date.now()}`,
            name,
            description,
            usageCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy,
            isActive: true
        };

        setStandardDocuments([...standardDocuments, newDoc]);
        return newDoc.id;
    };

    const updateStandardDocument = (id: string, name: string, description: string) => {
        // Check for duplicate names (case-insensitive), excluding current document
        const duplicate = standardDocuments.find(
            doc => doc.isActive && doc.id !== id && doc.name.toLowerCase() === name.toLowerCase()
        );
        if (duplicate) {
            throw new Error('A standard document with this name already exists');
        }

        setStandardDocuments(standardDocuments.map(doc =>
            doc.id === id
                ? { ...doc, name, description, updatedAt: new Date().toISOString() }
                : doc
        ));
    };

    const deleteStandardDocument = (id: string) => {
        // Soft delete - set isActive to false
        setStandardDocuments(standardDocuments.map(doc =>
            doc.id === id
                ? { ...doc, isActive: false, updatedAt: new Date().toISOString() }
                : doc
        ));
    };

    return (
        <DataContext.Provider value={{
            users, activeDeal, deals, tasks, logs,
            createDeal, addTask, setActiveDeal, updateDealStep, updateCurrentStepId, updateDealTimeline, updateDealStatus, addTaskComment, toggleCommentVisibility,
            addUser, updateUser, deactivateUser,
            addParticipant,
            removeParticipant,
            updateParticipant,
            uploadDocument,
            verifyDocument, releaseDocument, rejectDocument,
            standardDocuments,
            addStandardDocument,
            updateStandardDocument,
            deleteStandardDocument
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
