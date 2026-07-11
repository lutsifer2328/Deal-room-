'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { X, Lock, ShieldCheck, UploadCloud, Users, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    getDocumentAccess,
    setDocumentAccess,
    setDocumentAccessBulk,
    type DocAccessParticipant,
} from '@/app/actions/document-access';

/**
 * Attorney "who can open this document" control.
 * Content is closed by default; the host opens it per participant. Hosts and the
 * uploader always have access (shown, not toggleable). All changes are audit-logged
 * server-side.
 */
export default function DocumentAccessModal({ documentId, onClose }: {
    documentId: string;
    onClose: () => void;
}) {
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [rows, setRows] = useState<DocAccessParticipant[]>([]);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [bulkBusy, setBulkBusy] = useState(false);

    useEffect(() => {
        setMounted(true);
        document.body.style.overflow = 'hidden';
        (async () => {
            const res = await getDocumentAccess(documentId);
            if (res.ok) {
                setTitle(res.documentTitle);
                setRows(res.participants);
            } else {
                setError(res.error);
            }
            setLoading(false);
        })();
        return () => { document.body.style.overflow = 'unset'; };
    }, [documentId]);

    // Guests = everyone who isn't a host and isn't the uploader (the toggleable rows).
    const guests = rows.filter((r) => !r.isHostParticipant && !r.isUploader);

    const toggle = async (r: DocAccessParticipant) => {
        const next = !r.granted;
        setBusyId(r.participantId);
        // optimistic
        setRows((prev) => prev.map((x) => x.participantId === r.participantId ? { ...x, granted: next } : x));
        const res = await setDocumentAccess(documentId, r.participantId, next);
        setBusyId(null);
        if (!res.ok) {
            setRows((prev) => prev.map((x) => x.participantId === r.participantId ? { ...x, granted: !next } : x));
            toast.error(res.error || 'Could not update access');
        } else {
            toast.success(next ? `Opened to ${r.name}` : `Closed for ${r.name}`);
        }
    };

    const bulk = async (granted: boolean) => {
        const ids = guests.map((g) => g.participantId);
        if (!ids.length) return;
        setBulkBusy(true);
        const prev = rows;
        setRows((p) => p.map((x) => (!x.isHostParticipant && !x.isUploader) ? { ...x, granted } : x));
        const res = await setDocumentAccessBulk(documentId, ids, granted);
        setBulkBusy(false);
        if (!res.ok) {
            setRows(prev);
            toast.error(res.error || 'Could not update access');
        } else {
            toast.success(granted ? 'Opened to everyone' : 'Closed to everyone');
        }
    };

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-bold text-navy-primary flex items-center gap-2">
                            <Lock className="w-4 h-4 text-teal" /> Who can open this document
                        </h2>
                        <p className="text-xs text-text-light mt-0.5 truncate max-w-[24rem]">{title}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700" title="Close">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-teal" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-10 text-danger text-sm">{error}</div>
                    ) : (
                        <>
                            <p className="text-xs text-text-secondary bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 mb-4">
                                Content is closed by default. Open it to a participant only when the deal conditions are met — they can then view and download it.
                            </p>

                            {/* Always-access rows (hosts + uploader) */}
                            {rows.filter((r) => r.isHostParticipant || r.isUploader).map((r) => (
                                <div key={r.participantId} className="flex items-center justify-between py-2.5 px-2 opacity-70">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0">
                                            {r.isUploader ? <UploadCloud className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium text-navy-primary truncate">{r.name}</div>
                                            <div className="text-[11px] text-text-light uppercase tracking-wide">{r.role}</div>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-400 whitespace-nowrap">
                                        {r.isUploader ? 'Uploader — always' : 'Agenzia — always'}
                                    </span>
                                </div>
                            ))}

                            {guests.length > 0 && <div className="border-t border-gray-100 my-2" />}

                            {/* Toggleable guest rows */}
                            {guests.map((r) => (
                                <button
                                    key={r.participantId}
                                    onClick={() => toggle(r)}
                                    disabled={busyId === r.participantId || bulkBusy}
                                    className="w-full flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${r.granted ? 'bg-teal/10 text-teal' : 'bg-gray-100 text-gray-400'}`}>
                                            <Users className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 text-left">
                                            <div className="text-sm font-medium text-navy-primary truncate">{r.name}</div>
                                            <div className="text-[11px] text-text-light uppercase tracking-wide">{r.role}</div>
                                        </div>
                                    </div>
                                    {/* Toggle pill */}
                                    <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${r.granted ? 'bg-teal text-white border-teal' : 'bg-white text-gray-500 border-gray-200'}`}>
                                        {r.granted ? (<><Check className="w-3 h-3" /> Can open</>) : (<><Lock className="w-3 h-3" /> Closed</>)}
                                    </span>
                                </button>
                            ))}

                            {guests.length === 0 && (
                                <div className="text-center py-8 text-sm text-text-light">
                                    No other participants to grant access to yet.
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer shortcuts */}
                {!loading && !error && guests.length > 0 && (
                    <div className="px-4 py-3 border-t border-gray-100 flex justify-between items-center gap-3">
                        <button onClick={() => bulk(false)} disabled={bulkBusy}
                            className="text-xs font-bold text-gray-500 hover:text-danger disabled:opacity-50">
                            Close to everyone
                        </button>
                        <button onClick={() => bulk(true)} disabled={bulkBusy}
                            className="text-xs font-bold text-white bg-teal hover:bg-teal/90 px-4 py-2 rounded-lg disabled:opacity-50">
                            Open to everyone
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body,
    );
}
