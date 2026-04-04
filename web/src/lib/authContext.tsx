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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        const initSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    await fetchUserProfile(session.user.id, session.user.email!, session);
                } else {
                    setIsLoading(false);
                }
            } catch (error: any) {
                if (error.name === 'AbortError' || error.message?.includes('AbortError')) {
                    // Silent no-op for routine abortions, but MUST clear loading state
                    setIsLoading(false);
                    return;
                }
                console.error('❌ Auth initialization error:', error);
                setIsLoading(false);
            }
        };

        initSession();

        // 2. Listen for auth changes (Primary source of truth if getSession fails)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            console.log(`🔐 Auth State Change: ${_event}`, session ? 'User Found' : 'No User');

            // Handle Password Recovery & Invite Redirects
            if (_event === 'PASSWORD_RECOVERY') {
                const currentPath = window.location.pathname;
                // Only redirect if NOT already on auth callback or set-password pages
                if (!currentPath.includes('/auth/')) {
                    console.log('🔄 Password Recovery Event Detected. Redirecting to set password...');
                    router.push('/auth/set-password');
                } else {
                    console.log('🔄 Password Recovery Event Detected (already on auth page, skipping redirect)');
                }
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
                console.log(`🔄 Hash detected: type=${type}. Establishing session then redirecting...`);
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');
                if (accessToken) {
                    supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken || ''
                    }).then(() => {
                        router.push('/auth/update-password');
                    });
                } else {
                    setTimeout(() => {
                        router.push('/auth/update-password');
                    }, 500);
                }
            }
        }

        return () => subscription.unsubscribe();
    }, []);

    const lastFetchRef = React.useRef<number>(0);
    const isFetchingRef = React.useRef<boolean>(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fetchUserProfile = async (userId: string, email: string, existingSession: any = null) => {
        const now = Date.now();
        // Prevent redundant fetches within 2 seconds or if already fetching
        if (isFetchingRef.current || (now - lastFetchRef.current < 2000)) {
            console.log('⏳ Skipping redundant profile fetch (debounced)');
            return;
        }

        isFetchingRef.current = true;
        lastFetchRef.current = now;

        let dbData = null;

        // 1. Try to fetch from DB
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            if (data) {
                dbData = data;
            }
        } catch (error: any) {
            if (error.name === 'AbortError' || error.message?.includes('AbortError')) {
                console.warn(`⚠️ Profile fetch aborted. App navigation likely interrupting.`);
            } else {
                console.error('❌ DB Error fetching profile:', error);
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
            isFetchingRef.current = false;
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
                isFetchingRef.current = false;
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
        isFetchingRef.current = false;
    };

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        console.log('🔐 Login attempt:', email);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error('🔐 Login FAILED:', error.message, error.status, JSON.stringify(error));
            setIsLoading(false);
            return { error };
        }

        console.log('🔐 Login SUCCESS:', data.user?.id);

        // Update terms_accepted_at if it's null
        if (data.user) {
            await supabase
                .from('users')
                .update({ terms_accepted_at: new Date().toISOString() })
                .eq('id', data.user.id)
                .is('terms_accepted_at', null);
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
