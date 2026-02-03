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

    useEffect(() => {
        // Get the current user from the session (set by callback page)
        const checkSession = async () => {
            console.log('🔐 Set-password: Checking session...');
            const { data: { session } } = await supabase.auth.getSession();
            console.log('🔐 Set-password: Session:', session ? 'FOUND' : 'NONE');

            if (session?.user) {
                setUserEmail(session.user.email || '');
                setIsCheckingSession(false);
            } else {
                // Wait a bit longer in case session is still loading
                console.log('⏳ Set-password: No session yet, waiting...');
                setTimeout(async () => {
                    const { data: { session: retrySession } } = await supabase.auth.getSession();
                    if (retrySession?.user) {
                        setUserEmail(retrySession.user.email || '');
                        setIsCheckingSession(false);
                    } else {
                        // Still no session after retry - redirect to login
                        console.log('❌ Set-password: No session found, redirecting to login');
                        router.push('/login');
                    }
                }, 2000); // Wait 2 seconds before giving up
            }
        };
        checkSession();
    }, [router]);

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            // Update the user's password
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) throw updateError;

            // Success - redirect to dashboard
            router.push('/');
        } catch (err: any) {
            console.error('Password update error:', err);
            setError(err.message || 'Failed to set password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-playfair font-bold text-white mb-2">
                        Set Your Password
                    </h1>
                    <p className="text-gray-300">
                        Welcome! Please create a password for your account
                    </p>
                    {userEmail && (
                        <p className="text-teal-400 text-sm mt-2">{userEmail}</p>
                    )}
                </div>

                <form onSubmit={handleSetPassword} className="space-y-6">
                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                            <p className="text-red-300 text-sm">{error}</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-white font-medium mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="Enter your password"
                            required
                            minLength={6}
                        />
                        <p className="text-gray-400 text-xs mt-1">
                            Minimum 6 characters
                        </p>
                    </div>

                    <div>
                        <label className="block text-white font-medium mb-2">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="Confirm your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
                    >
                        {loading ? 'Setting Password...' : 'Continue to Dashboard'}
                    </button>
                </form>
            </div>
        </div>
    );
}
