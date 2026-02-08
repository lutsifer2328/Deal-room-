'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, Lock, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
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

        } catch (error: any) {
            console.error('Update Error:', error);
            setMsg('❌ Error: ' + (error.message || 'Failed to update'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Set New Password</h1>
                    <p className="text-sm text-gray-500 mt-2">
                        Welcome! Please set a secure password to access your account.
                    </p>
                </div>

                <form onSubmit={handleUpdate} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 outline-none"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 outline-none"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {msg && (
                        <div className={`p-3 rounded-lg text-sm ${msg.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                            {msg}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-teal hover:bg-teal/90 text-white font-bold rounded-lg transition-all"
                    >
                        {loading ? 'Updating...' : 'Set Password & Login'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
