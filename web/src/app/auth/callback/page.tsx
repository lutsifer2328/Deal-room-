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

                // Supabase invite emails use hash-based tokens, not PKCE code
                const hashParams = new URLSearchParams(window.location.hash.substring(1));

                // Check for errors first
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
                const type = hashParams.get('type');

                console.log('🔍 Extracted tokens:', {
                    hasAccessToken: !!accessToken,
                    hasRefreshToken: !!refreshToken,
                    type,
                    accessTokenPreview: accessToken?.substring(0, 20) + '...'
                });

                if (!accessToken) {
                    console.error('❌ No access token found');
                    setStatus('error');
                    setErrorMessage('No authentication token found in the invitation link');
                    return;
                }

                console.log('🔐 Calling supabase.auth.setSession...');

                // Set the session with the tokens from the invite
                const { data, error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken || ''
                });

                console.log('🔐 setSession response:', { data, error });

                if (error) {
                    console.error('❌ Session error:', error);
                    setStatus('error');
                    setErrorMessage(error.message);
                    return;
                }

                if (data.session) {
                    console.log('✅ Session established successfully');
                    setStatus('success');
                    // Redirect to password setup page
                    setTimeout(() => {
                        router.push('/auth/set-password');
                    }, 1500);
                } else {
                    console.error('❌ No session returned');
                    setStatus('error');
                    setErrorMessage('Could not establish session');
                }
            } catch (error: any) {
                console.error('❌ Auth callback error:', error);
                setStatus('error');
                setErrorMessage(error.message || 'An unexpected error occurred');
            }
        };

        // Add timeout to prevent infinite loading
        const timeout = setTimeout(() => {
            console.error('⏱️ Callback timeout - forcing error state');
            setStatus('error');
            setErrorMessage('The invitation verification took too long. Please try clicking the link again.');
        }, 10000); // 10 second timeout

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
