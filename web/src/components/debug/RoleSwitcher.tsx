'use client';

import { useAuth } from '@/lib/authContext';
import { useData } from '@/lib/store';
import { User as UserIcon, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function RoleSwitcher() {
    const { user, loginAs } = useAuth();
    const { activeDeal } = useData();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    if (process.env.NODE_ENV !== 'development') return null;

    // Only show when INSIDE a specific deal page (/deal/[id])
    const isInDealPage = pathname?.startsWith('/deal/');
    if (!user || !activeDeal || !isInDealPage) return null;

    // Build user list from deal participants + lawyer
    const participantUsers = activeDeal.participants
        .filter(p => p.isActive)
        .map(p => ({
            id: `participant_${p.id}`,
            name: p.fullName,
            email: p.email,
            role: p.role
        }));

    // Add lawyer
    const allUsers = [
        { id: 'u_lawyer', name: 'Elena Petrova', email: 'elena@agenzia.bg', role: 'lawyer' },
        ...participantUsers
    ];

    const getRoleBadgeColor = (role: string) => {
        const colors: Record<string, string> = {
            'lawyer': 'bg-midnight text-white',
            'buyer': 'bg-teal text-white',
            'seller': 'bg-blue-600 text-white',
            'broker': 'bg-purple-600 text-white',
            'attorney': 'bg-orange-600 text-white',
            'notary': 'bg-green-600 text-white',
            'bank_representative': 'bg-gray-600 text-white',
        };
        return colors[role] || 'bg-gray-500 text-white';
    };

    return (
        <div className="fixed bottom-4 left-4 z-50">
            <div className="relative">
                {/* Warning Badge */}
                <div className="absolute -top-2 -left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg uppercase">
                    DEV ONLY - Debug Tool
                </div>

                {/* Current User Display */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="bg-midnight text-white px-4 py-3 rounded-lg shadow-2xl border-2 border-gold flex items-center gap-3 hover:bg-midnight/90 transition-all"
                >
                    <UserIcon className="w-5 h-5" />
                    <div className="text-left">
                        <div className="text-xs opacity-70">Viewing as:</div>
                        <div className="font-bold">{user.name}</div>
                        <div className="text-xs opacity-80 capitalize">({user.role})</div>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {isOpen && (
                    <>
                        <div className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-2xl border border-gray-200 min-w-[280px] max-h-96 overflow-y-auto">
                            <div className="p-2 border-b border-gray-200 bg-gray-50">
                                <div className="text-xs font-bold text-gray-600 uppercase">Switch to:</div>
                            </div>
                            {allUsers.map(u => (
                                <button
                                    key={u.id}
                                    onClick={() => {
                                        loginAs(u.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 border-b border-gray-100 last:border-b-0 ${user?.id === u.id ? 'bg-teal/10' : ''
                                        }`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-teal flex items-center justify-center text-white font-bold flex-shrink-0">
                                        {u.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-midnight truncate">{u.name}</div>
                                        <div className="text-xs text-gray-500 truncate">{u.email}</div>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${getRoleBadgeColor(u.role)}`}>
                                        {u.role.replace('_', ' ')}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Click Outside to Close */}
                        <div
                            className="fixed inset-0 z-[-1]"
                            onClick={() => setIsOpen(false)}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
