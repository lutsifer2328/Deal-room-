export type Role = 'admin' | 'lawyer' | 'staff' | 'viewer' | 'buyer' | 'seller' | 'agent' | 'notary' | 'bank_representative';

export interface Permission {
  canCreateDeals: boolean;
  canEditDeals: boolean;
  canDeleteDeals: boolean;
  canManageUsers: boolean;
  canViewAllDeals: boolean;
  canEditTimeline: boolean;
  canCloseDeals: boolean;
  canManageDocuments: boolean;
  canExportData: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  permissions: Permission;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

// Global Participant (one person across all deals)
export interface GlobalParticipant {
  id: string;
  name: string;
  email: string; // UNIQUE - one person should only exist once
  phone?: string;

  // Invitation tracking
  invitationStatus: 'pending' | 'accepted' | 'declined';
  invitationSentAt?: string;
  invitationAcceptedAt?: string;

  // Internal notes (never visible to participants)
  internalNotes?: string;

  createdAt: string;
  updatedAt: string;
}

// Junction table linking participants to deals
export interface DealParticipant {
  id: string;
  dealId: string;
  participantId: string; // References GlobalParticipant.id

  role: Role;
  permissions: {
    canViewDocuments: boolean;
    canDownloadDocuments: boolean;
    canUploadDocuments: boolean;
    canViewTimeline: boolean;
  };

  joinedAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Legacy Participant (deal-specific, kept for backwards compatibility)
export interface Participant {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  canViewDocuments: boolean;  // Legacy - kept for backwards compatibility
  canDownload: boolean;  // Can download documents they have access to
  documentPermissions?: {
    canViewRoles: Role[];  // Which roles' documents can this person view? e.g., ['buyer', 'seller']
  };
  isActive: boolean;
  addedAt: string;
  invitationToken?: string;
  invitedAt?: string;
  hasAcceptedInvite: boolean;
}

export type DocumentStatus = 'private' | 'verified' | 'released' | 'rejected';

export interface DealDocument {
  id: string;
  title_en: string;
  title_bg: string;
  url: string; // Mock URL
  uploadedBy: string; // User ID
  status: DocumentStatus;
  uploadedAt: string;
  verifiedAt?: string;
  rejectionReason_en?: string;
  rejectionReason_bg?: string;
}

export interface StandardDocument {
  id: string;
  name: string;
  description?: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isActive: boolean;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  timestamp: string;
  isVisibleToAll: boolean;  // Lawyer can hide/show this comment from participants
}

export interface Task {
  id: string;
  dealId: string;
  title_en: string;
  title_bg: string;
  description_en?: string;
  description_bg?: string;
  assignedTo: Role; // 'buyer' or 'seller' mostly
  status: 'pending' | 'in_review' | 'completed';
  documents: DealDocument[];
  comments: Comment[];  // Lawyer can leave clarifications here
  required: boolean;
  standardDocumentId?: string;  // Reference to StandardDocument
  expirationDate?: string;      // For tracking expiring docs
}

export interface AuditLogEntry {
  id: string;
  dealId: string;
  actorId: string;
  actorName: string; // Denormalized for display speed
  action: 'CREATED_DEAL' | 'ADDED_TASK' | 'UPLOADED_DOC' | 'VERIFIED_DOC' | 'REJECTED_DOC' | 'RELEASED_DOC' | 'UPDATED_PARTICIPANT' | 'UPDATED_DEAL_STEP' | 'ADDED_COMMENT' | 'UPDATED_TIMELINE' | 'UPDATED_DEAL_STATUS';
  details: string;
  timestamp: string;
}

export interface TimelineStep {
  id: string;
  label: string;
  order: number;
}

export type DealStep = 'onboarding' | 'documents' | 'preliminary_contract' | 'final_review' | 'closing';

export type DealStatus = 'active' | 'on_hold' | 'closed';

export interface Deal {
  id: string;                    // Internal database ID
  dealNumber?: string;           // Custom CRM deal ID (e.g. "AGZ-2024-001")
  title: string;
  propertyAddress: string;
  status: DealStatus;            // Deal lifecycle status
  closedAt?: string;             // When deal was closed (ISO date)
  closedBy?: string;             // User ID who closed it
  closureNotes?: string;         // Optional closure/completion notes
  timeline: TimelineStep[];
  currentStepId: string;
  currentStep: DealStep;         // LEGACY: Keep for backwards compatibility
  participants: Participant[];
  // Legacy fields for backward compatibility
  buyerIds: string[];
  sellerIds: string[];
  lawyerId: string;
  agentId?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}
