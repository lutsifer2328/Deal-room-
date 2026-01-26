'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getInvitationData, invalidateInvitation } from '@/lib/invitations';
import { useAuth } from '@/lib/authContext';
import { Lock, Mail, User, CheckCircle, AlertCircle } from 'lucide-react';

export default function InvitePage() {
    const params = useParams();
    const router = useRouter();
    const { loginAs } = useAuth();
    const token = params.token as string;

    const [invitationData, setInvitationData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        // Validate token
        const data = getInvitationData(token);
        if (data) {
            setInvitationData(data);
        } else {
            setError('Invalid or expired invitation link');
        }
        setLoading(false);
    }, [token]);

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setCreating(true);

        // TODO: Replace with real user creation when deploying
        // Mock account creation - store in localStorage
        setTimeout(() => {
            const userId = `u_${Date.now()}`;
            const users = JSON.parse(localStorage.getItem('registered_users') || '{}');

            users[invitationData.email] = {
                id: userId,
                name: invitationData.name,
                email: invitationData.email,
                role: invitationData.role,
                password: password, // In real app, this would be hashed
                createdAt: new Date().toISOString()
            };

            localStorage.setItem('registered_users', JSON.stringify(users));

            // Invalidate the invitation token
            invalidateInvitation(token);

            // Auto-login the user
            loginAs(userId);

            // Redirect to their deal
            router.push(`/deal/${invitationData.dealId}`);
        }, 1000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-midnight via-midnight/95 to-teal/20 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    if (error && !invitationData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-midnight via-midnight/95 to-teal/20 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-midnight mb-2">Invalid Invitation</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => router.push('/login')}
                        className="bg-teal text-white px-6 py-2 rounded-lg font-bold hover:bg-teal/90 transition-colors"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-midnight via-midnight/95 to-teal/20 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold text-white mb-2">AGENZIA</h1>
                    <p className="text-gold text-sm uppercase tracking-widest">Real Estate Deal Room</p>
                </div>

                {/* Signup Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <div className="flex items-center gap-2 mb-6">
                        <CheckCircle className="w-6 h-6 text-teal" />
                        <h2 className="text-2xl font-bold text-midnight">You're Invited!</h2>
                    </div>

                    {invitationData && (
                        <div className="bg-teal/5 border border-teal/20 rounded-lg p-4 mb-6">
                            <p className="text-sm text-gray-600 mb-2">You've been invited as:</p>
                            <p className="font-bold text-midnight text-lg">{invitationData.name}</p>
                            <p className="text-sm text-gray-600">Role: <span className="font-medium text-teal uppercase">{invitationData.role}</span></p>
                        </div>
                    )}

                    <form onSubmit={handleCreateAccount} className="space-y-4">
                        {/* Email (pre-filled, readonly) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={invitationData?.email || ''}
                                    readOnly
                                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                                />
                            </div>
                        </div>

                        {/* Name (pre-filled, readonly) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={invitationData?.name || ''}
                                    readOnly
                                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Create Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal outline-none"
                                    placeholder="Minimum 8 characters"
                                    required
                                />
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal outline-none"
                                    placeholder="Re-enter password"
                                    required
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={creating}
                            className="w-full bg-teal text-white font-bold py-3 rounded-lg hover:bg-teal/90 transition-colors disabled:opacity-50"
                        >
                            {creating ? 'Creating Account...' : 'Create Account & Continue'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-xs text-gray-500">
                        By creating an account, you agree to our Terms of Service and Privacy Policy
                    </p>
                </div>
            </div>
        </div>
    );
}
