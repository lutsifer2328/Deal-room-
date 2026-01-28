'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from './types';
import { MOCK_USERS } from './mockData';

interface AuthContextType {
    user: User | null;
    loginAs: (userId: string) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    // Default to Admin for testing - change to null for production login screen
    const [user, setUser] = useState<User | null>(MOCK_USERS['u_admin']);
    const [isLoading, setIsLoading] = useState(false);

    const loginAs = (userId: string) => {
        setIsLoading(true);
        // Simulate network delay
        setTimeout(() => {
            // Check if it's a participant ID
            if (userId.startsWith('participant_')) {
                // Extract participant info and create a temporary user
                const participantId = userId.replace('participant_', '');
                // We need to get this from the data context - for now, just use mock
                setUser(MOCK_USERS[userId] || MOCK_USERS['u_buyer']);
            } else {
                const newUser = MOCK_USERS[userId];
                if (newUser) {
                    setUser(newUser);
                }
            }
            setIsLoading(false);
        }, 500);
    };

    const logout = () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loginAs, logout, isLoading }}>
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
