'use client';

import { Deal } from '@/lib/types';
import { useData } from '@/lib/store';
import { Building, Users, Archive, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import ParticipantsModal from './ParticipantsModal';
import CloseDealModal from './CloseDealModal';
import DealStatusBadge from './DealStatusBadge';
import { useAuth } from '@/lib/authContext';
import { BundleService } from '@/lib/bundleService';

export default function DealHeader({ deal }: { deal: Deal }) {
    const { tasks, updateDealStatus } = useData();
    const { user: currentUser } = useAuth();
    const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
    const [isCloseDealModalOpen, setIsCloseDealModalOpen] = useState(false);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isLawyer = currentUser?.role === 'lawyer' || currentUser?.role === 'admin';

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsStatusDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleExport = async () => {
        setIsExporting(true);
        await BundleService.generateBundle(deal, tasks, {});
        setIsExporting(false);
    };

    const handleStatusChange = (newStatus: 'active' | 'on_hold') => {
        if (currentUser) {
            updateDealStatus(deal.id, newStatus, currentUser.id);
            setIsStatusDropdownOpen(false);
        }
    };

    const handleCloseDeal = (notes: string) => {
        if (currentUser) {
            updateDealStatus(deal.id, 'closed', currentUser.id, notes);
        }
    };

    const handleReopenDeal = () => {
        if (currentUser) {
            updateDealStatus(deal.id, 'active', currentUser.id);
            setIsStatusDropdownOpen(false);
        }
    };

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2 text-teal font-semibold text-sm uppercase tracking-wider">
                            <Building className="w-4 h-4" />
                            <span>Deal {deal.dealNumber ? `#${deal.dealNumber}` : `• ${deal.title}`}</span>
                        </div>
                        <DealStatusBadge status={deal.status} />
                    </div>
                    <h1 className="text-3xl font-bold text-midnight mb-2">{deal.title}</h1>
                    <p className="text-gray-500">{deal.propertyAddress || 'No address provided'}</p>
                    <p className="text-gray-400 text-sm mt-1">Initiated on {new Date(deal.createdAt).toLocaleDateString()}</p>

                    {deal.status === 'closed' && deal.closedAt && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-600">
                                <strong>Closed:</strong> {new Date(deal.closedAt).toLocaleDateString()}
                            </p>
                            {deal.closureNotes && (
                                <p className="text-sm text-gray-600 mt-1">
                                    <strong>Notes:</strong> {deal.closureNotes}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Status Dropdown (Lawyer Only) */}
                    {isLawyer && (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                className="flex items-center gap-2 px-4 py-2 text-midnight font-bold border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Status
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            {isStatusDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                    {deal.status !== 'active' && (
                                        <button
                                            onClick={() => handleStatusChange('active')}
                                            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                                        >
                                            🟢 <span>Set Active</span>
                                        </button>
                                    )}
                                    {deal.status !== 'on_hold' && deal.status !== 'closed' && (
                                        <button
                                            onClick={() => handleStatusChange('on_hold')}
                                            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                                        >
                                            🟡 <span>Put On Hold</span>
                                        </button>
                                    )}
                                    {deal.status === 'closed' ? (
                                        <button
                                            onClick={handleReopenDeal}
                                            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm text-teal font-medium"
                                        >
                                            ↩️ <span>Reopen Deal</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setIsCloseDealModalOpen(true);
                                                setIsStatusDropdownOpen(false);
                                            }}
                                            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm border-t border-gray-100"
                                        >
                                            📦 <span>Close Deal</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {currentUser?.role === 'lawyer' && (
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="flex items-center gap-2 px-4 py-2 bg-teal text-white font-bold rounded-lg hover:bg-teal/90 shadow-md disabled:opacity-70 disabled:cursor-wait transition-all"
                        >
                            {isExporting ? <Archive className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                            {isExporting ? 'Bundling...' : 'Export Notary Bundle'}
                        </button>
                    )}

                    <button
                        onClick={() => setIsParticipantsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 text-midnight font-bold border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                        <Users className="w-4 h-4" />
                        Manage Participants
                    </button>
                </div>
            </div>

            {/* Modals */}
            {isParticipantsModalOpen && (
                <ParticipantsModal
                    dealId={deal.id}
                    onClose={() => setIsParticipantsModalOpen(false)}
                />
            )}

            {isCloseDealModalOpen && (
                <CloseDealModal
                    dealTitle={deal.title}
                    onClose={() => setIsCloseDealModalOpen(false)}
                    onConfirm={handleCloseDeal}
                />
            )}
        </div>
    );
}
