AGENZIA.BG DEAL ROOM
Archive Section & Standard Documents
Technical Specification Document
1. OVERVIEW
This document specifies the complete functionality, data structures, API endpoints, and user interface requirements for the Archive section of the Agenzia.bg real estate deal room platform. The Archive serves as a centralized document management hub with five key components:
1.	Standard Documents - Reusable document name templates
2.	Search All Documents - Cross-deal document search
3.	Pending Review - Approval queue for all deals
4.	Expiring Soon - Document expiration tracking
5.	Closed Deals - Historical document access
1.1 Key Design Principle
CRITICAL: Standard Documents are NOT actual file templates. They are standardized document names/labels used for consistency across deals. Lawyers cannot upload pre-made template files (e.g., blank ID forms, deed templates). These are simply common document names that appear as autocomplete suggestions when assigning document requirements to deal participants.
2. SYSTEM ARCHITECTURE
2.1 Database Schema
2.1.1 StandardDocument Model
interface StandardDocument {
  id: string;                    // UUID
  name: string;                  // e.g., 'Proof of Identity'
  description?: string;          // Optional helper text
  usageCount: number;            // Track frequency of use
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;             // User ID who created it
  isActive: boolean;             // Soft delete flag
}
2.1.2 DocumentRequirement Model (Updated)
Add to existing DocumentRequirement model:
interface DocumentRequirement {
  // ... existing fields ...
  standardDocumentId?: string;   // Reference to StandardDocument
  expirationDate?: Date;         // For tracking expiring docs
}
2.2 API Endpoints
2.2.1 Standard Documents Endpoints
GET /api/standard-documents
Purpose:
•	Retrieve all active standard documents
•	Used for autocomplete suggestions and management UI
Query Parameters:
•	search (optional) - Filter by name (case-insensitive)
•	sortBy (optional) - Sort field: 'name' | 'usageCount' | 'createdAt'
•	sortOrder (optional) - 'asc' | 'desc'
Response (200 OK):
{
  "data": [
    {
      "id": "uuid-1",
      "name": "Proof of Identity",
      "description": "ID card or passport",
      "usageCount": 47,
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-20T14:30:00Z"
    }
  ],
  "total": 15
}
POST /api/standard-documents
Purpose:
•	Create a new standard document name
Request Body:
{
  "name": "Power of Attorney",
  "description": "Legal document granting authority"
}
Validation:
•	name - Required, 3-100 characters, must be unique (case-insensitive)
•	description - Optional, max 500 characters
Response (201 Created):
{
  "id": "uuid-new",
  "name": "Power of Attorney",
  "description": "Legal document granting authority",
  "usageCount": 0,
  "createdAt": "2025-01-28T12:00:00Z",
  "updatedAt": "2025-01-28T12:00:00Z"
}
PUT /api/standard-documents/:id
Purpose:
•	Update an existing standard document name
Request Body:
{
  "name": "Proof of Identity (ID/Passport)",
  "description": "Updated description"
}
Response (200 OK):
Returns updated StandardDocument object
DELETE /api/standard-documents/:id
Purpose:
•	Soft delete a standard document (sets isActive = false)
Behavior:
•	Does not affect existing DocumentRequirements that reference this standard document
•	Removes from autocomplete suggestions
•	Hides from management UI
Response (204 No Content)
2.2.2 Autocomplete Endpoint
GET /api/document-suggestions
Purpose:
•	Provide autocomplete suggestions for document names
•	Combines Standard Documents + Previously Used Document Names
Query Parameters:
•	query (required) - Search term (min 1 character)
•	limit (optional) - Max results (default: 5)
Algorithm:
6.	Fuzzy search on StandardDocument names (prioritize exact prefix matches)
7.	If less than limit results, supplement with previously used document names from DocumentRequirements
8.	Return max limit results sorted by relevance
Response (200 OK):
{
  "suggestions": [
    {
      "name": "Proof of Identity",
      "source": "standard",  // 'standard' or 'history'
      "standardDocumentId": "uuid-1"
    },
    {
      "name": "Property Tax Receipt",
      "source": "history",
      "standardDocumentId": null
    }
  ]
}
2.2.3 Archive Aggregation Endpoints
GET /api/archive/pending-review
Purpose:
•	Get all documents with status 'pending' across all active deals
Response includes:
•	Document details (name, uploaded file, participant info)
•	Deal context (deal name, property address)
•	Upload date/time
•	Actions available (Approve, Deny, View)
GET /api/archive/expiring-soon
Purpose:
•	Get all documents expiring within the next 30 days
Query Parameters:
•	days (optional) - Number of days to look ahead (default: 30)
Logic:
•	Query DocumentRequirements where expirationDate is set and within date range
•	Sort by expirationDate (soonest first)
GET /api/archive/search
Purpose:
•	Cross-deal document search functionality
Query Parameters:
•	query - Search term (searches document names, deal names, participant names)
•	dealId (optional) - Filter by specific deal
•	participantId (optional) - Filter by specific participant
•	status (optional) - Filter by document status
•	dateFrom / dateTo (optional) - Date range filter
GET /api/archive/closed-deals
Purpose:
•	Access documents from deals with status 'closed' or 'archived'
Response includes:
•	Deal information (name, address, close date)
•	Document count per deal
•	Link to view full deal documentation
3. USER INTERFACE SPECIFICATIONS
3.1 Navigation
Update the main navigation sidebar to replace Documents with Archive:
📁 Archive
3.2 Archive Main Page
When user clicks Archive in the sidebar, display a page with five sections (tabs or cards):
3.2.1 Layout Structure
┌─────────────────────────────────────────────────────┐
│ 📁 ARCHIVE                                          │
├─────────────────────────────────────────────────────┤
│ [Standard Documents] [Search] [Pending] [Expiring] │
│ [Closed Deals]                                      │
├─────────────────────────────────────────────────────┤
│ [Active Section Content Displays Here]             │
│                                                     │
└─────────────────────────────────────────────────────┘
3.2.2 Standard Documents Tab (Default Active)
Header Section:
┌─────────────────────────────────────────────────────┐
│ 📋 Standard Documents              [+ Add Name]     │
│                                                     │
│ Manage your firm's common document names            │
│ 💡 These names appear as suggestions when adding    │
│    document requirements to deals.                  │
└─────────────────────────────────────────────────────┘
Table Columns:
9.	Document Name (sortable)
10.	Description (optional, truncated if long)
11.	Usage Count (sortable, shows 'Used X times')
12.	Actions (Edit, Delete buttons)
Example Row:
┌──────────────────────────────────────────────────┐
│ Proof of Identity    ID card or...   Used 47x    │
│                                     [Edit] [Delete]│
└──────────────────────────────────────────────────┘
3.2.3 Add/Edit Standard Document Modal
Clicking [+ Add Name] or [Edit] opens a modal:
┌──────────────────────────────────────────┐
│ Add Document Name                    [X] │
├──────────────────────────────────────────┤
│ Document Name *                          │
│ [________________________________]       │
│                                          │
│ Description (optional)                   │
│ [________________________________]       │
│ [________________________________]       │
│                                          │
│              [Cancel]  [Save]            │
└──────────────────────────────────────────┘
Validation:
•	Name required, 3-100 characters
•	Name must be unique (case-insensitive check)
•	Show error message inline if validation fails
3.2.4 Delete Confirmation
Clicking [Delete] shows confirmation dialog:
┌──────────────────────────────────────────┐
│ Delete Standard Document?                │
├──────────────────────────────────────────┤
│ Are you sure you want to delete          │
│ "Proof of Identity"?                     │
│                                          │
│ This will not affect existing documents, │
│ but will remove it from suggestions.     │
│                                          │
│         [Cancel]  [Delete]               │
└──────────────────────────────────────────┘
3.2.5 Autocomplete Component (in Add Document Requirement Modal)
Update the Add Document Requirement modal (shown in your screenshot) to include autocomplete on the Document Title field:
Behavior:
•	Start showing suggestions after 1 character typed
•	Debounce API calls by 200ms
•	Show max 5 suggestions in dropdown
•	Keyboard navigation (arrow keys, Enter to select, Escape to close)
•	Click to select suggestion
•	User can still type freely if no suggestions match
Visual Design:
Document Title: [Pro_____________]
               ┌─────────────────────────────┐
               │ 📋 Proof of Identity        │
               │ 📋 Proof of Ownership       │
               │ 📄 Property Tax Receipt     │
               └─────────────────────────────┘
Icons:
•	📋 = Standard Document (from template library)
•	📄 = Previously Used (from history)
3.2.6 Other Archive Tabs (High-Level Specs)
The following tabs have simpler UI requirements as they mostly display filtered lists of existing documents:
Pending Review Tab:
•	Table showing all documents with status 'pending'
•	Columns: Deal Name, Document Name, Participant, Uploaded Date, Actions
•	Actions: [View] [Approve] [Deny]
•	Clicking actions opens document modal (existing functionality)
Expiring Soon Tab:
•	Table showing documents with expirationDate within next 30 days
•	Columns: Deal Name, Document Name, Participant, Expiration Date, Days Until Expiry
•	Sort by expiration date (soonest first)
•	Color coding: Red if <7 days, Yellow if 7-14 days, Normal if >14 days
•	Action: [View Deal] link
Search All Documents Tab:
•	Search bar at top
•	Advanced filters: Deal, Participant, Status, Date Range
•	Results table with: Deal Name, Document Name, Participant, Status, Upload Date
•	Actions: [View] [Download]
Closed Deals Tab:
•	List of closed/archived deals
•	Columns: Deal Name, Property Address, Close Date, Document Count
•	Action: [View Documents] button opens deal page in read-only mode
4. IMPLEMENTATION GUIDE
4.1 Implementation Phases
Phase 1: Standard Documents Core (Priority: HIGH)
13.	Create StandardDocument database model
14.	Implement CRUD API endpoints for standard documents
15.	Build Standard Documents UI (table, add/edit modal, delete confirmation)
16.	Seed database with 15-20 common Bulgarian real estate documents
17.	Update navigation to replace 'Documents' with 'Archive'
Phase 2: Autocomplete Integration (Priority: HIGH)
18.	Implement /api/document-suggestions endpoint
19.	Build reusable Autocomplete component
20.	Integrate autocomplete into 'Add Document Requirement' modal
21.	Update DocumentRequirement model to include standardDocumentId reference
22.	Implement usage count tracking (increment on use)
Phase 3: Archive Aggregation Views (Priority: MEDIUM)
23.	Implement Pending Review tab and API endpoint
24.	Implement Expiring Soon tab and API endpoint
25.	Add expirationDate field to DocumentRequirement model
26.	Build expiration date picker in document requirement UI
Phase 4: Search & Historical Access (Priority: LOW)
27.	Implement Search All Documents tab
28.	Implement Closed Deals tab
29.	Add document export/download functionality
4.2 Standard Documents Seed Data
Pre-populate the database with these common Bulgarian real estate documents:
Document Name	Description
Proof of Identity	ID card or passport
Proof of Ownership (Notary Deed)	Notarized ownership document
Bank Statement	Recent bank account statement
Tax Return	Annual tax declaration
Proof of Funds	Evidence of available funds
Power of Attorney	Legal authorization document
Marriage Certificate	Official marriage documentation
Title Insurance	Property title insurance policy
Purchase Agreement	Sale and purchase contract
Property Appraisal	Professional property valuation
Building Permit	Construction authorization
Energy Performance Certificate	Energy efficiency rating
Cadastral Map	Official land survey map
Tax Clearance Certificate	Proof of tax compliance
Utility Bills	Recent utility statements
4.3 Testing Requirements
4.3.1 Unit Tests
•	StandardDocument CRUD operations
•	Autocomplete suggestion algorithm (fuzzy matching, prioritization)
•	Usage count increment logic
•	Unique name validation (case-insensitive)
4.3.2 Integration Tests
•	End-to-end flow: Add standard document → Use in autocomplete → Verify tracking
•	Delete standard document → Verify it disappears from autocomplete
•	Document requirement creation with standardDocumentId reference
4.3.3 UI Tests
•	Autocomplete keyboard navigation
•	Autocomplete click selection
•	Form validation error messages
•	Delete confirmation flow
4.4 Performance Considerations
•	Autocomplete API debouncing: 200ms
•	Database index on StandardDocument.name for fast search
•	Cache standard documents list on frontend (refresh on CRUD operations)
•	Lazy load Archive tabs (don't fetch all data on page load)
4.5 Security Considerations
•	Only authenticated lawyers/admins can manage standard documents
•	Validate all inputs server-side (don't rely on frontend validation alone)
•	Prevent SQL injection in search/autocomplete queries
•	Rate limit autocomplete API to prevent abuse
5. SUCCESS METRICS
Track these metrics to measure the success of the Standard Documents feature:
•	Autocomplete Usage Rate - % of document requirements created using autocomplete vs. free text
•	Document Name Consistency - Reduction in unique document names for the same document type
•	Time Savings - Average time to create a document requirement (target: <10 seconds)
•	Standard Document Adoption - % of deals using at least one standard document
•	Archive Section Usage - Number of weekly visits to each Archive tab
6. APPENDICES
6.1 Example API Response Payloads
GET /api/standard-documents (Full Response):
{
  "data": [
    {
      "id": "std-doc-001",
      "name": "Proof of Identity",
      "description": "ID card or passport",
      "usageCount": 47,
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-20T14:30:00Z",
      "createdBy": "user-123",
      "isActive": true
    },
    // ... more documents
  ],
  "total": 15,
  "page": 1,
  "pageSize": 20
}
6.2 Glossary
•	Standard Document - A reusable document name/label template (NOT an actual file)
•	Document Requirement - A specific document that must be uploaded by a participant for a deal
•	Autocomplete - UI component that suggests document names as user types
•	Usage Count - Number of times a standard document has been used across all deals
•	Soft Delete - Setting isActive=false instead of removing from database
END OF SPECIFICATION
