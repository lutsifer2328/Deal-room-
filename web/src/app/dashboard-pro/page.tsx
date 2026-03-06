'use client';

import { useData } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import {
    Building, Calendar, TrendingUp, Activity,
    AlertCircle, Clock, ChevronRight, Layers, Plus
} from 'lucide-react';
import { useState, useMemo } from 'react';
import DealStatusBadge from '@/components/deal/DealStatusBadge';
import CreateDealWizard from '@/components/deal/CreateDealWizard';
import { useTranslation } from '@/lib/useTranslation';
import { Deal } from '@/lib/types';
import PullToRefresh from 'react-simple-pull-to-refresh';

// ─── Utilities ───────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
    if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `€${(value / 1_000).toFixed(0)}K`;
    return `€${value.toLocaleString('en-US')}`;
}

function getStepLabel(step: string) {
    return step?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN';
}

// ─── Executive Pulse Card ─────────────────────────────────────────────────────

function PulseCard({
    icon: Icon,
    label,
    value,
    sub,
    accentColor,
    href,
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    sub?: string;
    accentColor: string; // Tailwind text color class for the icon & value
    href?: string;
}) {
    const router = useRouter();

    return (
        <div
            onClick={href ? () => router.push(href) : undefined}
            className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-3 hover:shadow-md transition-all duration-200 h-full ${href ? 'cursor-pointer hover:border-teal/30' : ''}`}
        >
            {/* Icon */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accentColor === 'text-teal' ? 'bg-teal/10' : accentColor === 'text-amber-500' ? 'bg-amber-50' : accentColor === 'text-blue-600' ? 'bg-blue-50' : 'bg-purple-50'}`}>
                <Icon className={`w-5 h-5 ${accentColor}`} />
            </div>

            {/* Value */}
            <div className="flex-1">
                <div className={`text-3xl font-serif font-bold tracking-tight text-navy-primary`}>
                    {value}
                </div>
                <div className="text-sm font-semibold text-text-secondary mt-0.5">{label}</div>
                {sub && <div className="text-xs text-text-light mt-1">{sub}</div>}
            </div>

            {href && (
                <div className={`flex items-center gap-1 text-xs font-bold ${accentColor} opacity-70`}>
                    {label === 'Urgent Actions' ? 'View in Approvals' : 'View Registry'} <ChevronRight className="w-3 h-3" />
                </div>
            )}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type StatusFilter = 'active' | 'on_hold' | 'closed';

export default function DashboardProPage() {
    const { deals, tasks, refreshData } = useData();
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const { t } = useTranslation();
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // ── Computed Stats ────────────────────────────────────────────────────────

    const stats = useMemo(() => {
        const activeDeals = deals.filter(d => d.status === 'active' || d.status === 'on_hold');
        const portfolioVolume = activeDeals.reduce((sum, d) => sum + (d.price ?? 0), 0);

        // Mirrors PendingReviewTab.tsx exactly:
        // count all documents across all active deals where doc.status is 'private' or 'verified'
        let urgentCount = 0;
        tasks.forEach(task => {
            const deal = deals.find(d => d.id === task.dealId);
            if (!deal || deal.status === 'closed') return;
            task.documents.forEach(doc => {
                if (doc.status === 'private' || doc.status === 'verified') {
                    urgentCount++;
                }
            });
        });

        return {
            portfolioVolume,
            activePipeline: activeDeals.length,
            urgentActions: urgentCount,
        };
    }, [deals, tasks]);

    const tabs: { id: StatusFilter; label: string }[] = [
        { id: 'active', label: t('dashboard.tab.active') },
        { id: 'on_hold', label: t('dashboard.tab.onHold') },
        { id: 'closed', label: t('dashboard.tab.closed') },
    ];

    const filteredDeals = deals.filter(d => d.status === statusFilter);

    if (isLoading) {
        return <div className="p-20 text-center text-gray-500">Loading...</div>;
    }

    return (
        <div className="bg-[#f8fafc] min-h-screen">
            <PullToRefresh
                onRefresh={refreshData}
                pullingContent={
                    <div className="flex justify-center p-4">
                        <div className="w-8 h-8 rounded-full border-2 animate-spin border-[#14b8a6] border-t-transparent"></div>
                    </div>
                }
                refreshingContent={
                    <div className="flex justify-center p-4">
                        <div className="w-8 h-8 rounded-full border-2 animate-spin border-[#14b8a6] border-t-transparent"></div>
                    </div>
                }
            >
                <div className="max-w-7xl mx-auto py-8 px-4">

                    {/* ── Header ──────────────────────────────────────────────────── */}
                    <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 rounded-lg bg-teal/10 flex items-center justify-center">
                                    <Layers className="w-4 h-4 text-teal" />
                                </div>
                                <span className="text-xs font-bold text-teal uppercase tracking-widest">
                                    {t('dashboardPro.operationsLabel')}
                                </span>
                            </div>
                            <h1 className="text-4xl font-serif font-bold text-navy-primary mb-1">{t('dashboardPro.pulseTitle')}</h1>
                            <p className="text-text-secondary text-base">
                                {t('dashboardPro.pulseSubtitle')} &middot; {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </p>
                        </div>

                        <div className="flex gap-3 w-full md:w-auto">
                            {user?.permissions?.canCreateDeals && (
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-teal to-teal/90 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300"
                                >
                                    <Plus className="w-5 h-5" />
                                    {t('deals.newDeal')}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── Executive Pulse Cards ────────────────────────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10 items-stretch">
                        <div className="sticky top-20 z-30 md:static drop-shadow-xl md:drop-shadow-none h-full">
                            <PulseCard
                                icon={TrendingUp}
                                label={t('dashboardPro.totalVolume')}
                                value={stats.portfolioVolume > 0 ? formatCurrency(stats.portfolioVolume) : '—'}
                                sub={t('dashboardPro.totalVolumeSub')}
                                accentColor="text-teal"
                            />
                        </div>
                        <PulseCard
                            icon={Activity}
                            label={t('dashboardPro.activePipeline')}
                            value={stats.activePipeline}
                            sub={`${deals.filter(d => d.status === 'on_hold').length} ${t('dashboardPro.dealsOnHold')}`}
                            accentColor="text-blue-600"
                        />
                        <PulseCard
                            icon={AlertCircle}
                            label={t('dashboardPro.urgentActions')}
                            value={stats.urgentActions}
                            sub={t('dashboardPro.urgentActionsSub')}
                            accentColor="text-amber-500"
                            href="/archive?tab=pending"
                        />
                        <PulseCard
                            icon={Clock}
                            label={t('dashboardPro.closingSoon')}
                            value="—"
                            sub={t('dashboardPro.closingSoonSub')}
                            accentColor="text-purple-500"
                        />
                    </div>

                    {/* ── Deal Registry ─────────────────────────────────────────────── */}

                    {/* Status Tabs — identical to /dashboard */}
                    <div className="mb-8 overflow-x-auto pb-2 no-scrollbar">
                        <div className="flex gap-4 p-1 bg-white/50 backdrop-blur-sm rounded-2xl inline-flex border border-white/20 min-w-max">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setStatusFilter(tab.id)}
                                    className={`px-6 py-3 font-bold text-sm rounded-xl transition-all duration-300 flex items-center gap-3 ${statusFilter === tab.id
                                        ? 'bg-navy-primary text-white shadow-lg transform scale-105'
                                        : 'text-text-secondary hover:bg-white hover:text-navy-primary'
                                        }`}
                                >
                                    {tab.label}
                                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                                        }`}>
                                        {deals.filter(d => d.status === tab.id).length}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table — identical structure to /dashboard */}
                    <div className="bg-white rounded-3xl shadow-xl shadow-navy-primary/5 border border-white/20 overflow-hidden backdrop-blur-xl">

                        {/* Desktop Table */}
                        <table className="w-full hidden md:table">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="px-8 py-6 text-left text-xs font-bold text-text-light uppercase tracking-widest font-sans">{t('dashboard.table.property')}</th>
                                    <th className="px-8 py-6 text-left text-xs font-bold text-text-light uppercase tracking-widest font-sans">{t('dashboard.table.address')}</th>
                                    <th className="px-8 py-6 text-left text-xs font-bold text-text-light uppercase tracking-widest font-sans">{t('dashboard.table.status')}</th>
                                    <th className="px-8 py-6 text-right text-xs font-bold text-text-light uppercase tracking-widest font-sans">Value</th>
                                    <th className="px-8 py-6 text-left text-xs font-bold text-text-light uppercase tracking-widest font-sans">{t('dashboard.table.phase')}</th>
                                    <th className="px-8 py-6 text-left text-xs font-bold text-text-light uppercase tracking-widest font-sans">{t('dashboard.table.date')}</th>
                                    <th className="px-8 py-6" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredDeals.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center text-text-light">
                                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                                    <Calendar className="w-8 h-8 opacity-20" />
                                                </div>
                                                <p className="text-lg font-medium text-text-secondary">
                                                    {statusFilter === 'active' ? t('dashboard.empty.active') :
                                                        statusFilter === 'on_hold' ? t('dashboard.empty.onHold') :
                                                            t('dashboard.empty.closed')}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDeals.map((deal: Deal) => (
                                        <tr
                                            key={deal.id}
                                            onClick={() => router.push(`/deal/${deal.id}`)}
                                            className="hover:bg-teal/[0.02] cursor-pointer transition-colors group"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center text-teal group-hover:bg-teal group-hover:text-white transition-colors duration-300">
                                                        <Building className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-serif font-bold text-lg text-navy-primary mb-1">{deal.title}</div>
                                                        {deal.dealNumber && (
                                                            <div className="text-xs text-text-light font-bold font-mono tracking-wide">#{deal.dealNumber}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-sm text-text-secondary font-medium">{deal.propertyAddress || 'N/A'}</td>
                                            <td className="px-8 py-6">
                                                <div className="transform scale-90 origin-left">
                                                    <DealStatusBadge status={deal.status} />
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                {deal.price != null && deal.price > 0 ? (
                                                    <span className="font-bold text-teal text-sm">{formatCurrency(deal.price)}</span>
                                                ) : (
                                                    <span className="text-gray-300 text-sm">—</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-navy-primary/5 text-navy-secondary border border-transparent group-hover:border-teal/20 group-hover:bg-teal/5 transition-all">
                                                    {getStepLabel(deal.currentStep || 'onboarding')}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-sm text-text-light font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    {statusFilter === 'closed' && deal.closedAt
                                                        ? new Date(deal.closedAt).toLocaleDateString()
                                                        : new Date(deal.createdAt).toLocaleDateString()
                                                    }
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button className="w-8 h-8 rounded-full flex items-center justify-center text-text-light hover:text-teal hover:bg-teal/10 transition-all transform hover:translate-x-1">→</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-gray-50">
                            {filteredDeals.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="flex flex-col items-center justify-center text-text-light">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                            <Calendar className="w-8 h-8 opacity-20" />
                                        </div>
                                        <p className="text-lg font-medium text-text-secondary">
                                            {statusFilter === 'active' ? t('dashboard.empty.active') :
                                                statusFilter === 'on_hold' ? t('dashboard.empty.onHold') :
                                                    t('dashboard.empty.closed')}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                filteredDeals.map((deal: Deal) => (
                                    <div
                                        key={deal.id}
                                        onClick={() => router.push(`/deal/${deal.id}`)}
                                        className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-2 gap-3">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center text-teal flex-shrink-0">
                                                    <Building className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-serif font-bold text-navy-primary truncate">{deal.title}</h3>
                                                    {deal.dealNumber && (
                                                        <div className="text-xs text-text-light font-bold font-mono">#{deal.dealNumber}</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="transform scale-90 flex-shrink-0">
                                                <DealStatusBadge status={deal.status} />
                                            </div>
                                        </div>

                                        <div className="pl-[52px] space-y-2">
                                            <div className="text-sm text-text-secondary font-medium truncate">
                                                {deal.propertyAddress || 'No address'}
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-text-light pt-2">
                                                <span className="bg-gray-100 px-2 py-1 rounded font-bold uppercase tracking-wide">
                                                    {getStepLabel(deal.currentStep || 'onboarding')}
                                                </span>
                                                {deal.price != null && deal.price > 0 && (
                                                    <span className="font-bold text-teal">
                                                        {formatCurrency(deal.price)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {
                        isCreateModalOpen && (
                            <CreateDealWizard
                                onClose={() => setIsCreateModalOpen(false)}
                                onSuccess={(dealId: string) => {
                                    setIsCreateModalOpen(false);
                                    router.push(`/deal/${dealId}`);
                                }}
                            />
                        )
                    }
                </div>
            </PullToRefresh>
        </div >
    );
}
