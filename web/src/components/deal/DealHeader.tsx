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
import { useTranslation } from '@/lib/useTranslation';

export default function DealHeader({ deal }: { deal: Deal }) {
    const { tasks, updateDealStatus } = useData();
    const { user: currentUser } = useAuth();
    const { t, language } = useTranslation();
    const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
    const [isCloseDealModalOpen, setIsCloseDealModalOpen] = useState(false);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const canEdit = currentUser?.permissions.canEditDeals;
    const canClose = currentUser?.permissions.canCloseDeals;
    const canExport = currentUser?.permissions.canExportData;

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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(language === 'bg' ? 'bg-BG' : 'en-US');
    };

    return (
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-navy-primary/5 border border-white/20 mb-8 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <div className="flex justify-between items-start relative z-10">
                <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2 text-teal font-bold text-xs uppercase tracking-[2px] bg-teal/5 px-3 py-1 rounded-lg">
                            <Building className="w-3 h-3" />
                            <span>{t('deal.header.deal')} {deal.dealNumber ? `#${deal.dealNumber}` : ''}</span>
                        </div>
                        <DealStatusBadge status={deal.status} />
                    </div>

                    <h1 className="text-4xl font-serif font-bold text-navy-primary mb-2 tracking-tight">{deal.title}</h1>
                    <p className="text-text-secondary text-lg flex items-center gap-2">
                        {deal.propertyAddress || t('deal.header.noAddress')}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-6 text-sm font-medium text-text-light">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal"></span>
                            {t('deal.header.initiatedOn')} {formatDate(deal.createdAt)}
                        </div>
                        {deal.status === 'closed' && deal.closedAt && (
                            <div className="flex items-center gap-2 text-navy-primary">
                                <span className="w-1.5 h-1.5 rounded-full bg-navy-primary"></span>
                                <strong>{t('deal.header.closed')}</strong> {formatDate(deal.closedAt)}
                            </div>
                        )}
                    </div>

                    {deal.status === 'closed' && deal.closureNotes && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 max-w-2xl">
                            <p className="text-sm text-text-secondary leading-relaxed">
                                <strong className="block text-navy-primary mb-1">{t('deal.header.notes')}</strong>
                                {deal.closureNotes}
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Status Dropdown */}
                    {canEdit && (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                className="flex items-center gap-2 px-5 py-2.5 text-navy-primary font-bold border-2 border-border-light rounded-xl hover:bg-gray-50 hover:border-teal/30 transition-all bg-white"
                            >
                                {t('deal.header.status')}
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            {isStatusDropdownOpen && (
                                <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl border border-border-light py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {deal.status !== 'active' && (
                                        <button
                                            onClick={() => handleStatusChange('active')}
                                            className="w-full px-5 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm font-medium text-navy-primary"
                                        >
                                            <span className="w-2 h-2 rounded-full bg-success"></span>
                                            <span>{t('deal.header.setActive')}</span>
                                        </button>
                                    )}
                                    {deal.status !== 'on_hold' && deal.status !== 'closed' && (
                                        <button
                                            onClick={() => handleStatusChange('on_hold')}
                                            className="w-full px-5 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm font-medium text-navy-primary"
                                        >
                                            <span className="w-2 h-2 rounded-full bg-warning"></span>
                                            <span>{t('deal.header.putOnHold')}</span>
                                        </button>
                                    )}
                                    {canClose && (
                                        deal.status === 'closed' ? (
                                            <button
                                                onClick={handleReopenDeal}
                                                className="w-full px-5 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm font-bold text-teal"
                                            >
                                                <ChevronDown className="w-4 h-4 rotate-180" />
                                                <span>{t('deal.header.reopen')}</span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setIsCloseDealModalOpen(true);
                                                    setIsStatusDropdownOpen(false);
                                                }}
                                                className="w-full px-5 py-3 text-left hover:bg-red-50 flex items-center gap-3 text-sm font-medium text-danger border-t border-gray-50 mt-1"
                                            >
                                                <Archive className="w-4 h-4" />
                                                <span>{t('deal.header.close')}</span>
                                            </button>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {canExport && (
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="flex items-center gap-2 px-5 py-2.5 bg-navy-primary text-white font-bold rounded-xl hover:bg-navy-secondary shadow-lg disabled:opacity-70 disabled:cursor-wait transition-all"
                        >
                            {isExporting ? <Archive className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                            {isExporting ? t('deal.header.bundling') : t('deal.header.export')}
                        </button>
                    )}

                    <button
                        onClick={() => setIsParticipantsModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 text-navy-primary font-bold bg-white border border-border-light rounded-xl hover:bg-gray-50 hover:border-teal/30 shadow-sm transition-all"
                    >
                        <Users className="w-4 h-4" />
                        {t('deal.header.manageParticipants')}
                    </button>
                </div>
            </div>

            {/* Modals */}
            <ParticipantsModal
                deal={deal}
                onClose={() => setIsParticipantsModalOpen(false)}
                isOpen={isParticipantsModalOpen}
            />

            <CloseDealModal
                dealTitle={deal.title}
                onClose={() => setIsCloseDealModalOpen(false)}
                onConfirm={handleCloseDeal}
                isOpen={isCloseDealModalOpen}
            />
        </div>
    );
}
