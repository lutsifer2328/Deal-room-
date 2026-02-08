'use client';

import { useAuth } from '@/lib/authContext';
import { useData } from '@/lib/store';
import { Bell, Search, X, Clock, Check, Info, AlertTriangle, Menu } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Notification } from '@/lib/types';
import Link from 'next/link';

interface NavbarProps {
    onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
    const { user } = useAuth();
    const { deals, notifications, markAsRead, markAllAsRead } = useData();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);
    const [showMobileSearch, setShowMobileSearch] = useState(false);

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Search logic...
    const searchResults = deals.filter(deal => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return false;

        // Search deal properties
        const dealMatches =
            deal.title.toLowerCase().includes(query) ||
            deal.propertyAddress?.toLowerCase().includes(query) ||
            deal.dealNumber?.toLowerCase().includes(query);

        // Search participant properties
        const participantMatches = deal.participants.some(p =>
            p.fullName.toLowerCase().includes(query) ||
            p.email.toLowerCase().includes(query) ||
            p.phone.toLowerCase().includes(query)
        );

        return dealMatches || participantMatches;
    }).slice(0, 5);

    const handleResultClick = (dealId: string) => {
        router.push(`/deal/${dealId}`);
        setSearchQuery('');
        setShowResults(false);
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setShowResults(false);
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-white/20 px-4 md:px-8 py-4 mb-8">
            <div className="flex justify-between items-center gap-4 md:gap-8">
                {/* Mobile Menu Button */}
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-2 -ml-2 text-navy-primary hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>

                {/* Search */}
                <div className={`flex-1 max-w-2xl relative transition-all duration-300 ${showMobileSearch ? 'absolute inset-x-0 top-0 h-16 bg-white z-50 px-4 flex items-center' : ''}`} ref={searchRef}>
                    <div className={`relative group w-full ${!showMobileSearch && 'hidden md:block'}`}>
                        <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-text-light group-focus-within:text-teal transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowResults(true);
                            }}
                            onFocus={() => setShowResults(true)}
                            placeholder="Search deals..."
                            className="w-full pl-14 pr-10 py-3 bg-white border-2 border-border-light rounded-2xl focus:border-teal/50 focus:ring-4 focus:ring-teal/10 outline-none text-base font-medium shadow-sm transition-all text-text-main placeholder:text-text-light/70"
                        />
                        {(searchQuery || showMobileSearch) && (
                            <button
                                onClick={() => {
                                    handleClearSearch();
                                    setShowMobileSearch(false);
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-light hover:text-text-secondary"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Search Results Dropdown */}
                    {showResults && searchQuery && (
                        <div className="absolute top-full mt-4 w-full bg-white rounded-2xl shadow-xl border border-border-light max-h-96 overflow-y-auto z-50 p-2">
                            {searchResults.length > 0 ? (
                                <div className="py-2">
                                    {searchResults.map((deal) => {
                                        // Find which participant matched
                                        const matchingParticipant = deal.participants.find(p =>
                                            p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            p.phone.toLowerCase().includes(searchQuery.toLowerCase())
                                        );

                                        return (
                                            <button
                                                key={deal.id}
                                                onClick={() => handleResultClick(deal.id)}
                                                className="w-full px-4 py-4 rounded-xl hover:bg-gray-50 transition-colors text-left mb-1 last:mb-0 group"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="font-serif font-bold text-lg text-navy-primary mb-1 group-hover:text-teal transition-colors">
                                                            {deal.title}
                                                        </div>
                                                        <div className="text-sm text-text-secondary flex items-center gap-2">
                                                            {deal.propertyAddress || 'No address'}
                                                        </div>
                                                        {matchingParticipant && (
                                                            <div className="mt-2 text-xs text-teal font-bold bg-teal/10 px-2 py-1 rounded inline-block">
                                                                👤 {matchingParticipant.fullName} • {matchingParticipant.role}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {deal.dealNumber && (
                                                        <div className="text-xs font-mono font-bold text-text-light bg-gray-100 px-2 py-1 rounded">
                                                            #{deal.dealNumber}
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="px-4 py-12 text-center text-text-light">
                                    <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                    <p className="font-medium text-text-secondary">No deals found for "{searchQuery}"</p>
                                    <p className="text-sm mt-1">Try searching by deal name, client, phone, or email</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Mobile Search Toggle */}
                <button
                    onClick={() => setShowMobileSearch(true)}
                    className={`md:hidden p-2 mr-2 text-navy-primary hover:bg-gray-100 rounded-lg ${showMobileSearch ? 'hidden' : ''}`}
                >
                    <Search className="w-6 h-6" />
                </button>


                {/* Right Actions */}
                <div className="flex items-center gap-4 ml-6">

                    {/* Notifications */}
                    <div className="relative" ref={notificationRef}>
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`relative w-12 h-12 flex items-center justify-center rounded-xl border transition-all ${showNotifications
                                ? 'bg-teal text-white border-teal shadow-md'
                                : 'bg-white border-border-light text-text-secondary hover:text-teal hover:border-teal hover:shadow-md'
                                }`}
                        >
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-3 right-3 w-2 h-2 bg-danger rounded-full ring-2 ring-white"></span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-border-light z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                                <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between bg-navy-primary/5">
                                    <h3 className="font-bold text-navy-primary">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-xs font-bold text-teal hover:text-teal/80 transition-colors"
                                        >
                                            Mark all as read
                                        </button>
                                    )}
                                </div>

                                <div className="max-h-[400px] overflow-y-auto">
                                    {notifications.length > 0 ? (
                                        <div className="divide-y divide-gray-50">
                                            {notifications.map((notification) => (
                                                <div
                                                    key={notification.id}
                                                    className={`p-4 transition-colors hover:bg-gray-50 ${!notification.read ? 'bg-teal/[0.03]' : ''}`}
                                                >
                                                    <div className="flex gap-3">
                                                        <div className={`mt-1 min-w-[32px] h-8 rounded-full flex items-center justify-center ${notification.type === 'success' ? 'bg-green-100 text-green-600' :
                                                            notification.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                                                                notification.type === 'error' ? 'bg-red-100 text-red-600' :
                                                                    'bg-blue-100 text-blue-600'
                                                            }`}>
                                                            {notification.type === 'success' ? <Check className="w-4 h-4" /> :
                                                                notification.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                                                                    notification.type === 'error' ? <AlertTriangle className="w-4 h-4" /> :
                                                                        <Info className="w-4 h-4" />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <h4 className={`text-sm font-bold ${!notification.read ? 'text-navy-primary' : 'text-gray-600'}`}>
                                                                    {notification.title}
                                                                </h4>
                                                                <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                                                    {new Date(notification.timestamp).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-500 mb-2 leading-relaxed">
                                                                {notification.message}
                                                            </p>

                                                            <div className="flex items-center gap-3">
                                                                {notification.link && (
                                                                    <Link
                                                                        href={notification.link}
                                                                        onClick={() => {
                                                                            markAsRead(notification.id);
                                                                            setShowNotifications(false);
                                                                        }}
                                                                        className="text-xs font-bold text-teal hover:underline flex items-center gap-1"
                                                                    >
                                                                        View Details →
                                                                    </Link>
                                                                )}
                                                                {!notification.read && (
                                                                    <button
                                                                        onClick={() => markAsRead(notification.id)}
                                                                        className="text-xs font-medium text-gray-400 hover:text-navy-primary transition-colors"
                                                                    >
                                                                        Mark as read
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-gray-400">
                                            <Bell className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                            <p className="text-sm">No notifications yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {user && <UserMenu user={user} />}
                </div>
            </div>
        </nav>
    );
}

function UserMenu({ user }: { user: any }) {
    const { logout } = useAuth();
    const router = useRouter();
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-3 bg-white pl-4 pr-2 py-2 rounded-xl border border-border-light hover:border-teal hover:shadow-md transition-all group"
            >
                <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-navy-primary group-hover:text-teal transition-colors">{user.name || 'User'}</div>
                    <div className="text-xs text-text-light font-medium capitalize">{user.role}</div>
                </div>
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal to-gold flex items-center justify-center text-white font-bold shadow-sm">
                    {(user.name || 'U').charAt(0)}
                </div>
            </button>

            {showMenu && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-border-light py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-5 py-3 border-b border-gray-50 mb-1">
                        <p className="text-sm font-bold text-navy-primary">{user.name || 'User'}</p>
                        <p className="text-xs text-text-light">{user.email}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-5 py-3 text-sm font-medium text-danger hover:bg-danger/5 transition-colors flex items-center gap-2"
                    >
                        <span>Sign Out</span>
                    </button>
                </div>
            )}
        </div>
    );
}
