'use client';

import { useMemo, useState } from 'react';
import { useData } from './store';

// Inverts the staff workflow from "go look in the tabs" to "the app tells you".
// One shared computation feeds the sidebar/bottom-nav badge and the
// dashboard-pro "needs attention" strip, all from data already in the store.

const EXPIRING_WINDOW_DAYS = 7;
const STALE_AFTER_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface DealAttention {
    dealId: string;
    dealTitle: string;
    propertyAddress: string;
    /** Documents with status private/verified waiting on staff (mirrors PendingReviewTab). */
    pendingReviewCount: number;
    /** Open tasks whose expiration date falls within the next 7 days. */
    expiringCount: number;
    /** True when nothing has happened on the deal for 14+ days. */
    isStale: boolean;
    staleDays: number;
}

export interface NeedsAttention {
    /** Total documents awaiting review across all non-closed deals (nav badge). */
    pendingReviewTotal: number;
    expiringTotal: number;
    staleTotal: number;
    /** Deals with at least one signal, most urgent first. */
    attentionDeals: DealAttention[];
}

export function useNeedsAttention(): NeedsAttention {
    const { deals, tasks, logs } = useData();
    // Time snapshot from mount — all the math here is day-granularity, so a
    // slightly stale "now" within a session is fine and keeps the memo pure.
    const [now] = useState(() => Date.now());

    return useMemo(() => {
        const expiryCutoff = now + EXPIRING_WINDOW_DAYS * DAY_MS;

        const attentionDeals: DealAttention[] = [];
        let pendingReviewTotal = 0;
        let expiringTotal = 0;
        let staleTotal = 0;

        for (const deal of deals) {
            if (!deal.id || deal.status === 'closed') continue;

            const dealTasks = tasks.filter(tk => tk.dealId === deal.id);

            let pendingReviewCount = 0;
            let expiringCount = 0;
            let lastActivity = new Date(deal.createdAt || 0).getTime() || 0;

            for (const tk of dealTasks) {
                lastActivity = Math.max(lastActivity, new Date(tk.createdAt || 0).getTime() || 0);

                if (tk.expirationDate && tk.status !== 'completed') {
                    const exp = new Date(tk.expirationDate).getTime();
                    if (!isNaN(exp) && exp >= now && exp <= expiryCutoff) expiringCount++;
                }

                for (const doc of tk.documents) {
                    if (doc.status === 'private' || doc.status === 'verified') pendingReviewCount++;
                    lastActivity = Math.max(
                        lastActivity,
                        new Date(doc.uploadedAt || 0).getTime() || 0,
                        new Date(doc.verifiedAt || 0).getTime() || 0
                    );
                }
            }

            // Audit logs capture everything else (status changes, participant edits, …).
            // The store only keeps the latest 100, so this is best-effort — fine here,
            // because missing log entries can only make lastActivity OLDER (more stale),
            // and recent activity is exactly what the recent logs do cover.
            for (const log of logs) {
                if ((log as { dealId?: string; deal_id?: string }).dealId === deal.id ||
                    (log as { dealId?: string; deal_id?: string }).deal_id === deal.id) {
                    lastActivity = Math.max(lastActivity, new Date(log.timestamp || 0).getTime() || 0);
                }
            }

            const staleDays = lastActivity > 0 ? Math.floor((now - lastActivity) / DAY_MS) : 0;
            const isStale = deal.status === 'active' && staleDays >= STALE_AFTER_DAYS;

            pendingReviewTotal += pendingReviewCount;
            expiringTotal += expiringCount;
            if (isStale) staleTotal++;

            if (pendingReviewCount > 0 || expiringCount > 0 || isStale) {
                attentionDeals.push({
                    dealId: deal.id,
                    dealTitle: deal.title,
                    propertyAddress: deal.propertyAddress,
                    pendingReviewCount,
                    expiringCount,
                    isStale,
                    staleDays
                });
            }
        }

        // Most urgent first: pending reviews outrank expiries, expiries outrank staleness.
        attentionDeals.sort((a, b) =>
            (b.pendingReviewCount - a.pendingReviewCount) ||
            (b.expiringCount - a.expiringCount) ||
            (Number(b.isStale) - Number(a.isStale)) ||
            (b.staleDays - a.staleDays)
        );

        return { pendingReviewTotal, expiringTotal, staleTotal, attentionDeals };
    }, [deals, tasks, logs, now]);
}
