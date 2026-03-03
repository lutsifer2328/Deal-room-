'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Shield, Key, Trash2 } from 'lucide-react';
import GdprAnonymizeModal from './GdprAnonymizeModal';
import { useData } from '@/lib/store';

interface SimpleUser {
    id: string;
    email: string;
    name: string;
    role: string;
    is_active: boolean;
}

export default function AdminUserList() {
    const { addNotification } = useData();
    const [users, setUsers] = useState<SimpleUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUserForAnonymize, setSelectedUserForAnonymize] = useState<SimpleUser | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('users').select('id, name, email, role, is_active').order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching users:', error);
            addNotification('error', 'Error', 'Failed to fetch users');
        } else if (data) {
            setUsers(data as SimpleUser[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSendPasswordReset = async (email: string) => {
        if (!email.includes('@')) {
            addNotification('error', 'Invalid Email', 'Cannot reset password for anonymized or invalid email');
            return;
        }

        try {
            const response = await fetch('/api/resend-invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send reset link');
            }

            addNotification('success', 'Email Sent', `Password reset link sent to ${email}`);
        } catch (error: any) {
            console.error('Password reset error:', error);
            addNotification('error', 'Error', error.message || 'Failed to send reset link');
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-navy-primary/10 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                <Shield className="w-5 h-5 text-navy-primary" />
                <div>
                    <h2 className="text-lg font-bold text-navy-primary">Администрация</h2>
                    <p className="text-sm text-text-light">Manage all registered users across the platform.</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading users...</div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50/80 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-teal-50/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-navy-primary">{user.name || 'No Name'}</div>
                                        <div className="text-xs text-text-secondary">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded border ${user.role === 'admin' ? 'bg-navy-primary/10 text-navy-primary border-navy-primary/20' :
                                            'bg-gray-100 text-gray-600 border-gray-200'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {user.is_active ? (
                                            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full w-fit">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                Active
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded-full w-fit">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                                Inactive
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={() => handleSendPasswordReset(user.email)}
                                                className="text-teal-600 hover:text-teal-700 font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                                disabled={!user.email.includes('@')}
                                            >
                                                <Key className="w-4 h-4" />
                                                <span className="hidden sm:inline">Изпрати линк за парола</span>
                                            </button>

                                            {selectedUserForAnonymize?.id !== user.id && (
                                                <button
                                                    onClick={() => setSelectedUserForAnonymize(user)}
                                                    className="text-red-500 hover:text-red-700 font-medium transition-colors flex items-center gap-1.5"
                                                    title="Заличи потребителя"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    <span className="hidden sm:inline">Заличи потребителя</span>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {selectedUserForAnonymize && (
                <GdprAnonymizeModal
                    userId={selectedUserForAnonymize.id}
                    userName={selectedUserForAnonymize.name || selectedUserForAnonymize.email}
                    onClose={() => setSelectedUserForAnonymize(null)}
                    onSuccess={() => {
                        setSelectedUserForAnonymize(null);
                        addNotification('success', 'User Anonymized', 'The user has been successfully scrubbed');
                        fetchUsers(); // Refresh the list
                    }}
                />
            )}
        </div>
    );
}
