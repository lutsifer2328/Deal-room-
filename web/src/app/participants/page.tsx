'use client';

import { useState, useMemo } from 'react';
import { useData } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import { Users, Search, X, UserPlus, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GlobalParticipant } from '@/lib/types';
import AddParticipantModal from '@/components/participants/AddParticipantModal';
import { useTranslation, TranslationKey } from '@/lib/useTranslation';

export default function ParticipantsPage() {
    const { globalParticipants, dealParticipants, deals, getRecentParticipants } = useData();
    const { user } = useAuth();
    const router = useRouter();
    const { t } = useTranslation();

    // Access control - check BEFORE using hooks
    if (!user || !['lawyer', 'admin', 'staff'].includes(user.role)) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('dashboard.accessDenied')}</h1>
                </div>
            </div>
        );
    }

    // All hooks MUST be called unconditionally after access check
    const [searchQuery, setSearchQuery] = useState('');
    const [filterMode, setFilterMode] = useState<'all' | 'active' | 'closed'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState<'name' | 'email' | 'createdAt'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const itemsPerPage = 20;

    // Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Get participant statistics
    const getParticipantStats = (participant: GlobalParticipant) => {
        const participantDealLinks = dealParticipants.filter(dp => dp.participantId === participant.id);
        const activeDealsCount = participantDealLinks.filter(dp => {
            const deal = deals.find(d => d.id === dp.dealId);
            return deal && deal.status !== 'closed';
        }).length;
        const closedDealsCount = participantDealLinks.filter(dp => {
            const deal = deals.find(d => d.id === dp.dealId);
            return deal && deal.status === 'closed';
        }).length;

        // Get most recent role
        const sortedLinks = participantDealLinks.sort((a, b) =>
            new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
        );
        const mostRecentRole = sortedLinks[0]?.role || 'N/A';

        return { activeDealsCount, closedDealsCount, mostRecentRole };
    };

    // Filter and search participants
    const filteredParticipants = useMemo(() => {
        let filtered = globalParticipants;

        // Apply search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.email.toLowerCase().includes(query) ||
                p.phone?.toLowerCase().includes(query)
            );
        }

        // Apply filter mode
        if (filterMode !== 'all') {
            filtered = filtered.filter(p => {
                const stats = getParticipantStats(p);
                if (filterMode === 'active') return stats.activeDealsCount > 0;
                if (filterMode === 'closed') return stats.closedDealsCount > 0;
                return true;
            });
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let compareA: any = a[sortBy];
            let compareB: any = b[sortBy];

            if (sortBy === 'createdAt') {
                compareA = new Date(compareA).getTime();
                compareB = new Date(compareB).getTime();
            } else {
                compareA = compareA?.toLowerCase() || '';
                compareB = compareB?.toLowerCase() || '';
            }

            if (sortOrder === 'asc') {
                return compareA > compareB ? 1 : -1;
            } else {
                return compareA < compareB ? 1 : -1;
            }
        });

        return filtered;
    }, [globalParticipants, searchQuery, filterMode, sortBy, sortOrder, dealParticipants, deals]);

    // Pagination
    const totalPages = Math.ceil(filteredParticipants.length / itemsPerPage);
    const paginatedParticipants = filteredParticipants.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Recent participants (last 30 days)
    const recentParticipants = getRecentParticipants(30).slice(0, 10);

    const handleRowClick = (participantId: string) => {
        router.push(`/participants/${participantId}`);
    };

    const getRoleBadgeColor = (role: string) => {
        const colors: Record<string, string> = {
            'buyer': 'bg-teal/10 text-teal border-teal/20',
            'seller': 'bg-blue-100 text-blue-700 border-blue-200',
            'agent': 'bg-purple-100 text-purple-700 border-purple-200',
            'lawyer': 'bg-gold/10 text-gold border-gold/20',
            'notary': 'bg-green-100 text-green-700 border-green-200',
            'bank_representative': 'bg-gray-100 text-gray-700 border-gray-200'
        };
        return colors[role] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    const getTranslatedRole = (role: string) => {
        const key = `role.${role}` as TranslationKey;
        // Check if translation exists, otherwise return raw role
        // Since t() handles missing keys by warning and returning key, we'll try it.
        // Or simply:
        return t(key).startsWith('role.') ? role : t(key);
    };

    return (
        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-12">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-serif font-bold text-navy-primary mb-2 tracking-tight">
                            {t('participants.title')}
                        </h1>
                        <p className="text-text-light font-medium">
                            Manage all deal participants, brokers, and external partners
                        </p>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-6 py-3 bg-teal text-white rounded-xl font-bold hover:bg-teal/90 flex items-center gap-2 shadow-lg shadow-teal/20 transition-all hover:scale-105"
                    >
                        <UserPlus className="w-5 h-5" />
                        {t('participants.addNew')}
                    </button>
                </div>

                {/* Filters & Search Card */}
                <div className="bg-white rounded-3xl p-6 shadow-lg shadow-navy-primary/5 border border-white/20 backdrop-blur-xl flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={t('participants.searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1); // Reset to first page on search
                            }}
                            className="w-full pl-12 pr-10 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none transition-all bg-gray-50/50 focus:bg-white"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    <div className="flex gap-2 bg-gray-100/50 p-1.5 rounded-xl border border-gray-200">
                        <button
                            onClick={() => { setFilterMode('all'); setCurrentPage(1); }}
                            className={`px-5 py-2 rounded-lg font-bold text-sm transition-all duration-300 ${filterMode === 'all'
                                ? 'bg-white text-navy-primary shadow-sm'
                                : 'text-text-light hover:text-navy-primary hover:bg-white/50'
                                }`}
                        >
                            {t('participants.filter.all')}
                        </button>
                        <button
                            onClick={() => { setFilterMode('active'); setCurrentPage(1); }}
                            className={`px-5 py-2 rounded-lg font-bold text-sm transition-all duration-300 ${filterMode === 'active'
                                ? 'bg-white text-teal shadow-sm'
                                : 'text-text-light hover:text-teal hover:bg-white/50'
                                }`}
                        >
                            {t('participants.filter.active')}
                        </button>
                        <button
                            onClick={() => { setFilterMode('closed'); setCurrentPage(1); }}
                            className={`px-5 py-2 rounded-lg font-bold text-sm transition-all duration-300 ${filterMode === 'closed'
                                ? 'bg-white text-text-secondary shadow-sm'
                                : 'text-text-light hover:text-text-secondary hover:bg-white/50'
                                }`}
                        >
                            {t('participants.filter.closed')}
                        </button>
                    </div>
                </div>

                {/* Recently Added Section */}
                {recentParticipants.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-navy-primary px-2 uppercase tracking-wider text-xs flex items-center gap-2">
                            <Clock className="w-4 h-4 text-teal" />
                            {t('participants.recent')}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {recentParticipants.map(participant => {
                                const stats = getParticipantStats(participant);
                                return (
                                    <div
                                        key={participant.id}
                                        onClick={() => handleRowClick(participant.id)}
                                        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal to-teal/80 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-teal/20 group-hover:scale-105 transition-transform">
                                                {participant.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-navy-primary group-hover:text-teal transition-colors">{participant.name}</div>
                                                <div className="text-xs text-text-light">{participant.email}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className={`px-2.5 py-1 rounded-md font-bold uppercase ${getRoleBadgeColor(stats.mostRecentRole)}`}>
                                                {getTranslatedRole(stats.mostRecentRole)}
                                            </span>
                                            <span className="text-text-light font-medium bg-gray-50 px-2 py-1 rounded-md">
                                                {stats.activeDealsCount + stats.closedDealsCount} Deals
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* All Participants Table */}
                <div className="bg-white rounded-3xl shadow-xl shadow-navy-primary/5 border border-white/20 overflow-hidden backdrop-blur-xl">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                        <h2 className="text-xl font-bold text-navy-primary font-serif">
                            {t('participants.allParticipants')}
                        </h2>
                        <span className="bg-navy-primary/5 text-navy-primary px-3 py-1 rounded-full text-xs font-bold">
                            {filteredParticipants.length} {t('participants.total')}
                        </span>
                    </div>

                    {filteredParticipants.length === 0 ? (
                        <div className="p-16 text-center text-gray-500">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Users className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-navy-primary mb-2">{t('participants.notFound')}</h3>
                            <p className="text-text-light max-w-xs mx-auto">{t('participants.tryAdjusting')}</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50/50 border-b border-gray-100">
                                        <tr>
                                            <th
                                                onClick={() => {
                                                    if (sortBy === 'name') {
                                                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                                    } else {
                                                        setSortBy('name');
                                                        setSortOrder('asc');
                                                    }
                                                }}
                                                className="px-8 py-5 text-left text-xs font-bold text-text-secondary uppercase tracking-wider cursor-pointer hover:text-teal transition-colors"
                                            >
                                                {t('participants.table.name')} {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th
                                                onClick={() => {
                                                    if (sortBy === 'email') {
                                                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                                    } else {
                                                        setSortBy('email');
                                                        setSortOrder('asc');
                                                    }
                                                }}
                                                className="px-8 py-5 text-left text-xs font-bold text-text-secondary uppercase tracking-wider cursor-pointer hover:text-teal transition-colors"
                                            >
                                                {t('participants.table.email')} {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="px-8 py-5 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                                                {t('participants.table.role')}
                                            </th>
                                            <th className="px-8 py-5 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                                                {t('participants.table.deals')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-50">
                                        {paginatedParticipants.map(participant => {
                                            const stats = getParticipantStats(participant);
                                            const dealsText = stats.activeDealsCount > 0 && stats.closedDealsCount > 0
                                                ? `${stats.activeDealsCount} ${t('participants.dealCount.active')}, ${stats.closedDealsCount} ${t('participants.dealCount.closed')}`
                                                : stats.activeDealsCount > 0
                                                    ? `${stats.activeDealsCount} ${t('participants.dealCount.active')}`
                                                    : stats.closedDealsCount > 0
                                                        ? `0 (${stats.closedDealsCount} ${t('participants.dealCount.closed')})`
                                                        : '0';

                                            return (
                                                <tr
                                                    key={participant.id}
                                                    onClick={() => handleRowClick(participant.id)}
                                                    className="hover:bg-teal/[0.02] cursor-pointer transition-colors group"
                                                >
                                                    <td className="px-8 py-5 whitespace-nowrap">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-navy-primary text-white flex items-center justify-center font-bold text-sm shadow-md group-hover:bg-teal transition-colors">
                                                                {participant.name.charAt(0)}
                                                            </div>
                                                            <div className="font-bold text-navy-primary text-base group-hover:text-teal transition-colors">{participant.name}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 whitespace-nowrap text-sm text-text-light font-medium">
                                                        {participant.email}
                                                    </td>
                                                    <td className="px-8 py-5 whitespace-nowrap">
                                                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase border ${getRoleBadgeColor(stats.mostRecentRole)}`}>
                                                            {getTranslatedRole(stats.mostRecentRole)}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 whitespace-nowrap text-sm text-text-light font-medium">
                                                        {dealsText}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="px-8 py-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                                    <div className="text-sm text-text-light font-medium">
                                        {t('participants.pagination.showing')} <span className="font-bold text-navy-primary">{((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredParticipants.length)}</span> {t('participants.pagination.of')} <span className="font-bold text-navy-primary">{filteredParticipants.length}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 border border-gray-200 bg-white rounded-lg font-bold text-text-light disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:text-navy-primary transition-colors"
                                        >
                                            {t('participants.pagination.previous')}
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 border border-gray-200 bg-white rounded-lg font-bold text-text-light disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:text-navy-primary transition-colors"
                                        >
                                            {t('participants.pagination.next')} →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Add Participant Modal */}
            {isAddModalOpen && (
                <AddParticipantModal onClose={() => setIsAddModalOpen(false)} />
            )}
        </div>
    );
}
