'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, Lock, ArrowRight } from 'lucide-react';

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    // const supabase = createClient(); // Removed, using singleton

    useEffect(() => {
        // Exchange code for session if present (handled by middleware usually, but safe to check)
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // If no session, they might have lost the magic link context or it expired
                // setMsg('Error: Invalid or expired link. Please request a new one.');
            }
        };
        checkSession();

        // FAILSAFE: Listen for USER_UPDATED event
        // The updateUser promise sometimes hangs in client-side auth flows, 
        // but the event fires reliably. We use this to trigger success.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'USER_UPDATED') {
                console.log('⚡ Event Listener caught USER_UPDATED! Forcing success flow.');
                setMsg('✅ Password updated! Redirecting...');

                // Clear the strict flag in DB just in case handleUpdate is stuck before it
                if (session?.user) {
                    supabase.from('users').update({
                        requires_password_change: false,
                        is_active: true,
                        last_login: new Date().toISOString()
                    }).eq('id', session.user.id).then(() => {
                        console.log('✅ DB Flag cleared via Event Listener');
                    });
                }

                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1000);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMsg('');

        if (!termsAccepted) {
            setMsg('❌ Моля, съгласете се с Общите условия и Политиката за поверителност преди да продължите.');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setMsg('❌ Passwords do not match');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setMsg('❌ Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            console.log('🔄 Starting Password Update Process...');

            // 0. Verify Session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                console.error('❌ No active session found before update:', sessionError);
                throw new Error('Session lost. Please reload the page.');
            }
            console.log('✅ Active Session Found for User:', session.user.id);

            // 1. Update Password in Auth
            console.log('📡 Calling supabase.auth.updateUser...');
            const { data, error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) {
                console.error('❌ Supabase Update Failed:', error);
                throw error;
            }

            console.log('✅ Supabase Update Success:', data);
            setMsg('✅ Password updated! Setting up account...');

            // 2. Update User Profile to clear strict flag (if applicable)
            if (session.user) {
                console.log('📡 Updating user profile flags...');
                await supabase.from('users').update({
                    requires_password_change: false,
                    is_active: true,
                    last_login: new Date().toISOString()
                }).eq('id', session.user.id);
            }

            setMsg('✅ Success! Redirecting to Dashboard...');

            // 3. Redirect (Force reload to clear auth state issues)
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);

        } catch (error: unknown) {
            console.error('Update Error:', error);
            const err = error as Error;
            setMsg('❌ Error: ' + (err.message || 'Failed to update'));
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

                {/* Main Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20 transition-all duration-300">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">Set New Password</h2>
                    <p className="text-center text-slate-500 text-sm mb-8">
                        Welcome to your Deal Room. Please establish a secure password to access your sensitive documents and deal progress.
                    </p>

                    <form onSubmit={handleUpdate} className="space-y-5">
                        {/* New Password */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 ml-1">New Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400 text-slate-800"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-500 transition-colors outline-none"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 ml-1">Confirm Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400 text-slate-800"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {/* Messages */}
                        {msg && (
                            <div className={`border px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${msg.includes('Error') || msg.includes('❌') ? 'bg-red-50 border-red-200 text-red-600' : 'bg-teal-50 border-teal-200 text-teal-700'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full min-w-[6px] ${msg.includes('Error') || msg.includes('❌') ? 'bg-red-500' : 'bg-teal-500'}`}></div>
                                {msg.replace(/✅ |❌ /g, '')}
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
                                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">Общите условия</a>
                                {' '}и{' '}
                                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">Политиката за поверителност</a>.
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || msg.includes('Redirecting')}
                            className="w-full bg-teal-500 text-white font-bold py-3.5 rounded-xl hover:bg-teal-600 active:scale-[0.98] transition-all shadow-lg shadow-teal-500/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group mt-2"
                        >
                            {loading ? 'Updating...' : msg.includes('Redirecting') ? 'Success!' : 'Set Password & Login'}
                            {!loading && !msg.includes('Redirecting') && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>
                </div>

                {/* Footer Security Note */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-slate-500 flex items-center justify-center gap-1 opacity-70">
                        <Lock className="w-3 h-3" /> Secure Deal Room Environment
                    </p>
                </div>
            </div>
        </div>
    );
}
