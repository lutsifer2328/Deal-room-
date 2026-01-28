'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import StandardDocumentsTab from '@/components/archive/StandardDocumentsTab';
import PendingReviewTab from '@/components/archive/PendingReviewTab';
import ExpiringSoonTab from '@/components/archive/ExpiringSoonTab';
import SearchAllDocumentsTab from '@/components/archive/SearchAllDocumentsTab';
import ClosedDealsTab from '@/components/archive/ClosedDealsTab';

type TabType = 'standard' | 'search' | 'pending' | 'expiring' | 'closed';

export default function ArchivePage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('standard');

    if (!user) return <div className="p-10 text-center">Loading...</div>;

    // Only lawyers and admins can access Archive
    if (user.role !== 'lawyer' && user.role !== 'admin') {
        return (
            <div className="p-10 text-center">
                <h1 className="text-2xl font-bold text-midnight mb-4">Access Denied</h1>
                <p className="text-gray-600">You don't have permission to access the Archive.</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-midnight mb-2">📁 Archive</h1>
                <p className="text-gray-600">Manage standard documents, search across deals, and access historical records</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('standard')}
                    className={`px-6 py-3 font-medium transition-all ${activeTab === 'standard'
                        ? 'text-teal border-b-2 border-teal'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Standard Documents
                </button>
                <button
                    onClick={() => setActiveTab('search')}
                    className={`px-6 py-3 font-medium transition-all ${activeTab === 'search'
                        ? 'text-teal border-b-2 border-teal'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Search All Documents
                </button>
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-6 py-3 font-medium transition-all ${activeTab === 'pending'
                        ? 'text-teal border-b-2 border-teal'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Pending Review
                </button>
                <button
                    onClick={() => setActiveTab('expiring')}
                    className={`px-6 py-3 font-medium transition-all ${activeTab === 'expiring'
                        ? 'text-teal border-b-2 border-teal'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Expiring Soon
                </button>
                <button
                    onClick={() => setActiveTab('closed')}
                    className={`px-6 py-3 font-medium transition-all ${activeTab === 'closed'
                        ? 'text-teal border-b-2 border-teal'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Closed Deals
                </button>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {activeTab === 'standard' && <StandardDocumentsTab />}
                {activeTab === 'search' && <SearchAllDocumentsTab />}
                {activeTab === 'pending' && <PendingReviewTab />}
                {activeTab === 'expiring' && <ExpiringSoonTab />}
                {activeTab === 'closed' && <ClosedDealsTab />}
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
