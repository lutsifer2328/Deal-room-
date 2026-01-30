'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import StandardDocumentsTab from '@/components/archive/StandardDocumentsTab';
import PendingReviewTab from '@/components/archive/PendingReviewTab';
import ExpiringSoonTab from '@/components/archive/ExpiringSoonTab';
import SearchAllDocumentsTab from '@/components/archive/SearchAllDocumentsTab';
import ClosedDealsTab from '@/components/archive/ClosedDealsTab';
import { useTranslation } from '@/lib/useTranslation';

type TabType = 'standard' | 'search' | 'pending' | 'expiring' | 'closed';

export default function ArchivePage() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<TabType>('standard');

    if (!user) return <div className="p-10 text-center">Loading...</div>;

    // Only lawyers and admins can access Archive
    if (user.role !== 'lawyer' && user.role !== 'admin') {
        return (
            <div className="p-10 text-center">
                <h1 className="text-2xl font-bold text-midnight mb-4">{t('archive.accessDenied')}</h1>
                <p className="text-gray-600">{t('archive.noPermission')}</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-12">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-serif font-bold text-navy-primary mb-2 tracking-tight">
                            {t('archive.title')}
                        </h1>
                        <p className="text-text-light text-lg">{t('archive.subtitle')}</p>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex flex-wrap gap-3">
                    {[
                        { id: 'standard', label: t('archive.tab.standard') },
                        { id: 'search', label: t('archive.tab.search') },
                        { id: 'pending', label: t('archive.tab.pending') },
                        { id: 'expiring', label: t('archive.tab.expiring') },
                        { id: 'closed', label: t('archive.tab.closed') },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${activeTab === tab.id
                                ? 'bg-teal text-white shadow-lg shadow-teal/20 scale-105'
                                : 'bg-white text-text-secondary hover:bg-gray-50 hover:text-navy-primary border border-gray-100'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-3xl shadow-xl shadow-navy-primary/5 border border-white/20 p-8 backdrop-blur-xl min-h-[500px]">
                    {activeTab === 'standard' && <StandardDocumentsTab />}
                    {activeTab === 'search' && <SearchAllDocumentsTab />}
                    {activeTab === 'pending' && <PendingReviewTab />}
                    {activeTab === 'expiring' && <ExpiringSoonTab />}
                    {activeTab === 'closed' && <ClosedDealsTab />}
                </div>
            </div>
        </div>
    );
}

function ComingSoonPlaceholder({ title }: { title: string }) {
    return (
        <div className="text-center py-16">
            <h2 className="text-xl font-bold text-midnight mb-2">{title}</h2>
            <p className="text-gray-500">This feature is coming in Phase 2-4 of the implementation.</p>
        </div>
    );
}
