'use client';

import { useData } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import { AlertTriangle, Calendar, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ExpiringSoonTab() {
    const { deals, tasks } = useData();
    const { user } = useAuth();
    const router = useRouter();

    if (!user) return null;

    // Get all tasks with expiration dates within 30 days
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiringTasks: Array<{
        taskId: string;
        taskTitle: string;
        dealId: string;
        dealTitle: string;
        dealAddress: string;
        participantName: string;
        expirationDate: string;
        daysUntilExpiry: number;
        hasDocument: boolean;
    }> = [];

    tasks.forEach(task => {
        if (!task.expirationDate) return;

        const deal = deals.find(d => d.id === task.dealId);
        if (!deal || deal.status === 'closed') return;

        const expirationDate = new Date(task.expirationDate);
        if (expirationDate <= thirtyDaysFromNow && expirationDate >= now) {
            const participant = deal.participants.find(p => p.role === task.assignedTo);
            const daysUntilExpiry = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            expiringTasks.push({
                taskId: task.id,
                taskTitle: task.title_en,
                dealId: deal.id,
                dealTitle: deal.title,
                dealAddress: deal.propertyAddress,
                participantName: participant?.fullName || 'Unknown',
                expirationDate: task.expirationDate,
                daysUntilExpiry,
                hasDocument: task.documents.length > 0
            });
        }
    });

    // Sort by expiration date (soonest first)
    expiringTasks.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

    const handleViewDeal = (dealId: string) => {
        router.push(`/deal/${dealId}`);
    };

    const getUrgencyColor = (days: number) => {
        if (days <= 7) return 'bg-red-100 text-red-700 border-red-200';
        if (days <= 14) return 'bg-orange-100 text-orange-700 border-orange-200';
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    };

    const getUrgencyBadge = (days: number) => {
        if (days <= 7) return { text: 'Urgent', color: 'bg-red-600' };
        if (days <= 14) return { text: 'Soon', color: 'bg-orange-600' };
        return { text: 'Upcoming', color: 'bg-yellow-600' };
    };

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-navy-primary font-serif mb-2 flex items-center gap-2">
                    ⏰ Expiring Soon
                </h2>
                <p className="text-text-secondary">
                    Documents with expiration dates within the next 30 days
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-red-50 to-white border border-red-100 rounded-2xl p-5 shadow-sm">
                    <div className="text-3xl font-bold text-red-600 font-serif mb-1">
                        {expiringTasks.filter(t => t.daysUntilExpiry <= 7).length}
                    </div>
                    <div className="text-xs font-bold text-red-800/60 uppercase tracking-wider">≤ 7 Days</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-white border border-orange-100 rounded-2xl p-5 shadow-sm">
                    <div className="text-3xl font-bold text-orange-600 font-serif mb-1">
                        {expiringTasks.filter(t => t.daysUntilExpiry > 7 && t.daysUntilExpiry <= 14).length}
                    </div>
                    <div className="text-xs font-bold text-orange-800/60 uppercase tracking-wider">8-14 Days</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-white border border-yellow-100 rounded-2xl p-5 shadow-sm">
                    <div className="text-3xl font-bold text-yellow-600 font-serif mb-1">
                        {expiringTasks.filter(t => t.daysUntilExpiry > 14).length}
                    </div>
                    <div className="text-xs font-bold text-yellow-800/60 uppercase tracking-wider">15-30 Days</div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <div className="text-3xl font-bold text-navy-primary font-serif mb-1">
                        {expiringTasks.length}
                    </div>
                    <div className="text-xs font-bold text-text-light uppercase tracking-wider">Total Expiring</div>
                </div>
            </div>

            {/* Info Box */}
            {expiringTasks.filter(t => t.daysUntilExpiry <= 7).length > 0 && (
                <div className="bg-red-50/50 border border-red-100 rounded-2xl p-5 mb-8 flex items-start gap-4 shadow-sm">
                    <div className="bg-white p-2 rounded-full shadow-sm text-red-600 border border-red-50">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    </div>
                    <div>
                        <p className="font-bold text-red-800 text-lg mb-1">Urgent Action Required</p>
                        <p className="text-sm text-red-700/80 leading-relaxed">
                            {expiringTasks.filter(t => t.daysUntilExpiry <= 7).length} document(s) expiring within 7 days.
                            Please review and take necessary action.
                        </p>
                    </div>
                </div>
            )}

            {/* Table */}
            {expiringTasks.length === 0 ? (
                <div className="text-center py-16 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-navy-primary font-bold text-lg mb-2">No expiring documents</p>
                    <p className="text-text-secondary">All documents are valid for more than 30 days</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="text-left py-4 px-6 text-xs font-bold text-text-light uppercase tracking-wider">Urgency</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-text-light uppercase tracking-wider">Deal</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-text-light uppercase tracking-wider">Document</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-text-light uppercase tracking-wider">Participant</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-text-light uppercase tracking-wider">Expires</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-text-light uppercase tracking-wider">Status</th>
                                    <th className="text-right py-4 px-6 text-xs font-bold text-text-light uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {expiringTasks.map((item) => {
                                    const badge = getUrgencyBadge(item.daysUntilExpiry);
                                    // Use left border for color coding instead of full background
                                    let rowBorderColor = 'border-l-4 border-l-transparent';
                                    if (item.daysUntilExpiry <= 7) rowBorderColor = 'border-l-4 border-l-red-500 bg-red-50/10';
                                    else if (item.daysUntilExpiry <= 14) rowBorderColor = 'border-l-4 border-l-orange-500 bg-orange-50/10';
                                    else rowBorderColor = 'border-l-4 border-l-yellow-500 bg-yellow-50/10';

                                    return (
                                        <tr key={item.taskId} className={`hover:bg-gray-50 transition-colors ${rowBorderColor}`}>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${badge.color} text-white text-xs font-bold rounded-md shadow-sm`}>
                                                    {badge.text}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="font-bold text-navy-primary">{item.dealTitle}</div>
                                                <div className="text-xs text-text-light font-medium mt-0.5">{item.dealAddress}</div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="font-medium text-navy-primary text-sm">{item.taskTitle}</div>
                                            </td>
                                            <td className="py-4 px-6 text-text-secondary text-sm font-medium">
                                                {item.participantName}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="font-bold text-navy-primary">
                                                    {new Date(item.expirationDate).toLocaleDateString()}
                                                </div>
                                                <div className="text-xs text-text-light font-medium">
                                                    {item.daysUntilExpiry} day{item.daysUntilExpiry !== 1 ? 's' : ''} remaining
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                {item.hasDocument ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md border border-green-200">
                                                        ✓ Uploaded
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-md border border-gray-200">
                                                        ⚠ Missing
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <button
                                                    onClick={() => handleViewDeal(item.dealId)}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-navy-primary text-white text-xs font-bold rounded-lg hover:bg-navy-secondary transition-colors shadow-sm"
                                                >
                                                    View Deal
                                                    <ExternalLink className="w-3 h-3" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
