'use client';

import { Building, FileText, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Deal, Task } from '@/lib/types';
import DealStatusBadge from '@/components/deal/DealStatusBadge';

/**
 * Participant-facing deals home.
 *
 * A repeat client can be a participant in several deals at once (some active,
 * some closed). Each deal is its own "table" — this grid keeps them strictly
 * separated, shows the status of *their* document requests per deal, and marks
 * closed deals distinctly so past work is visible but never confused with live
 * requests. Clicking a card opens that deal's document view.
 */
export default function ParticipantDealsGrid({ deals, tasks }: { deals: Deal[]; tasks: Task[] }) {
    const router = useRouter();

    if (deals.length === 0) {
        return (
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building className="w-8 h-8 opacity-20" />
                </div>
                <p className="text-lg font-medium text-text-secondary">No deals in this category.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {deals.map((deal) => {
                const dealTasks = tasks.filter((t) => t.dealId === deal.id);
                const total = dealTasks.length;
                // "Needed from you" = not yet submitted or was rejected and must be re-done.
                const needed = dealTasks.filter((t) => t.status === 'pending' || t.status === 'rejected').length;
                const awaiting = dealTasks.filter((t) => t.status === 'pending_review' || t.status === 'in_review').length;
                const done = dealTasks.filter((t) => t.status === 'completed').length;
                const isClosed = deal.status === 'closed';
                const s = (n: number) => (n === 1 ? '' : 's');

                return (
                    <button
                        key={deal.id}
                        onClick={() => router.push(`/deal/${deal.id}`)}
                        className={`text-left bg-white rounded-3xl shadow-lg shadow-navy-primary/5 border p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group ${isClosed ? 'border-gray-200 opacity-80 hover:opacity-100' : 'border-white/20'
                            }`}
                    >
                        {/* Header: which deal is this */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-11 h-11 rounded-xl bg-teal/10 flex items-center justify-center text-teal flex-shrink-0 group-hover:bg-teal group-hover:text-white transition-colors">
                                    <Building className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-serif font-bold text-lg text-navy-primary truncate">{deal.title}</h3>
                                    <p className="text-sm text-text-light truncate">{deal.propertyAddress || 'No address'}</p>
                                </div>
                            </div>
                            <div className="flex-shrink-0">
                                <DealStatusBadge status={deal.status} />
                            </div>
                        </div>

                        {/* This deal's document requests — the heart of the "table meeting" */}
                        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                            {total === 0 ? (
                                <div className="flex items-center gap-2 text-sm text-text-light">
                                    <FileText className="w-4 h-4" />
                                    <span>No documents requested yet</span>
                                </div>
                            ) : needed > 0 ? (
                                <div className="flex items-center gap-2 text-sm font-bold text-amber-600">
                                    <Clock className="w-4 h-4" />
                                    <span>{needed} of {total} document{s(total)} still needed from you</span>
                                </div>
                            ) : awaiting > 0 ? (
                                <div className="flex items-center gap-2 text-sm font-bold text-blue-600">
                                    <Clock className="w-4 h-4" />
                                    <span>{awaiting} document{s(awaiting)} awaiting review</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-sm font-bold text-green-600">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>All {total} document{s(total)} submitted</span>
                                </div>
                            )}
                            {total > 0 && (
                                <div className="mt-2 text-xs text-text-light">{done}/{total} completed</div>
                            )}
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wide text-text-light">
                                {isClosed ? 'Closed deal' : 'Open deal'}
                            </span>
                            <span className="flex items-center gap-1 text-sm font-bold text-teal group-hover:gap-2 transition-all">
                                View documents <ArrowRight className="w-4 h-4" />
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
