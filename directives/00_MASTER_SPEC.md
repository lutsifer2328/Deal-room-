# MASTER SPECIFICATION: Deal Room by Agenzia (v3.1 - Unified & Complete)
**STATUS:** ACTIVE & CRITICAL. This document overrides ALL previous directives in the /archive folder.

---

## SECTION 1: DATABASE SAFETY & SCHEMA
**⚠️ CRITICAL SAFETY CLAUSE:**
* **DO NOT** run `DROP SCHEMA` or `DROP TABLE` on existing tables (Users, Deals).
* **DO** use `ALTER TABLE` to add new columns.
* **DO** create new tables if they do not exist.

### Required Schema Updates:
1.  **Users Table:** Add `requires_password_change` (Boolean, Default: False) - *Reserved for manual resets, not initial invite.*
2.  **Participants Table:** Add `functional_role` (String) to support "Dual Roles" (e.g., Admin acting as Broker).
3.  **Roles Enum:** Add `'bank_representative'`.
4.  **New CRM Tables:**
    * `public.client_contracts` (id, user_id, file_url, uploaded_at, uploaded_by).
    * `public.client_notes` (id, user_id, content, created_at, author_id).
    * `public.document_templates` (id, name_bg, name_en, description, is_active).

---

## SECTION 2: UI VISUAL BLUEPRINTS (Based on Approved Designs)

### 2.1 Login Screen (Ref: 1A.jpg)
* **Layout:** Centered White Card on Dark Gradient Background.
* **Content:** Logo top, Title "Welcome Back", Email/Password inputs, Teal "Sign In" button.
* **Footer:** "New here? Contact administrator" (No registration link). "Forgot Password?" (Standard flow).

### 2.2 The Sidebar (Ref: image_1b9438.jpg)
* **Style:** Dark Sidebar (`bg-slate-900`).
* **Logic:**
    * **Internal (Admin/Staff):** See Full Menu (Deal Room, Archive, Participants, Finances, Settings).
    * **External (Client/Bank):** See ONLY "Deal Room". All other tabs are hidden from DOM.

### 2.3 Dashboard & Documents (Ref: image_1b9438.jpg)
* **Layout:** Center: "Required Documents" List. Right: "Deal Information" Panel.
* **Document Card:** Shows Owner Name, Document Name, Status Pill (Pending/Verified).
* **Transparency:** ALL participants see the card/status (Metadata).
* **Privacy:** ONLY the owner (or authorized Staff) can Upload/Download (Content).

### 2.4 Modals & Forms
* **Manage Participants (Ref: image_1baaa4.png):**
    * **Granular Privacy:** Checkboxes: "Select which roles' documents this person CAN view" (Buyer/Seller/Agent).
* **Add Participant (Ref: image_1c1763.png):**
    * **Smart Detection:** Input email -> AJAX check. If exists: Show "User Found" card + "Link User" button.
    * **Toggle:** `[ External Client ]` OR `[ Internal Team Member ]`.
    * **Internal Mode:** Dropdown of existing staff. Assigns a "Functional Role" (e.g., Broker).

### 2.5 Archives & Library (Ref: image_1cf498.jpg)
* **Tabs:** Standard Documents, Search All, Pending Review, Expiring Soon, Closed Deals.
* **Function:** "Standard Documents" list is pulled from the DB (`document_templates`).

### 2.6 Settings / Staff (Ref: image_1c9ae2.jpg)
* **Table:** Name, Role, Status, Created Date.
* **Actions:** Edit, Deactivate (Soft Delete), Delete (Hard Delete - blocked if user has history).

---

## SECTION 3: CORE LOGIC & PERMISSIONS

### 3.1 Unified Authentication (Simpler & Safer)
* **Philosophy:** "Identity First, Permissions Second."
* **The Invitation (One Flow):**
    * **New Users (Staff OR Client):** System sends an **Activation Link** (Supabase Magic Link).
    * **User Action:** Click Link -> Redirect to `/update-password` -> User sets their permanent password -> Dashboard.
    * **Existing Users:** System detects email exists. No invite sent. User simply gains access to the new resource (Deal or Team).
* **The Guardrail:**
    * **Internal Status:** Defined ONLY by the `users.role` column (Admin/Staff).
    * **External Status:** Defined by the `participants` table.

### 3.2 Role-Based Access Control (RBAC)
* **Rule:** `Global_Role` (Admin/Staff) > `Deal_Role`.
* **Scenario:** If an Admin assigns themselves as a "Broker" on a deal, they **MUST RETAIN** full Admin access (Settings, Finances) because their Global Role overrides the deal constraint.

### 3.3 Data Integrity (Zero Data Loss)
* **Transactional Saves:** UI shows Spinner until DB returns 200 OK.
* **Auto-Save:** Long forms use `onBlur` autosave.
* **Staff History:** Deactivated staff appear as "FORMER STAFF" in CRM. Never delete their historical deal association.

### 3.4 Admin Recovery
* **Safety Net:** Include a `restore_admin.sql` script in documentation to force-restore Admin privileges via Supabase if accidentally revoked.

### 3.5 Returning Participant Logic (Smart Linking)
* **Duplicate Detection:** The "Add Participant" form must query the `users` table via AJAX upon email entry.
    * **If Match Found:** Display "User exists in CRM" alert. Auto-fill Name/Phone fields.
* **Re-Activation:** If an existing user was previously "Deactivated" (Soft Deleted), adding them to a new deal **AUTOMATICALLY** sets `is_active = TRUE` and restores login access.
* **Notification Logic:**
    * **New User:** Send "Activation Link" (Set Password).
    * **Existing User:** Send "New Deal Access" notification (Login Link). Do NOT send a registration token.

## SECTION 4: PHASED RELEASE STRATEGY

### 4.1 Phase 1: Internal Alpha (Current)
**Goal:** Verify "Happy Paths" and Security.
*   **Audience:** Internal Admins & Developers only.
*   **Critical Path Verification:**
    *   Creates Deal (Admin) - **Verified**.
    *   Invite Staff (Admin) - **In Progress (Blocked by 403)**.
    *   Invite External (Agent/Buyer) - **In Progress**.
    *   Upload Documents (Lawyer) - **Verified**.
*   **Security Audit:**
    *   Review RLS policies for `deals` (Done), `participants`, `tasks`.
    *   Ensure API Routes use `SERVICE_ROLE_KEY` for admin actions.

### 4.2 Phase 2: Limited Beta
**Goal:** Real-world data entry & UX feedback.
*   **Audience:** 1 Trusted Attorney, 1 Real Estate Agent.
*   **Tasks:**
    *   Monitor Supabase logs for errors.
    *   Validate data integrity (no orphan records).

### 4.3 Phase 3: General Availability
**Goal:** Production Operations.
*   **Tasks:**
    *   Finalize Prod Config (`NEXT_PUBLIC_SITE_URL`).
    *   Enable Point-in-Time Recovery (PITR).
    *   Handover Admin Documentation.

---

## APPENDIX A: ADMIN USER GUIDE

# Deal Room Admin Guide

## 1. User Management (Staff & Clients)

### Inviting New Users
1.  Navigate to **Settings** -> **Team**.
2.  Click **"Add Member"**.
3.  Enter Email.
    *   **New User**: System sends an email with a link to set their password.
    *   **Existing User**: System adds them to the team instantly.

### Deactivating Staff
1.  Navigate to **Settings** -> **Team**.
2.  Click the "Three Dots" menu next to a user -> **Deactivate**.
    *   **Result**: User can no longer log in.
    *   **History**: Their name remains on past deals as "Former Staff".

---

## 2. Deal Management

### Creating a Deal
1.  Dashboard -> **"+ New Deal"**.
2.  Enter Title (e.g., "Malinova Dolina") and Address.
3.  **Important**: You are automatically assigned as the "Broker/Admin" for this deal.

### Managing Participants
1.  Open Deal -> **"Manage Participants"**.
2.  Add Buyer/Seller:
    *   Enter Email.
    *   Select **Reference Type** (Buyer vs Seller).
    *   System checks if they exist in the global database.

### Closing a Deal
1.  Open Deal -> **Status Dropdown** -> **Close**.
2.  Add closure notes (e.g., "Successfully signed on 12/12/2026").
3.  **Result**: Deal moves to "Archive". Documents are locked (read-only).

---

## 3. Troubleshooting

### User "Cannot Login"
1.  Check if they are **Deactivated** in Settings.
2.  Ask them to check **Spam** for the invitation email.
3.  If all else fails, use the **manual "Resend Invite"** button (if available) or the **Recovery Script**.

### "I didn't receive the email"
1.  Verify the email address is correct in the **Team** or **Participants** list.
2.  Check the "Resend" logs (if you have access) or ask the technical team to check the API logs.
3.  Emails come from `invites@resend.dev` (or your custom domain). Whitelist this address.

### "I don't see the deal"
*   **Buyers/Sellers**: Ensure they are added to the **Participants List** for that specific deal.
*   **Staff**: Ensure they are either an Admin (sees all) or assigned to the deal.

