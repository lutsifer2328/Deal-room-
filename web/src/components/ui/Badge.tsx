import * as React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'warning' | 'error' | 'outline' | 'info';
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant = 'default', ...props }, ref) => {

        const variants = {
            default: 'bg-gray-100 text-gray-800',
            success: 'bg-green-100 text-green-800',
            warning: 'bg-gold/10 text-gold-dark',
            error: 'bg-red-100 text-red-800',
            info: 'bg-blue-100 text-blue-800',
            outline: 'bg-transparent border border-gray-200 text-gray-600'
        };

        return (
            <span
                ref={ref}
                className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide',
                    variants[variant],
                    className
                )}
                {...props}
            />
        );
    }
);
Badge.displayName = 'Badge';

export { Badge };
