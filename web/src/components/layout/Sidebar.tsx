'use client';

import { LayoutDashboard, Archive, Users, CreditCard, Settings, Globe, ChevronUp, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { useTranslation } from '@/lib/useTranslation';
import { useState } from 'react';


// ...

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const { t, language, setLanguage } = useTranslation();
    const [showUserMenu, setShowUserMenu] = useState(false);

    if (!user) return null;

    const navItems = [
        { icon: LayoutDashboard, label: t('nav.dealRoom'), href: '/dashboard', roles: ['admin', 'lawyer', 'staff', 'broker', 'agent', 'buyer', 'seller', 'notary', 'bank_representative', 'viewer', 'attorney'] },
        { icon: Archive, label: t('nav.archive'), href: '/archive', roles: ['admin', 'lawyer', 'staff', 'broker', 'agent'] },
        { icon: Users, label: t('nav.participants'), href: '/participants', roles: ['admin', 'lawyer', 'staff', 'broker'] },
        { icon: CreditCard, label: t('nav.finances'), href: '/finances', roles: ['admin', 'lawyer'] },
        { icon: Settings, label: t('nav.settings'), href: '/settings', roles: ['admin'] },
    ];

    const visibleItems = navItems.filter(item => item.roles.includes(user.role));

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                w-[280px] bg-gradient-to-b from-navy-primary to-navy-secondary text-white 
                h-screen py-8 fixed top-0 left-0 shadow-2xl z-50 flex flex-col overflow-y-auto
                transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
            `}>
                {/* Logo Section */}
                <div className="px-8 pb-4 border-b border-white/10 mb-4 flex justify-between items-start">
                    <div>
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
                    {/* Mobile Close Button */}
                    <button onClick={onClose} className="md:hidden text-white/50 hover:text-white">
                        <ChevronUp className="w-6 h-6 rotate-[-90deg]" />
                    </button>
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
                                    onClick={() => onClose && onClose()} // Close on mobile navigation
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

                    {/* User Profile / Menu */}
                    <div className="relative">
                        {showUserMenu && (
                            <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-xl shadow-2xl p-2 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200 border border-gray-100">
                                <button
                                    onClick={() => logout()}
                                    className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 text-red-600 hover:bg-red-50 font-bold transition-colors"
                                >
                                    <span>Sign Out</span>
                                </button>
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
                                {(user.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold truncate">{user.name || 'User'}</div>
                                <div className={`text-xs truncate capitalize ${showUserMenu ? 'text-gray-500' : 'text-white/60'}`}>
                                    {t(`role.${user.role}` as any)}
                                </div>
                            </div>
                            <ChevronUp className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180 text-gray-400' : 'text-white/30'}`} />
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
