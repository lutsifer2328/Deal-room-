'use client';

import { X, Upload as UploadIcon, FileText } from 'lucide-react';
import { useState } from 'react';
import { useData } from '@/lib/store';
import { useAuth } from '@/lib/authContext';

export default function UploadModal({ taskId, taskTitle, onClose }: {
    taskId: string,
    taskTitle: string,
    onClose: () => void
}) {
    const { uploadDocument } = useData();
    const { user } = useAuth();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = () => {
        if (!selectedFile || !user) {
            alert('Please select a file first');
            return;
        }

        setIsUploading(true);

        // Simulate upload delay
        setTimeout(() => {
            uploadDocument(taskId, selectedFile.name, user.id);
            setIsUploading(false);
            onClose();
        }, 800);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-midnight text-white">
                    <h2 className="text-lg font-bold">Upload Document</h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Requirement</label>
                        <p className="text-gray-600">{taskTitle}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Select File</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal transition-colors">
                            <input
                                type="file"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="file-upload"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                            <label htmlFor="file-upload" className="cursor-pointer">
                                {selectedFile ? (
                                    <div className="flex items-center justify-center gap-2 text-teal">
                                        <FileText className="w-6 h-6" />
                                        <span className="font-medium">{selectedFile.name}</span>
                                    </div>
                                ) : (
                                    <div>
                                        <UploadIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                                        <p className="text-gray-600 font-medium">Click to select file</p>
                                        <p className="text-xs text-gray-400 mt-1">PDF, DOC, JPG, PNG (max 10MB)</p>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-800">
                            <strong>📋 Note:</strong> After upload, the lawyer will review your document before it's visible to other parties.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!selectedFile || isUploading}
                        className="px-6 py-2 bg-teal text-white font-bold rounded-lg hover:bg-teal/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isUploading ? 'Uploading...' : 'Upload Document'}
                    </button>
                </div>
            </div>
        </div>
    );
}
