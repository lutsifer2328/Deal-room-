'use client';

import { useData } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import { X, User } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Deal, Participant } from '@/lib/types';
import AutocompleteInput from '@/components/common/AutocompleteInput';

export default function CreateTaskModal({ deal, onClose }: { deal: Deal, onClose: () => void }) {
    const { addTask, standardDocuments, tasks } = useData();
    const { user } = useAuth();

    const [title, setTitle] = useState('');
    const [selectedParticipantId, setSelectedParticipantId] = useState('');
    const [selectedStandardDocId, setSelectedStandardDocId] = useState<string | undefined>(undefined);
    const [expirationDate, setExpirationDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!user || (user.role !== 'lawyer' && user.role !== 'admin')) return null;

    const activeParticipants = deal.participants.filter(p => p.isActive);

    // Build autocomplete suggestions
    const suggestions = useMemo(() => {
        const standardSuggestions = standardDocuments
            .filter(doc => doc.isActive)
            .map(doc => ({
                name: doc.name,
                source: 'standard' as const,
                standardDocumentId: doc.id
            }));

        // Get previously used document names from tasks
        const usedNames = new Set<string>();
        tasks.forEach(task => {
            if (!standardDocuments.find(doc => doc.name.toLowerCase() === task.title_en.toLowerCase())) {
                usedNames.add(task.title_en);
            }
        });

        const historySuggestions = Array.from(usedNames).map(name => ({
            name,
            source: 'history' as const
        }));

        return [...standardSuggestions, ...historySuggestions];
    }, [standardDocuments, tasks]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedParticipantId) {
            alert('Please select a participant');
            return;
        }

        const selectedParticipant = activeParticipants.find(p => p.id === selectedParticipantId);
        if (!selectedParticipant) return;


        setIsSubmitting(true);

        // Simulate API call
        setTimeout(() => {
            addTask(title, selectedParticipant.role, selectedStandardDocId, expirationDate || undefined);
            setIsSubmitting(false);
            onClose();
        }, 500);
    };

    const getRoleBadgeColor = (role: string) => {
        const colors: Record<string, string> = {
            'buyer': 'bg-teal/10 text-teal',
            'seller': 'bg-blue-100 text-blue-700',
            'broker': 'bg-purple-100 text-purple-700',
            'attorney': 'bg-orange-100 text-orange-700',
            'notary': 'bg-green-100 text-green-700',
            'bank_representative': 'bg-gray-100 text-gray-700',
        };
        return colors[role] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-midnight text-white">
                    <h2 className="text-lg font-bold">Add Document Requirement</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Document Title *</label>
                        <AutocompleteInput
                            value={title}
                            onChange={(newValue) => {
                                setTitle(newValue);
                                // Check if this matches a standard document
                                const matchingDoc = standardDocuments.find(
                                    doc => doc.isActive && doc.name.toLowerCase() === newValue.toLowerCase()
                                );
                                setSelectedStandardDocId(matchingDoc?.id);
                            }}
                            suggestions={suggestions}
                            placeholder="e.g. Proof of Identity, Bank Statement, Tax Return"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal focus:border-teal outline-none transition-all"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">Enter the document name that needs to be uploaded</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Assign To Participant *</label>
                        <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2">
                            {activeParticipants.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No participants in this deal yet</p>
                                </div>
                            ) : (
                                activeParticipants.map((participant) => (
                                    <button
                                        key={participant.id}
                                        type="button"
                                        onClick={() => setSelectedParticipantId(participant.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${selectedParticipantId === participant.id
                                            ? 'bg-teal/10 border-teal shadow-sm'
                                            : 'bg-white border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-teal flex items-center justify-center text-white font-bold">
                                            {participant.fullName.charAt(0)}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="font-bold text-midnight">{participant.fullName}</div>
                                            <div className="text-xs text-gray-500">{participant.email}</div>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${getRoleBadgeColor(participant.role)}`}>
                                            {participant.role.replace('_', ' ')}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Expiration Date (optional)
                        </label>
                        <input
                            type="date"
                            value={expirationDate}
                            onChange={(e) => setExpirationDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal focus:border-teal outline-none transition-all"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Set an expiration date for time-sensitive documents (e.g., ID cards, permits)
                        </p>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !selectedParticipantId}
                            className="px-6 py-2 bg-midnight text-white font-bold rounded-lg shadow-lg hover:bg-midnight/90 disabled:opacity-50 transition-all"
                        >
                            {isSubmitting ? 'Adding...' : 'Add Requirement'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

