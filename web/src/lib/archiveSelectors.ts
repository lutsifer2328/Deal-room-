import { Deal, DealDocument, Participant, Task, User } from './types';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** How far ahead the "Expiring Soon" tab looks. */
export const EXPIRY_WINDOW_DAYS = 30;

export interface PendingDocumentItem {
    doc: DealDocument;
    taskId: string;
    taskTitle: string;
    deal: Deal;
}

export interface ExpiringTaskItem {
    taskId: string;
    taskTitle: string;
    deal: Deal;
    task: Task;
    expirationDate: string;
    /** Whole days until expiry. Negative once the date has passed. */
    daysUntilExpiry: number;
    hasDocument: boolean;
}

/**
 * Whole days from today to `date`, comparing calendar days rather than
 * timestamps so a document expiring later today reads as 0, not -1.
 */
function daysFromToday(date: Date): number {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - startOfToday.getTime()) / MS_PER_DAY);
}

/**
 * Documents awaiting a lawyer decision, newest upload first. Closed deals are
 * skipped because nothing on them is actionable.
 */
export function collectPendingDocuments(deals: Deal[], tasks: Task[]): PendingDocumentItem[] {
    const items: PendingDocumentItem[] = [];

    tasks.forEach(task => {
        const deal = deals.find(d => d.id === task.dealId);
        if (!deal || deal.status === 'closed') return;

        task.documents.forEach(doc => {
            if (doc.status === 'private' || doc.status === 'verified') {
                items.push({ doc, taskId: task.id, taskTitle: task.title_en, deal });
            }
        });
    });

    return items.sort((a, b) => {
        const aTime = a.doc.uploadedAt ? new Date(a.doc.uploadedAt).getTime() : 0;
        const bTime = b.doc.uploadedAt ? new Date(b.doc.uploadedAt).getTime() : 0;
        return (isNaN(bTime) ? 0 : bTime) - (isNaN(aTime) ? 0 : aTime);
    });
}

/**
 * Tasks expiring within EXPIRY_WINDOW_DAYS, most overdue first.
 *
 * Already-expired tasks are included rather than filtered out: an expired
 * document on an open deal is the most urgent item on the page, so hiding it
 * would make the problem disappear at exactly the moment it starts to matter.
 */
export function collectExpiringTasks(deals: Deal[], tasks: Task[]): ExpiringTaskItem[] {
    const items: ExpiringTaskItem[] = [];

    tasks.forEach(task => {
        if (!task.expirationDate) return;

        const deal = deals.find(d => d.id === task.dealId);
        if (!deal || deal.status === 'closed') return;

        const expiration = new Date(task.expirationDate);
        if (isNaN(expiration.getTime())) return;

        const daysUntilExpiry = daysFromToday(expiration);
        if (daysUntilExpiry > EXPIRY_WINDOW_DAYS) return;

        items.push({
            taskId: task.id,
            taskTitle: task.title_en,
            deal,
            task,
            expirationDate: task.expirationDate,
            daysUntilExpiry,
            hasDocument: task.documents.length > 0,
        });
    });

    return items.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
}

export type UrgencyLevel = 'expired' | 'critical' | 'soon' | 'upcoming';

export function urgencyOf(daysUntilExpiry: number): UrgencyLevel {
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 7) return 'critical';
    if (daysUntilExpiry <= 14) return 'soon';
    return 'upcoming';
}

/** True when the list contains anything already expired or due within a week. */
export function hasUrgentExpiry(items: ExpiringTaskItem[]): boolean {
    return items.some(item => item.daysUntilExpiry <= 7);
}

/**
 * Resolve the display name of the person who uploaded a document.
 *
 * `uploadedBy` is a user ID: it may point at an internal user (admin/lawyer/staff)
 * or at a deal participant, whose record stores the id under either `userId` or `id`.
 */
export function resolveUploaderName(
    uploadedBy: string | undefined,
    deal: Deal | undefined,
    users: Record<string, User>
): string {
    if (!uploadedBy) return 'Admin';
    const internalUser: User | undefined = users[uploadedBy];
    if (internalUser) return internalUser.name;
    const participant = deal?.participants?.find(
        (p: Participant) => p.userId === uploadedBy || p.id === uploadedBy
    );
    if (participant) return participant.fullName || participant.email || 'Participant';
    return 'Admin';
}

/**
 * Resolve the person to show against a task.
 *
 * Prefers the real uploader of the task's most recent document — that is the
 * person who actually acted. Only when the task has no documents do we fall back
 * to the assignee.
 *
 * `assignedTo` is loosely typed and has three possible forms. Every task in
 * production currently stores an EMAIL, despite the type comment describing a
 * role or participant id — so matching on role alone (as this previously did)
 * never matched anything and every such row rendered as "Unknown". All three
 * forms are tried, most specific first; role is last because it is ambiguous
 * whenever a deal has two participants sharing a role.
 */
export function resolveTaskPersonName(
    task: Task,
    deal: Deal | undefined,
    users: Record<string, User>
): string {
    const latestDoc = latestDocument(task.documents);
    if (latestDoc) return resolveUploaderName(latestDoc.uploadedBy, deal, users);

    const participants = deal?.participants ?? [];
    const assignee =
        participants.find(p => p.id === task.assignedTo || p.userId === task.assignedTo) ??
        participants.find(p => p.email === task.assignedTo) ??
        participants.find(p => p.role === task.assignedTo);
    return assignee?.fullName || assignee?.email || 'Unknown';
}

/** Most recently uploaded document, or undefined when there are none. */
export function latestDocument(documents: DealDocument[] | undefined): DealDocument | undefined {
    if (!documents || documents.length === 0) return undefined;
    return documents.reduce((newest, doc) => {
        const docTime = doc.uploadedAt ? new Date(doc.uploadedAt).getTime() : 0;
        const newestTime = newest.uploadedAt ? new Date(newest.uploadedAt).getTime() : 0;
        return (isNaN(docTime) ? 0 : docTime) > (isNaN(newestTime) ? 0 : newestTime) ? doc : newest;
    });
}

/** Tailwind classes for a document-status badge. */
export function getStatusBadge(status: string): string {
    switch (status) {
        case 'private':
            return 'bg-yellow-100 text-yellow-700';
        case 'verified':
            return 'bg-blue-100 text-blue-700';
        case 'released':
            return 'bg-green-100 text-green-700';
        case 'rejected':
            return 'bg-red-100 text-red-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
}

/** Human-readable label for a document status. */
export function getStatusLabel(status: string): string {
    switch (status) {
        case 'private':
            return 'Private';
        case 'verified':
            return 'Verified';
        case 'released':
            return 'Released';
        case 'rejected':
            return 'Rejected';
        default:
            return status;
    }
}
