'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const handleCallback = async () => {
            try {
                console.log('🔍 Callback started');
                console.log('🔍 Full URL:', window.location.href);
                console.log('🔍 Hash:', window.location.hash);
                console.log('🔍 Search:', window.location.search);

                // ── Strategy 0: Direct token_hash verification (our invite links) ──
                // Our invite endpoint sends links like: /auth/callback?token_hash=TOKEN&type=recovery
                const searchParams = new URLSearchParams(window.location.search);
                const tokenHash = searchParams.get('token_hash');
                const tokenType = searchParams.get('type') as 'recovery' | 'magiclink' | 'invite' | 'signup' | 'email';

                const isNewInvite = searchParams.get('new') === '1';
                const getRedirectPath = (type: string | null): string => {
                    if (type === 'recovery' && isNewInvite) return '/auth/set-password';
                    if (type === 'recovery') return '/auth/update-password';
                    if (type === 'magiclink') return '/';
                    return '/auth/set-password'; // default for invite/signup
                };

                if (tokenHash) {
                    console.log('🔐 Verifying OTP token_hash directly (Strategy 0)...');
                    const { data, error } = await supabase.auth.verifyOtp({
                        token_hash: tokenHash,
                        type: tokenType || 'recovery',
                    });

                    if (error) {
                        console.error('❌ verifyOtp error:', error);
                        setStatus('error');
                        if (error.message.includes('expired')) {
                            setErrorMessage('This invitation link has expired. Please request a new one.');
                        } else {
                            setErrorMessage(error.message);
                        }
                        return;
                    }

                    if (data.session) {
                        console.log('✅ Session established via verifyOtp!');
                        setStatus('success');
                        setTimeout(() => router.push(getRedirectPath(tokenType)), 1500);
                        return;
                    }
                }

                // ── Strategy 1: Hash-based tokens (legacy invite emails) ─────────
                const hashParams = new URLSearchParams(window.location.hash.substring(1));

                // Check for errors in hash
                const authError = hashParams.get('error');
                const errorCode = hashParams.get('error_code');
                const errorDescription = hashParams.get('error_description');

                if (authError) {
                    console.error('❌ Auth error from Supabase:', { authError, errorCode, errorDescription });
                    setStatus('error');
                    if (errorCode === 'otp_expired') {
                        setErrorMessage('This invitation link has expired. Please request a new invitation.');
                    } else {
                        setErrorMessage(errorDescription || authError);
                    }
                    return;
                }

                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');

                if (accessToken) {
                    console.log('🔐 Setting session from hash tokens (Strategy 1)...');
                    const { data, error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken || ''
                    });

                    if (error) {
                        console.error('❌ setSession error:', error);
                        setStatus('error');
                        setErrorMessage(error.message);
                        return;
                    }

                    if (data.session) {
                        console.log('✅ Session established from hash tokens');
                        setStatus('success');
                        const hashType = hashParams.get('type');
                        setTimeout(() => router.push(getRedirectPath(hashType)), 1500);
                        return;
                    }
                }

                // ── Strategy 2: PKCE code exchange ──────────────────────
                const code = searchParams.get('code');
                if (code) {
                    console.log('🔐 Exchanging PKCE code (Strategy 2)...');
                    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

                    if (error) {
                        console.error('❌ Code exchange error:', error);
                        // Don't set error yet - try fallback
                    } else if (data.session) {
                        console.log('✅ Session established from PKCE code');
                        setStatus('success');
                        setTimeout(() => router.push(getRedirectPath(null)), 1500);
                        return;
                    }
                }

                // ── Strategy 3: Check existing session ──────────────────
                console.log('🔍 Checking for existing session (Strategy 3)...');
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    console.log('✅ Session found via getSession()');
                    setStatus('success');
                    setTimeout(() => router.push(getRedirectPath(null)), 1500);
                    return;
                }

                // ── No tokens found at all ──
                console.error('❌ No tokens found in any strategy');
                setStatus('error');
                setErrorMessage('No authentication token found. The link may have expired or been used already. Please request a new invitation.');

            } catch (error: any) {
                console.error('❌ Auth callback error:', error);
                setStatus('error');
                setErrorMessage(error.message || 'An unexpected error occurred');
            }
        };

        const timeout = setTimeout(() => {
            console.error('⏱️ Callback timeout');
            setStatus('error');
            setErrorMessage('Verification took too long. Please try clicking the link again.');
        }, 15000);

        handleCallback().finally(() => clearTimeout(timeout));
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl">
                {status === 'loading' && (
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-teal-400 border-t-transparent mx-auto mb-4"></div>
                        <h2 className="text-2xl font-playfair font-bold text-white mb-2">
                            Verifying your invitation...
                        </h2>
                        <p className="text-gray-300">Please wait a moment</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-playfair font-bold text-white mb-2">
                            Welcome aboard!
                        </h2>
                        <p className="text-gray-300">Setting up your account...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-playfair font-bold text-white mb-2">
                            Authentication Failed
                        </h2>
                        <p className="text-gray-300 mb-4">{errorMessage}</p>
                        <button
                            onClick={() => router.push('/login')}
                            className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg transition-colors"
                        >
                            Go to Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
