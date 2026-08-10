'use client';

import { useMemo, useState } from 'react';
import { Lock, Plus, Wallet, Clock, BellRing } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { useFinance } from '@/lib/useFinance';
import { IncomeEntry } from '@/lib/financeTypes';
import { useTranslation, TranslationKey } from '@/lib/useTranslation';
import { catKey, statusKey } from '@/lib/financeLabels';
import RegisterEntryModal from '@/components/finance/RegisterEntryModal';
import ManagerLedger from '@/components/finance/ManagerLedger';
import FinanceOverview from '@/components/finance/FinanceOverview';
import RenewalsPanel from '@/components/finance/RenewalsPanel';

const eur = (n: number) =>
    new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

const myCut = (e: IncomeEntry) =>
    e.lines.reduce((sum, l) => sum + (l.brokerCut ?? 0), 0);

const statusChipClass = (status: IncomeEntry['status']) => {
    switch (status) {
        case 'paid': return 'bg-green-100 text-green-700';
        case 'partially_paid': return 'bg-green-50 text-green-600';
        case 'won': return 'bg-amber-100 text-amber-700';
        case 'lost':
        case 'cancelled': return 'bg-gray-100 text-gray-500';
        default: return 'bg-blue-50 text-blue-600';
    }
};

export default function FinancesPage() {
    const { user, isLoading: authLoading } = useAuth();
    const { t } = useTranslation();
    const { entries, owners, partners, isLoading, financeAccess, registerEntry, confirmEntry, renewEntry, saveEntry, deleteEntry, importEntries, updateStatus } = useFinance();
    const [showRegister, setShowRegister] = useState(false);
    const [managerTab, setManagerTab] = useState<'overview' | 'ledger' | 'renewals'>('overview');

    const stats = useMemo(() => {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const in30 = new Date(now.getTime() + 30 * 864e5);

        let earnedThisMonth = 0;
        let awaiting = 0;
        let renewalsDue = 0;

        for (const e of entries) {
            if (e.status === 'won' || e.status === 'partially_paid') awaiting++;
            if (e.renewalDate) {
                const r = new Date(e.renewalDate);
                if (r >= now && r <= in30) renewalsDue++;
            }
            for (const l of e.lines) {
                if (l.brokerCut && l.receivedDate) {
                    const d = new Date(l.receivedDate);
                    if (d >= monthStart) earnedThisMonth += l.brokerCut;
                }
            }
        }
        return { earnedThisMonth, awaiting, renewalsDue };
    }, [entries]);

    if (authLoading) return null;

    if ((financeAccess ?? 'none') === 'none') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="bg-navy-secondary/10 p-6 rounded-full mb-6">
                    <Lock className="w-16 h-16 text-navy-secondary" />
                </div>
                <h1 className="text-3xl font-playfair font-bold text-navy-primary mb-4">{t('fin.restricted.title')}</h1>
                <p className="text-lg text-text-muted max-w-md">
                    {t('fin.restricted.body')}
                </p>
            </div>
        );
    }

    const isManager = financeAccess === 'all';

    return (
        <div className={`${isManager ? 'max-w-6xl' : 'max-w-4xl'} mx-auto p-6 md:p-8`}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-playfair font-bold text-navy-primary">{t('fin.page.title')}</h1>
                    <p className="text-text-muted text-sm mt-1">
                        {isManager ? t('fin.page.subAll') : t('fin.page.subMine', { name: user?.name?.split(' ')[0] ?? '' })}
                    </p>
                </div>
                <button
                    onClick={() => setShowRegister(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy-primary text-white font-semibold rounded-lg hover:bg-navy-secondary transition-colors shrink-0"
                >
                    <Plus className="w-4 h-4" /> <span className="hidden sm:inline">{t('fin.page.register')}</span><span className="sm:hidden">{t('common.add')}</span>
                </button>
            </div>

            {isManager ? (
                <>
                    <div className="flex gap-1 mb-5 border-b border-gray-200">
                        {(['overview', 'ledger', 'renewals'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setManagerTab(tab)}
                                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize transition-colors ${
                                    managerTab === tab
                                        ? 'border-teal text-navy-primary'
                                        : 'border-transparent text-text-muted hover:text-navy-primary'
                                }`}
                            >
                                {t(`fin.tab.${tab}` as TranslationKey)}
                            </button>
                        ))}
                    </div>
                    {managerTab === 'overview' && <FinanceOverview entries={entries} owners={owners} partners={partners} />}
                    {managerTab === 'ledger' && <ManagerLedger entries={entries} owners={owners} onConfirm={confirmEntry} onSave={saveEntry} onDelete={deleteEntry} onImport={importEntries} onUpdateStatus={updateStatus} />}
                    {managerTab === 'renewals' && <RenewalsPanel entries={entries} owners={owners} showOwner onRenew={renewEntry} />}
                </>
            ) : (
              <>
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-text-muted text-xs mb-1"><Wallet className="w-4 h-4" /> {t('fin.stat.earnedMonth')}</div>
                    <div className="text-2xl font-bold text-navy-primary">{eur(stats.earnedThisMonth)}</div>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-text-muted text-xs mb-1"><Clock className="w-4 h-4" /> {t('fin.stat.awaiting')}</div>
                    <div className="text-2xl font-bold text-navy-primary">{stats.awaiting}</div>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-text-muted text-xs mb-1"><BellRing className="w-4 h-4" /> {t('fin.stat.renewalsDue')}</div>
                    <div className="text-2xl font-bold text-navy-primary">{stats.renewalsDue}</div>
                </div>
            </div>

            {/* Entry list */}
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-text-muted text-sm">{t('fin.loading')}</div>
                ) : entries.length === 0 ? (
                    <div className="p-10 text-center">
                        <p className="text-navy-primary font-semibold mb-1">{t('fin.empty.title')}</p>
                        <p className="text-text-muted text-sm">{t('fin.empty.body')}</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {entries.map((e) => {
                            const cut = myCut(e);
                            return (
                                <li key={e.id} className="flex items-center gap-4 px-5 py-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-navy-primary truncate">
                                            {e.propertyAddress || e.clientName || t(catKey(e.category))}
                                        </p>
                                        <p className="text-xs text-text-muted">
                                            {t(catKey(e.category))}
                                            {e.category === 'insurance' && e.policyType ? ` · ${e.policyType}` : ''}
                                            {e.clientName && e.propertyAddress ? ` · ${e.clientName}` : ''}
                                            {e.category === 'insurance' && e.policyNumber ? ` · №${e.policyNumber}` : ''}
                                            {e.dealDate ? ` · ${new Date(e.dealDate).toLocaleDateString()}` : ''}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        {e.status === 'paid' || e.status === 'partially_paid' ? (
                                            <span className="text-sm font-bold text-green-700">{eur(cut)}</span>
                                        ) : e.expectedAmount ? (
                                            <span className="text-xs text-text-muted">{t('fin.expected', { amount: eur(e.expectedAmount) })}</span>
                                        ) : null}
                                    </div>
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${statusChipClass(e.status)}`}>
                                        {t(statusKey(e.status))}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
            {entries.some((e) => (e.category === 'insurance' && e.renewalDate) || e.status === 'won') && (
                <div className="mt-6">
                    <h2 className="text-lg font-semibold text-navy-primary mb-3">{t('fin.renewalsFollowups')}</h2>
                    <RenewalsPanel entries={entries} owners={owners} showOwner={false} onRenew={renewEntry} />
                </div>
            )}
              </>
            )}

            {showRegister && (
                <RegisterEntryModal onClose={() => setShowRegister(false)} onRegister={registerEntry} />
            )}
        </div>
    );
}
