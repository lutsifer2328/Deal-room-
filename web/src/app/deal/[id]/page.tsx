'use client';

import { useParams, useRouter } from 'next/navigation';
import { useData } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import DealHeader from '@/components/deal/DealHeader';
import SingleProgressBar from '@/components/deal/SingleProgressBar';
import { FileText, Lock, ShieldCheck, Download, Upload, AlertTriangle, Eye, Mail, ArrowLeft, Trash2 } from 'lucide-react';
import { Task, DealDocument, Deal, DealParticipant } from '@/lib/types';
import { useState } from 'react';
import CreateTaskModal from '@/components/deal/CreateTaskModal';
import RejectionModal from '@/components/deal/RejectionModal';
import AuditLogPanel from '@/components/deal/AuditLogPanel';
import UploadModal from '@/components/deal/UploadModal';
import DocumentPreviewModal from '@/components/deal/DocumentPreviewModal';
import DeleteDocumentModal from '@/components/deal/DeleteDocumentModal';
import TaskComments from '@/components/deal/TaskComments';
import { useTranslation, TranslationKey } from '@/lib/useTranslation';
import { supabase } from '@/lib/supabase';
import { getDocumentSignedUrl } from '@/app/actions/documents';

export default function DealDetailPage() {
    const params = useParams();
    const router = useRouter();
    const dealId = params?.id as string;
    const { user } = useAuth();
    const { isInitialized, deals, tasks, deleteTask, rawDealParticipants } = useData();
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const { t } = useTranslation();

    const deal = deals.find(d => d.id === dealId);

    if (!isInitialized || !user) return <div className="p-10 text-center">{t('common.loading')}</div>;
    if (!deal) return <div className="p-10 text-center">Deal not found</div>;

    const currentUserParticipant = deal.participants.find(p => p.userId === user.id);

    // Get the exact deal_participants join record for permissions
    const currentDealParticipantRecord = rawDealParticipants.find(
        dp => dp.dealId === deal.id && dp.participantId === currentUserParticipant?.id
    );

    const isStaff = ['admin', 'lawyer', 'staff'].includes(user.role);
    const contextualUserRole = isStaff ? user.role : (currentDealParticipantRecord?.role || user.role);

    const relevantTasks = tasks.filter(t => {
        if (t.dealId !== deal.id) return false;
        
        // Admins/Lawyers/Staff see everything
        if (isStaff || user.permissions.canViewAllDeals) return true;

        // Managers (Broker) see everything in this deal
        if (currentDealParticipantRecord?.role === 'broker') return true;

        // If specifically granted "Full View" (and not a standard restricted participant)
        // Note: For Phase 2, we want strict isolation for Buyer/Seller roles.
        // If they have canViewDocuments=true, they see all documents content, but not necessarily all tasks.
        // However, the current grouping logic uses this to show the whole section.
        // We will stick to assignment-based filtering for restricted roles.
        const restrictedRoles = ['buyer', 'seller', 'notary', 'bank_representative'];
        const isRestrictedRole = restrictedRoles.includes(currentDealParticipantRecord?.role || '');

        if (!isRestrictedRole && currentDealParticipantRecord?.permissions?.canViewDocuments) return true;

        // Standard logic: Assigned to me (by ID, by Role, or by Email)
        if (t.assignedTo === currentUserParticipant?.id) return true;
        if (t.assignedTo === currentUserParticipant?.role) return true;
        return t.assignedTo?.toLowerCase() === user.email.toLowerCase();
    });

    // Group tasks by participant/role
    const groupedTasks = relevantTasks.reduce((acc: Record<string, { participant?: Deal['participants'][0], role: string, tasks: Task[] }>, task: Task) => {
        // 1. Try to find by specific Participant ID
        let participant = deal.participants.find(p => p.id === task.assignedTo);

        // 2. Try to find by Email (Case-Insensitive) - NEW FIX
        if (!participant) {
            participant = deal.participants.find(p => p.email.toLowerCase() === task.assignedTo.toLowerCase());
        }

        // 3. If not found, try to fallback to Role (Legacy Logic)
        if (!participant) {
            participant = deal.participants.find(p => p.role === task.assignedTo && p.isActive);
        }

        const key = participant ? participant.id : task.assignedTo;
        // Use the tasks's assigned role if it's a role string, otherwise use participant's role
        const role = participant ? participant.role : task.assignedTo;

        if (!acc[key]) {
            acc[key] = {
                participant,
                role,
                tasks: []
            };
        }
        acc[key].tasks.push(task);
        return acc;
    }, {});

    // currentUserParticipant already found above

    return (
        <div className="max-w-5xl mx-auto pb-20">
            {/* Back Button */}
            <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-navy-primary hover:text-teal transition-colors mb-4 font-medium group"
                title="Back to Dashboard"
            >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Dashboard</span>
            </button>

            <DealHeader deal={deal} />
            <SingleProgressBar deal={deal} />

            {/* Warm Welcome Banner — client (non-staff) view only */}
            {!user.permissions.canViewAllDeals && (
                <div className="mb-6 bg-gradient-to-r from-teal/5 via-blue-50/50 to-teal/5 border border-teal/15 rounded-2xl p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-lg">👋</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-navy-primary text-sm mb-1">{t('deal.welcome.title' as TranslationKey)}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{t('deal.welcome.text' as TranslationKey)}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-midnight">{t('deal.requiredDocs')}</h2>
                        {user?.permissions?.canManageDocuments && (
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
                            userRole={contextualUserRole}
                            dealId={deal.id}
                            onDeleteTask={(taskId) => deleteTask(taskId, user.id)}
                            currentDealParticipantRecord={currentDealParticipantRecord}
                        />
                    ))}

                    {relevantTasks.length === 0 && (
                        <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-gray-500">{t('deal.noRequirements')}</p>
                        </div>
                    )}
                </div>

                <div className="col-span-1 space-y-6">
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

            {/* VISUAL VERIFICATION BADGE — REMOVED FOR PRODUCTION */}
        </div>
    );
}

function ParticipantTaskGroup({ participant, role, tasks, userRole, dealId, onDeleteTask, currentDealParticipantRecord }: {
    participant?: Deal['participants'][0],
    role: string,
    tasks: Task[],
    userRole: string,
    dealId: string,
    onDeleteTask: (id: string) => void,
    currentDealParticipantRecord?: DealParticipant
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
                {participant && participant.isUserActive === false && (
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded shadow-sm">
                            FORMER STAFF
                        </span>
                    </div>
                )}
            </div>

            {/* Tasks List */}
            <div className="divide-y divide-gray-50">
                {tasks.map(task => (
                    <TaskItem
                        key={task.id}
                        task={task}
                        userRole={userRole}
                        dealId={dealId}
                        onDelete={() => onDeleteTask(task.id)}
                        currentDealParticipantRecord={currentDealParticipantRecord}
                        taskOwnerRole={role} // Pass the group role as the task owner role
                    />
                ))}
            </div>
        </div>
    );
}

function TaskItem({ task, userRole, dealId, onDelete, currentDealParticipantRecord, taskOwnerRole }: {
    task: Task,
    userRole: string,
    dealId: string,
    onDelete: () => void,
    currentDealParticipantRecord?: DealParticipant,
    taskOwnerRole?: string
}) {
    const { t } = useTranslation();
    const { user } = useAuth();

    // Deal-level ownership: the user's PARTICIPANT record is assigned this task either by ID or by Role (e.g. 'buyer')
    // We check `user.id` matches the global `Participant` in `page.tsx`, but here we have the joined `DealParticipant`.
    // The previous implementation used `currentUserParticipant.id`, which was the global `Participant` id...
    // To be safe, checking whether current user holds the assigned role, or if they have full edit access.
    const isAssignedParticipant = !!(currentDealParticipantRecord && (
        task.assignedTo === currentDealParticipantRecord.participantId ||
        task.assignedTo === currentDealParticipantRecord.role ||
        taskOwnerRole === currentDealParticipantRecord.role
    ));

    // Also check global role for staff actions
    const globalRole = user?.role || userRole;
    const isOwner = isAssignedParticipant || globalRole === task.assignedTo;
    const isLawyer = globalRole === 'lawyer';
    const isAdmin = globalRole === 'admin';
    const isStaffOrAbove = isLawyer || isAdmin || globalRole === 'staff';
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    // Import Trash icon
    const { Trash2 } = require('lucide-react');

    const getStatusLabel = (status: string) => {
        const key = `status.${status}` as TranslationKey;
        return t(key).startsWith('status.') ? status.replace('_', ' ') : t(key);
    };

    return (
        <div className="p-6 hover:bg-teal/[0.02] transition-all duration-300 group relative">
            {(isLawyer || isAdmin) && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(t('common.confirmDelete') || 'Are you sure you want to delete this requirement?')) {
                            onDelete();
                        }
                    }}
                    className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Requirement"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}

            <div className="flex justify-between items-start mb-5 gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-bold text-navy-primary text-lg break-words">{task.title_en}</h4>
                        {task.required && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 shadow-sm whitespace-nowrap flex-shrink-0">* {t('deal.required')}</span>}
                    </div>
                    {task.title_bg && <p className="text-sm text-text-light break-words">{task.title_bg}</p>}
                </div>

                <div className="mr-8 flex-shrink-0">
                    {task.status === 'completed' ? (
                        <span className="flex items-center gap-1.5 text-success font-bold text-xs bg-success/10 px-3 py-1 rounded-full border border-success/20 shadow-sm whitespace-nowrap">
                            <ShieldCheck className="w-3.5 h-3.5" /> {t('status.verified')}
                        </span>
                    ) : task.status === 'rejected' ? (
                        <span className="flex items-center gap-1.5 text-amber-700 font-bold text-xs bg-amber-50 px-3 py-1 rounded-full border border-amber-200 shadow-sm whitespace-nowrap">
                            <AlertTriangle className="w-3.5 h-3.5" /> {t('deal.actionRequired' as TranslationKey)}
                        </span>
                    ) : task.status === 'pending_review' || task.status === 'in_review' ? (
                        <span className="flex items-center gap-1.5 text-blue-600 font-bold text-xs bg-blue-50 px-3 py-1 rounded-full border border-blue-200 shadow-sm whitespace-nowrap">
                            <Eye className="w-3.5 h-3.5" /> {t('deal.underReview' as TranslationKey)}
                        </span>
                    ) : (
                        <span className="text-xs font-bold text-text-secondary bg-gray-100/80 px-3 py-1 rounded-full border border-gray-200 whitespace-nowrap">
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
                                <DocumentRow
                                    doc={doc}
                                    userRole={userRole}
                                    taskId={task.id}
                                    currentDealParticipantRecord={currentDealParticipantRecord}
                                    taskOwnerRole={taskOwnerRole}
                                    isTaskAssignee={isAssignedParticipant}
                                />
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
                        {(isOwner || isAssignedParticipant || isStaffOrAbove) && (
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

            <UploadModal
                taskId={task.id}
                taskTitle={task.title_en}
                dealId={dealId}
                onClose={() => setIsUploadModalOpen(false)}
                isOpen={isUploadModalOpen}
            />
        </div>
    );
}

function DocumentRow({ doc, userRole, taskId, currentDealParticipantRecord, taskOwnerRole, isTaskAssignee }: {
    doc: DealDocument,
    userRole: string,
    taskId: string,
    currentDealParticipantRecord?: DealParticipant,
    taskOwnerRole?: string,
    isTaskAssignee?: boolean
}) {
    const { verifyDocument, releaseDocument, rejectDocument, deleteDocument } = useData();
    const { user } = useAuth();
    const { t } = useTranslation();
    const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Deal participant role takes priority over deprecated global 'viewer' role
    const globalRole = user?.role || userRole;
    const dealRole = currentDealParticipantRecord?.role; // e.g. 'broker', 'buyer', 'seller'
    const effectiveRole = dealRole || globalRole; // Deal role wins
    const isLawyer = globalRole === 'lawyer';
    const isAdmin = globalRole === 'admin';
    const isStaff = globalRole === 'staff';
    const isStaffOrAbove = isLawyer || isAdmin || isStaff;
    // A 'viewer' with a deal participant role (broker/buyer/seller) is NOT read-only
    const isViewer = globalRole === 'viewer' && !currentDealParticipantRecord;
    const isOwner = user?.id === doc.uploadedBy || userRole === doc.uploadedBy || currentDealParticipantRecord?.participantId === doc.uploadedBy;

    // --- PERMISSION LOGIC START ---

    const isFullViewer = currentDealParticipantRecord?.permissions?.canViewDocuments === true;

    // 1. Can Download?
    // ONLY render if:
    // - User is Admin/Staff
    // - OR User is Assignee/Owner of that specific task
    // - OR permissions.canDownloadDocuments === true
    const hasExplicitDownloadPermission = currentDealParticipantRecord?.permissions?.canDownloadDocuments === true;
    const canDownload = isStaffOrAbove || isTaskAssignee || isOwner || hasExplicitDownloadPermission;

    // 2. Can View Content? (Metadata is usually visible if they have access to the deal)
    // - Lawyers/Admins/Owners/FullViewers always can
    // - Standard Users:
    //   a) If 'Private', they can't see it (unless owner)
    //   b) If 'Verified' or 'Released', check detailed permissions:
    //      - canViewDocuments = false (Limited) -> ONLY if role is in canViewRoles list
    const hasViewPermission = isFullViewer || isLawyer || isAdmin || isOwner || (
        // Must be verified/released to even check additional permissions for non-admin/owner
        (doc.status !== 'private') && (
            // Fallback: If no explicit setting, they can see roles assigned to them (default behavior)
            (currentDealParticipantRecord?.permissions?.canViewDocuments === undefined && (taskOwnerRole === currentDealParticipantRecord?.role)) ||
            // Or Specific Role Access via canViewRoles targeting taskOwnerRole
            (taskOwnerRole && currentDealParticipantRecord?.permissions?.canViewRoles?.includes(taskOwnerRole as any))
        )
    );

    // canSeeMetadata: If they can't view content, do we show the row at all?
    // Requirement is "Technicaly they can see what's been requested but cant see the content"
    // So YES, show metadata, but lock the actions.
    const canSeeMetadata = true; // Always show row if they are in the deal (grouped tasks logic handles deal-level filtering)

    // --- PERMISSION LOGIC END ---

    if (!canSeeMetadata) return null;

    const handleDownload = async () => {
        try {
            if (doc.url.startsWith('http') || doc.url.startsWith('blob')) {
                window.open(doc.url, '_blank');
                return;
            }

            // Phase 5 Option B: Signed URLs via Server Action
            const { url, error } = await getDocumentSignedUrl(doc.id, true);
            if (error || !url) {
                throw new Error(error || 'Failed to generate signed URL');
            }
            window.location.href = url;
        } catch (error: any) {
            console.error('Download failed:', error);
            alert(`Download failed: ${error.message || 'Unknown error'}`);
        }
    };

    return (
        <>
            <div className={`flex items-center justify-between transition-all rounded-xl ${doc.status === 'rejected' ? 'bg-amber-50/50 p-2 -m-2 border border-amber-100' : ''}`}>
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className={`p-2.5 rounded-xl shadow-sm flex-shrink-0 ${doc.status === 'rejected' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-teal'}`}>
                        {doc.status === 'rejected' ? <AlertTriangle className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                        <div className="text-sm font-medium text-text-secondary flex items-center gap-1.5 mb-0.5 truncate pr-2">
                            <span className="text-xs font-bold text-text-light uppercase tracking-wide shrink-0">File:</span>
                            <span className="truncate text-navy-primary">{doc.title_en}</span>
                            {!canDownload && doc.status !== 'rejected' && <Lock className="w-3 h-3 text-gold flex-shrink-0" />}
                        </div>
                        {doc.status === 'rejected' ? (
                            <div className="text-xs text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md inline-block truncate max-w-full border border-amber-200">
                                {t('deal.actionRequired' as TranslationKey)}: {doc.rejectionReason_en}
                            </div>
                        ) : (
                            <div className="text-xs text-text-light font-medium">{new Date(doc.uploadedAt).toLocaleDateString()}</div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    {/* View Button */}
                    {hasViewPermission && (
                        <button
                            onClick={() => {
                                setIsPreviewOpen(true);
                            }}
                            className="p-2 text-teal bg-teal/5 hover:bg-teal/10 rounded-lg transition-colors border border-teal/10"
                            title={t('deal.view')}
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                    )}

                    {/* Document actions: Only if global role is lawyer/admin (NOT viewer) */}
                    {(isLawyer || isAdmin) && !isViewer && user && (
                        <>
                            {doc.status !== 'rejected' && doc.status !== 'released' && (
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
                                    className="px-4 py-1.5 bg-green-500 text-white text-xs font-bold rounded-lg hover:shadow-lg hover:bg-green-600 shadow-green-200 transition-all flex items-center gap-1"
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

                    {isOwner && !isStaffOrAbove && doc.status !== 'verified' && doc.status !== 'released' && (
                        <button
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="p-2 text-danger bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete document"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}

                    {canDownload ? (
                        <button
                            onClick={handleDownload}
                            className="p-2 text-text-light hover:text-teal hover:bg-teal/5 rounded-lg transition-all"
                            title={t('deal.download')}
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    ) : (
                        doc.status !== 'rejected' && (
                            <span className="text-xs font-bold text-gray-400 px-3 py-1 bg-gray-100 rounded-lg flex items-center gap-1.5 border border-gray-200" title="Restricted Access">
                                <Lock className="w-3 h-3" />
                                {!hasViewPermission ? 'Restricted' : ((doc.status === 'verified' ? t('deal.verified') : t('deal.private')))}
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

            {isDeleteModalOpen && (
                <DeleteDocumentModal
                    docTitle={doc.title_en}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={async () => {
                        await deleteDocument(taskId, doc.id, doc.url);
                        setIsDeleteModalOpen(false);
                    }}
                />
            )}
        </>
    );
}
