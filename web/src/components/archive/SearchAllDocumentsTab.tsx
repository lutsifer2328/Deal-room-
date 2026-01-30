'use client';

import { useData } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import { useTranslation } from '@/lib/useTranslation';
import { Search, FileText, Eye, ExternalLink, Filter } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DocumentPreviewModal from '@/components/deal/DocumentPreviewModal';
import { DealDocument } from '@/lib/types';

export default function SearchAllDocumentsTab() {
    const { deals, tasks } = useData();
    const { user } = useAuth();
    const router = useRouter();
    const { t } = useTranslation();

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
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-navy-primary font-serif mb-2 flex items-center gap-2">
                    🔍 {t('archive.search.title') || 'Search All Documents'}
                </h2>
                <p className="text-text-secondary">
                    {t('archive.search.subtitle') || 'Search and filter documents across all deals'}
                </p>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-gray-100">
                {/* Search Bar */}
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by document name, deal, address, or participant..."
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none transition-all placeholder:text-gray-400 text-navy-primary"
                    />
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-navy-primary mb-2">
                            <Filter className="w-4 h-4 inline mr-1.5 text-teal" />
                            Status
                        </label>
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none transition-all appearance-none bg-white text-navy-primary font-medium"
                            >
                                <option value="all">All Statuses</option>
                                <option value="private">Private</option>
                                <option value="verified">Verified</option>
                                <option value="released">Released</option>
                                <option value="rejected">Rejected</option>
                            </select>
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                                ▼
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-navy-primary mb-2">
                            <Filter className="w-4 h-4 inline mr-1.5 text-teal" />
                            Deal
                        </label>
                        <div className="relative">
                            <select
                                value={dealFilter}
                                onChange={(e) => setDealFilter(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none transition-all appearance-none bg-white text-navy-primary font-medium"
                            >
                                <option value="all">All Deals</option>
                                {deals.map(deal => (
                                    <option key={deal.id} value={deal.id}>
                                        {deal.title} - {deal.propertyAddress}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                                ▼
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Count */}
            <div className="mb-4 text-sm font-medium text-text-light flex items-center gap-2">
                <div className="h-px bg-gray-200 flex-grow"></div>
                <span>
                    Found <strong className="text-navy-primary">{filteredDocuments.length}</strong> document{filteredDocuments.length !== 1 ? 's' : ''}
                    {searchQuery && <span className="text-text-secondary"> matching "{searchQuery}"</span>}
                </span>
                <div className="h-px bg-gray-200 flex-grow"></div>
            </div>

            {/* Table */}
            {filteredDocuments.length === 0 ? (
                <div className="text-center py-16 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-navy-primary font-bold text-lg mb-2">No documents found</p>
                    <p className="text-text-secondary">Try adjusting your search or filters</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="text-left py-4 px-6 text-xs font-bold text-text-light uppercase tracking-wider">Document</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-text-light uppercase tracking-wider">Deal</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-text-light uppercase tracking-wider">Participant</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-text-light uppercase tracking-wider">Uploaded</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-text-light uppercase tracking-wider">Status</th>
                                    <th className="text-right py-4 px-6 text-xs font-bold text-text-light uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredDocuments.map((item) => (
                                    <tr key={`${item.taskId}-${item.doc.id}`} className="hover:bg-teal/[0.02] transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-50 rounded-lg text-gray-400 group-hover:text-teal group-hover:bg-teal/10 transition-colors">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-navy-primary group-hover:text-teal transition-colors">{item.doc.title_en}</div>
                                                    <div className="text-xs text-text-light font-medium">{item.taskTitle}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="font-bold text-navy-primary text-sm">{item.dealTitle}</div>
                                            <div className="text-xs text-text-light font-medium mt-0.5">{item.dealAddress}</div>
                                            {item.dealStatus === 'closed' && (
                                                <span className="inline-block mt-1.5 px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wider rounded border border-gray-200">
                                                    CLOSED
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-text-secondary text-sm font-medium">
                                            {item.participantName}
                                        </td>
                                        <td className="py-4 px-6 text-text-secondary text-sm">
                                            {new Date(item.doc.uploadedAt).toLocaleDateString()}
                                            <div className="text-xs text-text-light opacity-60 font-medium">
                                                {new Date(item.doc.uploadedAt).toLocaleTimeString()}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md shadow-sm border ${getStatusBadge(item.doc.status)} border-opacity-20`}>
                                                {getStatusLabel(item.doc.status)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setPreviewDoc(item.doc)}
                                                    className="p-2 text-text-light hover:text-teal hover:bg-teal/10 rounded-lg transition-colors"
                                                    title="View Document"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleViewDeal(item.dealId)}
                                                    className="p-2 text-text-light hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
