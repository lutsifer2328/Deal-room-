'use client';

import { useState } from 'react';
import { useData } from '@/lib/store';
import { Role } from '@/lib/types';

interface AddUserModalProps {
    onClose: () => void;
}

export default function AddUserModal({ onClose }: AddUserModalProps) {
    const { addUser } = useData();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<Role>('staff');

    const organizationalRoles: Role[] = ['admin', 'lawyer', 'staff', 'viewer'];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName.trim() || !email.trim()) return;

        addUser(fullName, email, role);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-navy-primary/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl flex-shrink-0">
                    <h3 className="text-xl font-bold text-navy-primary">Add New User</h3>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    <form onSubmit={handleSubmit} className="flex flex-col h-full">
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-navy-primary mb-1">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-navy-primary mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-navy-primary mb-1">
                                    Role
                                </label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as Role)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all bg-white"
                                >
                                    {organizationalRoles.map((r) => (
                                        <option key={r} value={r}>
                                            {r.charAt(0).toUpperCase() + r.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3 flex-shrink-0 z-10 rounded-b-2xl">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 text-text-light font-bold hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2.5 bg-navy-primary text-white font-bold rounded-xl hover:bg-navy-secondary transition-all shadow-lg hover:shadow-navy-primary/20"
                            >
                                Add User
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
