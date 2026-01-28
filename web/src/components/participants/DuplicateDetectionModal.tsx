'use client';

import { X, AlertTriangle } from 'lucide-react';
import { GlobalParticipant } from '@/lib/types';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-orange-50">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-orange-800">
                        <AlertTriangle className="w-5 h-5" />
                        Existing Participant Found
                    </h2>
                    <button onClick={onCancel} className="text-gray-600 hover:text-gray-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-700 mb-4">
                        A participant with email <strong>{email}</strong> already exists:
                    </p>

                    {/* Existing Participant Info */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-full bg-teal flex items-center justify-center text-white font-bold text-lg">
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
                                            <span className="w-1.5 h-1.5 rounded-full bg-teal"></span>
                                            {deal.dealName}
                                            <span className="text-xs font-bold px-2 py-0.5 rounded uppercase bg-teal/10 text-teal">
                                                {deal.role}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <p className="text-gray-700 font-medium mb-6">
                        Would you like to use this participant?
                    </p>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onUseExisting}
                            className="flex-1 px-4 py-2 bg-teal text-white rounded-lg font-bold hover:bg-teal/90"
                        >
                            Use Existing
                        </button>
                        <button
                            onClick={handleCreateNew}
                            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600"
                        >
                            Create New
                        </button>
                    </div>

                    <p className="text-xs text-gray-500 mt-3 text-center">
                        Creating a new participant will result in duplicate entries
                    </p>
                </div>
            </div>
        </div>
    );
}
