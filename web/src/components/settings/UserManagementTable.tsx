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

    // Inline confirmation state (replaces window.confirm which can be suppressed)
    const [pendingAction, setPendingAction] = useState<{
        type: 'delete' | 'deactivate' | 'activate';
        userId: string;
        userName: string;
    } | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Filter to show only organizational users
    const organizationalUsers = Object.values(users).filter(u =>
        isOrganizationalRole(u.role)
    );

    const handleConfirmAction = async () => {
        if (!pendingAction || !currentUser) return;
        setActionLoading(true);
        try {
            if (pendingAction.type === 'delete') {
                await deleteUser(pendingAction.userId);
            } else if (pendingAction.type === 'deactivate') {
                await deactivateUser(pendingAction.userId, currentUser.id);
            } else if (pendingAction.type === 'activate') {
                await updateUser(pendingAction.userId, { isActive: true });
            }
        } finally {
            setActionLoading(false);
            setPendingAction(null);
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
                                <tr key={user.id} className={`hover:bg-teal/[0.02] transition-colors ${!user.isActive ? 'opacity-50' : ''}`}>
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
                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-gray-100 text-gray-500 border border-gray-200 line-through">
                                                Deactivated
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
                                                        onClick={() => setPendingAction({ type: 'deactivate', userId: user.id, userName: user.name })}
                                                        className="text-amber-500 hover:text-amber-700 font-bold mr-3 transition-colors text-sm"
                                                    >
                                                        Deactivate
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => setPendingAction({ type: 'activate', userId: user.id, userName: user.name })}
                                                        className="text-teal hover:text-teal/80 font-bold mr-3 transition-colors text-sm"
                                                    >
                                                        Activate
                                                    </button>
                                                )}

                                                {user.isActive && (
                                                    <button
                                                        onClick={() => setPendingAction({ type: 'delete', userId: user.id, userName: user.name })}
                                                        className="text-red-500 hover:text-red-700 font-bold transition-colors text-sm"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
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

            {/* Inline Confirmation Modal (replaces native confirm()) */}
            {pendingAction && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setPendingAction(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md mx-4 animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            {pendingAction.type === 'delete' ? (
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                    <span className="text-red-600 text-lg">🗑️</span>
                                </div>
                            ) : pendingAction.type === 'deactivate' ? (
                                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                    <span className="text-amber-600 text-lg">⚠️</span>
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                    <span className="text-green-600 text-lg">✅</span>
                                </div>
                            )}
                            <h3 className="text-lg font-bold text-navy-primary">
                                {pendingAction.type === 'delete' ? 'Delete User' :
                                    pendingAction.type === 'deactivate' ? 'Deactivate User' : 'Activate User'}
                            </h3>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">
                            {pendingAction.type === 'delete' && (
                                <>Are you sure you want to remove <strong>{pendingAction.userName}</strong>? If they have existing deal associations, they will be <strong className="text-amber-600">deactivated</strong> instead and appear as &quot;Former Staff&quot;.</>
                            )}
                            {pendingAction.type === 'deactivate' && (
                                <>Are you sure you want to <strong className="text-amber-600">deactivate</strong> <strong>{pendingAction.userName}</strong>? They will immediately lose access to the system.</>
                            )}
                            {pendingAction.type === 'activate' && (
                                <>Are you sure you want to <strong className="text-green-600">reactivate</strong> <strong>{pendingAction.userName}</strong>? They will regain access to the system.</>
                            )}
                        </p>


                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => setPendingAction(null)}
                                disabled={actionLoading}
                                className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmAction}
                                disabled={actionLoading}
                                className={`px-4 py-2 text-sm font-bold text-white rounded-xl transition-colors ${pendingAction.type === 'delete'
                                    ? 'bg-red-500 hover:bg-red-600'
                                    : pendingAction.type === 'deactivate'
                                        ? 'bg-amber-500 hover:bg-amber-600'
                                        : 'bg-green-500 hover:bg-green-600'
                                    }`}
                            >
                                {actionLoading ? 'Processing...' :
                                    pendingAction.type === 'delete' ? 'Yes, Delete' :
                                        pendingAction.type === 'deactivate' ? 'Yes, Deactivate' : 'Yes, Activate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
