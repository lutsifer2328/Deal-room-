'use client';

import { useParams } from 'next/navigation';
import { useData } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import DealHeader from '@/components/deal/DealHeader';
import SingleProgressBar from '@/components/deal/SingleProgressBar';
import { FileText, Lock, ShieldCheck, Download, Upload, AlertTriangle, Eye, Mail } from 'lucide-react';
import { Task, DealDocument, Deal } from '@/lib/types';
import { useState } from 'react';
import CreateTaskModal from '@/components/deal/CreateTaskModal';
import RejectionModal from '@/components/deal/RejectionModal';
import AuditLogPanel from '@/components/deal/AuditLogPanel';
import UploadModal from '@/components/deal/UploadModal';
import DocumentPreviewModal from '@/components/deal/DocumentPreviewModal';
import TaskComments from '@/components/deal/TaskComments';
import { useTranslation, TranslationKey } from '@/lib/useTranslation';

export default function DealDetailPage() {
    const params = useParams();
    const dealId = params?.id as string;
    const { user } = useAuth();
    const { deals, tasks } = useData();
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const { t } = useTranslation();

    const deal = deals.find(d => d.id === dealId);

    if (!user) return <div className="p-10 text-center">{t('common.loading')}</div>;
    if (!deal) return <div className="p-10 text-center">Deal not found</div>;

    const relevantTasks = tasks.filter(t => {
        if (t.dealId !== deal.id) return false;
        if (user.role === 'lawyer' || user.role === 'admin') return true;
        if (user.role === 'agent') return true;
        return t.assignedTo === user.role;
    });

    // Group tasks by participant/role
    const groupedTasks = relevantTasks.reduce((acc: Record<string, { participant?: Deal['participants'][0], role: string, tasks: Task[] }>, task: Task) => {
        const participant = deal.participants.find(p => p.role === task.assignedTo && p.isActive);
        const key = participant ? participant.id : task.assignedTo;

        if (!acc[key]) {
            acc[key] = {
                participant,
                role: task.assignedTo,
                tasks: []
            };
        }
        acc[key].tasks.push(task);
        return acc;
    }, {});

    return (
        <div className="max-w-5xl mx-auto pb-20">
            <DealHeader deal={deal} />
            <SingleProgressBar deal={deal} />

            <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-midnight">{t('deal.requiredDocs')}</h2>
                        {(user.role === 'lawyer' || user.role === 'admin') && (
                            <button
                                onClick={() => setIsTaskModalOpen(true)}
                                className="text-sm text-gold font-bold hover:underline"
                            >
                                + {t('deal.addRequirement')}
                            </button>
                        )}
                    </div>

                    {Object.values(groupedTasks).map(group => (
                        <ParticipantTaskGroup
                            key={group.participant ? group.participant.id : group.role}
                            participant={group.participant}
                            role={group.role}
                            tasks={group.tasks}
                            userRole={user.role}
                        />
                    ))}

                    {relevantTasks.length === 0 && (
                        <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-gray-500">{t('deal.noRequirements')}</p>
                        </div>
                    )}
                </div>

                <div className="col-span-1">
                    <div className="bg-midnight/5 rounded-xl p-6 border border-midnight/10 sticky top-24">
                        <h3 className="font-bold text-midnight mb-2">{t('deal.infoTitle')}</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            {t('deal.infoPrefix')} <strong>Agenzia Legal</strong>{t('deal.infoSuffix')}
                        </p>
                        <div className="flex items-center gap-2 text-xs font-medium text-teal">
                            <ShieldCheck className="w-4 h-4" />
                            <span>{t('deal.encryption')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {isTaskModalOpen && <CreateTaskModal deal={deal} onClose={() => setIsTaskModalOpen(false)} />}
            <AuditLogPanel />
        </div>
    );
}

function ParticipantTaskGroup({ participant, role, tasks, userRole }: {
    participant?: Deal['participants'][0],
    role: string,
    tasks: Task[],
    userRole: string
}) {
    const { t } = useTranslation();
    const roleColors = {
        'buyer': 'bg-teal/10 text-teal border-teal/20',
        'seller': 'bg-blue-100 text-blue-700 border-blue-200',
        'agent': 'bg-purple-100 text-purple-700 border-purple-200',
        'lawyer': 'bg-gold/10 text-gold border-gold/20',
        'admin': 'bg-gray-100 text-gray-700 border-gray-200'
    } as Record<string, string>;

    const getTranslatedRole = (role: string) => {
        const key = `role.${role}` as TranslationKey;
        return t(key).startsWith('role.') ? role : t(key);
    };

    return (
        <div className="bg-white rounded-3xl shadow-lg shadow-navy-primary/5 border border-white/20 overflow-hidden backdrop-blur-xl mb-6">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-4">
                <span className={`text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider border ${roleColors[role] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                    {getTranslatedRole(role)}
                </span>
                {participant ? (
                    <span className="font-serif font-bold text-navy-primary text-xl tracking-tight">
                        {participant.fullName}
                    </span>
                ) : (
                    <span className="font-serif font-bold text-text-light italic">
                        {t('deal.unassigned')}
                    </span>
                )}
                {participant && (
                    <div className="flex items-center gap-2 text-xs text-text-light font-medium ml-auto bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                        <Mail className="w-3 h-3 text-teal" />
                        {participant.email}
                    </div>
                )}
            </div>

            {/* Tasks List */}
            <div className="divide-y divide-gray-50">
                {tasks.map(task => (
                    <TaskItem key={task.id} task={task} userRole={userRole} />
                ))}
            </div>
        </div>
    );
}

function TaskItem({ task, userRole }: { task: Task, userRole: string }) {
    const { t } = useTranslation();
    const isOwner = userRole === task.assignedTo;
    const isLawyer = userRole === 'lawyer';
    const isAdmin = userRole === 'admin';
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const getStatusLabel = (status: string) => {
        const key = `status.${status}` as TranslationKey;
        return t(key).startsWith('status.') ? status.replace('_', ' ') : t(key);
    };

    return (
        <div className="p-6 hover:bg-teal/[0.02] transition-all duration-300 group">
            <div className="flex justify-between items-start mb-5">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-navy-primary text-lg">{task.title_en}</h4>
                        {task.required && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 shadow-sm">* {t('deal.required')}</span>}
                    </div>
                    {task.title_bg && <p className="text-sm text-text-light">{task.title_bg}</p>}
                </div>

                <div>
                    {task.status === 'completed' ? (
                        <span className="flex items-center gap-1.5 text-success font-bold text-xs bg-success/10 px-3 py-1 rounded-full border border-success/20 shadow-sm">
                            <ShieldCheck className="w-3.5 h-3.5" /> {t('status.verified')}
                        </span>
                    ) : (
                        <span className="text-xs font-bold text-text-secondary bg-gray-100/80 px-3 py-1 rounded-full border border-gray-200">
                            {getStatusLabel(task.status)}
                        </span>
                    )}
                </div>
            </div>

            {/* Documents */}
            <div className="bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden">
                {task.documents.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {task.documents.map(doc => (
                            <div key={doc.id} className="p-4 bg-white/50 hover:bg-white transition-colors">
                                <DocumentRow doc={doc} userRole={userRole} taskId={task.id} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-6 flex justify-between items-center text-sm bg-white/50">
                        <span className="text-text-light italic flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-gray-400" />
                            </div>
                            {t('deal.noDocs')}
                        </span>
                        {(isOwner || isLawyer || isAdmin) && (
                            <button
                                onClick={() => setIsUploadModalOpen(true)}
                                className="flex items-center gap-2 text-white font-bold bg-teal hover:bg-teal/90 shadow-md shadow-teal/20 transition-all text-sm px-4 py-2 rounded-xl transform hover:scale-105"
                            >
                                <Upload className="w-4 h-4" /> {t('deal.upload')}
                            </button>
                        )}
                    </div>
                )}

                {/* Comments */}
                <div className="border-t border-gray-100 bg-white p-2">
                    <TaskComments task={task} />
                </div>
            </div>

            {isUploadModalOpen && (
                <UploadModal
                    taskId={task.id}
                    taskTitle={task.title_en}
                    onClose={() => setIsUploadModalOpen(false)}
                />
            )}
        </div>
    );
}

function DocumentRow({ doc, userRole, taskId }: { doc: DealDocument, userRole: string, taskId: string }) {
    const { verifyDocument, releaseDocument, rejectDocument } = useData();
    const { user } = useAuth();
    const { t } = useTranslation();
    const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const isLawyer = userRole === 'lawyer';
    const isOwner = userRole === doc.uploadedBy;
    const canDownload = isLawyer || isOwner || doc.status === 'released';
    const canSeeMetadata = isLawyer || isOwner || doc.status !== 'private';

    if (!canSeeMetadata) return null;

    return (
        <>
            <div className={`flex items-center justify-between transition-all rounded-xl ${doc.status === 'rejected' ? 'bg-red-50/50 p-2 -m-2' : ''}`}>
                <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl shadow-sm ${doc.status === 'rejected' ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-teal'}`}>
                        {doc.status === 'rejected' ? <AlertTriangle className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div>
                        <div className="text-sm font-bold text-navy-primary flex items-center gap-2 mb-0.5">
                            {doc.title_en}
                            {!canDownload && doc.status !== 'rejected' && <Lock className="w-3 h-3 text-gold" />}
                        </div>
                        {doc.status === 'rejected' ? (
                            <div className="text-xs text-red-600 font-bold bg-red-100/50 px-2 py-0.5 rounded-md inline-block">
                                {t('deal.rejected')}: {doc.rejectionReason_en}
                            </div>
                        ) : (
                            <div className="text-xs text-text-light font-medium">{doc.uploadedAt}</div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Button - Available to Lawyer */}
                    {isLawyer && (
                        <button
                            onClick={() => setIsPreviewOpen(true)}
                            className="p-2 text-teal bg-teal/5 hover:bg-teal/10 rounded-lg transition-colors border border-teal/10"
                            title={t('deal.view')}
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                    )}

                    {isLawyer && user && (
                        <>
                            {doc.status !== 'rejected' && (
                                <button
                                    onClick={() => setIsRejectionModalOpen(true)}
                                    className="px-3 py-1.5 text-danger bg-red-50 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors"
                                >
                                    {t('deal.reject')}
                                </button>
                            )}

                            {(doc.status === 'private' || doc.status === 'rejected') && (
                                <button
                                    onClick={() => verifyDocument(user.id, taskId, doc.id)}
                                    className="px-4 py-1.5 bg-success text-white text-xs font-bold rounded-lg hover:shadow-lg hover:bg-success/90 shadow-success/20 transition-all flex items-center gap-1"
                                >
                                    <ShieldCheck className="w-3 h-3" /> {t('deal.verify')}
                                </button>
                            )}

                            {doc.status === 'verified' && (
                                <button
                                    onClick={() => releaseDocument(user.id, taskId, doc.id)}
                                    className="px-4 py-1.5 bg-navy-primary text-white text-xs font-bold rounded-lg hover:shadow-lg hover:bg-navy-secondary transition-all"
                                >
                                    {t('deal.release')}
                                </button>
                            )}
                        </>
                    )}

                    {canDownload ? (
                        <button className="p-2 text-text-light hover:text-teal hover:bg-teal/5 rounded-lg transition-all" title={t('deal.download')}>
                            <Download className="w-4 h-4" />
                        </button>
                    ) : (
                        doc.status !== 'rejected' && (
                            <span className="text-xs font-bold text-gold px-3 py-1 bg-gold/10 rounded-lg flex items-center gap-1.5 border border-gold/20">
                                {doc.status === 'verified' ? <ShieldCheck className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                {doc.status === 'verified' ? t('deal.verified') : t('deal.private')}
                            </span>
                        )
                    )}
                </div>
            </div>

            {isPreviewOpen && (
                <DocumentPreviewModal
                    doc={doc}
                    onClose={() => setIsPreviewOpen(false)}
                />
            )}

            {isRejectionModalOpen && user && (
                <RejectionModal
                    onClose={() => setIsRejectionModalOpen(false)}
                    onConfirm={(en, bg) => {
                        rejectDocument(user.id, taskId, doc.id, en, bg);
                        setIsRejectionModalOpen(false);
                    }}
                />
            )}
        </>
    );
}
