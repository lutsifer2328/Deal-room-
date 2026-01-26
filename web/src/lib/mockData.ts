import { Deal, Task, User } from './types';
import { createDefaultTimeline } from './defaultTimeline';

// Users
export const MOCK_USERS: Record<string, User> = {
    'u_lawyer': { id: 'u_lawyer', name: 'Elena Petrova', email: 'legal@agenzia.bg', role: 'lawyer', avatarUrl: '/avatars/lawyer.png' },
    'u_buyer': { id: 'u_buyer', name: 'John Smith', email: 'john@example.com', role: 'buyer', avatarUrl: '/avatars/buyer.png' },
    'u_seller': { id: 'u_seller', name: 'Maria Ivanova', email: 'maria@example.bg', role: 'seller', avatarUrl: '/avatars/seller.png' },
    'u_agent': { id: 'u_agent', name: 'Ivan Dilov', email: 'ivan@agenzia.bg', role: 'agent', avatarUrl: '/avatars/agent.png' },
};

// Deal
const defaultTimeline = createDefaultTimeline();

export const MOCK_DEAL: Deal = {
    id: 'd_123',
    title: 'Luxury Apartment in Lozenets',
    propertyAddress: '42 Lozenets Boulevard, Sofia',
    status: 'active',
    timeline: defaultTimeline,
    currentStepId: defaultTimeline[1].id, // Documents phase
    currentStep: 'documents',
    participants: [
        { id: 'p1', fullName: 'John Smith', email: 'john@example.com', phone: '+359 888 123456', role: 'buyer', canViewDocuments: true, canDownload: true, isActive: true, addedAt: '2025-05-10T10:00:00Z', hasAcceptedInvite: true },
        { id: 'p2', fullName: 'Maria Ivanova', email: 'maria@example.bg', phone: '+359 888 654321', role: 'seller', canViewDocuments: true, canDownload: true, isActive: true, addedAt: '2025-05-10T10:00:00Z', hasAcceptedInvite: true },
        { id: 'p3', fullName: 'Ivan Dilov', email: 'ivan@agenzia.bg', phone: '+359 888 111222', role: 'agent', canViewDocuments: false, canDownload: false, isActive: true, addedAt: '2025-05-10T10:00:00Z', hasAcceptedInvite: true },
    ],
    buyerIds: ['u_buyer'],
    sellerIds: ['u_seller'],
    agentId: 'u_agent',
    lawyerId: 'u_lawyer',
    createdAt: '2025-05-10T10:00:00Z',
};

// Tasks
export const MOCK_TASKS: Task[] = [
    // SELLER TASKS
    {
        id: 't_1',
        dealId: 'd_123',
        title_en: 'Proof of Ownership (Notary Deed)',
        title_bg: 'Доказателство за собственост (Нотариален акт)',
        assignedTo: 'seller',
        status: 'completed',
        required: true,
        documents: [
            {
                id: 'doc_1',
                title_en: 'Notary Deed 2010.pdf',
                title_bg: 'Нотариален акт 2010.pdf',
                url: '#',
                uploadedBy: 'u_seller',
                status: 'released', // Buyer can see this
                uploadedAt: '2025-05-12T14:30:00Z',
                verifiedAt: '2025-05-12T16:00:00Z',
            }
        ]
    },
    {
        id: 't_2',
        dealId: 'd_123',
        title_en: 'Cadastral Sketch',
        title_bg: 'Кадастрална скица',
        assignedTo: 'seller',
        status: 'in_review',
        required: true,
        documents: [
            {
                id: 'doc_2',
                title_en: 'Sketch.pdf',
                title_bg: 'Скица.pdf',
                url: '#',
                uploadedBy: 'u_seller',
                status: 'verified', // Verified (Checkmark) but NOT released (Locked for Buyer)
                uploadedAt: '2025-05-15T09:00:00Z',
                verifiedAt: '2025-05-15T10:30:00Z',
            }
        ],
        comments: []
    },
    // BUYER TASKS
    {
        id: 't_3',
        dealId: 'd_123',
        title_en: 'Copy of ID / Passport',
        title_bg: 'Копие от лична карта / паспорт',
        assignedTo: 'buyer',
        status: 'pending',
        required: true,
        documents: [],
        comments: []
    },
    {
        id: 't2',
        dealId: 'd_1',
        title_en: 'Bank Statement',
        title_bg: 'Банково извлечение',
        description_en: 'Upload last 3 months of bank statements',
        description_bg: 'Качете извлечение за последните 3 месеца',
        assignedTo: 'buyer',
        status: 'pending',
        documents: [],
        comments: [],
        required: true
    },
    {
        id: 't_4',
        dealId: 'd_123',
        title_en: 'Origin of Funds Declaration',
        title_bg: 'Декларация за произход на средствата',
        assignedTo: 'buyer',
        status: 'pending',
        required: true,
        documents: []
    }
];
