'use client';

import { useAuth } from '@/lib/authContext';
import { Permission } from '@/lib/types';

/**
 * Hook to access current user's permissions
 */
export function usePermissions() {
    const { user } = useAuth();

    if (!user) {
        // Return all false if no user
        return {
            canCreateDeals: false,
            canEditDeals: false,
            canDeleteDeals: false,
            canManageUsers: false,
            canViewAllDeals: false,
            canEditTimeline: false,
            canCloseDeals: false,
            canManageDocuments: false,
            canExportData: false,
        };
    }

    return user.permissions;
}

/**
 * Hook to check a specific permission
 */
export function useHasPermission(permission: keyof Permission): boolean {
    const permissions = usePermissions();
    return permissions[permission];
}
