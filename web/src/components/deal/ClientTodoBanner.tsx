'use client';

import { Task } from '@/lib/types';
import { ClipboardList, CheckCircle2, ArrowDown, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';

// Answers the client's real question — "do I owe anything right now?" — in one
// card at the top of the deal page. `actionTasks` are the tasks the current
// participant must act on (nothing uploaded yet, or everything rejected).
export default function ClientTodoBanner({ actionTasks }: { actionTasks: Task[] }) {
    const { t, language } = useTranslation();

    if (actionTasks.length === 0) {
        return (
            <div className="mb-6 bg-success/5 border border-success/20 rounded-2xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                </div>
                <div>
                    <h3 className="font-bold text-navy-primary text-sm mb-1">{t('deal.todo.allDone.title')}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{t('deal.todo.allDone.text')}</p>
                </div>
            </div>
        );
    }

    const rejectedCount = actionTasks.filter(tk => tk.documents.some(d => d.status === 'rejected')).length;

    const dueDates = actionTasks
        .map(tk => tk.expirationDate)
        .filter((d): d is string => !!d)
        .map(d => new Date(d))
        .filter(d => !isNaN(d.getTime()));
    const earliestDue = dueDates.length > 0 ? new Date(Math.min(...dueDates.map(d => d.getTime()))) : null;
    const dueLabel = earliestDue
        ? earliestDue.toLocaleDateString(language === 'bg' ? 'bg-BG' : 'en-GB', { day: 'numeric', month: 'long' })
        : null;

    const scrollToFirstTask = () => {
        document.getElementById(`task-${actionTasks[0].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="mb-6 bg-gradient-to-r from-gold/10 via-amber-50/60 to-gold/5 border border-gold/25 rounded-2xl p-5">
            <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ClipboardList className="w-5 h-5 text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-navy-primary text-sm mb-1">{t('deal.todo.title')}</h3>
                    <p className="text-sm text-gray-700 leading-relaxed font-medium">
                        {actionTasks.length === 1
                            ? t('deal.todo.uploadOne')
                            : t('deal.todo.uploadMany', { count: actionTasks.length })}
                        {dueLabel && (
                            <span className="text-gray-500 font-normal"> · {t('deal.todo.firstDue', { date: dueLabel })}</span>
                        )}
                    </p>
                    {rejectedCount > 0 && (
                        <p className="text-sm text-red-600 leading-relaxed mt-1 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                            {rejectedCount === 1
                                ? t('deal.todo.rejectedOne')
                                : t('deal.todo.rejectedMany', { count: rejectedCount })}
                        </p>
                    )}
                    <button
                        onClick={scrollToFirstTask}
                        className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-white bg-navy-primary hover:bg-navy-primary/90 px-4 py-2 rounded-xl shadow-sm transition-all active:scale-95"
                    >
                        <ArrowDown className="w-4 h-4" />
                        {t('deal.todo.goTo')}
                    </button>
                </div>
            </div>
        </div>
    );
}
