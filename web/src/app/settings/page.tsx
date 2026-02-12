'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import UserManagementTable from '@/components/settings/UserManagementTable';
import { Check, X, Shield, Briefcase, Users as UsersIcon } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';

export default function SettingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'users' | 'general'>('users');

    // Redirect if not admin
    useEffect(() => {
        if (user && user.role !== 'admin') {
            router.push('/dashboard');
        }
    }, [user, router]);

    if (!user || user.role !== 'admin') {
        return null;
    }

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-serif font-bold text-navy-primary">{t('settings.title')}</h1>
                <p className="text-text-secondary mt-2">{t('settings.subtitle')}</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`py-4 px-1 border-b-2 font-bold text-sm transition-colors ${activeTab === 'users'
                            ? 'border-teal text-teal'
                            : 'border-transparent text-text-light hover:text-navy-primary hover:border-gray-300'
                            }`}
                    >
                        {t('settings.tab.users')}
                    </button>
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`py-4 px-1 border-b-2 font-bold text-sm transition-colors ${activeTab === 'general'
                            ? 'border-teal text-teal'
                            : 'border-transparent text-text-light hover:text-navy-primary hover:border-gray-300'
                            }`}
                    >
                        {t('settings.tab.general')}
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'users' && (
                <div className="space-y-6">
                    {/* Permissions Legend */}
                    <div className="bg-gradient-to-br from-navy-primary/5 to-teal/5 rounded-2xl border border-teal/10 p-6">
                        <h2 className="text-lg font-bold text-navy-primary mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-teal" />
                            {t('settings.permissions.title')}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Admin */}
                            <div className="bg-white rounded-xl p-4 border border-navy-primary/10 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <Shield className="w-5 h-5 text-navy-primary" />
                                    <h3 className="font-bold text-navy-primary">{t('settings.role.admin')}</h3>
                                </div>
                                <ul className="space-y-1.5 text-sm">
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> {t('settings.perm.manageUsers')}
                                    </li>
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> {t('settings.perm.createDeals')}
                                    </li>
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> {t('settings.perm.editDeals')}
                                    </li>
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> {t('settings.perm.closeDeals')}
                                    </li>
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> {t('settings.perm.manageDocs')}
                                    </li>
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> {t('settings.perm.editTimeline')}
                                    </li>
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> {t('settings.perm.exportData')}
                                    </li>
                                </ul>
                            </div>

                            {/* Lawyer */}
                            <div className="bg-white rounded-xl p-4 border border-gold/20 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <Briefcase className="w-5 h-5 text-gold" />
                                    <h3 className="font-bold text-gold">{t('settings.role.lawyer')}</h3>
                                </div>
                                <ul className="space-y-1.5 text-sm">
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> {t('settings.perm.manageUsers')}
                                    </li>
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> {t('settings.perm.createDeals')}
                                    </li>
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> {t('settings.perm.editDeals')}
                                    </li>
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> {t('settings.perm.closeDeals')}
                                    </li>
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> {t('settings.perm.manageDocs')}
                                    </li>
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> {t('settings.perm.editTimeline')}
                                    </li>
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> {t('settings.perm.exportData')}
                                    </li>
                                </ul>
                            </div>

                            {/* Staff */}
                            <div className="bg-white rounded-xl p-4 border border-teal/20 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <UsersIcon className="w-5 h-5 text-teal" />
                                    <h3 className="font-bold text-teal">{t('settings.role.staff')}</h3>
                                </div>
                                <ul className="space-y-1.5 text-sm">
                                    <li className="flex items-center gap-2 text-red-600">
                                        <X className="w-4 h-4" /> {t('settings.perm.manageUsers')}
                                    </li>
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> {t('settings.perm.createDeals')}
                                    </li>
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> {t('settings.perm.editDeals')}
                                    </li>
                                    <li className="flex items-center gap-2 text-red-600">
                                        <X className="w-4 h-4" /> {t('settings.perm.closeDeals')}
                                    </li>
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> {t('settings.perm.manageDocs')}
                                    </li>
                                    <li className="flex items-center gap-2 text-red-600">
                                        <X className="w-4 h-4" /> {t('settings.perm.editTimeline')}
                                    </li>
                                    <li className="flex items-center gap-2 text-red-600">
                                        <X className="w-4 h-4" /> {t('settings.perm.exportData')}
                                    </li>
                                </ul>
                            </div>


                        </div>
                    </div>

                    {/* User Management Table */}
                    <UserManagementTable />
                </div>
            )}
            {activeTab === 'general' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                        <h2 className="text-xl font-bold text-navy-primary mb-4 flex items-center gap-2">
                            <Shield className="w-6 h-6 text-teal" />
                            System Health & Recovery
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Tools to manage system consistency and data integrity.
                        </p>

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div>
                                    <h3 className="font-bold text-gray-800">Force Profile Synchronization</h3>
                                    <p className="text-sm text-gray-500">
                                        Re-fetches your user profile and updates local session metadata. Use this if you see "Access Denied" or incorrect roles.
                                    </p>
                                </div>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-4 py-2 bg-navy-primary text-white rounded hover:bg-navy-secondary font-bold text-sm transition-colors"
                                >
                                    Relaunch Application
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
