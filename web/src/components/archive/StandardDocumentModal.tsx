'use client';

import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { useData } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import { StandardDocument } from '@/lib/types';
import { X } from 'lucide-react';

interface StandardDocumentModalProps {
    document: StandardDocument | null;
    onClose: () => void;
}

export default function StandardDocumentModal({ document, onClose }: StandardDocumentModalProps) {
    const { addStandardDocument, updateStandardDocument } = useData();
    const { user } = useAuth();

    const [name, setName] = useState(document?.name || '');
    const [description, setDescription] = useState(document?.description || '');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        window.document.body.style.overflow = 'hidden';
        return () => {
            window.document.body.style.overflow = 'unset';
        };
    }, []);

    if (!user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (name.trim().length < 3) {
            setError('Document name must be at least 3 characters');
            return;
        }

        if (name.trim().length > 100) {
            setError('Document name must be less than 100 characters');
            return;
        }

        if (description.length > 500) {
            setError('Description must be less than 500 characters');
            return;
        }

        setIsSubmitting(true);

        try {
            if (document) {
                // Update existing document
                await updateStandardDocument(document.id, name.trim(), description.trim());
            } else {
                // Add new document
                await addStandardDocument(name.trim(), description.trim(), user.id);
            }
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setIsSubmitting(false);
        }
    };

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-midnight text-white">
                    <h2 className="text-lg font-bold">
                        {document ? 'Edit Document Name' : 'Add Document Name'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Document Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Document Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Proof of Identity, Bank Statement"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal focus:border-teal outline-none transition-all"
                            maxLength={100}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {name.length}/100 characters
                        </p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description (optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description to help identify this document"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal focus:border-teal outline-none transition-all resize-none"
                            rows={3}
                            maxLength={500}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {description.length}/500 characters
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !name.trim()}
                            className="px-6 py-2 bg-midnight text-white font-bold rounded-lg shadow-lg hover:bg-midnight/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isSubmitting ? 'Saving...' : document ? 'Save Changes' : 'Add Document'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        window.document.body
    );
}
