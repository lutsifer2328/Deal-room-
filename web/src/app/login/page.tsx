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
                    <div className="font-serif text-[1.75rem] font-bold text-white tracking-[0.5px] mb-4">DEAL ROOM</div>
                    <div className="flex flex-col gap-1 items-center justify-center">
                        <div className="text-xs text-teal font-bold uppercase tracking-[2px]">Powered by</div>
                        <img
                            src="/logo.png"
                            alt="Agenzia"
                            className="h-32 w-auto object-contain brightness-0 invert opacity-90 -my-2"
                        />
                    </div>
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
                    <div className="mt-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 text-white">
                        <p className="text-xs font-bold text-teal mb-2 uppercase tracking-wider">DEV MODE - Quick Login:</p>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => quickLogin('u_admin')}
                                className="px-3 py-2 bg-navy-secondary text-white text-xs font-bold rounded hover:bg-navy-primary border border-white/10 transition-colors"
                            >
                                Admin
                            </button>
                            <button
                                onClick={() => quickLogin('u_lawyer')}
                                className="px-3 py-2 bg-navy-secondary text-white text-xs font-bold rounded hover:bg-navy-primary border border-white/10 transition-colors"
                            >
                                Lawyer
                            </button>
                            <button
                                onClick={() => quickLogin('u_staff')}
                                className="px-3 py-2 bg-navy-secondary text-white text-xs font-bold rounded hover:bg-navy-primary border border-white/10 transition-colors"
                            >
                                Staff
                            </button>
                            <button
                                onClick={() => quickLogin('u_viewer')}
                                className="px-3 py-2 bg-navy-secondary text-white text-xs font-bold rounded hover:bg-navy-primary border border-white/10 transition-colors"
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
