'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { getPermissionsForRole } from './permissions';
import { User } from './types';
// ... (imports remain the same, just adding this one)

// ... inside fetchUserProfile ...

import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<{ error: any }>;
    logout: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // 1. Check active session
        // 1. Check active session
        const checkSession = async (retries = 3) => {
            try {
                console.log(`🔐 Checking session... (Attempts left: ${retries})`);
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) throw error;

                console.log('🔐 Session:', session ? 'FOUND' : 'NONE');

                if (session?.user) {
                    await fetchUserProfile(session.user.id, session.user.email!, session);
                } else {
                    setUser(null);
                    setIsLoading(false);
                }
            } catch (error: any) {
                // Retry on Abort/Network error
                if (retries > 0 && (error.name === 'AbortError' || error.message?.includes('AbortError'))) {
                    console.warn(`⚠️ Session check aborted. Retrying...`);
                    await new Promise(r => setTimeout(r, 500));
                    return checkSession(retries - 1);
                }

                console.error('❌ Session check failed:', error);
                // Even if session check failed, try to see if we have ANY persistence user in localStorage if possible, or just fail.
                // We set user to null to be safe.
                setUser(null);
                setIsLoading(false);
            }
        };

        checkSession();

        // 2. Listen for auth changes (Primary source of truth if getSession fails)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            console.log(`🔐 Auth State Change: ${_event}`, session ? 'User Found' : 'No User');

            // Handle Password Recovery & Invite Redirects
            if (_event === 'PASSWORD_RECOVERY') {
                console.log('🔄 Password Recovery Event Detected. Redirecting to update password...');
                router.push('/auth/update-password');
                return;
            }

            if (session?.user) {
                // If we already have a user and it matches, don't re-fetch needlessly unless it's a specific event
                if (user?.id === session.user.id && _event === 'TOKEN_REFRESHED') return;

                await fetchUserProfile(session.user.id, session.user.email!, session);
            } else if (_event === 'SIGNED_OUT') {
                setUser(null);
                setIsLoading(false);
            }
        });

        // 3. Manual Hash Check for "type=invite" or "type=recovery"
        // Sometimes onAuthStateChange fires AFTER the hash is consumed or doesn't fire PASSWORD_RECOVERY for invites.
        if (typeof window !== 'undefined' && window.location.hash) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1)); // remove #
            const type = hashParams.get('type');
            if (type === 'recovery' || type === 'invite') {
                console.log(`🔄 Hash detected: type=${type}. Redirecting to update password...`);
                // Short timeout to allow auth state to settle
                setTimeout(() => {
                    router.push('/auth/update-password');
                }, 500);
            }
        }

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserProfile = async (userId: string, email: string, existingSession: any = null) => {
        let dbData = null;
        let retryCount = 0;
        const maxRetries = 3;

        // 1. Try to fetch from DB with Retries
        while (retryCount < maxRetries) {
            try {
                // console.log(`🔍 Try ${retryCount + 1}/${maxRetries} fetching profile for: ${email}`);
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (error) throw error;
                if (data) {
                    dbData = data;
                    break; // Success
                }
            } catch (error: any) {
                // Only retry on network/abort errors
                if (error.name === 'AbortError' || error.message?.includes('AbortError') || error.message?.includes('fetch')) {
                    console.warn(`⚠️ Profile fetch aborted/failed. Retrying (${retryCount + 1}/${maxRetries})...`);
                    retryCount++;
                    await new Promise(r => setTimeout(r, 500)); // Wait 500ms
                } else {
                    console.error('❌ Non-retriable DB Error:', error);
                    break; // Don't retry logic errors
                }
            }
        }

        // 2. If DB success -> Set User
        if (dbData) {
            console.log('✅ Found user data (DB), role:', dbData.role);
            setUser({
                id: dbData.id,
                email: dbData.email,
                name: dbData.name,
                role: dbData.role,
                permissions: getPermissionsForRole(dbData.role),
                avatarUrl: dbData.avatar_url,
                isActive: dbData.is_active,
                createdAt: dbData.created_at,
                lastLogin: dbData.last_login
            });
            setIsLoading(false);
            return;
        }

        // 3. If DB Failed -> Try Session Metadata (Resilience)
        try {
            console.warn('⚠️ DB Fetch failed/exhausted. Attempting Metadata Fallback...');

            // Use passed session OR try to get it if missing (though unlikely if passed)
            let session = existingSession;
            if (!session) {
                const { data } = await supabase.auth.getSession();
                session = data.session;
            }

            const metaRole = session?.user?.user_metadata?.role;

            if (metaRole) {
                console.log('✅ Found user data (Metadata), role:', metaRole);
                setUser({
                    id: userId,
                    email: email,
                    name: session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || 'User',
                    role: metaRole,
                    permissions: getPermissionsForRole(metaRole),
                    isActive: true, // Assuming active if they have a valid session
                    createdAt: new Date().toISOString()
                });
                setIsLoading(false);
                return;
            }
        } catch (metaError) {
            console.error('❌ Metadata fallback failed:', metaError);
        }

        // 4. Ultimate Fallback -> Viewer
        console.warn('⚠️ No user data found in DB OR Metadata, defaulting to viewer');
        setUser({
            id: userId,
            email: email,
            name: 'Unknown User',
            role: 'viewer',
            permissions: getPermissionsForRole('viewer'),
            isActive: true,
            createdAt: new Date().toISOString()
        });
        setIsLoading(false);
    };

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            setIsLoading(false);
            return { error };
        }

        return { error: null };
    };

    const logout = async () => {
        setIsLoading(true);
        await supabase.auth.signOut();
        router.push('/login');
        setUser(null);
        setIsLoading(false);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
