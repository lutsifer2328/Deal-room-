'use client';

import { useData } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import { Archive, FileText, Eye, ExternalLink, Calendar } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DocumentPreviewModal from '@/components/deal/DocumentPreviewModal';
import { DealDocument, Deal } from '@/lib/types';

export default function ClosedDealsTab() {
    const { deals, tasks } = useData();
    const { user } = useAuth();
    const router = useRouter();
    const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
    const [previewDoc, setPreviewDoc] = useState<DealDocument | null>(null);

    if (!user) return null;

    // Get closed deals relevant to the user
    const closedDeals = deals.filter(deal => {
        if (deal.status !== 'closed') return false;

        // Admin/Lawyer/Staff can see all (based on permissions)
        if (user.permissions.canViewAllDeals) return true;

        // Participants only see deals they are part of
        return deal.participants.some(p => p.role === user.role && p.isActive);
    });

    // Sort by creation date (newest first)
    closedDeals.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Get documents for selected deal
    const getDocumentsForDeal = (dealId: string) => {
        const dealTasks = tasks.filter(task => task.dealId === dealId);
        const documents: Array<{
            doc: DealDocument;
            taskTitle: string;
            participantName: string;
        }> = [];

        dealTasks.forEach(task => {
            const deal = deals.find(d => d.id === dealId);
            const participant = deal?.participants.find(p => p.role === task.assignedTo);

            task.documents.forEach(doc => {
                documents.push({
                    doc,
                    taskTitle: task.title_en,
                    participantName: participant?.fullName || 'Unknown'
                });
            });
        });

        return documents;
    };

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
                    📦 Closed Deals
                </h2>
                <p className="text-text-secondary">
                    Access documentation from completed deals
                </p>
            </div>

            {/* Stats - Only visible to internal team */}
            {user.permissions.canViewAllDeals && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-white/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-3xl font-bold text-navy-primary font-serif mb-1">
                            {closedDeals.length}
                        </div>
                        <div className="text-sm font-bold text-text-light uppercase tracking-wider">Closed Deals</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50/50 to-white border border-blue-50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-3xl font-bold text-blue-600 font-serif mb-1">
                            {closedDeals.reduce((sum, deal) => {
                                const dealTasks = tasks.filter(t => t.dealId === deal.id);
                                return sum + dealTasks.reduce((taskSum, task) => taskSum + task.documents.length, 0);
                            }, 0)}
                        </div>
                        <div className="text-sm font-bold text-blue-800/60 uppercase tracking-wider">Total Documents</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50/50 to-white border border-green-50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-3xl font-bold text-green-600 font-serif mb-1">
                            {closedDeals.reduce((sum, deal) => sum + deal.participants.length, 0)}
                        </div>
                        <div className="text-sm font-bold text-green-800/60 uppercase tracking-wider">Total Participants</div>
                    </div>
                </div>
            )}

            {/* Closed Deals List */}
            {closedDeals.length === 0 ? (
                <div className="text-center py-16 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                    <Archive className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-text-light font-medium mb-2">No closed deals yet</p>
                    <p className="text-sm text-text-light/70">Completed deals will appear here</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {closedDeals.map((deal) => {
                        const dealDocuments = getDocumentsForDeal(deal.id);
                        const isExpanded = selectedDealId === deal.id;

                        return (
                            <div
                                key={deal.id}
                                className={`bg-white border transition-all duration-300 overflow-hidden ${isExpanded
                                    ? 'rounded-3xl border-teal/20 shadow-lg shadow-teal/5 ring-1 ring-teal/10'
                                    : 'rounded-2xl border-gray-100 shadow-sm hover:shadow-md hover:border-teal/30'
                                    }`}
                            >
                                {/* Deal Header */}
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setSelectedDealId(isExpanded ? null : deal.id)}
                                    className="w-full flex items-center justify-between p-6 text-left group cursor-pointer"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={`p-3 rounded-xl transition-colors ${isExpanded ? 'bg-teal text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-teal/10 group-hover:text-teal'
                                            }`}>
                                            <Archive className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-lg text-navy-primary group-hover:text-teal transition-colors font-serif">{deal.title}</div>
                                            <div className="text-sm text-text-secondary font-medium mt-0.5">{deal.propertyAddress}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right hidden sm:block">
                                            <div className="flex items-center gap-2 text-sm font-bold text-text-secondary">
                                                <Calendar className="w-4 h-4 text-teal" />
                                                {new Date(deal.createdAt).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-text-light font-medium mt-1">
                                                {dealDocuments.length} document{dealDocuments.length !== 1 ? 's' : ''}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewDeal(deal.id);
                                                }}
                                                className="p-2 text-text-light hover:text-white hover:bg-teal rounded-lg transition-all"
                                                title="View Deal"
                                            >
                                                <ExternalLink className="w-5 h-5" />
                                            </button>
                                            <span className={`text-gray-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                                ▼
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Documents Table (Expanded) */}
                                {isExpanded && dealDocuments.length > 0 && (
                                    <div className="border-t border-gray-100 bg-gray-50/30">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-100">
                                                    <th className="text-left py-3 px-6 text-xs font-bold text-text-light uppercase tracking-wider">Document</th>
                                                    <th className="text-left py-3 px-6 text-xs font-bold text-text-light uppercase tracking-wider">Participant</th>
                                                    <th className="text-left py-3 px-6 text-xs font-bold text-text-light uppercase tracking-wider">Uploaded</th>
                                                    <th className="text-left py-3 px-6 text-xs font-bold text-text-light uppercase tracking-wider">Status</th>
                                                    <th className="text-right py-3 px-6 text-xs font-bold text-text-light uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {dealDocuments.map((item, index) => (
                                                    <tr key={item.doc.id} className="hover:bg-white transition-colors">
                                                        <td className="py-3 px-6">
                                                            <div className="flex items-center gap-3">
                                                                <FileText className="w-4 h-4 text-teal opacity-70" />
                                                                <div>
                                                                    <div className="font-bold text-navy-primary text-sm">{item.doc.title_en}</div>
                                                                    <div className="text-xs text-text-light font-medium">{item.taskTitle}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-6 text-text-secondary text-sm font-medium">
                                                            {item.participantName}
                                                        </td>
                                                        <td className="py-3 px-6 text-text-secondary text-sm">
                                                            {new Date(item.doc.uploadedAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="py-3 px-6">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md ${getStatusBadge(item.doc.status)}`}>
                                                                {getStatusLabel(item.doc.status)}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-6 text-right">
                                                            <button
                                                                onClick={() => setPreviewDoc(item.doc)}
                                                                className="p-2 text-text-light hover:text-teal hover:bg-teal/10 rounded-lg transition-colors"
                                                                title="View Document"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {isExpanded && dealDocuments.length === 0 && (
                                    <div className="p-12 text-center text-text-light text-sm border-t border-gray-100 bg-gray-50/30">
                                        No documents in this deal
                                    </div>
                                )}
                            </div>
                        );
                    })}
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
