'use client';

import { useData } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import { useTranslation } from '@/lib/useTranslation';
import { FileText, Eye, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DocumentPreviewModal from '@/components/deal/DocumentPreviewModal';
import { DealDocument } from '@/lib/types';

export default function PendingReviewTab() {
    const { deals, tasks, users, verifyDocument, rejectDocument, releaseDocument } = useData();
    const { user } = useAuth();
    const { t } = useTranslation();
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
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-navy-primary font-serif mb-2 flex items-center gap-2">
                    ⏳ {t('archive.pending.title')}
                </h2>
                <p className="text-text-secondary">
                    {t('archive.pending.subtitle')}
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-yellow-50/50 to-white border border-yellow-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-3xl font-bold text-yellow-600 font-serif mb-1">
                        {pendingDocuments.filter(p => p.doc.status === 'private').length}
                    </div>
                    <div className="text-sm font-bold text-yellow-800/60 uppercase tracking-wider">{t('archive.pending.awaitingVerification')}</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50/50 to-white border border-blue-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-3xl font-bold text-blue-600 font-serif mb-1">
                        {pendingDocuments.filter(p => p.doc.status === 'verified').length}
                    </div>
                    <div className="text-sm font-bold text-blue-800/60 uppercase tracking-wider">{t('archive.pending.awaitingRelease')}</div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-3xl font-bold text-navy-primary font-serif mb-1">
                        {pendingDocuments.length}
                    </div>
                    <div className="text-sm font-bold text-text-light uppercase tracking-wider">{t('archive.pending.totalPending')}</div>
                </div>
            </div>

            {/* Table */}
            {pendingDocuments.length === 0 ? (
                <div className="text-center py-16 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4 opacity-80" />
                    <p className="text-navy-primary font-bold text-lg mb-2">{t('archive.pending.allCaughtUp')}</p>
                    <p className="text-text-secondary">{t('archive.pending.noDocs')}</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="text-left py-4 px-6 text-xs font-bold text-text-light uppercase tracking-wider">{t('deal.header.deal')}</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-text-light uppercase tracking-wider">{t('common.view')}</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-text-light uppercase tracking-wider">{t('participants.table.role')}</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-text-light uppercase tracking-wider">{t('dashboard.table.date')}</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-text-light uppercase tracking-wider">{t('deal.header.status')}</th>
                                    <th className="text-right py-4 px-6 text-xs font-bold text-text-light uppercase tracking-wider">{t('participants.pagination.of')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {pendingDocuments.map((item, index) => (
                                    <tr key={`${item.taskId}-${item.doc.id}`} className="hover:bg-teal/[0.02] transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="font-bold text-navy-primary group-hover:text-teal transition-colors">{item.dealTitle}</div>
                                            <div className="text-xs text-text-light font-medium mt-0.5">{item.dealAddress}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-4 h-4 text-teal opacity-70" />
                                                <div>
                                                    <div className="font-bold text-navy-primary text-sm">{item.doc.title_en}</div>
                                                    <div className="text-xs text-text-light font-medium">{item.taskTitle}</div>
                                                </div>
                                            </div>
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
                                            {item.doc.status === 'private' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-md border border-yellow-200/50">
                                                    ⏳ {t('archive.pending.needsVerification')}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-md border border-blue-200/50">
                                                    ✓ {t('archive.pending.needsRelease')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setPreviewDoc(item.doc)}
                                                    className="p-2 text-text-light hover:text-teal hover:bg-teal/10 rounded-lg transition-colors"
                                                    title={t('common.view')}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleViewDeal(item.dealId)}
                                                    className="p-2 text-text-light hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title={t('common.viewDeal')}
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                                {item.doc.status === 'private' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleVerify(item.taskId, item.doc.id)}
                                                            className="px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 shadow-md shadow-green-200 transition-all hover:scale-105"
                                                        >
                                                            {t('deal.verify')}
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(item.taskId, item.doc.id)}
                                                            className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors"
                                                        >
                                                            {t('deal.reject')}
                                                        </button>
                                                    </>
                                                )}
                                                {item.doc.status === 'verified' && user && (
                                                    <button
                                                        onClick={() => releaseDocument(user.id, item.taskId, item.doc.id)}
                                                        className="px-3 py-1.5 bg-navy-primary text-white text-xs font-bold rounded-lg hover:bg-navy-secondary shadow-md shadow-navy-primary/20 transition-all hover:scale-105"
                                                    >
                                                        {t('deal.release')}
                                                    </button>
                                                )}
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
