'use client';

import { LayoutDashboard, FileText, Users, CreditCard, Building, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

export default function Sidebar() {
    const { user } = useAuth();
    const pathname = usePathname();

    if (!user) return null;

    const navItems = [
        { icon: LayoutDashboard, label: 'Deal Room', href: '/dashboard', roles: ['lawyer', 'admin', 'staff', 'viewer'] },
        { icon: FileText, label: 'Documents', href: '/documents', roles: ['lawyer', 'admin', 'buyer', 'seller', 'agent', 'staff'] },
        { icon: Users, label: 'Participants', href: '/participants', roles: ['lawyer', 'admin', 'staff'] },
        { icon: CreditCard, label: 'Finances', href: '/finances', roles: ['lawyer', 'admin'] },
        { icon: Settings, label: 'Settings', href: '/settings', roles: ['admin'] },
    ];


    const visibleItems = navItems.filter(item => item.roles.includes(user.role));

    return (
        <div className="w-64 bg-midnight text-white min-h-screen p-6 flex flex-col">
            {/* Logo */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-2xl font-bold">
                    <Building className="w-8 h-8 text-teal" />
                    <span>AGENZIA<span className="text-gold">.BG</span></span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2">
                {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname?.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                ? 'bg-teal text-white font-bold shadow-lg'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer Info */}
            <div className="mt-auto pt-6 border-t border-white/10">
                <p className="text-xs text-white/50">
                    Logged in as <strong className="text-white">{user.name}</strong>
                </p>
                <p className="text-xs text-white/30 capitalize">{user.role}</p>
            </div>
        </div>
    );
}
