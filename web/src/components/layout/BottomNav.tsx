'use client';

import { useAuth } from '@/lib/authContext';
import { useTranslation } from '@/lib/useTranslation';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, ClipboardCheck, Settings } from 'lucide-react';

export default function BottomNav() {
    const { user } = useAuth();
    const pathname = usePathname();
    const { t } = useTranslation();

    if (!user) return null;

    const navItems = [
        { icon: LayoutDashboard, label: t('nav.dealRoom'), href: user.role === 'admin' ? '/dashboard-pro' : '/dashboard', roles: ['admin', 'lawyer', 'staff', 'broker', 'agent', 'buyer', 'seller', 'notary', 'bank_representative', 'viewer', 'attorney', 'user'] },
        { icon: ClipboardCheck, label: t('nav.archive'), href: '/archive', roles: ['admin', 'lawyer', 'staff', 'broker', 'agent'] },
        { icon: Settings, label: t('nav.settings'), href: '/settings', roles: ['admin'] },
    ];

    const visibleItems = navItems.filter(item => item.roles.includes(user.role));

    if (visibleItems.length === 0) return null;

    return (
        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] env(safe-area-inset-bottom)">
            <div className="flex items-center justify-around h-16 sm:h-20 px-4">
                {visibleItems.map((item) => {
                    const Icon = item.icon;
                    // Exact match or subpath. Adjust dashboard logic.
                    const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/dashboard-pro') || (item.href !== '/dashboard' && item.href !== '/dashboard-pro' && pathname?.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${isActive ? 'text-teal translate-y-[-2px]' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <div className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-colors ${isActive ? 'bg-teal/10' : ''}`}>
                                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                            </div>
                            <span className={`text-[10px] font-bold tracking-wide transition-colors ${isActive ? 'text-teal' : 'text-gray-500'}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
