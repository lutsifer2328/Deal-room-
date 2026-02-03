'use client';

import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { useData } from '@/lib/store';
import { useEffect } from 'react';
import { FileText, Lock, ShieldCheck, Download, Upload, AlertTriangle } from 'lucide-react';
import { Task, DealDocument } from '@/lib/types';

import { useState } from 'react';
import RejectionModal from '@/components/deal/RejectionModal';

export default function Home() {
  const { user, isLoading } = useAuth();
  const { activeDeal } = useData();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to finish loading
    if (isLoading) return;

    // No user? Redirect to login
    if (!user) {
      router.push('/login');
      return;
    }

    // Redirect lawyers/admins to dashboard
    if (user.role === 'lawyer' || user.role === 'admin') {
      router.push('/dashboard');
    } else if (activeDeal) {
      // Redirect other users to their active deal
      router.push(`/deal/${activeDeal.id}`);
    }
  }, [user, isLoading, activeDeal, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

function TaskCard({ task, userRole }: { task: Task, userRole: string }) {
  const isOwner = userRole === task.assignedTo;
  const isLawyer = userRole === 'lawyer';

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${task.assignedTo === 'buyer' ? 'bg-teal/10 text-teal' : 'bg-blue-100 text-blue-700'}`}>
              {task.assignedTo} Side
            </span>
            {task.required && <span className="text-[10px] font-bold text-red-500">* REQUIRED</span>}
          </div>
          <h4 className="font-bold text-lg text-midnight">{task.title_en}</h4>
          <p className="text-sm text-gray-400">{task.title_bg}</p>
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

      {/* Documents Section */}
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
            {(isOwner || isLawyer) && (
              <button className="flex items-center gap-2 text-midnight font-medium hover:text-teal transition-colors">
                <Upload className="w-4 h-4" /> Upload
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function DocumentRow({ doc, userRole, taskId }: { doc: DealDocument, userRole: string, taskId: string }) {
  const { verifyDocument, releaseDocument, rejectDocument } = useData();
  const { user } = useAuth(); // Need user for logging
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);

  // Visibility Logic
  // 1. Lawyer sees everything.
  // 2. Owner sees everything.
  // 3. Counterparty (Buyer view of Seller doc) sees ONLY if status != 'private'.
  //    If 'verified', they see Metadata but NO Download.
  //    If 'released', they see Download.

  const isLawyer = userRole === 'lawyer';
  const isOwner = userRole === doc.uploadedBy; // Simplified check

  // If not lawyer and not owner, checks apply
  // In this mock, we assume tasks are assigned to roles, and docs are uploaded by that role.

  // The visual lock logic
  const canDownload = isLawyer || isOwner || doc.status === 'released';
  const canSeeMetadata = isLawyer || isOwner || doc.status !== 'private';

  if (!canSeeMetadata) return null; // Invisible

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
          {/* LAWYER ACTIONS */}
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
  )
}
