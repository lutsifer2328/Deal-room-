'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/useTranslation';
import { AlertTriangle, X } from 'lucide-react';
import { anonymizeUserAction } from '@/app/actions/anonymize-user';
import { useAuth } from '@/lib/authContext';

interface GdprAnonymizeModalProps {
    userId: string;
    userName: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function GdprAnonymizeModal({ userId, userName, onClose, onSuccess }: GdprAnonymizeModalProps) {
    const { t } = useTranslation();
    const { user: currentUser } = useAuth();
    const [confirmationText, setConfirmationText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isConfirmed = confirmationText === 'ПОТВЪРЖДАВАМ';

    const handleProceed = async () => {
        if (!isConfirmed) return;
        setLoading(true);
        setError('');

        try {
            const result = await anonymizeUserAction(userId, currentUser?.id || 'unknown');
            if (!result.success) {
                throw new Error(result.error);
            }
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to anonymize user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
                <div className="bg-red-50 p-6 flex items-start gap-4 border-b border-red-100">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 text-red-600">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-red-900 mb-1">
                            Заличи потребителя
                        </h2>
                        <p className="text-sm text-red-700">
                            Warning: Files and profile data will be permanently purged, but anonymized deal records may be kept for legal audit.
                        </p>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
                            {error}
                        </div>
                    )}

                    <div>
                        <p className="text-sm text-gray-700 mb-3 font-medium">
                            To process the GDPR anonymization for <strong>{userName}</strong>, please type <span className="font-bold text-teal-600 tracking-wider">ПОТВЪРЖДАВАМ</span> below.
                        </p>
                        <input
                            type="text"
                            value={confirmationText}
                            onChange={(e) => setConfirmationText(e.target.value)}
                            placeholder="ПОТВЪРЖДАВАМ"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent uppercase tracking-wider text-center font-bold"
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 font-semibold transition-colors disabled:opacity-50"
                    >
                        Отказ
                    </button>
                    <button
                        onClick={handleProceed}
                        disabled={!isConfirmed || loading}
                        className={`px-6 py-2 rounded-lg font-bold text-white transition-all shadow-md ${!isConfirmed || loading
                                ? 'bg-red-300 cursor-not-allowed opacity-70'
                                : 'bg-red-600 hover:bg-red-700 hover:shadow-red-500/30'
                            }`}
                    >
                        {loading ? 'Processing...' : 'Заличи'}
                    </button>
                </div>
            </div>
        </div>
    );
}
