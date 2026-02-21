DEAL ROOM BY AGENZIA — MASTER BIBLE (v6.0)

Status: ACTIVE & CRITICAL — This document overrides all prior specs, notes, and /archive content.
Audience: Antigravity (implementation agent), developers, and you (product owner).
Primary Goal: A secure, production-grade multi-tenant “Deal Room” where each user sees only what they are allowed to see, with a clean workflow: Admin creates deal → adds participants → assigns tasks → participants upload → staff review approve/reject → status updates.

0) NON-NEGOTIABLE SAFETY RULES (DO NOT BREAK PROGRESS)
0.1 No destructive DB operations on production project

DO NOT run DROP SCHEMA, DROP TABLE, or “reset database” on the current project unless explicitly instructed by you.

DO use ALTER TABLE / CREATE TABLE IF NOT EXISTS / additive migrations only.

DO create new columns/tables when needed, and backfill safely.

0.2 Migration discipline

Every DB change must be delivered as:

SQL migration (idempotent where possible),

Rollback notes (how to undo safely),

Verification queries (prove it worked).

0.3 Security discipline

No “Allow all access for anon/authenticated” policies on sensitive tables, ever.

RLS must be ON for all multi-tenant tables before participant logins are considered “working”.

Storage access must be authorization-based, not link-based.

1) PRODUCT WORKFLOW (SOURCE OF TRUTH)
1.1 Happy-path workflow

Admin creates a Deal (title, address, value, optional reference number).

Admin adds Participants (buyers/sellers/brokers/agents/lawyers/notary/bank reps).

If email already exists, system recognizes it (repeat participant / multi-deal user).

Deal is created immediately after participants are confirmed.

System sends invite link(s):

New users receive an activation link → set password → access deal.

Existing users receive “new deal access” notification (no registration token).

Admin assigns Tasks to specific participants: “Please upload X document.”

Participant logs in → sees tasks → uploads document.

Admin/Lawyer reviews:

Approve → task becomes complete.

Reject → must include reason, task remains pending.

Participants see document/task status in real-time (Pending / Uploaded / Approved / Rejected).

1.2 Permissions UX rules (must match DB enforcement)

Participants may see metadata (document cards and statuses) depending on permission model.

Participants may download only if explicitly granted.

Staff (admin/lawyer/staff) have full operational access (with global role overriding deal role).

2) ROLES & PERMISSIONS MODEL
2.1 Global roles (users.role)

admin

lawyer (treated as fully privileged like admin)

staff

viewer deprecated (do not use)

Global role overrides deal constraints. If an admin assigns themselves as “broker” on a deal, they retain admin rights.

2.2 Deal participant roles (participants.functional_role or deal_participants.role)

External-facing: buyer, seller, agent, broker, attorney, notary, bank_representative

Internal staff may also appear as participants for workflow reasons (functional role).

2.3 Document access permissions (granular)

Per participant, per deal, we support:

can_view_all_documents (boolean)

can_download_documents (boolean)

Optional future: role-based view (buyer docs, seller docs, etc.)

Key principle: Permissions are server-derived and stored; never trust client-submitted privilege values.

3) DATA MODEL (CANONICAL)

Your current schema is close, but the master bible defines the canonical intent and required corrections.

3.1 Core tables

public.users — internal staff + global roles + profile

public.participants — external identities and linkage to users (repeat users)

public.deals — deal header + status

public.deal_participants — membership junction + per-deal permission JSON

public.tasks — requested documents/work items assigned to participant

public.documents — uploaded artifacts + review status + storage path + linkage to task/deal/participant

public.audit_logs — append-only events

public.client_notes — notes, staff-only

public.standard_documents — document templates / library

Optional: public.agency_contracts — contracts, staff-only

3.2 Required schema improvements (must implement)

These are “must” because they eliminate security holes and unblock workflow.

A) public.users.id must align with auth.users.id

Must: public.users.id is the same UUID as auth.users.id.

public.users.id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE

If you keep public.users separate but not linked, you will constantly fight auth mismatches.

B) Email normalization

Must: use CITEXT or a normalized unique constraint to prevent duplicates by case.

C) Tasks must link to participant

Right now tasks.assigned_to is text. That’s a correctness and security risk.

Must change:

Add tasks.assigned_participant_id UUID NULL REFERENCES participants(id) ON DELETE SET NULL

(Optionally keep assigned_to as display field, but do not use it for auth logic)

D) Documents must store storage path, not public URL

Right now you have documents.url text. If that’s a direct URL, it becomes a leak vector.

Must change:

Add documents.storage_path text NOT NULL

Keep url only if it’s a short-lived signed URL (prefer not storing at all).

E) Documents should record owner/actor participant

To enforce “who uploaded what” and role-based access, store:

documents.owner_participant_id UUID NULL REFERENCES participants(id)

F) Review status model

Keep/extend documents.status:

private (uploaded but not released)

shared (released/visible based on permission)
Or use a second column:

review_status: pending_review, approved, rejected

Must: Rejection reason stored and visible to uploader.

4) STORAGE ARCHITECTURE (CANONICAL)
4.1 Bucket

Bucket name: documents

Bucket must be PRIVATE (public=false) ✅ you already have this.

4.2 Storage path format (MANDATORY)

Your current design uses deal_id root and task_id subfolder.

Canonical path:

documents/{deal_id}/{task_id}/{document_id}-{sanitized_filename}


Rules:

{deal_id} must be a UUID

{task_id} must be a UUID

{document_id} must be UUID

Filename must be sanitized (no slashes)

4.3 Client upload reality

You confirmed the app currently uploads from the browser:

supabase.storage.from('documents').upload(...) client-side

Therefore: Storage RLS policies must be correct now (not “later”).

5) SECURITY (ABSOLUTE REQUIREMENTS)
5.1 RLS status must be corrected

Your current RLS status shows critical tables with RLS disabled:

❌ deal_participants RLS disabled

❌ participants RLS disabled

❌ tasks RLS disabled

❌ users RLS disabled

❌ standard_documents RLS disabled

Must: Enable RLS ON for all multi-tenant / sensitive tables:

users, participants, deal_participants, tasks, documents, deals, standard_documents, client_notes, agency_contracts, audit_logs

5.2 Remove dangerous policies

You currently have policies like:

“Enable all access for anon”

“Enable anon read/insert/update”

“Enable all access for authenticated”

Must: Delete/disable them from documents, participants, users, deal_participants, tasks, agency_contracts, client_notes.

These policies are incompatible with a deal-room security model.

5.3 Helper functions pattern (avoid recursion)

RLS policies must not query RLS tables directly in subqueries if it causes recursion.

Use SECURITY DEFINER helper functions with locked-down permissions.

5.4 Lock down SECURITY DEFINER functions

Every security definer function must have:

SECURITY DEFINER

SET search_path = public

REVOKE ALL ON FUNCTION ... FROM PUBLIC

Grant execute only to postgres, and optionally service_role

RLS policies can still call the function.

6) CANONICAL PERMISSION RULES (DB-ENFORCED)
6.1 Identity & membership

Define “deal member”:

A user is a deal member if there exists a participant row linked to them (participants.user_id = auth.uid()) AND a deal_participants row linking that participant to the deal.

6.2 Staff definition

Staff is:

users.role IN ('admin','lawyer','staff') AND users.is_active = true

6.3 Who can see what (summary)

Staff:

Can view/manage all deals, participants, tasks, documents.
Participant:

Can view deals they are in.

Can view tasks assigned to them (or in their deal if you choose).

Can upload to storage only inside their deal/task folder.

Can view/download documents depending on permissions.

7) RLS POLICIES (CANONICAL SET)

Note: This bible provides the intended policy logic. Implementation must match your exact columns after migrations.

7.1 Functions (pseudo-SQL)

Create helper functions:

public.is_staff() → boolean

public.current_participant_id() → UUID (or NULL)

public.is_deal_member(deal_id uuid) → boolean

public.can_view_document(doc_id uuid) → boolean

public.can_download_document(doc_id uuid) → boolean

Must be SECURITY DEFINER and locked down.

7.2 public.users policies

Staff can read all users.

Any logged-in user can read their own profile.

Updates restricted (likely staff-only, plus self profile fields if desired).

No anon access.

7.3 public.participants

Staff: all.

Participant: can read their own participant record.

Participant: can read other participants in same deal only if “see peers” is enabled (optional).

No anon access.

7.4 public.deal_participants

Staff: all.

Participant: can read memberships for their deal (or only theirs).

No anon access.

7.5 public.deals

Staff: all.

Participant: select only deals they are a member of.

No anon access.

7.6 public.tasks

Staff: all.

Participant: select tasks assigned to their participant_id (or tasks within their deal if you choose).

Participant: cannot arbitrarily update tasks (only staff updates status/assignment).

No anon access.

7.7 public.documents

Staff: all.

Participant:

select document metadata if they are in the deal (optional)

insert only if they are deal member and the owner_participant_id is themselves (enforce with WITH CHECK)

update only limited fields (e.g., participant cannot approve/reject)

Absolutely no anon policies.

8) STORAGE RLS (CANONICAL, BULLETPROOF)
8.1 Why your current storage policies are unsafe

Your storage policy list includes {public} role entries (“Give users authenticated access to folder flreew_*”) — those are effectively public/anon and must be removed.

8.2 Storage policy goal

Only authenticated users can:

list/download objects if they are a deal member of {deal_id}

upload objects only into {deal_id}/{task_id}/... where they are a deal member
Optionally: require that they are the assigned participant for that {task_id}.

8.3 UUID crash protection (MANDATORY)

Any policy that casts folder name to UUID must guard with regex first.

8.4 Canonical storage.objects policies (logic)

For storage.objects:

SELECT: bucket is documents, first folder is UUID, user is deal member

INSERT: bucket is documents, first folder is UUID, user is deal member, and path contains {task_id} UUID

UPDATE/DELETE: typically staff-only, or uploader-only if required

9) API ARCHITECTURE (MANDATORY PATTERN)
9.1 Two Supabase clients rule

User client (anon key + user JWT) for authorization checks and DB reads/writes under RLS.

Service role client ONLY for:

auth admin actions (create user, invite)

generating signed URLs (if you move to signed downloads)

rare background maintenance

Never use service role to read documents/tasks/participants for authorization decisions.

9.2 Upload handling (given current client uploads)

Because uploads happen client-side:

Storage RLS must enforce access

After upload, client writes a documents row (RLS-enforced)

Staff reviews by updating the document row + task status

9.3 Optional hardening (recommended next)

Move to:

server-side signed URL generation for downloads

server-side upload signing (or server uploads)
But this is Phase 2 if you want to keep momentum.

10) UI / UX BEHAVIOR (WHAT USERS WILL EXPERIENCE)
10.1 Admin / Lawyer / Staff

Full sidebar: Deal Room, Archive, Participants, Finances, Settings

Create deal → add participants (existing email recognized)

Manage participants: edit, permissions, resend invite

Assign tasks per participant

Review uploads: approve/reject with reason

10.2 Participant (external)

Sidebar shows ONLY Deal Room (hidden from DOM).

Sees:

their deals

tasks for the deal (or tasks assigned to them)

document cards + statuses (if enabled)

Can upload required docs

Can see “Pending review / Approved / Rejected (with reason)”

Can download only if permitted

10.3 “What changes after security is implemented”

Participants will stop seeing anything they shouldn’t.

Some screens may show less until staff grants permission.

If something breaks, it will be 403 or empty lists (that’s expected during policy tightening).

11) AUDIT LOGGING (MINIMUM REQUIRED)

Every critical action should append:

deal created

participant added/removed

invite sent/resend

task created/updated

document uploaded

document approved/rejected

permission changed

Audit rows should be insert-only:

allow authenticated insert (or staff-only insert)

select staff-only (recommended)

12) INVITATION & ACCOUNT LIFECYCLE (CANONICAL)
12.1 One unified invitation flow

New user:

create auth user

create public.users row

create participants row (if external)

send activation/magic link → /update-password

Existing user:

do NOT create new auth user

link them to participant + deal membership

send “you have access” email

12.2 Deactivation behavior

Staff deactivation: set users.is_active = false

Deactivated users cannot log in or access deals.

Reactivation: adding them to a deal or re-enabling in settings sets is_active = true

13) PHASED DELIVERY PLAN (HOW ANTIGRAVITY MUST IMPLEMENT)
Phase 1 — Security foundation (must happen first)

Add missing columns (tasks assigned_participant_id, documents storage_path, etc.)

Create helper functions (security definer, locked down)

Remove dangerous policies

Enable RLS table-by-table in safe order:

users → participants → deal_participants → tasks → verify deals/documents → standard_documents

Fix storage.objects policies (remove {public} rules)

Acceptance criteria:

External user cannot list other deals/participants/tasks/documents

External user can upload only within their deal/task folder

Admin still sees everything

Phase 2 — Workflow correctness (UPDATED — Master Change Request)

CRITICAL RULE: "Invite Participant" ≠ "Add Participant"

- "Add Participant" = create/link a participants row + deal_participants link (already exists)
- "Invite Participant" = ensure the full chain: participants row → deal_participants link → auth.users account → participants.user_id linked → invitation email sent → invitation_status updated

2a) Idempotent Invite Endpoint: POST /api/participants/invite

The server-only endpoint must perform ALL of these steps in order:
1. Staff auth check (reject if caller is not staff)
2. Ensure participants row exists (find by email, create if missing)
3. Ensure deal_participants link exists (create if missing, do NOT throw "User already in deal")
4. Ensure auth.users account exists (create via supabaseAdmin.auth.admin.createUser if missing)
5. Link participants.user_id = auth_user.id (update if was NULL)
6. Send invite email / resend email (magic link or recovery link)
7. Update participants.invitation_status = 'invited' (or 'resent')
8. Return success — NEVER throw error for "already exists" scenarios

2b) UI Invite Button

- The "Invite" button in the UI must call POST /api/participants/invite
- Must show success toast even when resending to an already-invited participant
- Must NOT show "User already in deal" error — the endpoint is idempotent

2c) Task Assignment Wiring

- When creating a task, tasks.assigned_participant_id must be populated by matching the assigned_to email against participants.email
- If no matching participant exists, assigned_participant_id = NULL (secure — participant won't see task until linked)
- This is critical for RLS task visibility (tasks_assignee_read policy)

2d) Audit Logging (server-side only)

- Client-side audit log inserts are blocked by RLS (no INSERT policy on audit_logs)
- logAction must use POST /api/audit-log (service_role) instead of direct DB insert
- audit_logs fetch re-enabled for staff via audit_logs_staff_select policy

2e) Phase 2 Acceptance Criteria (BLOCKS Phase 3)

DO NOT proceed to Phase 3 until ALL of these pass:

✅ A participant who accepts invite and sets password can log in and see their deal(s)
✅ Participant sees ONLY tasks where assigned_participant_id matches their participant row
✅ Participant can upload to storage path {deal_id}/{task_id}/… without 403
✅ Invite button works for both new and existing linked participants (resend works, no errors)
✅ Admin still sees all deals, tasks, participants, documents after all changes
✅ Audit log entries are created via server-side API route

Phase 3 — Hardening & polish

Signed URLs for downloads

Rate limiting

Virus scanning (optional)

Full audit log UI (optional)

14) TESTING (MANDATORY CHECKLIST)
14.1 Create test identities

Admin

Lawyer

Staff

Buyer participant

Seller participant

14.2 Critical path tests

Admin creates deal + adds buyer/seller

Buyer logs in → sees only their deal

Admin creates task assigned to buyer

Buyer uploads doc → document row created

Admin reviews → approve

Buyer sees approved status

Buyer attempts to view seller-only doc → blocked (403/empty)

Admin grants download permission → buyer can download

14.3 Security regression tests

Anonymous tries to list deals/documents → blocked

Authenticated external tries to query participants globally → blocked

External tries to upload to other deal folder → blocked

External tries to update review fields → blocked

15) CURRENT STATE DIAGNOSIS (WHAT IS WRONG TODAY)

Based on what you shared:

RLS is OFF on users, participants, deal_participants, tasks, standard_documents → this is a showstopper.

You have many overly broad policies (“anon all access”, “authenticated all access”) → incompatible with a deal room.

Storage policies include {public} rules and broad authenticated read/write → dangerous.

Uploads occur client-side → storage RLS must be correct immediately.
