'use client';

import { useData } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { Plus, Building, Calendar } from 'lucide-react';
import { useState } from 'react';
import CreateDealWizard from '@/components/deal/CreateDealWizard';
import DealStatusBadge from '@/components/deal/DealStatusBadge';
import { DealStatus } from '@/lib/types';

type StatusFilter = 'active' | 'on_hold' | 'closed';

export default function DashboardPage() {
    const { deals } = useData();
    const { user } = useAuth();
    const router = useRouter();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');

    if (!user || (user.role !== 'lawyer' && user.role !== 'admin')) {
        return <div className="p-10 text-center">Access Denied. Admin/Lawyer only.</div>;
    }

    // Filter deals by status
    const filteredDeals = deals.filter(deal => deal.status === statusFilter);

    // Count deals by status
    const statusCounts = {
        active: deals.filter(d => d.status === 'active').length,
        on_hold: deals.filter(d => d.status === 'on_hold').length,
        closed: deals.filter(d => d.status === 'closed').length
    };

    const getStepLabel = (step: string) => {
        const labels: Record<string, string> = {
            'onboarding': 'Onboarding',
            'documents': 'Documents',
            'preliminary_contract': 'Preliminary Contract',
            'final_review': 'Final Review',
            'closing': 'Closing'
        };
        return labels[step] || step;
    };

    const tabs: { id: StatusFilter; label: string; count: number }[] = [
        { id: 'active', label: 'Active', count: statusCounts.active },
        { id: 'on_hold', label: 'On Hold', count: statusCounts.on_hold },
        { id: 'closed', label: 'Closed', count: statusCounts.closed }
    ];

    return (
        <div className="max-w-7xl mx-auto p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-midnight">Deals</h1>
                    <p className="text-gray-500 mt-1">Manage and monitor your property transactions</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-teal text-white font-bold rounded-lg hover:bg-teal/90 shadow-lg transition-all"
                >
                    <Plus className="w-5 h-5" />
                    New Deal
                </button>
            </div>

            {/* Status Tabs */}
            <div className="mb-6 border-b border-gray-200">
                <div className="flex gap-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id)}
                            className={`px-6 py-3 font-bold text-sm transition-colors relative ${statusFilter === tab.id
                                    ? 'text-teal'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${statusFilter === tab.id
                                    ? 'bg-teal text-white'
                                    : 'bg-gray-200 text-gray-600'
                                }`}>
                                {tab.count}
                            </span>
                            {statusFilter === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal"></div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Deals Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                Property
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                Address
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                Phase
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredDeals.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <div className="text-gray-400">
                                        {statusFilter === 'active' && 'No active deals. Click "New Deal" to get started.'}
                                        {statusFilter === 'on_hold' && 'No deals on hold.'}
                                        {statusFilter === 'closed' && 'No closed deals yet.'}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredDeals.map((deal) => (
                                <tr
                                    key={deal.id}
                                    onClick={() => router.push(`/deal/${deal.id}`)}
                                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Building className="w-5 h-5 text-teal" />
                                            <div>
                                                <div className="font-medium text-midnight">{deal.title}</div>
                                                {deal.dealNumber && (
                                                    <div className="text-xs text-gray-400 font-mono">#{deal.dealNumber}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {deal.propertyAddress || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <DealStatusBadge status={deal.status} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-teal/10 text-teal">
                                            {getStepLabel(deal.currentStep || 'onboarding')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            {statusFilter === 'closed' && deal.closedAt
                                                ? new Date(deal.closedAt).toLocaleDateString()
                                                : new Date(deal.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-teal font-medium hover:text-teal/80">
                                            View →
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
