'use client';

import { X, FileText, Download } from 'lucide-react';
import { DealDocument } from '@/lib/types';

export default function DocumentPreviewModal({ doc, onClose }: {
    doc: DealDocument,
    onClose: () => void
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-midnight text-white">
                    <div>
                        <h2 className="text-lg font-bold">{doc.title_en}</h2>
                        <p className="text-xs text-white/70">Uploaded {new Date(doc.uploadedAt).toLocaleString()}</p>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Preview Area */}
                <div className="p-8 bg-gray-50 min-h-[500px] flex flex-col items-center justify-center">
                    <FileText className="w-24 h-24 text-gray-300 mb-4" />
                    <p className="text-gray-600 font-medium mb-2">Document Preview</p>
                    <p className="text-sm text-gray-500 max-w-md text-center mb-6">
                        In production, this would display the actual document (PDF viewer, image preview, etc.)
                    </p>

                    {/* Document Info */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4 w-full max-w-md">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Filename:</span>
                                <span className="font-medium">{doc.title_en}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Uploaded by:</span>
                                <span className="font-medium">{doc.uploadedBy}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Status:</span>
                                <span className={`font-bold capitalize ${doc.status === 'verified' ? 'text-green-600' :
                                        doc.status === 'rejected' ? 'text-red-600' :
                                            'text-gray-600'
                                    }`}>
                                    {doc.status}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Date:</span>
                                <span className="font-medium">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Simulated Preview Notice */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
                        <p className="text-xs text-blue-800">
                            <strong>💡 Development Note:</strong> In production, this modal would show:
                        </p>
                        <ul className="text-xs text-blue-700 mt-2 ml-4 list-disc space-y-1">
                            <li>PDF viewer for PDF documents</li>
                            <li>Image preview for JPG/PNG files</li>
                            <li>Download option for other file types</li>
                            <li>Zoom, rotate, and annotation tools</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-midnight text-white font-bold rounded-lg hover:bg-midnight/90"
                    >
                        Close Preview
                    </button>
                </div>
            </div>
        </div>
    );
}
