'use client';

import { useParams } from 'next/navigation';
import { useData } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import DealHeader from '@/components/deal/DealHeader';
import SingleProgressBar from '@/components/deal/SingleProgressBar';
import { FileText, Lock, ShieldCheck, Download, Upload, AlertTriangle, Eye } from 'lucide-react';
import { Task, DealDocument, Deal } from '@/lib/types';
import { useState } from 'react';
import CreateTaskModal from '@/components/deal/CreateTaskModal';
import RejectionModal from '@/components/deal/RejectionModal';
import AuditLogPanel from '@/components/deal/AuditLogPanel';
import UploadModal from '@/components/deal/UploadModal';
import DocumentPreviewModal from '@/components/deal/DocumentPreviewModal';
import TaskComments from '@/components/deal/TaskComments';

export default function DealDetailPage() {
    const params = useParams();
    const dealId = params?.id as string;
    const { user } = useAuth();
    const { deals, tasks } = useData();
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

    const deal = deals.find(d => d.id === dealId);

    if (!user) return <div className="p-10 text-center">Loading...</div>;
    if (!deal) return <div className="p-10 text-center">Deal not found</div>;

    const relevantTasks = tasks.filter(t => {
        if (t.dealId !== deal.id) return false;
        if (user.role === 'lawyer' || user.role === 'admin') return true;
        if (user.role === 'agent') return true;
        return t.assignedTo === user.role;
    });

    return (
        <div className="max-w-5xl mx-auto pb-20">
            <DealHeader deal={deal} />
            <SingleProgressBar deal={deal} />

            <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-midnight">Required Documents</h2>
                        {(user.role === 'lawyer' || user.role === 'admin') && (
                            <button
                                onClick={() => setIsTaskModalOpen(true)}
                                className="text-sm text-gold font-bold hover:underline"
                            >
                                + Add Requirement
                            </button>
                        )}
                    </div>

                    {relevantTasks.map(task => (
                        <TaskCard key={task.id} task={task} userRole={user.role} deal={deal} />
                    ))}
                </div>

                <div className="col-span-1">
                    <div className="bg-midnight/5 rounded-xl p-6 border border-midnight/10 sticky top-24">
                        <h3 className="font-bold text-midnight mb-2">Deal Information</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            This deal room is supervised by <strong>Agenzia Legal</strong>. All documents are verified independently.
                        </p>
                        <div className="flex items-center gap-2 text-xs font-medium text-teal">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Bank Encryption Standard</span>
                        </div>
                    </div>
                </div>
            </div>

            {isTaskModalOpen && <CreateTaskModal deal={deal} onClose={() => setIsTaskModalOpen(false)} />}
            <AuditLogPanel />
        </div>
    );
}

function TaskCard({ task, userRole, deal }: { task: Task, userRole: string, deal: Deal }) {
    const isOwner = userRole === task.assignedTo;
    const isLawyer = userRole === 'lawyer';
    const isAdmin = userRole === 'admin';
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    // Find the participant this task is assigned to
    const assignedParticipant = deal.participants.find(p => p.role === task.assignedTo && p.isActive);

    return (
        <>
            <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5 flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${task.assignedTo === 'buyer' ? 'bg-teal/10 text-teal' :
                                task.assignedTo === 'seller' ? 'bg-blue-100 text-blue-700' :
                                    task.assignedTo === 'agent' ? 'bg-purple-100 text-purple-700' :
                                        'bg-gray-100 text-gray-700'
                                }`}>
                                {task.assignedTo.replace('_', ' ')}
                            </span>
                            {assignedParticipant && (
                                <span className="text-xs text-gray-600">
                                    → <strong>{assignedParticipant.fullName}</strong>
                                </span>
                            )}
                            {task.required && <span className="text-[10px] font-bold text-red-500">* REQUIRED</span>}
                        </div>
                        <h4 className="font-bold text-lg text-midnight">{task.title_en}</h4>
                        {task.title_bg && <p className="text-sm text-gray-400">{task.title_bg}</p>}
                    </div>

                    <div>
                        {task.status === 'completed' ? (
                            <span className="flex items-center gap-1 text-green-600 font-bold text-sm bg-green-50 px-3 py-1 rounded-full border border-green-100">
                                <ShieldCheck className="w-4 h-4" /> Verified
                            </span>
                        ) : (
                            <span className="text-sm font-medium text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                                {task.status.replace('_', ' ')}
                            </span>
                        )}
                    </div>
                </div>

                <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
                    {task.documents.length > 0 ? (
                        <div className="space-y-2">
                            {task.documents.map(doc => (
                                <DocumentRow key={doc.id} doc={doc} userRole={userRole} taskId={task.id} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400 italic">No documents uploaded yet.</span>
                            {(isOwner || isLawyer || isAdmin) && (
                                <button
                                    onClick={() => setIsUploadModalOpen(true)}
                                    className="flex items-center gap-2 text-midnight font-medium hover:text-teal transition-colors"
                                >
                                    <Upload className="w-4 h-4" /> Upload
                                </button>
                            )}
                        </div>
                    )}

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
        </>
    );
}

function DocumentRow({ doc, userRole, taskId }: { doc: DealDocument, userRole: string, taskId: string }) {
    const { verifyDocument, releaseDocument, rejectDocument } = useData();
    const { user } = useAuth();
    const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const isLawyer = userRole === 'lawyer';
    const isOwner = userRole === doc.uploadedBy;
    const canDownload = isLawyer || isOwner || doc.status === 'released';
    const canSeeMetadata = isLawyer || isOwner || doc.status !== 'private';

    if (!canSeeMetadata) return null;

    return (
        <>
            <div className={`flex items-center justify-between bg-white p-3 rounded border ${doc.status === 'rejected' ? 'border-red-200 bg-red-50' : 'border-gray-200'
                }`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded text-gray-500 ${doc.status === 'rejected' ? 'bg-red-100' : 'bg-gray-100'}`}>
                        {doc.status === 'rejected' ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <FileText className="w-4 h-4" />}
                    </div>
                    <div>
                        <div className="text-sm font-medium text-midnight flex items-center gap-2">
                            {doc.title_en}
                            {!canDownload && doc.status !== 'rejected' && <Lock className="w-3 h-3 text-gold" />}
                        </div>
                        {doc.status === 'rejected' ? (
                            <div className="text-xs text-red-600 font-bold">
                                Rejected: {doc.rejectionReason_en}
                            </div>
                        ) : (
                            <div className="text-xs text-gray-400">{doc.uploadedAt}</div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Button - Available to Lawyer */}
                    {isLawyer && (
                        <button
                            onClick={() => setIsPreviewOpen(true)}
                            className="p-2 text-teal hover:bg-teal/10 rounded transition-colors"
                            title="View Document"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                    )}

                    {isLawyer && user && (
                        <>
                            {doc.status !== 'rejected' && (
                                <button
                                    onClick={() => setIsRejectionModalOpen(true)}
                                    className="px-2 py-1 text-red-500 hover:bg-red-50 rounded text-xs font-bold"
                                >
                                    Reject
                                </button>
                            )}

                            {(doc.status === 'private' || doc.status === 'rejected') && (
                                <button
                                    onClick={() => verifyDocument(user.id, taskId, doc.id)}
                                    className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded hover:bg-gray-200 border border-gray-300"
                                >
                                    Verify
                                </button>
                            )}

                            {doc.status === 'verified' && (
                                <button
                                    onClick={() => releaseDocument(user.id, taskId, doc.id)}
                                    className="px-3 py-1 bg-midnight text-white text-xs font-bold rounded hover:bg-opacity-90 shadow-md"
                                >
                                    Release
                                </button>
                            )}
                        </>
                    )}

                    {canDownload ? (
                        <button className="p-2 text-gray-500 hover:text-teal transition-colors" title="Download">
                            <Download className="w-4 h-4" />
                        </button>
                    ) : (
                        doc.status !== 'rejected' && (
                            <span className="text-xs font-bold text-gold px-2 py-1 bg-gold/10 rounded flex items-center gap-1">
                                {doc.status === 'verified' ? <ShieldCheck className="w-3 h-3" /> : null}
                                {doc.status === 'verified' ? 'Verified' : 'Private'}
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
