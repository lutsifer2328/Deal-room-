'use client';

import { useData } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import { FileText, Eye, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DocumentPreviewModal from '@/components/deal/DocumentPreviewModal';
import { DealDocument } from '@/lib/types';

export default function PendingReviewTab() {
    const { deals, tasks, users, verifyDocument, rejectDocument, releaseDocument } = useData();
    const { user } = useAuth();
    const router = useRouter();
    const [previewDoc, setPreviewDoc] = useState<DealDocument | null>(null);

    if (!user) return null;

    // Get all documents with status 'private' or 'verified' (pending review/release)
    const pendingDocuments: Array<{
        doc: DealDocument;
        taskId: string;
        taskTitle: string;
        dealId: string;
        dealTitle: string;
        dealAddress: string;
        participantName: string;
    }> = [];

    tasks.forEach(task => {
        const deal = deals.find(d => d.id === task.dealId);
        if (!deal || deal.status === 'closed') return;

        const participant = deal.participants.find(p => p.role === task.assignedTo);

        task.documents.forEach(doc => {
            if (doc.status === 'private' || doc.status === 'verified') {
                pendingDocuments.push({
                    doc,
                    taskId: task.id,
                    taskTitle: task.title_en,
                    dealId: deal.id,
                    dealTitle: deal.title,
                    dealAddress: deal.propertyAddress,
                    participantName: participant?.fullName || 'Unknown'
                });
            }
        });
    });

    // Sort by upload date (newest first)
    pendingDocuments.sort((a, b) =>
        new Date(b.doc.uploadedAt).getTime() - new Date(a.doc.uploadedAt).getTime()
    );

    const handleVerify = (taskId: string, docId: string) => {
        if (user) {
            verifyDocument(user.id, taskId, docId);
        }
    };

    const handleReject = (taskId: string, docId: string) => {
        const reason = prompt('Enter rejection reason:');
        if (reason && user) {
            rejectDocument(user.id, taskId, docId, reason, reason);
        }
    };

    const handleViewDeal = (dealId: string) => {
        router.push(`/deal/${dealId}`);
    };

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-xl font-bold text-midnight mb-2">⏳ Pending Review</h2>
                <p className="text-sm text-gray-600">
                    All documents awaiting approval across all active deals
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-yellow-700">
                        {pendingDocuments.filter(p => p.doc.status === 'private').length}
                    </div>
                    <div className="text-sm text-yellow-600">Awaiting Verification</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-700">
                        {pendingDocuments.filter(p => p.doc.status === 'verified').length}
                    </div>
                    <div className="text-sm text-blue-600">Awaiting Release</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-700">
                        {pendingDocuments.length}
                    </div>
                    <div className="text-sm text-gray-600">Total Pending</div>
                </div>
            </div>

            {/* Table */}
            {pendingDocuments.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">All caught up!</p>
                    <p className="text-sm text-gray-500">No documents pending review</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="text-left py-3 px-4 font-bold text-midnight">Deal</th>
                                <th className="text-left py-3 px-4 font-bold text-midnight">Document</th>
                                <th className="text-left py-3 px-4 font-bold text-midnight">Participant</th>
                                <th className="text-left py-3 px-4 font-bold text-midnight">Uploaded</th>
                                <th className="text-left py-3 px-4 font-bold text-midnight">Status</th>
                                <th className="text-right py-3 px-4 font-bold text-midnight">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingDocuments.map((item, index) => (
                                <tr key={`${item.taskId}-${item.doc.id}`} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-4">
                                        <div className="font-medium text-midnight">{item.dealTitle}</div>
                                        <div className="text-xs text-gray-500">{item.dealAddress}</div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <div className="font-medium text-midnight">{item.doc.title_en}</div>
                                                <div className="text-xs text-gray-500">{item.taskTitle}</div>
                                            </div>
                                        </div>
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
                                        {item.doc.status === 'private' ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded">
                                                ⏳ Needs Verification
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                                                ✓ Needs Release
                                            </span>
                                        )}
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
                                            {item.doc.status === 'private' && (
                                                <>
                                                    <button
                                                        onClick={() => handleVerify(item.taskId, item.doc.id)}
                                                        className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 transition-colors"
                                                    >
                                                        Verify
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(item.taskId, item.doc.id)}
                                                        className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {item.doc.status === 'verified' && user && (
                                                <button
                                                    onClick={() => releaseDocument(user.id, item.taskId, item.doc.id)}
                                                    className="px-3 py-1 bg-midnight text-white text-xs font-bold rounded hover:bg-midnight/90 transition-colors"
                                                >
                                                    Release
                                                </button>
                                            )}
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
