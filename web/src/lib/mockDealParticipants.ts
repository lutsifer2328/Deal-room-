import { DealParticipant } from './types';

// Links global participants to specific deals
export const MOCK_DEAL_PARTICIPANTS: DealParticipant[] = [
    // Deal 1: Luxury Apartment in Lozenets
    {
        id: 'dp_001',
        dealId: 'd_1',
        participantId: 'gp_001', // Ivan Petrov
        role: 'buyer',
        permissions: {
            canViewDocuments: true,
            canDownloadDocuments: true,
            canUploadDocuments: true,
            canViewTimeline: true
        },
        joinedAt: '2025-01-10T09:00:00Z',
        isActive: true,
        createdAt: '2025-01-10T09:00:00Z',
        updatedAt: '2025-01-10T09:00:00Z'
    },
    {
        id: 'dp_002',
        dealId: 'd_1',
        participantId: 'gp_006', // Nikolay Stoyanov
        role: 'seller',
        permissions: {
            canViewDocuments: true,
            canDownloadDocuments: true,
            canUploadDocuments: true,
            canViewTimeline: true
        },
        joinedAt: '2024-10-20T10:00:00Z',
        isActive: true,
        createdAt: '2024-10-20T10:00:00Z',
        updatedAt: '2024-10-20T10:00:00Z'
    },
    {
        id: 'dp_003',
        dealId: 'd_1',
        participantId: 'gp_003', // Georgi Dimitrov
        role: 'agent',
        permissions: {
            canViewDocuments: true,
            canDownloadDocuments: true,
            canUploadDocuments: false,
            canViewTimeline: true
        },
        joinedAt: '2024-12-15T08:00:00Z',
        isActive: true,
        createdAt: '2024-12-15T08:00:00Z',
        updatedAt: '2024-12-15T08:00:00Z'
    },

    // Deal 2: Office Space in Sofia Center
    {
        id: 'dp_004',
        dealId: 'd_2',
        participantId: 'gp_002', // Maria Ivanova
        role: 'buyer',
        permissions: {
            canViewDocuments: true,
            canDownloadDocuments: true,
            canUploadDocuments: true,
            canViewTimeline: true
        },
        joinedAt: '2025-01-12T10:00:00Z',
        isActive: true,
        createdAt: '2025-01-12T10:00:00Z',
        updatedAt: '2025-01-12T10:00:00Z'
    },
    {
        id: 'dp_005',
        dealId: 'd_2',
        participantId: 'gp_014', // Boyan Ivanov
        role: 'seller',
        permissions: {
            canViewDocuments: true,
            canDownloadDocuments: true,
            canUploadDocuments: true,
            canViewTimeline: true
        },
        joinedAt: '2024-08-10T09:00:00Z',
        isActive: true,
        createdAt: '2024-08-10T09:00:00Z',
        updatedAt: '2024-08-10T09:00:00Z'
    },
    {
        id: 'dp_006',
        dealId: 'd_2',
        participantId: 'gp_008', // Plamen Todorov
        role: 'agent',
        permissions: {
            canViewDocuments: true,
            canDownloadDocuments: true,
            canUploadDocuments: false,
            canViewTimeline: true
        },
        joinedAt: '2024-09-10T09:00:00Z',
        isActive: true,
        createdAt: '2024-09-10T09:00:00Z',
        updatedAt: '2024-09-10T09:00:00Z'
    },

    // Deal 3: Villa in Boyana (CLOSED)
    {
        id: 'dp_007',
        dealId: 'd_3',
        participantId: 'gp_001', // Ivan Petrov (also in Deal 1)
        role: 'buyer',
        permissions: {
            canViewDocuments: true,
            canDownloadDocuments: true,
            canUploadDocuments: true,
            canViewTimeline: true
        },
        joinedAt: '2024-11-10T09:00:00Z',
        isActive: false, // Deal is closed
        createdAt: '2024-11-10T09:00:00Z',
        updatedAt: '2024-12-20T16:00:00Z'
    },
    {
        id: 'dp_008',
        dealId: 'd_3',
        participantId: 'gp_019', // Daniela Nikolova
        role: 'seller',
        permissions: {
            canViewDocuments: true,
            canDownloadDocuments: true,
            canUploadDocuments: true,
            canViewTimeline: true
        },
        joinedAt: '2024-07-20T11:00:00Z',
        isActive: false,
        createdAt: '2024-07-20T11:00:00Z',
        updatedAt: '2024-12-20T16:00:00Z'
    },
    {
        id: 'dp_009',
        dealId: 'd_3',
        participantId: 'gp_020', // Krasimir Todorov
        role: 'agent',
        permissions: {
            canViewDocuments: true,
            canDownloadDocuments: true,
            canUploadDocuments: false,
            canViewTimeline: true
        },
        joinedAt: '2024-09-25T10:00:00Z',
        isActive: false,
        createdAt: '2024-09-25T10:00:00Z',
        updatedAt: '2024-12-20T16:00:00Z'
    },

    // Additional participants in various deals
    {
        id: 'dp_010',
        dealId: 'd_1',
        participantId: 'gp_009', // Svetlana Dimitrova (Notary)
        role: 'notary',
        permissions: {
            canViewDocuments: true,
            canDownloadDocuments: true,
            canUploadDocuments: false,
            canViewTimeline: true
        },
        joinedAt: '2024-11-15T08:00:00Z',
        isActive: true,
        createdAt: '2024-11-15T08:00:00Z',
        updatedAt: '2024-11-15T08:00:00Z'
    },
    {
        id: 'dp_011',
        dealId: 'd_2',
        participantId: 'gp_012', // Dimitar Kolev (Bank Rep)
        role: 'bank_representative',
        permissions: {
            canViewDocuments: false,
            canDownloadDocuments: false,
            canUploadDocuments: true,
            canViewTimeline: false
        },
        joinedAt: '2024-12-01T09:00:00Z',
        isActive: true,
        createdAt: '2024-12-01T09:00:00Z',
        updatedAt: '2024-12-01T09:00:00Z'
    },
    {
        id: 'dp_012',
        dealId: 'd_1',
        participantId: 'gp_007', // Desislava Ilieva
        role: 'buyer',
        permissions: {
            canViewDocuments: true,
            canDownloadDocuments: true,
            canUploadDocuments: true,
            canViewTimeline: true
        },
        joinedAt: '2025-01-18T11:00:00Z',
        isActive: true,
        createdAt: '2025-01-18T11:00:00Z',
        updatedAt: '2025-01-18T11:00:00Z'
    },
    {
        id: 'dp_013',
        dealId: 'd_2',
        participantId: 'gp_010', // Hristo Angelov
        role: 'buyer',
        permissions: {
            canViewDocuments: true,
            canDownloadDocuments: true,
            canUploadDocuments: true,
            canViewTimeline: true
        },
        joinedAt: '2025-01-20T13:00:00Z',
        isActive: true,
        createdAt: '2025-01-20T13:00:00Z',
        updatedAt: '2025-01-20T13:00:00Z'
    }
];
