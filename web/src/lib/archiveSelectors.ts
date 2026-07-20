import { Deal, DealDocument, Role, Task } from './types';

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
    assignedTo: Role | string;
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
            assignedTo: task.assignedTo,
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
