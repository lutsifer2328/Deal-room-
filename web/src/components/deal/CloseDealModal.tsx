'use client';

import { useState } from 'react';
import { Modal, ModalHeader, ModalContent, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface CloseDealModalProps {
    dealTitle: string;
    onClose: () => void;
    onConfirm: (notes: string) => void;
    isOpen?: boolean;
}

export default function CloseDealModal({ dealTitle, onClose, onConfirm, isOpen = true }: CloseDealModalProps) {
    const [notes, setNotes] = useState('');

    const handleConfirm = () => {
        onConfirm(notes);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md">
            <ModalHeader onClose={onClose}>Close Deal</ModalHeader>
            <ModalContent>
                <p className="text-gray-700 mb-4">
                    Are you sure you want to close <strong className="text-midnight">"{dealTitle}"</strong>?
                </p>
                <p className="text-sm text-gray-500 mb-4">
                    This will move the deal to your archived deals. You can reopen it later if needed.
                </p>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Closure Notes <span className="text-gray-400">(Optional)</span>
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g., Property sold, all documents signed and finalized"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal outline-none resize-none"
                        rows={3}
                        autoFocus
                    />
                </div>
            </ModalContent>
            <ModalFooter>
                <Button onClick={onClose} variant="ghost">Cancel</Button>
                <Button onClick={handleConfirm} variant="secondary">Close Deal</Button>
            </ModalFooter>
        </Modal>
    );
}
