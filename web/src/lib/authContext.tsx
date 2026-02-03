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
        const checkSession = async () => {
            try {
                console.log('🔐 Checking session...');
                const { data: { session } } = await supabase.auth.getSession();
                console.log('🔐 Session:', session ? 'FOUND' : 'NONE');

                if (session?.user) {
                    await fetchUserProfile(session.user.id, session.user.email!);
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('❌ Session check failed:', error);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        // Add timeout to prevent infinite loading
        const timeout = setTimeout(() => {
            console.warn('⚠️ Auth check timeout - forcing loading to false');
            setIsLoading(false);
        }, 10000); // 10 second timeout (increased for invite flow)

        checkSession().finally(() => clearTimeout(timeout));

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                await fetchUserProfile(session.user.id, session.user.email!);
            } else {
                setUser(null);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserProfile = async (userId: string, email: string) => {
        try {
            // Fetch role/name from public.users table
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (data) {
                setUser({
                    id: data.id,
                    email: data.email,
                    name: data.name,
                    role: data.role,
                    permissions: getPermissionsForRole(data.role),
                    avatarUrl: data.avatar_url,
                    isActive: data.is_active,
                    createdAt: data.created_at,
                    lastLogin: data.last_login
                });
            } else {
                // Fallback if public user record missing (should not happen if triggers match)
                setUser({
                    id: userId,
                    email: email,
                    name: 'Unknown User',
                    role: 'viewer',
                    permissions: getPermissionsForRole('viewer'),
                    isActive: true,
                    createdAt: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        } finally {
            setIsLoading(false);
        }
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
