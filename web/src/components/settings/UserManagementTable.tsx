'use client';

import { useState } from 'react';
import { useData } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import { User, Role } from '@/lib/types';
import { isOrganizationalRole } from '@/lib/permissions';
import AddUserModal from './AddUserModal';
import EditUserModal from './EditUserModal';

export default function UserManagementTable() {
    const { users, deactivateUser, deleteUser, updateUser } = useData();
    const { user: currentUser } = useAuth();
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Filter to show only organizational users
    const organizationalUsers = Object.values(users).filter(u =>
        isOrganizationalRole(u.role)
    );

    const handleDeactivate = (userId: string) => {
        if (!currentUser) return;
        if (confirm('Are you sure you want to deactivate this user?')) {
            deactivateUser(userId, currentUser.id);
        }
    };

    const getRoleBadgeColor = (role: Role) => {
        switch (role) {
            case 'admin': return 'bg-navy-primary text-white border-navy-primary';
            case 'lawyer': return 'bg-gold/10 text-gold border-gold/20';
            case 'staff': return 'bg-teal/10 text-teal border-teal/20';
            case 'viewer': return 'bg-gray-100 text-gray-600 border-gray-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <>
            <div className="bg-white rounded-3xl shadow-xl shadow-navy-primary/5 border border-white/20 overflow-hidden backdrop-blur-xl">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-navy-primary">Users</h2>
                        <p className="text-sm text-text-light mt-1">
                            {organizationalUsers.length} organizational user{organizationalUsers.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-navy-primary text-white font-bold rounded-xl hover:bg-navy-secondary transition-all shadow-lg hover:shadow-navy-primary/20"
                    >
                        + Add User
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Login
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {organizationalUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-teal/[0.02] transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal to-navy-primary flex items-center justify-center text-white font-bold shadow-md">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-bold text-navy-primary">{user.name}</div>
                                                <div className="text-sm text-text-light">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-lg border ${getRoleBadgeColor(user.role)}`}>
                                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {user.isActive ? (
                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-success/10 text-success border border-success/20">
                                                Active
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-red-50 text-red-600 border border-red-100">
                                                Inactive
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                        {formatDate(user.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                        {formatDate(user.lastLogin)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => setEditingUser(user)}
                                            className="text-teal hover:text-teal/80 font-bold mr-3 transition-colors text-sm"
                                        >
                                            Edit
                                        </button>

                                        {/* Toggle Active Status */}
                                        {user.id !== currentUser?.id && (
                                            <>
                                                {user.isActive ? (
                                                    <button
                                                        onClick={() => handleDeactivate(user.id)}
                                                        className="text-amber-500 hover:text-amber-700 font-bold mr-3 transition-colors text-sm"
                                                    >
                                                        Deactivate
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            if (currentUser && confirm('Reactivate this user?')) {
                                                                updateUser(user.id, { isActive: true });
                                                            }
                                                        }}
                                                        className="text-teal hover:text-teal/80 font-bold mr-3 transition-colors text-sm"
                                                    >
                                                        Activate
                                                    </button>
                                                )}

                                                <button
                                                    onClick={async () => {
                                                        if (confirm('PERMANENTLY DELETE this user? This cannot be undone.')) {
                                                            await deleteUser(user.id);
                                                        }
                                                    }}
                                                    className="text-red-500 hover:text-red-700 font-bold transition-colors text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals - Rendered outside the main container to avoid clipping */}
            {showAddModal && <AddUserModal onClose={() => setShowAddModal(false)} />}
            {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />}
        </>
    );
}
