'use client';

import { X, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '@/lib/useTranslation';

const REASONS = [
    { label: 'Unreadable copy / Нечетливо копие', en: 'Unreadable copy', bg: 'Нечетливо копие' },
    { label: 'Document expired / Изтекъл срок', en: 'Document expired', bg: 'Изтекъл срок' },
    { label: 'Missing signature / Липсва подпис', en: 'Missing signature', bg: 'Липсва подпис' },
    { label: 'Wrong document / Грешен документ', en: 'Wrong document', bg: 'Грешен документ' },
];

export default function RejectionModal({ onClose, onConfirm }: { onClose: () => void, onConfirm: (en: string, bg: string) => void }) {
    const { t } = useTranslation();
    const [reasonEn, setReasonEn] = useState(REASONS[0].en);
    const [reasonBg, setReasonBg] = useState(REASONS[0].bg);
    const [isCustom, setIsCustom] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(reasonEn, reasonBg);
    };

    const psetReason = (idx: number) => {
        setReasonEn(REASONS[idx].en);
        setReasonBg(REASONS[idx].bg);
        setIsCustom(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
            <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[92vh] sm:max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-red-600 text-white">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        {t('reject.title')}
                    </h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-6 space-y-4 overflow-y-auto flex-1 min-h-0">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('reject.commonReasons')}</label>
                        <div className="grid grid-cols-1 gap-2">
                            {REASONS.map((r, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => psetReason(i)}
                                    className={`flex items-center justify-between px-3 py-2 text-sm border rounded-lg transition-colors ${reasonEn === r.en && !isCustom ? 'border-red-500 bg-red-50 text-red-700 font-medium' : 'border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {r.label}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => setIsCustom(true)}
                                className={`flex items-center justify-between px-3 py-2 text-sm border rounded-lg transition-colors ${isCustom ? 'border-red-500 bg-red-50 text-red-700 font-medium' : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                {t('reject.otherCustom')}
                            </button>
                        </div>
                    </div>

                    {isCustom && (
                        <div className="space-y-3 pt-2 border-t border-gray-100">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t('reject.enReason')}</label>
                                <input
                                    type="text"
                                    required
                                    value={reasonEn}
                                    onChange={(e) => setReasonEn(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t('reject.bgReason')}</label>
                                <input
                                    type="text"
                                    required
                                    value={reasonBg}
                                    onChange={(e) => setReasonBg(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 outline-none text-sm"
                                />
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:w-auto px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="w-full sm:w-auto px-6 py-2 bg-red-600 text-white font-bold rounded-lg shadow-lg hover:bg-red-700 transition-all"
                        >
                            {t('reject.title')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
