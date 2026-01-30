'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import UserManagementTable from '@/components/settings/UserManagementTable';
import { Check, X, Shield, Briefcase, Users as UsersIcon, Eye } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';

export default function SettingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'users' | 'general'>('users');

    // Redirect if not admin
    if (!user || user.role !== 'admin') {
        router.push('/dashboard');
        return null;
    }

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">{t('settings.title')}</h1>
                <p className="text-gray-600 mt-2">{t('settings.subtitle')}</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'users'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        {t('settings.tab.users')}
                    </button>
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'general'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-600" />
                            {t('settings.permissions.title')}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Admin */}
                            <div className="bg-white rounded-lg p-4 border border-purple-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <Shield className="w-5 h-5 text-purple-600" />
                                    <h3 className="font-bold text-purple-900">{t('settings.role.admin')}</h3>
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
                            <div className="bg-white rounded-lg p-4 border border-blue-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <Briefcase className="w-5 h-5 text-blue-600" />
                                    <h3 className="font-bold text-blue-900">{t('settings.role.lawyer')}</h3>
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
                            <div className="bg-white rounded-lg p-4 border border-green-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <UsersIcon className="w-5 h-5 text-green-600" />
                                    <h3 className="font-bold text-green-900">{t('settings.role.staff')}</h3>
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

                            {/* Viewer */}
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <Eye className="w-5 h-5 text-gray-600" />
                                    <h3 className="font-bold text-gray-900">{t('settings.role.viewer')}</h3>
                                </div>
                                <ul className="space-y-1.5 text-sm">
                                    <li className="flex items-center gap-2 text-red-600">
                                        <X className="w-4 h-4" /> {t('settings.perm.manageUsers')}
                                    </li>
                                    <li className="flex items-center gap-2 text-red-600">
                                        <X className="w-4 h-4" /> {t('settings.perm.createDeals')}
                                    </li>
                                    <li className="flex items-center gap-2 text-red-600">
                                        <X className="w-4 h-4" /> {t('settings.perm.editDeals')}
                                    </li>
                                    <li className="flex items-center gap-2 text-red-600">
                                        <X className="w-4 h-4" /> {t('settings.perm.closeDeals')}
                                    </li>
                                    <li className="flex items-center gap-2 text-red-600">
                                        <X className="w-4 h-4" /> {t('settings.perm.manageDocs')}
                                    </li>
                                    <li className="flex items-center gap-2 text-red-600">
                                        <X className="w-4 h-4" /> {t('settings.perm.editTimeline')}
                                    </li>
                                    <li className="flex items-center gap-2 text-red-600">
                                        <X className="w-4 h-4" /> {t('settings.perm.exportData')}
                                    </li>
                                </ul>
                                <p className="text-xs text-gray-500 mt-2 italic">{t('settings.perm.readOnly')}</p>
                            </div>
                        </div>
                    </div>

                    {/* User Management Table */}
                    <UserManagementTable />
                </div>
            )}
            {activeTab === 'general' && (
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-500">{t('settings.general.comingSoon')}</p>
                </div>
            )}
        </div>
    );
}
