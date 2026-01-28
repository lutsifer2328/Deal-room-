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
            <div className="mb-6">
                <h2 className="text-xl font-bold text-midnight mb-2">⏰ Expiring Soon</h2>
                <p className="text-sm text-gray-600">
                    Documents with expiration dates within the next 30 days
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-red-700">
                        {expiringTasks.filter(t => t.daysUntilExpiry <= 7).length}
                    </div>
                    <div className="text-sm text-red-600">≤ 7 Days</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-orange-700">
                        {expiringTasks.filter(t => t.daysUntilExpiry > 7 && t.daysUntilExpiry <= 14).length}
                    </div>
                    <div className="text-sm text-orange-600">8-14 Days</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-yellow-700">
                        {expiringTasks.filter(t => t.daysUntilExpiry > 14).length}
                    </div>
                    <div className="text-sm text-yellow-600">15-30 Days</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-700">
                        {expiringTasks.length}
                    </div>
                    <div className="text-sm text-gray-600">Total Expiring</div>
                </div>
            </div>

            {/* Info Box */}
            {expiringTasks.filter(t => t.daysUntilExpiry <= 7).length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-red-800">Urgent Action Required</p>
                        <p className="text-sm text-red-700">
                            {expiringTasks.filter(t => t.daysUntilExpiry <= 7).length} document(s) expiring within 7 days.
                            Please review and take necessary action.
                        </p>
                    </div>
                </div>
            )}

            {/* Table */}
            {expiringTasks.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">No expiring documents</p>
                    <p className="text-sm text-gray-500">All documents are valid for more than 30 days</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="text-left py-3 px-4 font-bold text-midnight">Urgency</th>
                                <th className="text-left py-3 px-4 font-bold text-midnight">Deal</th>
                                <th className="text-left py-3 px-4 font-bold text-midnight">Document</th>
                                <th className="text-left py-3 px-4 font-bold text-midnight">Participant</th>
                                <th className="text-left py-3 px-4 font-bold text-midnight">Expires</th>
                                <th className="text-left py-3 px-4 font-bold text-midnight">Status</th>
                                <th className="text-right py-3 px-4 font-bold text-midnight">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expiringTasks.map((item) => {
                                const badge = getUrgencyBadge(item.daysUntilExpiry);
                                return (
                                    <tr key={item.taskId} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${getUrgencyColor(item.daysUntilExpiry)}`}>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 ${badge.color} text-white text-xs font-bold rounded`}>
                                                {badge.text}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-medium text-midnight">{item.dealTitle}</div>
                                            <div className="text-xs text-gray-500">{item.dealAddress}</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-medium text-midnight">{item.taskTitle}</div>
                                        </td>
                                        <td className="py-3 px-4 text-gray-600 text-sm">
                                            {item.participantName}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-medium text-midnight">
                                                {new Date(item.expirationDate).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {item.daysUntilExpiry} day{item.daysUntilExpiry !== 1 ? 's' : ''} remaining
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            {item.hasDocument ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                                                    ✓ Uploaded
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded">
                                                    ⚠ Missing
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <button
                                                onClick={() => handleViewDeal(item.dealId)}
                                                className="inline-flex items-center gap-2 px-3 py-1 bg-midnight text-white text-xs font-bold rounded hover:bg-midnight/90 transition-colors"
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
            )}
        </div>
    );
}
