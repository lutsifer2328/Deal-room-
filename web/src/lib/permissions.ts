import { Role, Permission } from './types';

/**
 * Default permissions for each role
 */
export const ROLE_PERMISSIONS: Record<Role, Permission> = {
    admin: {
        canCreateDeals: true,
        canEditDeals: true,
        canDeleteDeals: true,
        canManageUsers: true,
        canViewAllDeals: true,
        canEditTimeline: true,
        canCloseDeals: true,
        canManageDocuments: true,
        canExportData: true,
    },
    lawyer: {
        canCreateDeals: true,
        canEditDeals: true,
        canDeleteDeals: true,
        canManageUsers: false,
        canViewAllDeals: true,
        canEditTimeline: true,
        canCloseDeals: true,
        canManageDocuments: true,
        canExportData: true,
    },
    staff: {
        canCreateDeals: true,
        canEditDeals: true,
        canDeleteDeals: false,
        canManageUsers: false,
        canViewAllDeals: true,
        canEditTimeline: false,
        canCloseDeals: false,
        canManageDocuments: true,
        canExportData: false,
    },
    viewer: {
        canCreateDeals: false,
        canEditDeals: false,
        canDeleteDeals: false,
        canManageUsers: false,
        canViewAllDeals: true,
        canEditTimeline: false,
        canCloseDeals: false,
        canManageDocuments: false,
        canExportData: false,
    },
    // Deal participants have limited access
    buyer: {
        canCreateDeals: false,
        canEditDeals: false,
        canDeleteDeals: false,
        canManageUsers: false,
        canViewAllDeals: false, // Only their deals
        canEditTimeline: false,
        canCloseDeals: false,
        canManageDocuments: false,
        canExportData: false,
    },
    seller: {
        canCreateDeals: false,
        canEditDeals: false,
        canDeleteDeals: false,
        canManageUsers: false,
        canViewAllDeals: false, // Only their deals
        canEditTimeline: false,
        canCloseDeals: false,
        canManageDocuments: false,
        canExportData: false,
    },
    agent: {
        canCreateDeals: false,
        canEditDeals: false,
        canDeleteDeals: false,
        canManageUsers: false,
        canViewAllDeals: false, // Only their deals
        canEditTimeline: false,
        canCloseDeals: false,
        canManageDocuments: false,
        canExportData: false,
    },
    notary: {
        canCreateDeals: false,
        canEditDeals: false,
        canDeleteDeals: false,
        canManageUsers: false,
        canViewAllDeals: false, // Only their deals
        canEditTimeline: false,
        canCloseDeals: false,
        canManageDocuments: false,
        canExportData: false,
    },
    bank_representative: {
        canCreateDeals: false,
        canEditDeals: false,
        canDeleteDeals: false,
        canManageUsers: false,
        canViewAllDeals: false, // Only their deals
        canEditTimeline: false,
        canCloseDeals: false,
        canManageDocuments: false,
        canExportData: false,
    },
};

/**
 * Get permissions for a specific role
 */
export function getPermissionsForRole(role: Role | string): Permission {
    const normalizeRole = (role || 'viewer').toLowerCase() as Role;
    return ROLE_PERMISSIONS[normalizeRole] || ROLE_PERMISSIONS['viewer'];
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(permissions: Permission, permission: keyof Permission): boolean {
    return permissions[permission];
}

/**
 * Check if a role is an organizational role (not a deal participant)
 */
export function isOrganizationalRole(role: Role): boolean {
    return ['admin', 'lawyer', 'staff', 'viewer'].includes(role);
}
