export type Role = 'admin' | 'lawyer' | 'staff' | 'viewer' | 'buyer' | 'seller' | 'agent';

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
