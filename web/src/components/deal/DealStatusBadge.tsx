'use client';

import { DealStatus } from '@/lib/types';
import { useTranslation } from '@/lib/useTranslation';

interface DealStatusBadgeProps {
    status: DealStatus;
    className?: string;
}

export default function DealStatusBadge({ status, className = '' }: DealStatusBadgeProps) {
    const { t } = useTranslation();

    const statusConfig = {
        active: { color: 'bg-green-100 text-green-700 border-green-200', icon: '🟢' },
        on_hold: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '🟡' },
        closed: { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: '⚫' }
    };

    const config = statusConfig[status];

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color} ${className}`}>
            <span>{config.icon}</span>
            {t(`status.${status}`)}
        </span>
    );
}
