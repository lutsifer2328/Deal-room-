'use client';

import { useRouter } from 'next/navigation';
import { AlertCircle, Clock, MoonStar, ChevronRight } from 'lucide-react';
import { useNeedsAttention } from '@/lib/useNeedsAttention';
import { useTranslation } from '@/lib/useTranslation';

const MAX_CARDS = 6;

// Dashboard strip of deals that need staff action right now — pending reviews,
// tasks expiring within 7 days, or deals gone quiet for 14+ days. Hidden when
// nothing needs attention.
export default function NeedsAttentionStrip() {
    const { attentionDeals } = useNeedsAttention();
    const { t } = useTranslation();
    const router = useRouter();

    if (attentionDeals.length === 0) return null;

    return (
        <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                </div>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">
                    {t('attention.title')}
                </span>
                <span className="text-xs font-bold text-white bg-amber-500 rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                    {attentionDeals.length}
                </span>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {attentionDeals.slice(0, MAX_CARDS).map(deal => (
                    <button
                        key={deal.dealId}
                        onClick={() => router.push(`/deal/${deal.dealId}`)}
                        className="flex-shrink-0 w-[280px] text-left bg-white rounded-2xl border border-amber-200/60 shadow-sm hover:shadow-md hover:border-amber-300 hover:-translate-y-0.5 transition-all p-5 group"
                    >
                        <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-bold text-navy-primary truncate group-hover:text-teal transition-colors">
                                {deal.dealTitle}
                            </h3>
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-teal flex-shrink-0 mt-1 transition-colors" />
                        </div>
                        <p className="text-xs text-text-light truncate mb-3">{deal.propertyAddress}</p>
                        <div className="flex flex-wrap gap-2">
                            {deal.pendingReviewCount > 0 && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                    <AlertCircle className="w-3 h-3" />
                                    {t('attention.pending', { count: deal.pendingReviewCount })}
                                </span>
                            )}
                            {deal.expiringCount > 0 && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                                    <Clock className="w-3 h-3" />
                                    {t('attention.expiring', { count: deal.expiringCount })}
                                </span>
                            )}
                            {deal.isStale && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                                    <MoonStar className="w-3 h-3" />
                                    {t('attention.stale', { days: deal.staleDays })}
                                </span>
                            )}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
