'use client';

import { useData } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Task } from '@/lib/types';
import { useTranslation, TranslationKey } from '@/lib/useTranslation';

/**
 * Edit an existing document request — title, per-case instructions, and deadline.
 * Reassignment is deliberately out of scope (delete + recreate for that); this
 * exists so the lawyer can refine free-text instructions without starting over.
 */
export default function EditTaskModal({ task, onClose }: { task: Task, onClose: () => void }) {
    const { updateTask } = useData();
    const { user } = useAuth();
    const { t } = useTranslation();

    const [title, setTitle] = useState(task.title_en || '');
    const [instructions, setInstructions] = useState(task.description_en || task.description_bg || '');
    const [expirationDate, setExpirationDate] = useState(
        task.expirationDate ? task.expirationDate.split('T')[0] : ''
    );
    const [isSaving, setIsSaving] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    if (!mounted || !user || (user.role !== 'lawyer' && user.role !== 'admin')) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || isSaving) return;
        setIsSaving(true);
        try {
            await updateTask(
                task.id,
                { title: title.trim(), description: instructions, expirationDate: expirationDate || null },
                user.id
            );
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    // Portal to <body>: task cards have backdrop-blur, which would otherwise make
    // this fixed overlay size/position relative to the card instead of the viewport.
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
            <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[92vh] sm:max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-midnight text-white">
                    <h2 className="text-lg font-bold">{t('modal.editTask.title' as TranslationKey)}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white" title={t('common.cancel')}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 sm:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-6 space-y-4 overflow-y-auto flex-1 min-h-0">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('modal.createTask.docTitle')}</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal focus:border-teal outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('modal.createTask.instructions' as TranslationKey)}</label>
                        <textarea
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            rows={5}
                            placeholder={t('modal.createTask.instructionsPlaceholder' as TranslationKey)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal focus:border-teal outline-none transition-all resize-y"
                        />
                        <p className="text-xs text-gray-500 mt-1">{t('modal.createTask.instructionsHelp' as TranslationKey)}</p>
                    </div>

                    <div>
                        <label htmlFor="editExpirationDate" className="block text-sm font-medium text-gray-700 mb-1">
                            {t('modal.createTask.expiration')}
                        </label>
                        <input
                            id="editExpirationDate"
                            type="date"
                            value={expirationDate}
                            onChange={(e) => setExpirationDate(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal focus:border-teal outline-none transition-all"
                            title={t('modal.createTask.expiration')}
                        />
                    </div>

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
                            disabled={isSaving || !title.trim()}
                            className="w-full sm:w-auto px-6 py-2 bg-midnight text-white font-bold rounded-lg shadow-lg hover:bg-midnight/90 disabled:opacity-50 transition-all"
                        >
                            {isSaving ? t('modal.createTask.submitting') : t('common.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
