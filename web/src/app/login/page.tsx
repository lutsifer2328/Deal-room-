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
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isResetView, setIsResetView] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        if (!termsAccepted) {
            setError('Моля, съгласете се с Общите условия и Политиката за поверителност преди да продължите.');
            setLoading(false);
            return;
        }

        const { error: loginError } = await login(email, password);

        if (loginError) {
            setError(loginError.message || 'Invalid email or password');
            setLoading(false);
        } else {
            // Successful login will trigger auth state change and let the root page handle redirect logic
            router.push('/');
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        if (!email) {
            setError('Моля, въведете имейл адрес.');
            setLoading(false);
            return;
        }

        // We need to import supabase inside the component or via auth context, 
        // since useAuth doesn't expose resetPassword directly, we'll import supabase client
        try {
            const { supabase } = await import('@/lib/supabase');
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/update-password`,
            });

            if (resetError) {
                setError(resetError.message);
            } else {
                setSuccessMessage('Връзката за нулиране на паролата е изпратена! Моля, проверете имейла си.');
                // Don't auto-switch back so they can read the message, or provide a button to go back.
            }
        } catch (err: any) {
            setError('Възникна грешка. Моля, опитайте отново.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-0"></div>
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[80px]"></div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="font-serif text-[2.5rem] font-bold text-white tracking-tight mb-2 drop-shadow-lg">Deal Room</div>
                    <div className="flex flex-col gap-1 items-center justify-center opacity-90">
                        <div className="text-[10px] text-teal-400 font-bold uppercase tracking-[3px]">Powered by</div>
                        <img
                            src="/logo.png"
                            alt="Agenzia"
                            className="h-24 w-auto object-contain brightness-0 invert opacity-100"
                        />
                    </div>
                </div>

                {/* Login/Reset Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20 transition-all duration-300">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">
                        {isResetView ? 'Reset Password' : 'Welcome Back'}
                    </h2>
                    <p className="text-center text-slate-500 text-sm mb-8">
                        {isResetView
                            ? 'Enter your email to receive a password reset link'
                            : 'Please sign in to access your dashboard'}
                    </p>

                    {/* Form Toggle based on state */}
                    {!isResetView ? (
                        <form onSubmit={handleLogin} className="space-y-5">
                            {/* Email */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400 text-slate-800"
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5 ml-1">
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Password</label>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400 text-slate-800"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 min-w-[6px]"></div>
                                    {error}
                                </div>
                            )}

                            {/* Terms Checkbox */}
                            <div className="flex items-start gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                    className="mt-1 w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500/20"
                                    required
                                />
                                <label htmlFor="terms" className="text-xs text-slate-500 leading-tight">
                                    Съгласен съм с{' '}
                                    <a href="#" className="text-teal-600 hover:underline">Общите условия</a>
                                    {' '}и{' '}
                                    <a href="#" className="text-teal-600 hover:underline">Политиката за поверителност</a>.
                                </label>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-teal-500 text-white font-bold py-3.5 rounded-xl hover:bg-teal-600 active:scale-[0.98] transition-all shadow-lg shadow-teal-500/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
                            >
                                {loading ? 'Signing in...' : 'Sign In'}
                                {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-5">
                            {/* Email */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400 text-slate-800"
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Messages */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 min-w-[6px]"></div>
                                    {error}
                                </div>
                            )}

                            {successMessage && (
                                <div className="bg-teal-50 border border-teal-200 text-teal-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 min-w-[6px]"></div>
                                    {successMessage}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || !!successMessage}
                                className="w-full bg-teal-500 text-white font-bold py-3.5 rounded-xl hover:bg-teal-600 active:scale-[0.98] transition-all shadow-lg shadow-teal-500/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
                            >
                                {loading ? 'Sending link...' : 'Send Reset Link'}
                            </button>
                        </form>
                    )}

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-2">
                        {!isResetView ? (
                            <>
                                <button
                                    onClick={() => {
                                        setIsResetView(true);
                                        setError('');
                                        setSuccessMessage('');
                                    }}
                                    className="text-sm font-medium text-slate-500 hover:text-teal-600 transition-colors bg-transparent border-none cursor-pointer"
                                >
                                    Forgot your password?
                                </button>
                                <p className="text-sm text-slate-400 mt-2">
                                    New here? <a href="#" className="text-slate-600 font-semibold hover:text-teal-600 transition-colors">Contact administrator</a>
                                </p>
                            </>
                        ) : (
                            <button
                                onClick={() => {
                                    setIsResetView(false);
                                    setError('');
                                    setSuccessMessage('');
                                }}
                                className="text-sm font-medium text-slate-500 hover:text-teal-600 transition-colors bg-transparent border-none cursor-pointer flex items-center justify-center w-full gap-1"
                            >
                                <ArrowRight className="w-4 h-4 rotate-180" /> Back to Login
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
