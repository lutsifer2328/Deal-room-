'use client';

import { useData } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import { Search, FileText, Eye, ExternalLink, Filter } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DocumentPreviewModal from '@/components/deal/DocumentPreviewModal';
import { DealDocument } from '@/lib/types';

export default function SearchAllDocumentsTab() {
    const { deals, tasks } = useData();
    const { user } = useAuth();
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'private' | 'verified' | 'released' | 'rejected'>('all');
    const [dealFilter, setDealFilter] = useState<string>('all');
    const [previewDoc, setPreviewDoc] = useState<DealDocument | null>(null);

    if (!user) return null;

    // Collect all documents from all tasks
    const allDocuments: Array<{
        doc: DealDocument;
        taskId: string;
        taskTitle: string;
        dealId: string;
        dealTitle: string;
        dealAddress: string;
        dealStatus: string;
        participantName: string;
    }> = [];

    tasks.forEach(task => {
        const deal = deals.find(d => d.id === task.dealId);
        if (!deal) return;

        const participant = deal.participants.find(p => p.role === task.assignedTo);

        task.documents.forEach(doc => {
            allDocuments.push({
                doc,
                taskId: task.id,
                taskTitle: task.title_en,
                dealId: deal.id,
                dealTitle: deal.title,
                dealAddress: deal.propertyAddress,
                dealStatus: deal.status,
                participantName: participant?.fullName || 'Unknown'
            });
        });
    });

    // Filter documents
    let filteredDocuments = allDocuments;

    // Search filter
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredDocuments = filteredDocuments.filter(item =>
            item.doc.title_en.toLowerCase().includes(query) ||
            item.taskTitle.toLowerCase().includes(query) ||
            item.dealTitle.toLowerCase().includes(query) ||
            item.dealAddress.toLowerCase().includes(query) ||
            item.participantName.toLowerCase().includes(query)
        );
    }

    // Status filter
    if (statusFilter !== 'all') {
        filteredDocuments = filteredDocuments.filter(item => item.doc.status === statusFilter);
    }

    // Deal filter
    if (dealFilter !== 'all') {
        filteredDocuments = filteredDocuments.filter(item => item.dealId === dealFilter);
    }

    // Sort by upload date (newest first)
    filteredDocuments.sort((a, b) =>
        new Date(b.doc.uploadedAt).getTime() - new Date(a.doc.uploadedAt).getTime()
    );

    const handleViewDeal = (dealId: string) => {
        router.push(`/deal/${dealId}`);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'private':
                return 'bg-yellow-100 text-yellow-700';
            case 'verified':
                return 'bg-blue-100 text-blue-700';
            case 'released':
                return 'bg-green-100 text-green-700';
            case 'rejected':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'private':
                return 'Private';
            case 'verified':
                return 'Verified';
            case 'released':
                return 'Released';
            case 'rejected':
                return 'Rejected';
            default:
                return status;
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-xl font-bold text-midnight mb-2">🔍 Search All Documents</h2>
                <p className="text-sm text-gray-600">
                    Search and filter documents across all deals
                </p>
            </div>

            {/* Search and Filters */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by document name, deal, address, or participant..."
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal focus:border-teal outline-none transition-all"
                    />
                </div>

                {/* Filters */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Filter className="w-4 h-4 inline mr-1" />
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal focus:border-teal outline-none transition-all"
                        >
                            <option value="all">All Statuses</option>
                            <option value="private">Private</option>
                            <option value="verified">Verified</option>
                            <option value="released">Released</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Filter className="w-4 h-4 inline mr-1" />
                            Deal
                        </label>
                        <select
                            value={dealFilter}
                            onChange={(e) => setDealFilter(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal focus:border-teal outline-none transition-all"
                        >
                            <option value="all">All Deals</option>
                            {deals.map(deal => (
                                <option key={deal.id} value={deal.id}>
                                    {deal.title} - {deal.propertyAddress}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Results Count */}
            <div className="mb-4 text-sm text-gray-600">
                Found <strong>{filteredDocuments.length}</strong> document{filteredDocuments.length !== 1 ? 's' : ''}
                {searchQuery && ` matching "${searchQuery}"`}
            </div>

            {/* Table */}
            {filteredDocuments.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">No documents found</p>
                    <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="text-left py-3 px-4 font-bold text-midnight">Document</th>
                                <th className="text-left py-3 px-4 font-bold text-midnight">Deal</th>
                                <th className="text-left py-3 px-4 font-bold text-midnight">Participant</th>
                                <th className="text-left py-3 px-4 font-bold text-midnight">Uploaded</th>
                                <th className="text-left py-3 px-4 font-bold text-midnight">Status</th>
                                <th className="text-right py-3 px-4 font-bold text-midnight">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDocuments.map((item, index) => (
                                <tr key={`${item.taskId}-${item.doc.id}`} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                            <div>
                                                <div className="font-medium text-midnight">{item.doc.title_en}</div>
                                                <div className="text-xs text-gray-500">{item.taskTitle}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="font-medium text-midnight">{item.dealTitle}</div>
                                        <div className="text-xs text-gray-500">{item.dealAddress}</div>
                                        {item.dealStatus === 'closed' && (
                                            <span className="inline-block mt-1 px-2 py-0.5 bg-gray-200 text-gray-700 text-xs font-bold rounded">
                                                CLOSED
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-gray-600 text-sm">
                                        {item.participantName}
                                    </td>
                                    <td className="py-3 px-4 text-gray-600 text-sm">
                                        {new Date(item.doc.uploadedAt).toLocaleDateString()}
                                        <div className="text-xs text-gray-400">
                                            {new Date(item.doc.uploadedAt).toLocaleTimeString()}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded ${getStatusBadge(item.doc.status)}`}>
                                            {getStatusLabel(item.doc.status)}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setPreviewDoc(item.doc)}
                                                className="p-2 text-gray-600 hover:text-teal hover:bg-teal/10 rounded transition-colors"
                                                title="View Document"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleViewDeal(item.dealId)}
                                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="View Deal"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Preview Modal */}
            {previewDoc && (
                <DocumentPreviewModal
                    doc={previewDoc}
                    onClose={() => setPreviewDoc(null)}
                />
            )}
        </div>
    );
}
