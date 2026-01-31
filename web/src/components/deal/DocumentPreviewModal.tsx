import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { X, FileText } from 'lucide-react';
import { DealDocument } from '@/lib/types';

export default function DocumentPreviewModal({ doc, onClose }: {
    doc: DealDocument,
    onClose: () => void
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
            setMounted(false);
        };
    }, []);

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
                <div className="flex-1 overflow-y-auto p-8 bg-gray-50 flex flex-col items-center">
                    <div className="w-full max-w-2xl flex flex-col items-center">
                        <FileText className="w-24 h-24 text-gray-300 mb-4" />
                        <p className="text-gray-600 font-medium mb-2">Document Preview</p>
                        <p className="text-sm text-gray-500 text-center mb-6">
                            In production, this would display the actual document (PDF viewer, image preview, etc.)
                        </p>

                        {/* Document Info */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6 w-full shadow-sm">
                            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3">Metadata</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Filename:</span>
                                    <span className="font-medium text-gray-900">{doc.title_en}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Uploaded by:</span>
                                    <span className="font-medium text-gray-900">{doc.uploadedBy}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Status:</span>
                                    <span className={`font-bold capitalize px-2 py-0.5 rounded text-xs ${doc.status === 'verified' ? 'bg-green-100 text-green-700' :
                                            doc.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                'bg-gray-100 text-gray-700'
                                        }`}>
                                        {doc.status}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Date:</span>
                                    <span className="font-medium text-gray-900">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Simulated Preview Notice */}
                        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 w-full">
                            <p className="text-xs text-blue-800 font-bold mb-2">
                                💡 Development Note
                            </p>
                            <p className="text-xs text-blue-700 mb-2">
                                In a real production environment, this modal would include:
                            </p>
                            <ul className="text-xs text-blue-700 ml-4 list-disc space-y-1">
                                <li><strong>PDF Viewer:</strong> Full embedded PDF reading capability</li>
                                <li><strong>Image Preview:</strong> High-res image viewer with zoom</li>
                                <li><strong>Audit Log:</strong> List of who viewed this document</li>
                            </ul>
                        </div>
                    </div>
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
