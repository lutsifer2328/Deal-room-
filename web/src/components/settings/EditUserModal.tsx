'use client';

import { useState } from 'react';
import { useData } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import { User, Role, FinanceAccess, Department } from '@/lib/types';

interface EditUserModalProps {
    user: User;
    onClose: () => void;
}

export default function EditUserModal({ user, onClose }: EditUserModalProps) {
    const { updateUser } = useData();
    const { user: currentUser } = useAuth();
    const [fullName, setFullName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [role, setRole] = useState<Role>(user.role);
    const [title, setTitle] = useState(user.title || '');
    const [phone, setPhone] = useState(user.phone || '');

    // Finance fields are only editable by a finance manager (finance_access='all').
    // The DB trigger enforces this too; this just keeps the UI honest.
    const canManageFinance = (currentUser?.financeAccess ?? 'none') === 'all';
    const [financeAccess, setFinanceAccess] = useState<FinanceAccess>(user.financeAccess ?? 'none');
    const [department, setDepartment] = useState<Department | ''>(user.department ?? '');
    const [commissionPct, setCommissionPct] = useState<string>(
        user.defaultCommissionPct != null ? String(user.defaultCommissionPct) : ''
    );

    const organizationalRoles: Role[] = ['admin', 'lawyer', 'staff', 'viewer'];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName.trim() || !email.trim()) return;

        const updates: Partial<User> = {
            name: fullName,
            email,
            role,
            title: title.trim(),
            phone: phone.trim()
        };

        if (canManageFinance) {
            updates.financeAccess = financeAccess;
            updates.department = department === '' ? null : department;
            const pct = commissionPct.trim();
            updates.defaultCommissionPct = pct === '' ? null : Number(pct);
        }

        updateUser(user.id, updates);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
                    <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Job Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Transaction Lawyer"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Shown to clients on deals this person leads.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="e.g. 0888 123 456"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Role
                            </label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as Role)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                title="Role"
                            >
                                {organizationalRoles.map((r) => (
                                    <option key={r} value={r}>
                                        {r.charAt(0).toUpperCase() + r.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                                <strong>Note:</strong> Changing the role will automatically update the user&apos;s permissions.
                            </p>
                        </div>

                        {canManageFinance && (
                            <div className="border-t border-gray-200 pt-4 mt-2 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold text-gray-900">Finance</h4>
                                    <span className="text-xs text-gray-400">Managers only</span>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Finance access
                                    </label>
                                    <select
                                        value={financeAccess}
                                        onChange={(e) => setFinanceAccess(e.target.value as FinanceAccess)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        title="Finance access"
                                    >
                                        <option value="none">None — no access to Finances</option>
                                        <option value="own">Own — sees only their own deals</option>
                                        <option value="all">All — full ledger (manager)</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">Separate from role. The lawyer-admin should stay on None.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Department
                                    </label>
                                    <select
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value as Department | '')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        title="Department"
                                    >
                                        <option value="">—</option>
                                        <option value="properties">Properties</option>
                                        <option value="insurance">Insurance</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Default commission %
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        step={0.5}
                                        value={commissionPct}
                                        onChange={(e) => setCommissionPct(e.target.value)}
                                        placeholder="e.g. 30"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Just the default — the % on each deal is set (and can be overridden) at confirmation.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 flex-shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
