'use client';

import { AlertTriangle } from 'lucide-react';
import { GlobalParticipant } from '@/lib/types';
import { Modal, ModalHeader, ModalContent, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface DuplicateDetectionModalProps {
    existingParticipant: GlobalParticipant;
    email: string;
    deals: Array<{ dealName: string; role: string }>;
    onCancel: () => void;
    onUseExisting: () => void;
    onCreateNew: () => void;
}

export default function DuplicateDetectionModal({
    existingParticipant,
    email,
    deals,
    onCancel,
    onUseExisting,
    onCreateNew
}: DuplicateDetectionModalProps) {
    const handleCreateNew = () => {
        if (confirm('Are you sure? This will create a duplicate entry for the same email address.')) {
            onCreateNew();
        }
    };

    return (
        <Modal isOpen={true} onClose={onCancel} size="md">
            <ModalHeader className="bg-orange-50 border-orange-100 text-orange-800" onClose={onCancel}>
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    Existing Participant Found
                </div>
            </ModalHeader>
            <ModalContent>
                <p className="text-gray-700 mb-4">
                    A participant with email <strong>{email}</strong> already exists:
                </p>

                {/* Existing Participant Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-teal flex items-center justify-center text-white font-bold text-lg shrink-0">
                            {existingParticipant.name.charAt(0)}
                        </div>
                        <div>
                            <div className="font-bold text-midnight">{existingParticipant.name}</div>
                            <div className="text-sm text-gray-600">{existingParticipant.email}</div>
                            {existingParticipant.phone && (
                                <div className="text-sm text-gray-600">{existingParticipant.phone}</div>
                            )}
                        </div>
                    </div>

                    {deals.length > 0 && (
                        <div className="pt-3 border-t border-gray-200">
                            <div className="text-xs font-bold text-gray-700 uppercase mb-2">
                                Currently in {deals.length} {deals.length === 1 ? 'deal' : 'deals'}:
                            </div>
                            <ul className="space-y-1">
                                {deals.map((deal, index) => (
                                    <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-teal shrink-0"></span>
                                        <span className="truncate max-w-[150px]">{deal.dealName}</span>
                                        <Badge variant="outline" className="text-teal bg-teal/5 border-teal/20 text-[10px] px-1.5 py-0">
                                            {deal.role}
                                        </Badge>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <p className="text-gray-700 font-medium mb-4">
                    Would you like to use this participant?
                </p>

                <p className="text-xs text-gray-500 text-center">
                    Creating a new participant will result in duplicate entries
                </p>
            </ModalContent>
            <ModalFooter className="flex-col sm:flex-row gap-2">
                <Button onClick={onCancel} variant="outline" className="w-full sm:w-auto">
                    Cancel
                </Button>
                <Button onClick={onUseExisting} variant="primary" className="w-full sm:w-auto">
                    Use Existing
                </Button>
                <Button onClick={handleCreateNew} variant="danger" className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 border-none text-white">
                    Create New
                </Button>
            </ModalFooter>
        </Modal>
    );
}
