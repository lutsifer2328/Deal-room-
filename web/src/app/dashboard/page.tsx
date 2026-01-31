'use client';

import { useData } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { Plus, Building, Calendar } from 'lucide-react';
import { useState } from 'react';
import CreateDealWizard from '@/components/deal/CreateDealWizard';
import DealStatusBadge from '@/components/deal/DealStatusBadge';
import { DealStatus } from '@/lib/types';
import { useTranslation } from '@/lib/useTranslation';

type StatusFilter = 'active' | 'on_hold' | 'closed';

export default function DashboardPage() {
    const { deals } = useData();
    const { user } = useAuth();
    const router = useRouter();
    const { t } = useTranslation();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');

    if (!user || !['admin', 'lawyer', 'staff', 'viewer'].includes(user.role)) {
        return <div className="p-10 text-center">{t('dashboard.accessDenied')}</div>;
    }

    // Filter deals based on user role and participation
    // Admin & Lawyer: See ALL deals
    // Staff/Others: See ONLY deals they participate in (by email or userId)
    const accessibleDeals = deals.filter(deal => {
        if (user.role === 'admin' || user.role === 'lawyer') return true;

        // Check if user is a participant in this deal
        return deal.participants?.some(p =>
            (p.userId === user.id) ||
            (p.email.toLowerCase().trim() === user.email.toLowerCase().trim())
        );
    });

    // Filter accessible deals by status
    const filteredDeals = accessibleDeals.filter(deal => deal.status === statusFilter);

    // Count deals by status (using accessible deals filtered)
    const statusCounts = {
        active: accessibleDeals.filter(d => d.status === 'active').length,
        on_hold: accessibleDeals.filter(d => d.status === 'on_hold').length,
        closed: accessibleDeals.filter(d => d.status === 'closed').length
    };

    const getStepLabel = (step: string) => {
        const labels: Record<string, string> = {
            'onboarding': t('dashboard.phase.onboarding'),
            'documents': t('dashboard.phase.documents'),
            'preliminary_contract': t('dashboard.phase.preliminary_contract'),
            'final_review': t('dashboard.phase.final_review'),
            'closing': t('dashboard.phase.closing')
        };
        return labels[step] || step;
    };

    const tabs: { id: StatusFilter; label: string; count: number }[] = [
        { id: 'active', label: t('dashboard.tab.active'), count: statusCounts.active },
        { id: 'on_hold', label: t('dashboard.tab.onHold'), count: statusCounts.on_hold },
        { id: 'closed', label: t('dashboard.tab.closed'), count: statusCounts.closed }
    ];

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-4xl font-serif font-bold text-navy-primary mb-2">{t('dashboard.title')}</h1>
                    <p className="text-text-secondary text-lg">{t('dashboard.subtitle')}</p>
                </div>
                {user.permissions.canCreateDeals && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-teal to-teal/90 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300"
                    >
                        <Plus className="w-5 h-5" />
                        {t('dashboard.newDeal')}
                    </button>
                )}
            </div>

            {/* Status Tabs */}
            <div className="mb-8">
                <div className="flex gap-4 p-1 bg-white/50 backdrop-blur-sm rounded-2xl inline-flex border border-white/20">
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
                            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${statusFilter === tab.id
                                ? 'bg-white/20 text-white'
                                : 'bg-gray-200 text-gray-600'
                                }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Deals Table */}
            <div className="bg-white rounded-3xl shadow-xl shadow-navy-primary/5 border border-white/20 overflow-hidden backdrop-blur-xl">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                            <th className="px-8 py-6 text-left text-xs font-bold text-text-light uppercase tracking-widest font-sans">
                                {t('dashboard.table.property')}
                            </th>
                            <th className="px-8 py-6 text-left text-xs font-bold text-text-light uppercase tracking-widest font-sans">
                                {t('dashboard.table.address')}
                            </th>
                            <th className="px-8 py-6 text-left text-xs font-bold text-text-light uppercase tracking-widest font-sans">
                                {t('dashboard.table.status')}
                            </th>
                            <th className="px-8 py-6 text-left text-xs font-bold text-text-light uppercase tracking-widest font-sans">
                                {t('dashboard.table.phase')}
                            </th>
                            <th className="px-8 py-6 text-left text-xs font-bold text-text-light uppercase tracking-widest font-sans">
                                {t('dashboard.table.date')}
                            </th>
                            <th className="px-8 py-6"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredDeals.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center justify-center text-text-light">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                            <Calendar className="w-8 h-8 opacity-20" />
                                        </div>
                                        <p className="text-lg font-medium text-text-secondary">
                                            {statusFilter === 'active' && t('dashboard.empty.active')}
                                            {statusFilter === 'on_hold' && t('dashboard.empty.onHold')}
                                            {statusFilter === 'closed' && t('dashboard.empty.closed')}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredDeals.map((deal) => (
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
                                    <td className="px-8 py-6 text-sm text-text-secondary font-medium">
                                        {deal.propertyAddress || 'N/A'}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="transform scale-90 origin-left">
                                            <DealStatusBadge status={deal.status} />
                                        </div>
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
                                                : new Date(deal.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button className="w-8 h-8 rounded-full flex items-center justify-center text-text-light hover:text-teal hover:bg-teal/10 transition-all transform hover:translate-x-1">
                                            →
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isCreateModalOpen && (
                <CreateDealWizard
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={(dealId: string) => {
                        setIsCreateModalOpen(false);
                        router.push(`/deal/${dealId}`);
                    }}
                />
            )}
        </div>
    );
}
