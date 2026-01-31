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
        <div className="fixed inset-0 bg-navy-primary/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-white/20 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="text-xl font-bold text-navy-primary">Add New User</h3>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-6">
                    <div className="space-y-4">
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

                    <div className="mt-8 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-text-light font-bold hover:bg-gray-50 rounded-xl transition-colors"
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
    );
}
