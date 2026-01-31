'use client';

import { useState } from 'react';
import { GlobalParticipant } from '@/lib/types';
import { useData } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import { FileText, Plus, Trash2, Upload, Calendar, Download } from 'lucide-react';
import { Modal, ModalContent, ModalHeader, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export default function AgencyContractsSection({ participant }: { participant: GlobalParticipant }) {
    const { addParticipantContract, deleteParticipantContract } = useData();
    const { user } = useAuth();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [contractTitle, setContractTitle] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    // Only Admin, Lawyer, and Staff can manage contracts
    const canManageContracts = user && ['admin', 'lawyer', 'staff'].includes(user.role);

    if (!canManageContracts) return null;

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contractTitle.trim() || !user) return;

        setIsUploading(true);

        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 800));

        addParticipantContract(participant.id, contractTitle, user.id);

        setIsUploading(false);
        setContractTitle('');
        setIsUploadModalOpen(false);
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

                            <div className="flex items-center gap-2">
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

                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-teal/50 hover:bg-teal/[0.02] transition-colors cursor-pointer">
                            <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm font-bold text-navy-primary">Click to select file</p>
                            <p className="text-xs text-text-light mt-1">PDF, DOCX up to 10MB</p>
                        </div>
                    </form>
                </ModalContent>
                <ModalFooter>
                    <Button variant="ghost" onClick={() => setIsUploadModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        form="upload-contract-form"
                        isLoading={isUploading}
                        disabled={!contractTitle.trim() || isUploading}
                    >
                        Upload Contract
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}
