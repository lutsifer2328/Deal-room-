'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, Building } from 'lucide-react';

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error: loginError } = await login(email, password);

        if (loginError) {
            setError(loginError.message || 'Invalid email or password');
            setLoading(false);
        } else {
            // Successful login will trigger auth state change and redirect
            router.push('/dashboard');
        }
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
            </div>
        </div>
    );
}
