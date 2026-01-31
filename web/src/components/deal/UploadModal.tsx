import { useEffect, useState } from 'react';
import { Upload as UploadIcon, FileText } from 'lucide-react';
import { useData } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import { Modal, ModalHeader, ModalContent, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export default function UploadModal({ taskId, taskTitle, onClose, isOpen = true }: {
    taskId: string,
    taskTitle: string,
    onClose: () => void,
    isOpen?: boolean
}) {
    const { uploadDocument } = useData();
    const { user } = useAuth();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setSelectedFile(null);
            setIsUploading(false);
        }
    }, [isOpen]);

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
        <Modal isOpen={isOpen} onClose={onClose} size="md">
            <ModalHeader onClose={onClose} className="bg-midnight text-white">
                Upload Document
            </ModalHeader>

            <ModalContent>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Requirement</label>
                        <p className="text-gray-600 font-medium bg-gray-50 p-2 rounded border border-gray-100">{taskTitle}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Select File</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal transition-colors group cursor-pointer bg-gray-50/50 hover:bg-teal/5">
                            <input
                                type="file"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="file-upload"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                            <label htmlFor="file-upload" className="cursor-pointer block w-full h-full">
                                {selectedFile ? (
                                    <div className="flex flex-col items-center justify-center gap-2 text-teal animate-in fade-in">
                                        <FileText className="w-8 h-8" />
                                        <span className="font-bold">{selectedFile.name}</span>
                                        <span className="text-xs text-gray-500 font-medium">Click to change file</span>
                                    </div>
                                ) : (
                                    <div className="group-hover:translate-y-[-2px] transition-transform duration-200">
                                        <UploadIcon className="w-10 h-10 mx-auto text-gray-400 mb-3 group-hover:text-teal transition-colors" />
                                        <p className="text-gray-600 font-bold group-hover:text-teal transition-colors">Click to select file</p>
                                        <p className="text-xs text-gray-400 mt-1">PDF, DOC, JPG, PNG (max 10MB)</p>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-2 items-start">
                        <div className="text-blue-500 mt-0.5">ℹ️</div>
                        <p className="text-xs text-blue-800 leading-relaxed">
                            <strong>Note:</strong> After upload, the lawyer will review your document before it becomes visible to other parties.
                        </p>
                    </div>
                </div>
            </ModalContent>

            <ModalFooter>
                <Button variant="ghost" onClick={onClose} disabled={isUploading}>
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onClick={handleUpload}
                    disabled={!selectedFile || isUploading}
                    isLoading={isUploading}
                    className="flex items-center gap-2"
                >
                    {!isUploading && <UploadIcon className="w-4 h-4" />}
                    Upload Document
                </Button>
            </ModalFooter>
        </Modal>
    );
}
