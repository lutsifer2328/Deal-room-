'use client';

import { useData } from '@/lib/store';
import { User } from '@/lib/types';
import { useAuth } from '@/lib/authContext';
import { useTranslation } from '@/lib/useTranslation';
import { FileText, Eye, CheckCircle, ExternalLink } from 'lucide-react';
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

    // Resolve uploader name from user ID — same pattern as SearchAllDocumentsTab
    const resolveUploaderName = (uploadedBy: string | undefined, deal: any): string => {
        if (!uploadedBy) return 'Admin';
        // Check internal users map first
        const internalUser: User | undefined = users[uploadedBy];
        if (internalUser) return internalUser.name;
        // Check deal participants
        const participant = deal?.participants?.find((p: any) => p.userId === uploadedBy || p.id === uploadedBy);
        if (participant) return participant.fullName || participant.email || 'Participant';
        return 'Admin';
    };

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

        task.documents.forEach(doc => {
            if (doc.status === 'private' || doc.status === 'verified') {
                pendingDocuments.push({
                    doc,
                    taskId: task.id,
                    taskTitle: task.title_en,
                    dealId: deal.id,
                    dealTitle: deal.title,
                    dealAddress: deal.propertyAddress,
                    participantName: resolveUploaderName(doc.uploadedBy, deal)
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
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-3xl font-bold text-yellow-600 font-serif mb-1">
                        {pendingDocuments.filter(p => p.doc.status === 'private').length}
                    </div>
                    <div className="text-sm font-bold text-text-light uppercase tracking-wider">{t('archive.pending.awaitingVerification')}</div>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-3xl font-bold text-blue-600 font-serif mb-1">
                        {pendingDocuments.filter(p => p.doc.status === 'verified').length}
                    </div>
                    <div className="text-sm font-bold text-text-light uppercase tracking-wider">{t('archive.pending.awaitingRelease')}</div>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
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
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm flex flex-col">
                    {/* Desktop Header */}
                    <div className="hidden xl:flex items-center gap-4 bg-gray-50/50 border-b border-gray-100 py-4 px-6 text-xs font-bold text-text-light uppercase tracking-widest font-sans">
                        <div className="w-[18%] min-w-[120px]">{t('deal.header.deal')}</div>
                        <div className="flex-1 min-w-[150px]">Document</div>
                        <div className="w-[15%] min-w-[120px]">Uploader</div>
                        <div className="w-[100px] shrink-0">{t('dashboard.table.date')}</div>
                        <div className="w-[160px] shrink-0">{t('deal.header.status')}</div>
                        <div className="w-[200px] shrink-0 text-right">Actions</div>
                    </div>

                    <div className="divide-y divide-gray-50 flex flex-col">
                        {pendingDocuments.map((item) => (
                            <div key={`${item.taskId}-${item.doc.id}`} className="flex flex-col xl:flex-row gap-4 xl:items-center py-5 px-6 hover:bg-teal/[0.02] transition-colors group">
                                {/* Deal */}
                                <div className="xl:w-[18%] xl:min-w-[120px] flex flex-col min-w-0">
                                    <div className="text-xs font-bold text-text-light uppercase xl:hidden mb-1">{t('deal.header.deal')}</div>
                                    <div className="font-bold text-navy-primary group-hover:text-teal transition-colors line-clamp-1">{item.dealTitle}</div>
                                    <div className="text-xs text-text-light font-medium mt-0.5 line-clamp-1">{item.dealAddress}</div>
                                </div>

                                {/* Document */}
                                <div className="xl:flex-1 xl:min-w-[150px] flex flex-col min-w-0">
                                    <div className="text-xs font-bold text-text-light uppercase xl:hidden mb-1 mt-2">Document</div>
                                    <div className="flex items-start gap-3">
                                        <FileText className="w-4 h-4 text-teal opacity-70 mt-0.5 shrink-0" />
                                        <div className="min-w-0">
                                            <div className="font-bold text-navy-primary text-sm line-clamp-1">{item.taskTitle}</div>
                                            <div className="text-xs text-text-light font-medium line-clamp-1 flex items-center gap-1">
                                                <span>📎</span>
                                                <span className="truncate">{item.doc.title_en}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Uploader */}
                                <div className="xl:w-[15%] xl:min-w-[120px] flex flex-col min-w-0">
                                    <div className="text-xs font-bold text-text-light uppercase xl:hidden mb-1 mt-2">Uploader</div>
                                    <div className="text-text-secondary text-sm font-medium line-clamp-1">
                                        {item.participantName}
                                    </div>
                                </div>

                                {/* Date */}
                                <div className="xl:w-[100px] shrink-0 flex flex-col min-w-0">
                                    <div className="text-xs font-bold text-text-light uppercase xl:hidden mb-1 mt-2">{t('dashboard.table.date')}</div>
                                    <div className="text-text-secondary text-sm">
                                        {new Date(item.doc.uploadedAt).toLocaleDateString()}
                                        <div className="text-xs text-text-light opacity-60 font-medium">
                                            {new Date(item.doc.uploadedAt).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="xl:w-[160px] shrink-0 flex flex-col items-start w-full xl:w-auto">
                                    <div className="text-xs font-bold text-text-light uppercase xl:hidden mb-1 mt-2">{t('deal.header.status')}</div>
                                    <div className="flex">
                                        {item.doc.status === 'private' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-md border border-yellow-200/50 whitespace-nowrap">
                                                ⏳ {t('archive.pending.needsVerification')}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-md border border-blue-200/50 whitespace-nowrap">
                                                ✓ {t('archive.pending.needsRelease')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="xl:w-[200px] shrink-0 flex xl:justify-end gap-2 mt-4 xl:mt-0 pt-4 xl:pt-0 border-t border-gray-100 xl:border-0 w-full xl:w-auto min-w-0">
                                    <button
                                        onClick={() => setPreviewDoc(item.doc)}
                                        className="p-2 text-text-light hover:text-teal hover:bg-teal/10 rounded-lg transition-colors shrink-0"
                                        title={t('common.view')}
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleViewDeal(item.dealId)}
                                        className="p-2 text-text-light hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0"
                                        title={t('common.viewDeal')}
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </button>
                                    {item.doc.status === 'private' && (
                                        <>
                                            <button
                                                onClick={() => handleVerify(item.taskId, item.doc.id)}
                                                className="px-3 py-2 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 shadow-md shadow-green-200/50 transition-all hover:scale-105 shrink-0 whitespace-nowrap"
                                            >
                                                {t('deal.verify')}
                                            </button>
                                            <button
                                                onClick={() => handleReject(item.taskId, item.doc.id)}
                                                className="px-3 py-2 bg-red-50 text-red-600 border border-red-100 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors shrink-0 whitespace-nowrap"
                                            >
                                                {t('deal.reject')}
                                            </button>
                                        </>
                                    )}
                                    {item.doc.status === 'verified' && user && (
                                        <button
                                            onClick={() => releaseDocument(user.id, item.taskId, item.doc.id)}
                                            className="px-4 py-2 bg-navy-primary text-white text-xs font-bold rounded-lg hover:bg-navy-secondary shadow-md shadow-navy-primary/20 transition-all hover:scale-105 shrink-0 whitespace-nowrap"
                                        >
                                            {t('deal.release')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
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
