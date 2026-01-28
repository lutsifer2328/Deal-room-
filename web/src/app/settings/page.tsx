'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import UserManagementTable from '@/components/settings/UserManagementTable';
import { Check, X, Shield, Briefcase, Users as UsersIcon, Eye } from 'lucide-react';

export default function SettingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'users' | 'general'>('users');

    // Redirect if not admin
    if (!user || user.role !== 'admin') {
        router.push('/dashboard');
        return null;
    }

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-2">Manage your organization's settings and users</p>
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
                        User Management
                    </button>
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'general'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        General
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
                            Role Permissions Reference
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Admin */}
                            <div className="bg-white rounded-lg p-4 border border-purple-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <Shield className="w-5 h-5 text-purple-600" />
                                    <h3 className="font-bold text-purple-900">Admin</h3>
                                </div>
                                <ul className="space-y-1.5 text-sm">
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> Manage users
                                    </li>
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> Create deals
                                    </li>
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> Edit deals
                                    </li>
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> Close deals
                                    </li>
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> Manage documents
                                    </li>
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> Edit timeline
                                    </li>
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> Export data
                                    </li>
                                </ul>
                            </div>

                            {/* Lawyer */}
                            <div className="bg-white rounded-lg p-4 border border-blue-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <Briefcase className="w-5 h-5 text-blue-600" />
                                    <h3 className="font-bold text-blue-900">Lawyer</h3>
                                </div>
                                <ul className="space-y-1.5 text-sm">
                                    <li className="flex items-center gap-2 text-red-600">
                                        <X className="w-4 h-4" /> Manage users
                                    </li>
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> Create deals
                                    </li>
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> Edit deals
                                    </li>
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> Close deals
                                    </li>
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> Manage documents
                                    </li>
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> Edit timeline
                                    </li>
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> Export data
                                    </li>
                                </ul>
                            </div>

                            {/* Staff */}
                            <div className="bg-white rounded-lg p-4 border border-green-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <UsersIcon className="w-5 h-5 text-green-600" />
                                    <h3 className="font-bold text-green-900">Staff</h3>
                                </div>
                                <ul className="space-y-1.5 text-sm">
                                    <li className="flex items-center gap-2 text-red-600">
                                        <X className="w-4 h-4" /> Manage users
                                    </li>
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> Create deals
                                    </li>
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> Edit deals
                                    </li>
                                    <li className="flex items-center gap-2 text-red-600">
                                        <X className="w-4 h-4" /> Close deals
                                    </li>
                                    <li className="flex items-center gap-2 text-green-700">
                                        <Check className="w-4 h-4" /> Manage documents
                                    </li>
                                    <li className="flex items-center gap-2 text-red-600">
                                        <X className="w-4 h-4" /> Edit timeline
                                    </li>
                                    <li className="flex items-center gap-2 text-red-600">
                                        <X className="w-4 h-4" /> Export data
                                    </li>
                                </ul>
                            </div>

                            {/* Viewer */}
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <Eye className="w-5 h-5 text-gray-600" />
                                    <h3 className="font-bold text-gray-900">Viewer</h3>
                                </div>
                                <ul className="space-y-1.5 text-sm">
                                    <li className="flex items-center gap-2 text-red-600">
                                        <X className="w-4 h-4" /> Manage users
                                    </li>
                                    <li className="flex items-center gap-2 text-red-600">
                                        <X className="w-4 h-4" /> Create deals
                                    </li>
                                    <li className="flex items-center gap-2 text-red-600">
                                        <X className="w-4 h-4" /> Edit deals
                                    </li>
                                    <li className="flex items-center gap-2 text-red-600">
                                        <X className="w-4 h-4" /> Close deals
                                    </li>
                                    <li className="flex items-center gap-2 text-red-600">
                                        <X className="w-4 h-4" /> Manage documents
                                    </li>
                                    <li className="flex items-center gap-2 text-red-600">
                                        <X className="w-4 h-4" /> Edit timeline
                                    </li>
                                    <li className="flex items-center gap-2 text-red-600">
                                        <X className="w-4 h-4" /> Export data
                                    </li>
                                </ul>
                                <p className="text-xs text-gray-500 mt-2 italic">Read-only access</p>
                            </div>
                        </div>
                    </div>

                    {/* User Management Table */}
                    <UserManagementTable />
                </div>
            )}
            {activeTab === 'general' && (
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-500">General settings coming soon...</p>
                </div>
            )}
        </div>
    );
}
