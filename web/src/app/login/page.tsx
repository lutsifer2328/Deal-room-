'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { useData } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, Building } from 'lucide-react';

export default function LoginPage() {
    const { loginAs } = useAuth();
    const { users } = useData();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Find user by email
        setTimeout(() => {
            const user = Object.values(users).find(u => u.email === email);

            if (user && user.isActive) {
                // In production, verify password here
                // For now, accept any password for active users
                loginAs(user.id);
                router.push('/dashboard');
            } else if (user && !user.isActive) {
                setError('Your account has been deactivated. Please contact your administrator.');
            } else {
                setError('Invalid email or password');
            }
            setLoading(false);
        }, 500);
    };

    // Quick login for development
    const quickLogin = (userId: string) => {
        loginAs(userId);
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-midnight via-midnight/95 to-teal/20 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <Building className="w-12 h-12 text-teal" />
                        <h1 className="text-5xl font-bold text-white">AGENZIA<span className="text-gold">.BG</span></h1>
                    </div>
                    <p className="text-gold text-sm uppercase tracking-widest">Real Estate Deal Room</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <h2 className="text-2xl font-bold text-midnight mb-6">Welcome Back</h2>

                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal outline-none"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal outline-none"
                                    placeholder="••••••••"
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
                            disabled={loading}
                            className="w-full bg-teal text-white font-bold py-3 rounded-lg hover:bg-teal/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? 'Logging in...' : 'Sign In'}
                            {!loading && <ArrowRight className="w-5 h-5" />}
                        </button>
                    </form>

                    {/* Footer */}
                    <p className="mt-6 text-center text-sm text-gray-500">
                        New here?{' '}
                        <span className="text-gray-700">Contact your administrator for access.</span>
                    </p>
                </div>

                {/* Dev Quick Login */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-xs font-semibold text-yellow-800 mb-2">DEV MODE - Quick Login:</p>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => quickLogin('u_admin')}
                                className="px-3 py-2 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                            >
                                Admin
                            </button>
                            <button
                                onClick={() => quickLogin('u_lawyer')}
                                className="px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                            >
                                Lawyer
                            </button>
                            <button
                                onClick={() => quickLogin('u_staff')}
                                className="px-3 py-2 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                            >
                                Staff
                            </button>
                            <button
                                onClick={() => quickLogin('u_viewer')}
                                className="px-3 py-2 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                            >
                                Viewer
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
