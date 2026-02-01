import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { X, FileText, AlertTriangle } from 'lucide-react';
import { DealDocument } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export default function DocumentPreviewModal({ doc, onClose }: {
    doc: DealDocument,
    onClose: () => void
}) {
    const [mounted, setMounted] = useState(false);
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [isLoadingUrl, setIsLoadingUrl] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        document.body.style.overflow = 'hidden';

        const fetchUrl = async () => {
            setErrorMsg(null);
            if (doc.url.startsWith('http') || doc.url.startsWith('blob')) {
                setSignedUrl(doc.url);
                setIsLoadingUrl(false);
                return;
            }

            // Fetch signed URL for internal path
            const { data, error } = await supabase.storage
                .from('documents')
                .createSignedUrl(doc.url, 3600); // 1 hour expiry

            if (error) {
                console.error('Error fetching signed URL:', error);
                setErrorMsg(error.message); // <--- CAPTURE ERROR
                setSignedUrl(null);
            } else {
                setSignedUrl(data.signedUrl);
            }
            setIsLoadingUrl(false);
        };

        fetchUrl();

        return () => {
            document.body.style.overflow = 'unset';
            setMounted(false);
        };
    }, [doc.url]);

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-midnight text-white flex-shrink-0 rounded-t-xl">
                    <div>
                        <h2 className="text-lg font-bold">{doc.title_en}</h2>
                        <p className="text-xs text-white/70">Uploaded {new Date(doc.uploadedAt).toLocaleString()}</p>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Preview Area - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col items-center min-h-[400px]">
                    {isLoadingUrl ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-midnight"></div>
                        </div>
                    ) : signedUrl ? (
                        doc.title_en.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/) ? (
                            <img src={signedUrl} alt={doc.title_en} className="max-w-full h-auto rounded shadow-sm" />
                        ) : doc.title_en.toLowerCase().endsWith('.pdf') ? (
                            <iframe src={signedUrl} className="w-full h-[600px] border-none rounded shadow-sm" />
                        ) : doc.title_en.toLowerCase().match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/) ? (
                            <iframe
                                src={`https://docs.google.com/viewer?url=${encodeURIComponent(signedUrl)}&embedded=true`}
                                className="w-full h-[600px] border-none rounded shadow-sm"
                            />
                        ) : (
                            <div className="text-center py-20">
                                <FileText className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600 font-bold mb-2">Preview not supported for this file type</p>
                                <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="text-teal hover:underline font-bold">
                                    Download to View
                                </a>
                            </div>
                        )
                    ) : (
                        <div className="text-center py-20">
                            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                            <p className="text-gray-600 font-bold">Could not load document preview</p>
                            {errorMsg && <p className="text-red-500 text-sm mt-2 bg-red-50 p-2 rounded border border-red-100">{errorMsg}</p>}

                            {/* DEBUG PANEL */}
                            <div className="mt-8 mx-auto max-w-md bg-black text-green-400 p-4 font-mono text-xs text-left rounded overflow-auto max-h-40 shadow-lg">
                                <p className="font-bold border-b border-green-900 mb-2">DEBUG DIAGNOSTICS:</p>
                                <p>DOC URL: {doc.url}</p>
                                <p>SIGNED URL: {signedUrl || 'null'}</p>
                                <p>ERROR: {errorMsg || 'null'}</p>
                                <p>IS LOADING: {isLoadingUrl ? 'YES' : 'NO'}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-midnight text-white font-bold rounded-lg hover:bg-midnight/90 transition-colors shadow-lg"
                    >
                        Close Preview
                    </button>
                </div>
            </div>

            {/* Backdrop click to close */}
            <div className="absolute inset-0 z-[-1]" onClick={onClose}></div>
        </div>,
        document.body
    );
}
