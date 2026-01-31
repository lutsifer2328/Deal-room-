'use client';

import { LayoutDashboard, Archive, Users, CreditCard, Settings, Globe, ChevronUp, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { useTranslation } from '@/lib/useTranslation';
import { useState } from 'react';
import { useData } from '@/lib/store';

// ...

export default function Sidebar() {
    const { user, loginAs } = useAuth();
    const pathname = usePathname();
    const { t, language, setLanguage } = useTranslation();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const { users, deals } = useData();

    if (!user) return null;

    const navItems = [
        { icon: LayoutDashboard, label: t('nav.dealRoom'), href: '/dashboard', roles: ['lawyer', 'admin', 'staff', 'viewer'] },
        { icon: Archive, label: t('nav.archive'), href: '/archive', roles: ['lawyer', 'admin', 'buyer', 'seller', 'agent', 'staff'] },
        { icon: Users, label: t('nav.participants'), href: '/participants', roles: ['lawyer', 'admin', 'staff'] },
        { icon: CreditCard, label: t('nav.finances'), href: '/finances', roles: ['lawyer', 'admin'] },
        { icon: Settings, label: t('nav.settings'), href: '/settings', roles: ['admin'] },
    ];

    const visibleItems = navItems.filter(item => item.roles.includes(user.role));

    // Calculate Switchable Users based on context
    const getSwitchableUsers = () => {
        const allUsers = Object.values(users);

        // If we are in a deal page, we MUST filter
        if (pathname?.startsWith('/deal/')) {
            const dealId = pathname.split('/')[2];
            const currentDeal = deals.find(d => d.id === dealId);

            if (currentDeal) {
                const participantUserIds = currentDeal.participants
                    .map(p => p.userId)
                    .filter(Boolean) as string[];

                const participantEmails = currentDeal.participants
                    .map(p => p.email.toLowerCase());

                return allUsers.filter(u =>
                    // Always show core staff
                    ['admin', 'lawyer', 'staff'].includes(u.role) ||
                    // Show participants specific to this deal (match by ID or Email)
                    participantUserIds.includes(u.id) ||
                    participantEmails.includes(u.email.toLowerCase())
                );
            } else {
                // Deal not found yet (loading or invalid) -> Safe fallback: Show ONLY Staff
                return allUsers.filter(u => ['admin', 'lawyer', 'staff'].includes(u.role));
            }
        }

        // Default (Dashboard, Archive, etc.): Show ONLY Staff (Admin/Lawyer/Staff)
        // We do NOT show deal participants here.
        return allUsers.filter(u => ['admin', 'lawyer', 'staff'].includes(u.role));
    };

    const switchableUsers = getSwitchableUsers();

    return (
        <aside className="w-[280px] bg-gradient-to-b from-navy-primary to-navy-secondary text-white min-h-screen py-8 fixed h-screen shadow-2xl z-50 flex flex-col overflow-y-auto">
            {/* Logo Section */}
            <div className="px-8 pb-4 border-b border-white/10 mb-4">
                <div className="font-serif text-[1.75rem] font-bold text-white tracking-[0.5px] mb-4">DEAL ROOM</div>
                <div className="flex flex-col gap-1">
                    <div className="text-xs text-teal font-bold uppercase tracking-[2px]">Powered by</div>
                    <img
                        src="/logo.png"
                        alt="Agenzia"
                        className="h-44 w-auto object-contain brightness-0 invert opacity-90 -ml-4 -my-4"
                    />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-0">
                <div className="space-y-1">
                    {visibleItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname?.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-4 px-8 py-4 transition-all duration-300 font-medium border-l-[3px] ${isActive
                                    ? 'bg-teal/10 text-teal border-teal'
                                    : 'text-white/70 hover:bg-white/5 hover:text-white border-transparent hover:border-teal'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'opacity-100' : 'opacity-80'}`} />
                                <span className="tracking-wide">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Language Switcher & User Profile */}
            <div className="px-8 pb-8 space-y-6 relative">
                {/* Language Toggles */}
                <div className="flex gap-2 justify-center bg-white/5 rounded-lg p-1 border border-white/10">
                    <button
                        onClick={() => setLanguage('en')}
                        className={`flex-1 py-1 text-xs font-bold rounded ${language === 'en' ? 'bg-teal text-white shadow-sm' : 'text-white/50 hover:text-white'}`}
                    >
                        EN
                    </button>
                    <button
                        onClick={() => setLanguage('bg')}
                        className={`flex-1 py-1 text-xs font-bold rounded ${language === 'bg' ? 'bg-teal text-white shadow-sm' : 'text-white/50 hover:text-white'}`}
                    >
                        BG
                    </button>
                </div>

                {/* User Profile / Role Switcher Trigger */}
                <div className="relative">
                    {showUserMenu && (
                        <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-xl shadow-2xl p-2 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200 border border-gray-100 max-h-64 overflow-y-auto">
                            <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Switch Role</div>
                            {switchableUsers.map((u) => (
                                <button
                                    key={u.id}
                                    onClick={() => {
                                        loginAs(u.id);
                                        setShowUserMenu(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between mb-1 ${user.id === u.id
                                        ? 'bg-teal/10 text-teal font-bold'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <span>{u.name}</span>
                                    <span className="text-[10px] uppercase bg-gray-100 px-1 rounded text-gray-500">{u.role}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${showUserMenu
                            ? 'bg-white text-navy-primary border-white shadow-lg transform -translate-y-1'
                            : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                            }`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg transition-colors ${showUserMenu ? 'bg-teal text-white' : 'bg-gradient-to-br from-teal to-gold text-navy-primary'
                            }`}>
                            {user.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold truncate">{user.name}</div>
                            <div className={`text-xs truncate capitalize ${showUserMenu ? 'text-gray-500' : 'text-white/60'}`}>
                                {t(`role.${user.role}` as any)}
                            </div>
                        </div>
                        <ChevronUp className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180 text-gray-400' : 'text-white/30'}`} />
                    </div>
                </div>
            </div>
        </aside>
    );
}
