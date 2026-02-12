'use client';

import { useData } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { Plus, Building, Calendar, Search, Globe, UserCheck, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import CreateDealWizard from '@/components/deal/CreateDealWizard';
import DealStatusBadge from '@/components/deal/DealStatusBadge';
import { DealStatus } from '@/lib/types';
import { useTranslation } from '@/lib/useTranslation';
import { supabase } from '@/lib/supabase';

type StatusFilter = 'active' | 'on_hold' | 'closed';
type ViewMode = 'my-deals' | 'global-index';

export default function DashboardPage() {
    const { deals } = useData();
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const { t } = useTranslation();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // State
    const [viewMode, setViewMode] = useState<ViewMode>('my-deals');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');

    // Global Index State
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [globalDeals, setGlobalDeals] = useState<any[]>([]);
    const [totalGlobal, setTotalGlobal] = useState(0);
    const [loadingGlobal, setLoadingGlobal] = useState(false);
    const [joiningDealId, setJoiningDealId] = useState<string | null>(null);

    const isInternal = ['admin', 'staff', 'lawyer'].includes(user?.role || '');

    // Derived
    const tabs = [
        { id: 'active' as const, label: t('dashboard.tab.active'), count: deals.filter(d => d.status === 'active').length },
        { id: 'on_hold' as const, label: t('dashboard.tab.onHold'), count: deals.filter(d => d.status === 'on_hold').length },
        { id: 'closed' as const, label: t('dashboard.tab.closed'), count: deals.filter(d => d.status === 'closed').length },
    ];

    const filteredMyDeals = deals.filter(d => d.status === statusFilter);

    // Fetch Global Deals
    useEffect(() => {
        if (viewMode === 'global-index' && isInternal) {
            fetchGlobalDeals();
        }
    }, [viewMode, isInternal, currentPage, searchQuery]);

    const fetchGlobalDeals = async () => {
        setLoadingGlobal(true);
        try {
            const query = new URLSearchParams({
                page: currentPage.toString(),
                limit: '10',
                q: searchQuery
            });

            const res = await fetch(`/api/deals/search?${query.toString()}`);
            if (res.ok) {
                const responseData = await res.json();
                setGlobalDeals(responseData.data || []);
                setTotalGlobal(responseData.meta?.total || 0);
            }
        } catch (error) {
            console.error('Failed to fetch global deals:', error);
        } finally {
            setLoadingGlobal(false);
        }
    };

    const handleJoinDeal = async (dealId: string) => {
        if (!confirm('Are you sure you want to join this deal? You will be added as a participant.')) return;

        setJoiningDealId(dealId);
        try {
            const res = await fetch('/api/deals/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dealId,
                    userId: user?.id,
                    userEmail: user?.email,
                    userRole: user?.role
                })
            });

            if (!res.ok) throw new Error('Failed to join');

            alert('Successfully joined the deal!');
            fetchGlobalDeals(); // Refresh list

            // Switch to My Deals
            // window.location.reload(); // Simple reload to refresh context
        } catch (error) {
            console.error('Join failed:', error);
            alert('Failed to join deal. Please try again.');
        } finally {
            setJoiningDealId(null);
        }
    };

    const isParticipantInGlobal = (deal: any) => {
        // Optimistic check against local deals if possible, or assume if in My Deals it overlaps.
        // For now, simpler: check if deal.id is in known deals
        return deals.some(d => d.id === deal.id);
    };

    const getStepLabel = (step: string) => {
        return step?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN';
    };

    if (isLoading) {
        return <div className="p-20 text-center text-gray-500">Loading...</div>;
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-10 text-center gap-4">
                <div className="text-red-500 font-bold text-xl">Authentication Status: Unknown</div>
                <p className="text-gray-600 max-w-md">
                    We detected a session issue. The server authorized you, but the client could not verify your profile.
                </p>

                <div className="bg-gray-100 p-4 rounded text-left text-xs font-mono text-gray-600 max-w-md w-full">
                    <p><strong>Debug Info:</strong></p>
                    <p>User Object: {user ? 'Existent' : 'NULL'}</p>
                    <p>Loading: {isLoading ? 'True' : 'False'}</p>
                    <p>Role: N/A</p>
                    <p>Timestamp: {new Date().toISOString()}</p>
                </div>

                <div className="flex gap-4 mt-2">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-gray-200 text-gray-700 font-bold rounded hover:bg-gray-300 transition-colors"
                    >
                        Retry Connection
                    </button>
                    <button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            window.location.href = '/login';
                        }}
                        className="px-6 py-2 bg-navy-primary text-white font-bold rounded hover:bg-navy-secondary transition-colors"
                    >
                        Reset & Log In
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
                <div>
                    <h1 className="text-4xl font-serif font-bold text-navy-primary mb-2">{t('dashboard.title')}</h1>
                    <p className="text-text-secondary text-lg">{t('dashboard.subtitle')}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    {isInternal && (
                        <div className="bg-gray-100 p-1 rounded-xl flex w-full sm:w-auto">
                            <button
                                onClick={() => setViewMode('my-deals')}
                                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'my-deals'
                                    ? 'bg-white text-navy-primary shadow-sm'
                                    : 'text-gray-500 hover:text-navy-primary'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <UserCheck className="w-4 h-4" />
                                    <span>My Deals</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setViewMode('global-index')}
                                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'global-index'
                                    ? 'bg-white text-navy-primary shadow-sm'
                                    : 'text-gray-500 hover:text-navy-primary'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Globe className="w-4 h-4" />
                                    <span>Global Index</span>
                                </div>
                            </button>
                        </div>
                    )}

                    {user.permissions.canCreateDeals && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-teal to-teal/90 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 w-full sm:w-auto"
                        >
                            <Plus className="w-5 h-5" />
                            {t('dashboard.newDeal')}
                        </button>
                    )}
                </div>
            </div>

            {/* MY DEALS VIEW */}
            {viewMode === 'my-deals' && (
                <>
                    {/* Status Tabs */}
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

                    {/* Deals List */}
                    <div className="bg-white rounded-3xl shadow-xl shadow-navy-primary/5 border border-white/20 overflow-hidden backdrop-blur-xl">

                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-gray-50">
                            {filteredMyDeals.length === 0 ? (
                                <div className="p-8 text-center">
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
                                </div>
                            ) : (
                                filteredMyDeals.map((deal) => (
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
                                                    {deal.dealNumber && <div className="text-xs text-text-light font-bold font-mono">#{deal.dealNumber}</div>}
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
                                                        €{deal.price.toLocaleString('en-US')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Desktop Table View */}
                        <table className="w-full hidden md:table">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="px-8 py-6 text-left text-xs font-bold text-text-light uppercase tracking-widest font-sans">{t('dashboard.table.property')}</th>
                                    <th className="px-8 py-6 text-left text-xs font-bold text-text-light uppercase tracking-widest font-sans">{t('dashboard.table.address')}</th>
                                    <th className="px-8 py-6 text-left text-xs font-bold text-text-light uppercase tracking-widest font-sans">{t('dashboard.table.status')}</th>
                                    <th className="px-8 py-6 text-right text-xs font-bold text-text-light uppercase tracking-widest font-sans">Value</th>
                                    <th className="px-8 py-6 text-left text-xs font-bold text-text-light uppercase tracking-widest font-sans">{t('dashboard.table.phase')}</th>
                                    <th className="px-8 py-6 text-left text-xs font-bold text-text-light uppercase tracking-widest font-sans">{t('dashboard.table.date')}</th>
                                    <th className="px-8 py-6"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredMyDeals.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-20 text-center">
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
                                    filteredMyDeals.map((deal) => (
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
                                                        {deal.dealNumber && <div className="text-xs text-text-light font-bold font-mono tracking-wide">#{deal.dealNumber}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-sm text-text-secondary font-medium">{deal.propertyAddress || 'N/A'}</td>
                                            <td className="px-8 py-6"><div className="transform scale-90 origin-left"><DealStatusBadge status={deal.status} /></div></td>
                                            <td className="px-8 py-6 text-right">
                                                {deal.price != null && deal.price > 0 ? (
                                                    <span className="font-bold text-teal text-sm">€{deal.price.toLocaleString('en-US')}</span>
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
                                                    {statusFilter === 'closed' && deal.closedAt ? new Date(deal.closedAt).toLocaleDateString() : new Date(deal.createdAt).toLocaleDateString()}
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
                    </div>
                </>
            )}

            {/* GLOBAL INDEX VIEW */}
            {viewMode === 'global-index' && isInternal && (
                <div className="space-y-6">
                    {/* Search Bar */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <Search className="w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search all deals by title or ID..."
                            className="flex-1 outline-none text-navy-primary"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Global List */}
                    <div className="bg-white rounded-3xl shadow-xl shadow-navy-primary/5 border border-white/20 overflow-hidden backdrop-blur-xl overflow-x-auto">
                        {loadingGlobal ? (
                            <div className="p-10 text-center text-gray-500">Loading Global Index...</div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th className="px-8 py-6 text-left text-xs font-bold text-text-light uppercase tracking-widest font-sans">Deal</th>
                                        <th className="px-8 py-6 text-left text-xs font-bold text-text-light uppercase tracking-widest font-sans">Created</th>
                                        <th className="px-8 py-6 text-left text-xs font-bold text-text-light uppercase tracking-widest font-sans">Role Check</th>
                                        <th className="px-8 py-6 text-right text-xs font-bold text-text-light uppercase tracking-widest font-sans">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {globalDeals.length === 0 ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-gray-500">No deals found.</td></tr>
                                    ) : (
                                        globalDeals.map(deal => {
                                            const isPart = isParticipantInGlobal(deal);
                                            return (
                                                <tr key={deal.id} className="hover:bg-gray-50">
                                                    <td className="px-8 py-6">
                                                        <div className="font-bold text-navy-primary">{deal.title}</div>
                                                        <div className="text-xs text-gray-400">ID: {deal.id}</div>
                                                    </td>
                                                    <td className="px-8 py-6 text-sm text-gray-500">
                                                        {new Date(deal.created_at || deal.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        {isPart ? (
                                                            <span className="inline-flex items-center gap-1 text-teal text-xs font-bold bg-teal/10 px-2 py-1 rounded">
                                                                <UserCheck className="w-3 h-3" /> Joined
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs">Not Joined</span>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        {isPart ? (
                                                            <button
                                                                onClick={() => router.push(`/deal/${deal.id}`)}
                                                                className="text-teal font-bold text-sm hover:underline"
                                                            >
                                                                Open Deal
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleJoinDeal(deal.id)}
                                                                disabled={joiningDealId === deal.id}
                                                                className="inline-flex items-center gap-2 px-4 py-2 bg-navy-primary text-white text-sm font-bold rounded-lg hover:bg-navy-secondary transition-colors disabled:opacity-50"
                                                            >
                                                                <UserPlus className="w-4 h-4" />
                                                                {joiningDealId === deal.id ? 'Joining...' : 'Join Deal'}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        )}

                        {/* Pagination Controls */}
                        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-bold text-gray-500">Page {currentPage} of {Math.ceil(totalGlobal / 10)}</span>
                            <button
                                onClick={() => setCurrentPage(p => p + 1)}
                                disabled={currentPage >= Math.ceil(totalGlobal / 10)}
                                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
