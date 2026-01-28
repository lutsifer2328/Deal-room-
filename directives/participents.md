AGENZIA.BG DEAL ROOM
Participants Section - Technical Specification Document
________________________________________
1. OVERVIEW
This document specifies the complete functionality, data structures, API endpoints, and user interface requirements for the Participants section of the Agenzia.bg real estate deal room platform.
The Participants section serves as a centralized participant management hub where lawyers can: - View all participants across all deals in one place - Search and filter participants
- View complete participant history (active and closed deals) - Manage participant contact information and internal notes - Prevent duplicate participant creation
________________________________________
2. KEY DESIGN PRINCIPLES
2.1 Global Participant Identity
CRITICAL: Participants are global entities, not deal-specific. A person with email john@example.com should only exist ONCE in the system, even if they participate in multiple deals.
Benefits: - No duplicate contact information - Complete history of involvement across all deals - Single invitation per person (not per deal) - Efficient search and management
2.2 Access to Historical Data
Lawyers need to access participant information from both ACTIVE and CLOSED deals. System must maintain full history and allow filtering by deal status.
2.3 Duplicate Prevention
When adding a participant to a deal, system MUST check if participant with that email already exists and offer to use existing record. Creating duplicate participants should require explicit confirmation.
2.4 Simplicity Over Features
Focus on what lawyers actually need: - Finding participants - Viewing their deals - Accessing contact information
Avoid: Analytics dashboards, complex bulk actions, or features that add unnecessary complexity.
________________________________________
3. DATABASE SCHEMA
3.1 Participant Model (Global Entity)
interface Participant {
  id: string;                    // UUID
  name: string;                  // Full name
  email: string;                 // UNIQUE constraint
  phone?: string;                // Optional
  
  // Invitation tracking
  invitationStatus: 'pending' | 'accepted' | 'declined';
  invitationSentAt?: Date;
  invitationAcceptedAt?: Date;
  
  // Internal lawyer notes (never visible to participants)
  internalNotes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}
3.2 DealParticipant Model (Junction Table)
This junction table links participants to specific deals. A single participant can have multiple DealParticipant records (one per deal they’re involved in).
interface DealParticipant {
  id: string;                    // UUID
  dealId: string;                // Foreign key to Deal
  participantId: string;         // Foreign key to Participant
  
  // Role in this specific deal
  role: 'buyer' | 'seller' | 'agent' | 'lawyer' | 'notary' | 'other';
  
  // Permissions specific to this deal
  permissions: {
    canViewDocuments: boolean;
    canDownloadDocuments: boolean;
    canUploadDocuments: boolean;
    canViewTimeline: boolean;
    // ... other permissions
  };
  
  joinedAt: Date;                // When added to this deal
  isActive: boolean;             // Still part of this deal?
  createdAt: Date;
  updatedAt: Date;
}
3.3 Required Database Indexes
-- Participant table
CREATE UNIQUE INDEX idx_participant_email ON Participant(email);
CREATE INDEX idx_participant_name ON Participant(name);
CREATE INDEX idx_participant_created ON Participant(createdAt);

-- DealParticipant table
CREATE INDEX idx_dealparticipant_deal ON DealParticipant(dealId);
CREATE INDEX idx_dealparticipant_participant ON DealParticipant(participantId);
CREATE UNIQUE INDEX idx_dealparticipant_unique ON DealParticipant(dealId, participantId);
________________________________________
4. API ENDPOINTS
4.1 GET /api/participants
Purpose: Retrieve all participants with pagination and filtering
Query Parameters: - search (optional) - Search by name, email, or phone (case-insensitive) - dealStatus (optional) - Filter: ‘active’ | ‘closed’ | ‘all’ (default: ‘all’) - role (optional) - Filter by role: ‘buyer’ | ‘seller’ | ‘agent’ | etc. - page (optional) - Page number (default: 1) - pageSize (optional) - Items per page (default: 20) - sortBy (optional) - Sort field: ‘name’ | ‘email’ | ‘createdAt’ (default: ‘name’) - sortOrder (optional) - ‘asc’ | ‘desc’ (default: ‘asc’)
Response (200 OK):
{
  "data": [
    {
      "id": "participant-001",
      "name": "John Smith",
      "email": "john@example.com",
      "phone": "+359 888 123 456",
      "invitationStatus": "accepted",
      "createdAt": "2025-01-15T10:00:00Z",
      "activeDealsCount": 2,
      "closedDealsCount": 1,
      "mostRecentRole": "buyer"
    }
  ],
  "pagination": {
    "total": 234,
    "page": 1,
    "pageSize": 20,
    "totalPages": 12
  }
}
4.2 GET /api/participants/recent
Purpose: Get participants added within last 30 days (for quick access section)
Query Parameters: - days (optional) - Days to look back (default: 30) - limit (optional) - Max results (default: 10)
Response (200 OK): Same structure as GET /api/participants
4.3 GET /api/participants/:id
Purpose: Get full details for specific participant including all deals
Response (200 OK):
{
  "id": "participant-001",
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "+359 888 123 456",
  "invitationStatus": "accepted",
  "invitationSentAt": "2025-01-15T10:00:00Z",
  "invitationAcceptedAt": "2025-01-15T14:30:00Z",
  "internalNotes": "Prefers email. Fast responder.",
  "createdAt": "2025-01-15T10:00:00Z",
  "deals": [
    {
      "dealId": "deal-001",
      "dealName": "Luxury Apartment in Lozenets",
      "propertyAddress": "42 Lozenets Boulevard, Sofia",
      "role": "buyer",
      "dealStatus": "active",
      "joinedAt": "2025-01-15T10:00:00Z",
      "isActive": true
    },
    {
      "dealId": "deal-002",
      "dealName": "Villa in Boyana",
      "propertyAddress": "15 Mountain View, Boyana",
      "role": "buyer",
      "dealStatus": "closed",
      "joinedAt": "2024-11-10T09:00:00Z",
      "closedAt": "2024-12-20T16:00:00Z",
      "isActive": false
    }
  ]
}
4.4 PUT /api/participants/:id
Purpose: Update participant contact information and internal notes
Request Body:
{
  "name": "John Smith Jr.",
  "phone": "+359 888 999 777",
  "internalNotes": "Updated notes here"
}
Note: Email cannot be changed (would break uniqueness constraint)
Response (200 OK): Returns updated Participant object
4.5 POST /api/participants/check-duplicate
Purpose: Check if participant with given email already exists (prevents duplicates)
Request Body:
{
  "email": "john@example.com"
}
Response - Participant Exists (200 OK):
{
  "exists": true,
  "participant": {
    "id": "participant-001",
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "+359 888 123 456",
    "activeDealsCount": 2,
    "deals": [
      {
        "dealName": "Luxury Apartment in Lozenets",
        "role": "buyer"
      }
    ]
  }
}
Response - Participant Does Not Exist (200 OK):
{
  "exists": false
}
________________________________________
5. USER INTERFACE SPECIFICATIONS
5.1 Navigation
Add Participants link to main navigation sidebar:
👥 Participants
Clicking navigates to /participants route.
5.2 Main Participants Page Layout
┌────────────────────────────────────────────────────────┐
│ 👥 Participants                         [+ Add New]    │
├────────────────────────────────────────────────────────┤
│ [Search: name, email, phone...]                        │
│ Filter: [All] [Active Deals Only] [From Closed Deals] │
├────────────────────────────────────────────────────────┤
│ Recently Added (Last 30 days) - Quick Access          │
│ ┌──────────────────────────────────────────────────┐  │
│ │ John Smith      john@ex.com    Buyer   2 deals  │  │
│ │ Maria Ivanova   maria@ex.bg    Seller  1 deal   │  │
│ │ Ivan Dilov      ivan@ag.bg     Agent   3 deals  │  │
│ └──────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────┤
│ All Participants (234 total)                          │
│ ┌──────────────────────────────────────────────────┐  │
│ │ Name           Email          Role     Deals    │  │
│ │ John Smith     john@...       Buyer    2 active │  │
│ │ Maria Ivanova  maria@...      Seller   1 active │  │
│ │ Peter Dimitrov peter@...      Agent    0 (1 cl) │  │
│ │ ...                                             │  │
│ └──────────────────────────────────────────────────┘  │
│ Showing 1-20 of 234                     [Next →]      │
└────────────────────────────────────────────────────────┘
5.3 Component Specifications
Search Bar: - Searches across: name, email, phone - Case-insensitive - Debounce: 300ms - Clear button (X) when text entered
Filter Buttons: - [All] - Show all participants (default) - [Active Deals Only] - activeDealsCount > 0 - [From Closed Deals] - closedDealsCount > 0 - Active filter highlighted - Updates table immediately
Recent Participants Section: - Shows up to 10 most recent (last 30 days) - Hide section if no recent participants - Each row: Name, Email, Most Recent Role, Total Deals - Click row → navigate to detail page - Hover effect
All Participants Table:
Columns: - Name - Full name (sortable) - Email - Email address (truncate if long) - Role - Most recent role - Deals - Format: “2 active” or “0 (1 closed)” or “2 active, 1 closed”
Behavior: - Click row → navigate to detail page - Hover effect - 20 per page - Pagination controls at bottom - Show count: “Showing 1-20 of 234”
5.4 Participant Detail Page Layout
┌───────────────────────────────────────────────────────┐
│ ← Back to Participants                                │
├───────────────────────────────────────────────────────┤
│ 👤 John Smith                               [Edit]    │
│    john@example.com                                   │
│    +359 888 123 456                                   │
│                                                       │
│    Invitation: ✓ Accepted (Jan 15, 2025)             │
│                                     [Send Email]      │
├───────────────────────────────────────────────────────┤
│ Deals (2 active, 1 closed)                            │
│                                                       │
│ 🟢 Active Deals                                       │
│ • Luxury Apartment in Lozenets (Buyer)               │
│   [View Deal →]                                      │
│ • Office Space in Sofia Center (Buyer)               │
│   [View Deal →]                                      │
│                                                       │
│ ⚫ Closed Deals                                       │
│ • Villa in Boyana (Buyer) - Closed Dec 2024         │
│   [View Deal →]                                      │
├───────────────────────────────────────────────────────┤
│ Internal Notes (Only visible to your team)           │
│ [_______________________________________________]     │
│ Prefers email. Fast responder.                [Save] │
└───────────────────────────────────────────────────────┘
Invitation Status Display: - ✓ Accepted (date) - Green checkmark - ⏳ Pending (date) - Orange clock, show [Resend Invitation] button - ❌ Declined (date) - Red X
[Send Email] Button: - Opens default email client: mailto:email@example.com
Deals Section: - Separate active/closed with headers - Show deal name + role in parentheses - For closed deals, show close date - [View Deal →] navigates to deal page - If no deals: “Not currently involved in any deals”
Internal Notes: - Multiline textarea (5 rows) - Max 1000 characters - Auto-save on [Save] or blur - Show “Saved” indicator briefly - Clearly labeled “Only visible to your team”
5.5 Duplicate Detection Modal
CRITICAL FEATURE: Appears when lawyer attempts to add participant using existing email.
Trigger: 1. Lawyer enters email in ‘Add Participant to Deal’ form 2. On blur/submission, call POST /api/participants/check-duplicate 3. If exists=true, show this modal 4. If exists=false, proceed normally
Modal Layout:
┌────────────────────────────────────────────┐
│ ⚠️  Existing Participant Found          [X]│
├────────────────────────────────────────────┤
│ A participant with email                   │
│ john@example.com already exists:           │
│                                            │
│ John Smith (Buyer)                         │
│ john@example.com | +359 888 123 456        │
│                                            │
│ Currently in 2 deals:                      │
│ • Luxury Apartment in Lozenets (Buyer)    │
│ • Office Space in Sofia Center (Buyer)    │
│                                            │
│ Would you like to use this participant?    │
│                                            │
│ [Cancel] [Use Existing] [Create New]      │
└────────────────────────────────────────────┘
Button Actions: - [Cancel] - Close modal, return to form - [Use Existing] (Primary) - Use existing participant ID, add to current deal - [Create New] (Secondary, warning) - Proceed with duplicate creation (show additional confirmation: “Are you sure? This will create a duplicate entry.”)
________________________________________
6. IMPLEMENTATION PHASES
Phase 1: Core Participants Page (Priority: HIGH)
1.	Verify/update database schema (Participant + DealParticipant)
2.	Create database indexes
3.	Implement GET /api/participants
4.	Build main page UI (table, search, filters)
5.	Implement pagination
6.	Add navigation link
Phase 2: Participant Detail Page (Priority: HIGH)
1.	Implement GET /api/participants/:id
2.	Build detail page UI
3.	Display contact info + invitation status
4.	List active/closed deals
5.	Implement internal notes with auto-save
6.	Implement PUT /api/participants/:id
Phase 3: Duplicate Detection (Priority: CRITICAL)
1.	Implement POST /api/participants/check-duplicate
2.	Build duplicate detection modal
3.	Integrate into ‘Add Participant to Deal’ flow
4.	Test edge cases
Phase 4: Recent Participants & Polish (Priority: MEDIUM)
1.	Implement GET /api/participants/recent
2.	Add ‘Recent Participants’ section
3.	Add [Send Email] functionality
4.	Improve loading states and error handling
5.	Add empty states
________________________________________
7. DATA MIGRATION STRATEGY
CRITICAL: If current system has deal-specific participant records (same person exists multiple times with same email), MUST migrate to global participant identity first.
Migration Steps: 1. Audit data: Identify duplicate participants by email 2. Consolidate duplicates: For each unique email: - Create ONE global Participant record - Create DealParticipant junction records for each deal - Preserve role and permissions per deal 3. Update foreign keys: Point all document requirements, comments to new IDs 4. Add unique constraint: Add UNIQUE index on Participant.email 5. Test thoroughly: Verify no data loss, all relationships intact
________________________________________
8. TESTING REQUIREMENTS
Unit Tests
•	Participant CRUD operations
•	Duplicate email detection
•	Deal count aggregation
•	Search functionality (case-insensitive, partial match)
•	Pagination logic
Integration Tests
•	Create participant → Add to deal → View in Participants page
•	Duplicate detection flow
•	Deal closure → Verify in participant history
•	Internal notes persistence
UI Tests
•	Search debouncing
•	Filter buttons
•	Pagination navigation
•	Duplicate detection modal flow
•	Empty states
________________________________________
9. PERFORMANCE CONSIDERATIONS
•	Search debouncing: 300ms
•	Database indexes on: email (UNIQUE), name, createdAt
•	Pagination: 20 items per page
•	Lazy load deal details
•	Cache recent participants (5 min TTL)
________________________________________
10. SECURITY CONSIDERATIONS
•	Only authenticated lawyers/admins can view Participants page
•	Internal notes never exposed to participants via API
•	Email validation: must be valid format
•	Rate limiting on search endpoint
•	Server-side validation of all inputs
________________________________________
11. SUCCESS METRICS
•	Duplicate Prevention Rate - % using existing vs creating duplicate
•	Search Usage - How often search vs scrolling
•	Recent Section Usage - Click-through rate on recent participants
•	Time to Find Participant - Average time from page load to participant selection
•	Internal Notes Adoption - % of participants with notes
