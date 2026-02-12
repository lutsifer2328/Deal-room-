'use client';

import { useState, useRef, useEffect } from 'react';
import { GlobalParticipant, AgencyContract } from '@/lib/types';
import { useData } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabase';
import { FileText, Plus, Trash2, Upload, Calendar, Download, CheckCircle, Eye, X, AlertTriangle } from 'lucide-react';
import { Modal, ModalContent, ModalHeader, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export default function AgencyContractsSection({ participant }: { participant: GlobalParticipant }) {
    const { addParticipantContract, deleteParticipantContract } = useData();
    const { user } = useAuth();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [contractTitle, setContractTitle] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [previewContract, setPreviewContract] = useState<AgencyContract | null>(null);
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [isLoadingUrl, setIsLoadingUrl] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Only Admin, Lawyer, and Staff can manage contracts
    const canManageContracts = user && ['admin', 'lawyer', 'staff'].includes(user.role);

    useEffect(() => {
        const fetchUrl = async () => {
            if (!previewContract) return;

            setErrorMsg(null);
            setIsLoadingUrl(true);

            // Handle legacy/placeholder URLs
            if (previewContract.url === '#' || !previewContract.url) {
                setSignedUrl(null);
                setIsLoadingUrl(false);
                return;
            }

            // Fetch signed URL from Supabase Storage
            const { data, error } = await supabase.storage
                .from('documents')
                .createSignedUrl(previewContract.url, 3600); // 1 hour expiry

            if (error) {
                console.error('Error fetching signed URL:', error);
                setErrorMsg(error.message);
                setSignedUrl(null);
            } else {
                setSignedUrl(data.signedUrl);
            }
            setIsLoadingUrl(false);
        };

        if (previewContract) {
            fetchUrl();
        } else {
            setSignedUrl(null);
            setErrorMsg(null);
        }
    }, [previewContract]);

    if (!canManageContracts) return null;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            // Generate preview for images
            if (file.type.startsWith('image/')) {
                const url = URL.createObjectURL(file);
                setFilePreview(url);
            } else {
                setFilePreview(null);
            }
            // Auto-fill title from filename if title is empty
            if (!contractTitle.trim()) {
                const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
                setContractTitle(nameWithoutExt);
            }
        }
    };

    const clearFile = () => {
        if (filePreview) URL.revokeObjectURL(filePreview);
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const getFileExtension = (name: string) => name.split('.').pop()?.toUpperCase() || 'FILE';

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contractTitle.trim() || !user || !selectedFile) return;

        setIsUploading(true);

        try {
            await addParticipantContract(participant.id, contractTitle, user.id, selectedFile);
        } catch (err) {
            console.error('Contract upload failed:', err);
        } finally {
            setIsUploading(false);
            setContractTitle('');
            clearFile();
            setIsUploadModalOpen(false);
        }
    };

    const handleDelete = (contractId: string) => {
        if (confirm('Are you sure you want to delete this contract?')) {
            deleteParticipantContract(participant.id, contractId);
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-navy-primary font-serif flex items-center gap-2">
                        <FileText className="w-5 h-5 text-teal" />
                        Agency Contracts
                    </h2>
                    <p className="text-text-secondary text-sm mt-1">
                        Manage agreements with this client
                    </p>
                </div>
                <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-teal/10 text-teal font-bold rounded-xl hover:bg-teal hover:text-white transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Add Contract
                </button>
            </div>

            {(!participant.contracts || participant.contracts.length === 0) ? (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-text-light font-medium">No contracts uploaded yet</p>
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="text-sm text-teal font-bold hover:underline mt-2"
                    >
                        Upload the first contract
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {participant.contracts.map(contract => (
                        <div
                            key={contract.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 group hover:border-teal/30 hover:shadow-md transition-all duration-300"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-lg shadow-sm text-teal">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-navy-primary">{contract.title}</div>
                                    <div className="flex items-center gap-3 text-xs text-text-light mt-1">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(contract.uploadedAt).toLocaleDateString()}
                                        </span>
                                        <span className="bg-gray-200 w-1 h-1 rounded-full" />
                                        <span>Uploaded by Admin</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setPreviewContract(contract)}
                                    className="p-2 text-text-light hover:text-teal hover:bg-teal/10 rounded-lg transition-colors"
                                    title="Preview"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                                <button
                                    className="p-2 text-text-light hover:text-teal hover:bg-teal/10 rounded-lg transition-colors"
                                    title="Download"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(contract.id)}
                                    className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Modal */}
            <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} size="md">
                <ModalHeader onClose={() => setIsUploadModalOpen(false)}>
                    Upload Agency Contract
                </ModalHeader>
                <ModalContent>
                    <form id="upload-contract-form" onSubmit={handleUpload} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-navy-primary mb-1">
                                Contract Title
                            </label>
                            <input
                                type="text"
                                value={contractTitle}
                                onChange={(e) => setContractTitle(e.target.value)}
                                placeholder="e.g. Brokerage Agreement 2024"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none transition-all"
                                autoFocus
                                required
                            />
                        </div>

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-teal/50 hover:bg-teal/[0.02] transition-colors cursor-pointer"
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            {selectedFile ? (
                                <div className="space-y-3">
                                    {/* Preview area */}
                                    {filePreview ? (
                                        /* Image thumbnail */
                                        <div className="relative mx-auto w-full max-w-[200px]">
                                            <img
                                                src={filePreview}
                                                alt="Preview"
                                                className="w-full h-32 object-cover rounded-lg border border-gray-200 shadow-sm"
                                            />
                                        </div>
                                    ) : (
                                        /* Document type badge */
                                        <div className="mx-auto w-16 h-20 bg-gradient-to-br from-navy-primary to-navy-secondary rounded-lg flex flex-col items-center justify-center shadow-md">
                                            <FileText className="w-6 h-6 text-white/80 mb-1" />
                                            <span className="text-[10px] font-black text-white bg-teal px-1.5 py-0.5 rounded">
                                                {getFileExtension(selectedFile.name)}
                                            </span>
                                        </div>
                                    )}
                                    {/* File info */}
                                    <div>
                                        <p className="text-sm font-bold text-navy-primary truncate max-w-[280px] mx-auto">
                                            {selectedFile.name}
                                        </p>
                                        <p className="text-xs text-text-light mt-0.5">
                                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Click to change file
                                        </p>
                                    </div>
                                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                                    <p className="text-sm font-bold text-navy-primary">Click to select file</p>
                                    <p className="text-xs text-text-light mt-1">PDF, DOCX, JPG, PNG up to 10MB</p>
                                </>
                            )}
                        </div>
                    </form>
                </ModalContent>
                <ModalFooter>
                    <Button variant="ghost" onClick={() => { setIsUploadModalOpen(false); clearFile(); setContractTitle(''); }}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        form="upload-contract-form"
                        isLoading={isUploading}
                        disabled={!contractTitle.trim() || !selectedFile || isUploading}
                    >
                        Upload Contract
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Preview Modal */}
            <Modal isOpen={!!previewContract} onClose={() => setPreviewContract(null)} size="2xl">
                <ModalHeader onClose={() => setPreviewContract(null)}>
                    Contract Preview
                </ModalHeader>
                <ModalContent className="flex flex-col h-[70vh]">
                    {previewContract && (
                        <div className="flex-1 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-4 px-1">
                                <div>
                                    <h3 className="font-bold text-navy-primary text-lg">{previewContract.title}</h3>
                                    <p className="text-xs text-text-secondary flex items-center gap-2 mt-1">
                                        Uploaded {new Date(previewContract.uploadedAt).toLocaleDateString()} by {previewContract.uploadedBy || 'Admin'}
                                    </p>
                                </div>
                                {signedUrl && (
                                    <a
                                        href={signedUrl}
                                        download
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-text-secondary rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download Original
                                    </a>
                                )}
                            </div>

                            <div className="flex-1 bg-gray-100 rounded-xl overflow-hidden relative border border-gray-200 flex items-center justify-center min-h-[400px]">
                                {isLoadingUrl ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-sm font-bold text-teal">Loading document...</span>
                                    </div>
                                ) : errorMsg ? (
                                    <div className="text-center p-8">
                                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                                            <AlertTriangle className="w-8 h-8" />
                                        </div>
                                        <h4 className="font-bold text-red-600 mb-2">Failed to load preview</h4>
                                        <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg border border-red-100 inline-block">
                                            {errorMsg}
                                        </p>
                                    </div>
                                ) : signedUrl ? (
                                    previewContract.url.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/) ? (
                                        <img src={signedUrl} alt={previewContract.title} className="max-w-full max-h-full object-contain" />
                                    ) : previewContract.url.toLowerCase().endsWith('.pdf') ? (
                                        <iframe src={signedUrl} className="w-full h-full border-none" title="PDF Preview" />
                                    ) : previewContract.url.toLowerCase().match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/) ? (
                                        <iframe
                                            src={`https://docs.google.com/viewer?url=${encodeURIComponent(signedUrl)}&embedded=true`}
                                            className="w-full h-full border-none"
                                            title="Office Document Preview"
                                        />
                                    ) : (
                                        <div className="text-center p-8">
                                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                            <p className="font-bold text-gray-600 mb-2">Preview not supported for this file type</p>
                                            <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="text-teal font-bold hover:underline">
                                                Download to view
                                            </a>
                                        </div>
                                    )
                                ) : (
                                    <div className="text-center p-8">
                                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-text-light">No file available for preview</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </ModalContent>
                <ModalFooter>
                    <Button variant="ghost" onClick={() => setPreviewContract(null)}>
                        Close Preview
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}
