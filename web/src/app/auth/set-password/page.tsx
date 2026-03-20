'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SetPassword() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [termsAccepted, setTermsAccepted] = useState(false);

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUserEmail(session.user.email || '');
                setIsCheckingSession(false);
                return;
            }

            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                if (session?.user) {
                    setUserEmail(session.user.email || '');
                    setIsCheckingSession(false);
                    subscription.unsubscribe();
                } else if (event === 'SIGNED_OUT') {
                    router.push('/login');
                    subscription.unsubscribe();
                }
            });

            const fallback = setTimeout(() => {
                subscription.unsubscribe();
                router.push('/login');
            }, 5000);

            return () => {
                clearTimeout(fallback);
                subscription.unsubscribe();
            };
        };
        checkSession();
    }, [router]);

    const recordTermsAccepted = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            await supabase.from('users')
                .update({ terms_accepted_at: new Date().toISOString() })
                .eq('id', session.user.id)
                .is('terms_accepted_at', null);
        }
    };

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match'); return; }
        if (!termsAccepted) { setError('Моля, съгласете се с Общите условия и Политиката за поверителност преди да продължите.'); return; }
        setLoading(true);
        try {
            const { error: updateError } = await supabase.auth.updateUser({ password });
            if (updateError) {
                if (updateError.message?.toLowerCase().includes('same') || updateError.message?.toLowerCase().includes('different')) {
                    await recordTermsAccepted();
                    router.push('/');
                    return;
                }
                throw updateError;
            }
            await recordTermsAccepted();
            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Failed to set password. Please try again.');
            setLoading(false);
        }
    };

    if (isCheckingSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-400 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-300">Verifying your session...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-playfair font-bold text-white mb-2">Set Your Password</h1>
                    <p className="text-gray-300">Welcome! Please create a password for your account</p>
                    {userEmail && <p className="text-teal-400 text-sm mt-2">{userEmail}</p>}
                </div>
                <form onSubmit={handleSetPassword} className="space-y-6">
                    {error && <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3"><p className="text-red-300 text-sm">{error}</p></div>}
                    <div>
                        <label className="block text-white font-medium mb-2">Password</label>
                        <input id="new-password" name="new-password" autoComplete="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Enter your password" required minLength={6} />
                        <p className="text-gray-400 text-xs mt-1">Minimum 6 characters</p>
                    </div>
                    <div>
                        <label className="block text-white font-medium mb-2">Confirm Password</label>
                        <input id="confirm-password" name="confirm-password" autoComplete="new-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Confirm your password" required />
                    </div>
                    <div className="flex items-start gap-2 pt-2">
                        <input type="checkbox" id="terms" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-1 w-4 h-4 rounded border-white/30 bg-white/10 text-teal-500 focus:ring-teal-500/20" required />
                        <label htmlFor="terms" className="text-xs text-gray-300 leading-tight">
                            Съгласен съм с{' '}<a href="/terms" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">Общите условия</a>{' '}и{' '}<a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">Политиката за поверителност</a>.
                        </label>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors">
                        {loading ? 'Setting Password...' : 'Continue to Dashboard'}
                    </button>
                </form>
            </div>
        </div>
    );
}
