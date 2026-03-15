'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal, ModalHeader, ModalContent, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export default function DeleteDocumentModal({ docTitle, onClose, onConfirm }: {
    docTitle: string;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirm = async () => {
        setIsDeleting(true);
        try {
            await onConfirm();
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Modal isOpen onClose={onClose} size="md">
            <ModalHeader onClose={onClose} className="bg-midnight text-white">
                Remove Document
            </ModalHeader>

            <ModalContent>
                <div className="space-y-4">
                    <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-lg p-3">
                        <Trash2 className="w-5 h-5 text-danger flex-shrink-0" />
                        <p className="text-sm font-bold text-gray-800 truncate">{docTitle}</p>
                    </div>

                    <p className="text-sm text-gray-700">
                        Are you sure you want to remove this file? This action cannot be undone.
                    </p>
                    <p className="text-sm text-gray-500">
                        Сигурни ли сте, че искате да премахнете този файл? Това действие е необратимо.
                    </p>
                </div>
            </ModalContent>

            <ModalFooter>
                <Button variant="ghost" onClick={onClose} disabled={isDeleting}>
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onClick={handleConfirm}
                    disabled={isDeleting}
                    isLoading={isDeleting}
                    className="bg-danger hover:bg-red-700 flex items-center gap-2"
                >
                    {!isDeleting && <Trash2 className="w-4 h-4" />}
                    Delete
                </Button>
            </ModalFooter>
        </Modal>
    );
}
