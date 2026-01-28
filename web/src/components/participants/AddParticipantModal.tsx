'use client';

import { useState } from 'react';
import { useData } from '@/lib/store';
import { X, UserPlus } from 'lucide-react';
import { Role, GlobalParticipant } from '@/lib/types';
import DuplicateDetectionModal from './DuplicateDetectionModal';

interface AddParticipantModalProps {
    onClose: () => void;
}

export default function AddParticipantModal({ onClose }: AddParticipantModalProps) {
    const { createGlobalParticipant, checkDuplicateEmail, getParticipantDeals } = useData();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });

    const [duplicateParticipant, setDuplicateParticipant] = useState<GlobalParticipant | null>(null);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [pendingData, setPendingData] = useState<any>(null);

    const handleEmailBlur = () => {
        if (formData.email.trim()) {
            const duplicate = checkDuplicateEmail(formData.email);
            if (duplicate) {
                // Show modal immediately when duplicate is detected
                setPendingData(formData);
                setDuplicateParticipant(duplicate);
                setShowDuplicateModal(true);
            } else {
                setDuplicateParticipant(null);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.email) {
            alert('Name and email are required');
            return;
        }

        // Check for duplicate
        const duplicate = checkDuplicateEmail(formData.email);
        if (duplicate) {
            setPendingData(formData);
            setDuplicateParticipant(duplicate);
            setShowDuplicateModal(true);
            return;
        }

        // No duplicate, create new participant
        createNewParticipant(formData);
    };

    const createNewParticipant = (data: any) => {
        createGlobalParticipant({
            name: data.name,
            email: data.email,
            phone: data.phone || undefined,
            invitationStatus: 'pending',
            invitationSentAt: new Date().toISOString(),
            internalNotes: ''
        });
        onClose();
    };

    const handleUseExisting = () => {
        // Just close both modals - the participant already exists
        setShowDuplicateModal(false);
        onClose();
    };

    const handleCreateNew = () => {
        if (!pendingData) return;
        setShowDuplicateModal(false);
        createNewParticipant(pendingData);
    };

    const handleCancelDuplicate = () => {
        setShowDuplicateModal(false);
        setDuplicateParticipant(null);
        setPendingData(null);
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-midnight text-white">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <UserPlus className="w-5 h-5" />
                            Add New Participant
                        </h2>
                        <button onClick={onClose} className="text-white/80 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal outline-none"
                                    placeholder="e.g. John Smith"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    onBlur={handleEmailBlur}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal outline-none"
                                    placeholder="e.g. john@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal outline-none"
                                    placeholder="e.g. +359 888 123 456"
                                />
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-xs text-blue-800">
                                    💡 This creates a participant record. You can add them to specific deals later from the deal's participant management.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-teal text-white font-bold rounded-lg hover:bg-teal/90"
                            >
                                Add Participant
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Duplicate Detection Modal */}
            {showDuplicateModal && duplicateParticipant && (
                <DuplicateDetectionModal
                    existingParticipant={duplicateParticipant}
                    email={pendingData?.email || ''}
                    deals={getParticipantDeals(duplicateParticipant.id).map(({ deal, dealParticipant }) => ({
                        dealName: deal.title || deal.propertyAddress,
                        role: dealParticipant.role
                    }))}
                    onCancel={handleCancelDuplicate}
                    onUseExisting={handleUseExisting}
                    onCreateNew={handleCreateNew}
                />
            )}
        </>
    );
}
