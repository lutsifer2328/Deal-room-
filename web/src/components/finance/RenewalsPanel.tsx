'use client';

import { useMemo, useState } from 'react';
import { RefreshCw, AlertTriangle, Clock } from 'lucide-react';
import { IncomeEntry } from '@/lib/financeTypes';
import { OwnerInfo } from '@/lib/useFinance';
import { useTranslation } from '@/lib/useTranslation';
import { catKey } from '@/lib/financeLabels';

interface RenewalsPanelProps {
    entries: IncomeEntry[];
    owners: Record<string, OwnerInfo>;
    showOwner: boolean;
    onRenew: (entry: IncomeEntry) => Promise<{ error: string | null }>;
}

const DAY = 864e5;
const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const daysBetween = (a: Date, b: Date) => Math.round((a.getTime() - b.getTime()) / DAY);

export default function RenewalsPanel({ entries, owners, showOwner, onRenew }: RenewalsPanelProps) {
    const { t } = useTranslation();
    const [busyId, setBusyId] = useState<string | null>(null);

    const data = useMemo(() => {
        const today = startOfToday();
        const in30 = new Date(today.getTime() + 30 * DAY);
        // A policy is "renewed" if some entry points back to it via renewed_from.
        const renewed = new Set<string>();
        entries.forEach((e) => { if (e.renewedFrom) renewed.add(e.renewedFrom); });

        const insurance = entries.filter((e) => e.category === 'insurance' && e.renewalDate);
        const dueSoon: IncomeEntry[] = [];
        const overdue: IncomeEntry[] = [];
        let dueTotal = 0, renewedCount = 0;

        insurance.forEach((e) => {
            const r = new Date(e.renewalDate!);
            const isRenewed = renewed.has(e.id);
            if (r <= today) { dueTotal++; if (isRenewed) renewedCount++; }
            if (isRenewed) return;
            if (r < today) overdue.push(e);
            else if (r <= in30) dueSoon.push(e);
        });
        overdue.sort((a, b) => (a.renewalDate! < b.renewalDate! ? -1 : 1));
        dueSoon.sort((a, b) => (a.renewalDate! < b.renewalDate! ? -1 : 1));

        // Pipeline aging: still-unpaid 'won' entries older than 30 days.
        const aging = entries
            .filter((e) => e.status === 'won' && e.dealDate && daysBetween(today, new Date(e.dealDate)) > 30)
            .sort((a, b) => (a.dealDate! < b.dealDate! ? -1 : 1));

        const retention = dueTotal ? Math.round((renewedCount / dueTotal) * 100) : null;
        return { dueSoon, overdue, aging, retention, dueTotal, renewedCount };
    }, [entries]);

    const renew = async (e: IncomeEntry) => {
        setBusyId(e.id);
        await onRenew(e);
        setBusyId(null);
    };

    const card = 'bg-white border border-gray-100 rounded-xl p-5';
    const ownerName = (e: IncomeEntry) => owners[e.ownerId]?.name ?? '';

    const renewalRow = (e: IncomeEntry, overdue: boolean) => {
        const r = new Date(e.renewalDate!);
        const days = daysBetween(r, startOfToday());
        return (
            <li key={e.id} className="flex items-center gap-3 py-2.5">
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-navy-primary truncate">{e.clientName ?? t('fin.renew.policyFallback')}</p>
                    <p className="text-xs text-text-muted">
                        {r.toLocaleDateString()}
                        {overdue ? ` · ${t('fin.renew.overdueDays', { days: Math.abs(days) })}` : ` · ${t('fin.renew.inDays', { days })}`}
                        {showOwner && ownerName(e) ? ` · ${ownerName(e)}` : ''}
                    </p>
                </div>
                <button
                    onClick={() => renew(e)}
                    disabled={busyId === e.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-teal border border-teal/40 rounded-lg hover:bg-teal/5 disabled:opacity-50 shrink-0"
                >
                    <RefreshCw className="w-3.5 h-3.5" /> {busyId === e.id ? t('fin.renew.renewing') : t('fin.renew.registerRenewal')}
                </button>
            </li>
        );
    };

    return (
        <div className="space-y-4">
            {data.retention != null && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-white border border-gray-100 rounded-xl p-4">
                        <div className="text-xs text-text-muted mb-1">{t('fin.renew.retention')}</div>
                        <div className="text-2xl font-bold text-navy-primary">{data.retention}%</div>
                        <div className="text-xs text-text-muted">{t('fin.renew.renewedOf', { done: data.renewedCount, total: data.dueTotal })}</div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl p-4">
                        <div className="text-xs text-text-muted mb-1">{t('fin.renew.dueNext30')}</div>
                        <div className="text-2xl font-bold text-navy-primary">{data.dueSoon.length}</div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl p-4">
                        <div className="text-xs text-text-muted mb-1">{t('fin.renew.overdue')}</div>
                        <div className="text-2xl font-bold text-navy-primary">{data.overdue.length}</div>
                    </div>
                </div>
            )}

            <div className={card}>
                <p className="text-sm font-medium text-navy-primary mb-1 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" /> {t('fin.renew.overdueTitle')}
                </p>
                {data.overdue.length === 0 ? (
                    <p className="text-text-muted text-sm py-2">{t('fin.renew.nothingOverdue')}</p>
                ) : (
                    <ul className="divide-y divide-gray-50">{data.overdue.map((e) => renewalRow(e, true))}</ul>
                )}
            </div>

            <div className={card}>
                <p className="text-sm font-medium text-navy-primary mb-1 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal" /> {t('fin.renew.dueSoonTitle')}
                </p>
                {data.dueSoon.length === 0 ? (
                    <p className="text-text-muted text-sm py-2">{t('fin.renew.nothingDueSoon')}</p>
                ) : (
                    <ul className="divide-y divide-gray-50">{data.dueSoon.map((e) => renewalRow(e, false))}</ul>
                )}
            </div>

            <div className={card}>
                <p className="text-sm font-medium text-navy-primary mb-1">{t('fin.renew.awaitingTooLong')}</p>
                <p className="text-xs text-text-muted mb-2">{t('fin.renew.awaitingDesc')}</p>
                {data.aging.length === 0 ? (
                    <p className="text-text-muted text-sm py-2">{t('fin.renew.nothingStuck')}</p>
                ) : (
                    <ul className="divide-y divide-gray-50">
                        {data.aging.map((e) => {
                            const days = daysBetween(startOfToday(), new Date(e.dealDate!));
                            return (
                                <li key={e.id} className="flex items-center gap-3 py-2.5">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-navy-primary truncate">
                                            {e.propertyAddress || e.clientName || t(catKey(e.category))}
                                        </p>
                                        <p className="text-xs text-text-muted">
                                            {t(catKey(e.category))} · {t('fin.renew.daysWaiting', { days })}
                                            {showOwner && ownerName(e) ? ` · ${ownerName(e)}` : ''}
                                        </p>
                                    </div>
                                    {e.expectedAmount != null && (
                                        <span className="text-xs text-text-muted">
                                            {t('fin.expected', { amount: new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(e.expectedAmount) })}
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
