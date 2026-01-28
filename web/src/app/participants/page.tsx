'use client';

import { useState, useMemo } from 'react';
import { useData } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import { Users, Search, X, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GlobalParticipant } from '@/lib/types';
import AddParticipantModal from '@/components/participants/AddParticipantModal';

export default function ParticipantsPage() {
    const { globalParticipants, dealParticipants, deals, getRecentParticipants } = useData();
    const { user } = useAuth();
    const router = useRouter();

    // Access control - check BEFORE using hooks
    if (!user || !['lawyer', 'admin', 'staff'].includes(user.role)) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
                    <p className="text-gray-600">You don't have permission to view this page.</p>
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
            'buyer': 'bg-teal/10 text-teal',
            'seller': 'bg-blue-100 text-blue-700',
            'agent': 'bg-purple-100 text-purple-700',
            'lawyer': 'bg-gold/10 text-gold',
            'notary': 'bg-green-100 text-green-700',
            'bank_representative': 'bg-gray-100 text-gray-700'
        };
        return colors[role] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-midnight flex items-center gap-3">
                        <Users className="w-8 h-8 text-teal" />
                        Participants
                    </h1>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-4 py-2 bg-teal text-white rounded-lg font-bold hover:bg-teal/90 flex items-center gap-2"
                    >
                        <UserPlus className="w-5 h-5" />
                        Add New
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-6 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1); // Reset to first page on search
                        }}
                        className="w-full pl-12 pr-10 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal outline-none"
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

                {/* Filter Buttons */}
                <div className="mb-6 flex gap-3">
                    <button
                        onClick={() => { setFilterMode('all'); setCurrentPage(1); }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterMode === 'all'
                            ? 'bg-teal text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => { setFilterMode('active'); setCurrentPage(1); }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterMode === 'active'
                            ? 'bg-teal text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        Active Deals Only
                    </button>
                    <button
                        onClick={() => { setFilterMode('closed'); setCurrentPage(1); }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterMode === 'closed'
                            ? 'bg-teal text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        From Closed Deals
                    </button>
                </div>

                {/* Recently Added Section */}
                {recentParticipants.length > 0 && (
                    <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-bold text-midnight mb-4">Recently Added (Last 30 days)</h2>
                        <div className="space-y-2">
                            {recentParticipants.map(participant => {
                                const stats = getParticipantStats(participant);
                                return (
                                    <div
                                        key={participant.id}
                                        onClick={() => handleRowClick(participant.id)}
                                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-10 h-10 rounded-full bg-teal flex items-center justify-center text-white font-bold">
                                                {participant.name.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-midnight">{participant.name}</div>
                                                <div className="text-sm text-gray-600">{participant.email}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${getRoleBadgeColor(stats.mostRecentRole)}`}>
                                                {stats.mostRecentRole}
                                            </span>
                                            <span className="text-sm text-gray-600">
                                                {stats.activeDealsCount + stats.closedDealsCount} {stats.activeDealsCount + stats.closedDealsCount === 1 ? 'deal' : 'deals'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* All Participants Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-bold text-midnight">
                            All Participants ({filteredParticipants.length} total)
                        </h2>
                    </div>

                    {filteredParticipants.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium">No participants found</p>
                            <p className="text-sm">Try adjusting your search or filters</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
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
                                                className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                            >
                                                Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
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
                                                className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                            >
                                                Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Role
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Deals
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedParticipants.map(participant => {
                                            const stats = getParticipantStats(participant);
                                            const dealsText = stats.activeDealsCount > 0 && stats.closedDealsCount > 0
                                                ? `${stats.activeDealsCount} active, ${stats.closedDealsCount} closed`
                                                : stats.activeDealsCount > 0
                                                    ? `${stats.activeDealsCount} active`
                                                    : stats.closedDealsCount > 0
                                                        ? `0 (${stats.closedDealsCount} closed)`
                                                        : '0';

                                            return (
                                                <tr
                                                    key={participant.id}
                                                    onClick={() => handleRowClick(participant.id)}
                                                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-teal flex items-center justify-center text-white font-bold">
                                                                {participant.name.charAt(0)}
                                                            </div>
                                                            <div className="font-medium text-midnight">{participant.name}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                        {participant.email}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${getRoleBadgeColor(stats.mostRecentRole)}`}>
                                                            {stats.mostRecentRole}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
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
                                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                    <div className="text-sm text-gray-600">
                                        Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredParticipants.length)} of {filteredParticipants.length}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 border border-gray-300 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 border border-gray-300 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                        >
                                            Next →
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
