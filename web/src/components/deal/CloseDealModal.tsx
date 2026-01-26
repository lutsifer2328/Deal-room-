'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface CloseDealModalProps {
    dealTitle: string;
    onClose: () => void;
    onConfirm: (notes: string) => void;
}

export default function CloseDealModal({ dealTitle, onClose, onConfirm }: CloseDealModalProps) {
    const [notes, setNotes] = useState('');

    const handleConfirm = () => {
        onConfirm(notes);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-midnight">Close Deal</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
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
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-midnight text-white rounded-lg font-bold hover:bg-midnight/90 transition-colors"
                    >
                        Close Deal
                    </button>
                </div>
            </div>
        </div>
    );
}
