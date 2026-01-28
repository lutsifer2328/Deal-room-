'use client';

import { useAuth } from '@/lib/authContext';
import { useData } from '@/lib/store';
import { Bell, Search, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
    const { user } = useAuth();
    const { deals } = useData();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Close search results when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Search across deals and participants
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
    }).slice(0, 5); // Limit to 5 results

    const handleResultClick = (dealId: string) => {
        router.push(`/deal/${dealId}`);
        setSearchQuery('');
        setShowResults(false);
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setShowResults(false);
    };

    return (
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30">
            {/* Search */}
            <div className="flex-1 max-w-2xl relative" ref={searchRef}>
                <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowResults(true);
                        }}
                        onFocus={() => setShowResults(true)}
                        placeholder="Search deals, clients, phone, email..."
                        className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal outline-none text-sm"
                    />
                    {searchQuery && (
                        <button
                            onClick={handleClearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Search Results Dropdown */}
                {showResults && searchQuery && (
                    <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
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
                                            className="w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="font-bold text-midnight mb-1">
                                                        {deal.title}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {deal.propertyAddress || 'No address'}
                                                    </div>
                                                    {matchingParticipant && (
                                                        <div className="mt-2 text-xs text-teal font-medium">
                                                            👤 {matchingParticipant.fullName} • {matchingParticipant.role}
                                                        </div>
                                                    )}
                                                </div>
                                                {deal.dealNumber && (
                                                    <div className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">
                                                        #{deal.dealNumber}
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="px-4 py-8 text-center text-gray-500">
                                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">No deals found for "{searchQuery}"</p>
                                <p className="text-xs mt-1">Try searching by deal name, client, phone, or email</p>
                            </div>
                        )}
                    </div>
                )}
            </div>


            {/* Right Actions */}
            <div className="flex items-center gap-6 ml-6">
                <button className="relative text-gray-400 hover:text-midnight transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white translate-x-1/3 -translate-y-1/3"></span>
                </button>

                <div className="h-8 w-px bg-gray-200"></div>

                {user && <UserMenu user={user} />}
            </div>
        </header>
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
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
                <div className="text-right hidden sm:block">
                    <div className="text-sm font-semibold text-midnight">{user.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                </div>
                <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    {user.name.charAt(0)}
                </div>
            </button>

            {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
}
