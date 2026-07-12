'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { X, Lock, ShieldCheck, UploadCloud, Eye, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from '@/lib/useTranslation';
import {
    getDocumentAccess,
    setDocumentAccess,
    setDocumentAccessBulk,
    type DocAccessParticipant,
    type AccessLevel,
} from '@/app/actions/document-access';

/**
 * Attorney "who can open this document" control.
 * Three levels per participant: Closed / View only / View + Download.
 * Content is closed by default; the host opens it per participant when the deal
 * conditions are met. Hosts and the uploader always have full access. All changes
 * are audit-logged server-side.
 */
export default function DocumentAccessModal({ documentId, onClose }: {
    documentId: string;
    onClose: () => void;
}) {
    const { t } = useTranslation();
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

    const guests = rows.filter((r) => !r.isHostParticipant && !r.isUploader);

    const setLevel = async (r: DocAccessParticipant, level: AccessLevel) => {
        if (r.level === level) return;
        setBusyId(r.participantId);
        const prev = r.level;
        setRows((p) => p.map((x) => x.participantId === r.participantId ? { ...x, level } : x));
        const res = await setDocumentAccess(documentId, r.participantId, level);
        setBusyId(null);
        if (!res.ok) {
            setRows((p) => p.map((x) => x.participantId === r.participantId ? { ...x, level: prev } : x));
            toast.error(res.error || t('docAccess.toastUpdateError'));
        }
    };

    const bulk = async (level: AccessLevel) => {
        const ids = guests.map((g) => g.participantId);
        if (!ids.length) return;
        setBulkBusy(true);
        const prev = rows;
        setRows((p) => p.map((x) => (!x.isHostParticipant && !x.isUploader) ? { ...x, level } : x));
        const res = await setDocumentAccessBulk(documentId, ids, level);
        setBulkBusy(false);
        if (!res.ok) { setRows(prev); toast.error(res.error || 'Could not update access'); }
        else toast.success(level === 'none' ? t('docAccess.toastClosedAll') : t('docAccess.toastOpenedAll'));
    };

    if (!mounted) return null;

    const SegBtn = ({ active, onClick, disabled, children, tone }: {
        active: boolean; onClick: () => void; disabled?: boolean; children: React.ReactNode; tone: 'gray' | 'teal' | 'navy';
    }) => {
        const toneCls = active
            ? (tone === 'teal' ? 'bg-teal text-white border-teal'
                : tone === 'navy' ? 'bg-navy-primary text-white border-navy-primary'
                    : 'bg-gray-200 text-gray-700 border-gray-300')
            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50';
        return (
            <button onClick={onClick} disabled={disabled}
                className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 border transition-colors disabled:opacity-50 ${toneCls}`}>
                {children}
            </button>
        );
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-bold text-navy-primary flex items-center gap-2">
                            <Lock className="w-4 h-4 text-teal" /> {t('docAccess.title')}
                        </h2>
                        <p className="text-xs text-text-light mt-0.5 truncate max-w-[26rem]">{title}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700" title={t('docAccess.close')}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

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
                                {t('docAccess.infoPrefix')} <strong>{t('docAccess.levelView')}</strong> {t('docAccess.infoMid')} <strong>{t('docAccess.levelDownload')}</strong> {t('docAccess.infoSuffix')}
                            </p>

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
                                        {r.isUploader ? t('docAccess.uploaderFull') : t('docAccess.agenziaFull')}
                                    </span>
                                </div>
                            ))}

                            {guests.length > 0 && <div className="border-t border-gray-100 my-2" />}

                            {guests.map((r) => (
                                <div key={r.participantId} className="flex items-center justify-between py-2.5 px-2 gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${r.level !== 'none' ? 'bg-teal/10 text-teal' : 'bg-gray-100 text-gray-400'}`}>
                                            {r.level === 'download' ? <Download className="w-4 h-4" /> : r.level === 'view' ? <Eye className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium text-navy-primary truncate">{r.name}</div>
                                            <div className="text-[11px] text-text-light uppercase tracking-wide">{r.role}</div>
                                        </div>
                                    </div>
                                    {/* Segmented 3-state control */}
                                    <div className="flex rounded-lg overflow-hidden flex-shrink-0" style={{ opacity: busyId === r.participantId || bulkBusy ? 0.5 : 1 }}>
                                        <SegBtn tone="gray" active={r.level === 'none'} disabled={busyId === r.participantId || bulkBusy} onClick={() => setLevel(r, 'none')}>
                                            <Lock className="w-3 h-3" /> {t('docAccess.levelClosed')}
                                        </SegBtn>
                                        <SegBtn tone="teal" active={r.level === 'view'} disabled={busyId === r.participantId || bulkBusy} onClick={() => setLevel(r, 'view')}>
                                            <Eye className="w-3 h-3" /> {t('docAccess.levelView')}
                                        </SegBtn>
                                        <SegBtn tone="navy" active={r.level === 'download'} disabled={busyId === r.participantId || bulkBusy} onClick={() => setLevel(r, 'download')}>
                                            <Download className="w-3 h-3" /> {t('docAccess.levelDownload')}
                                        </SegBtn>
                                    </div>
                                </div>
                            ))}

                            {guests.length === 0 && (
                                <div className="text-center py-8 text-sm text-text-light">{t('docAccess.noGuests')}</div>
                            )}
                        </>
                    )}
                </div>

                {!loading && !error && guests.length > 0 && (
                    <div className="px-4 py-3 border-t border-gray-100 flex justify-between items-center gap-2">
                        <button onClick={() => bulk('none')} disabled={bulkBusy}
                            className="text-xs font-bold text-gray-500 hover:text-danger disabled:opacity-50">
                            {t('docAccess.closeAll')}
                        </button>
                        <div className="flex gap-2">
                            <button onClick={() => bulk('view')} disabled={bulkBusy}
                                className="text-xs font-bold text-teal border border-teal/30 hover:bg-teal/5 px-3 py-2 rounded-lg disabled:opacity-50">
                                {t('docAccess.viewAll')}
                            </button>
                            <button onClick={() => bulk('download')} disabled={bulkBusy}
                                className="text-xs font-bold text-white bg-navy-primary hover:bg-navy-secondary px-3 py-2 rounded-lg disabled:opacity-50">
                                {t('docAccess.downloadAll')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body,
    );
}
