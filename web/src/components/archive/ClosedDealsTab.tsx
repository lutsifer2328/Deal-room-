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

    // Get all closed deals
    const closedDeals = deals.filter(deal => deal.status === 'closed');

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
            <div className="mb-6">
                <h2 className="text-xl font-bold text-midnight mb-2">📦 Closed Deals</h2>
                <p className="text-sm text-gray-600">
                    Access documentation from completed deals
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-700">
                        {closedDeals.length}
                    </div>
                    <div className="text-sm text-gray-600">Closed Deals</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-700">
                        {closedDeals.reduce((sum, deal) => {
                            const dealTasks = tasks.filter(t => t.dealId === deal.id);
                            return sum + dealTasks.reduce((taskSum, task) => taskSum + task.documents.length, 0);
                        }, 0)}
                    </div>
                    <div className="text-sm text-blue-600">Total Documents</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-700">
                        {closedDeals.reduce((sum, deal) => sum + deal.participants.length, 0)}
                    </div>
                    <div className="text-sm text-green-600">Total Participants</div>
                </div>
            </div>

            {/* Closed Deals List */}
            {closedDeals.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Archive className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">No closed deals yet</p>
                    <p className="text-sm text-gray-500">Completed deals will appear here</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {closedDeals.map((deal) => {
                        const dealDocuments = getDocumentsForDeal(deal.id);
                        const isExpanded = selectedDealId === deal.id;

                        return (
                            <div key={deal.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                {/* Deal Header */}
                                <button
                                    onClick={() => setSelectedDealId(isExpanded ? null : deal.id)}
                                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <Archive className="w-5 h-5 text-gray-600" />
                                        <div className="text-left">
                                            <div className="font-bold text-midnight">{deal.title}</div>
                                            <div className="text-sm text-gray-600">{deal.propertyAddress}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(deal.createdAt).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {dealDocuments.length} document{dealDocuments.length !== 1 ? 's' : ''}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewDeal(deal.id);
                                            }}
                                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            title="View Deal"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </button>
                                        <span className="text-gray-400">
                                            {isExpanded ? '▼' : '▶'}
                                        </span>
                                    </div>
                                </button>

                                {/* Documents Table (Expanded) */}
                                {isExpanded && dealDocuments.length > 0 && (
                                    <div className="border-t border-gray-200">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-200 bg-gray-50">
                                                    <th className="text-left py-2 px-4 font-bold text-midnight text-sm">Document</th>
                                                    <th className="text-left py-2 px-4 font-bold text-midnight text-sm">Participant</th>
                                                    <th className="text-left py-2 px-4 font-bold text-midnight text-sm">Uploaded</th>
                                                    <th className="text-left py-2 px-4 font-bold text-midnight text-sm">Status</th>
                                                    <th className="text-right py-2 px-4 font-bold text-midnight text-sm">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dealDocuments.map((item, index) => (
                                                    <tr key={item.doc.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                        <td className="py-2 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="w-4 h-4 text-gray-400" />
                                                                <div>
                                                                    <div className="font-medium text-midnight text-sm">{item.doc.title_en}</div>
                                                                    <div className="text-xs text-gray-500">{item.taskTitle}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-2 px-4 text-gray-600 text-sm">
                                                            {item.participantName}
                                                        </td>
                                                        <td className="py-2 px-4 text-gray-600 text-sm">
                                                            {new Date(item.doc.uploadedAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="py-2 px-4">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded ${getStatusBadge(item.doc.status)}`}>
                                                                {getStatusLabel(item.doc.status)}
                                                            </span>
                                                        </td>
                                                        <td className="py-2 px-4 text-right">
                                                            <button
                                                                onClick={() => setPreviewDoc(item.doc)}
                                                                className="p-2 text-gray-600 hover:text-teal hover:bg-teal/10 rounded transition-colors"
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
                                    <div className="p-8 text-center text-gray-500 text-sm border-t border-gray-200">
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
