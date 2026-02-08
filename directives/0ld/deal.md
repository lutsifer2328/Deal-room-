Core Philosophy: "The Neutral Judge" — Eliminating transaction stress through bilingual transparency and rigorous legal oversight.
________________________________________
1. THE USER HIERARCHY & ROLES
To maintain neutrality, the system uses a strictly tiered permission model:
•	Agency Admin: Full "God Mode" access. Owns the deal room and can oversee all sides.
•	Agency Lawyer (The Gatekeeper): The only role authorized to "Verify & Release" documents. They control the firewall between the Buyer and Seller.
•	Agents: Can manage the timeline and upload documents on behalf of their specific clients (Proxy Upload).
•	Participants (Clients/External Lawyers/Banks): Limited access. They only see what the Agency Lawyer explicitly releases to them.
________________________________________
2. CORE FUNCTIONALITIES
A. The Dual-Lane Timeline
A visual, step-by-step roadmap (Onboarding → Doc Collection → Signing → Handover → Closed). The UI shows separate progress for the Buyer and Seller sides.
B. The "Verify & Release" Mechanism
The heart of the system.
1.	Private State: Uploaded docs are invisible to the counterparty.
2.	Review State: Lawyer reviews the document.
3.	Release State: Lawyer clicks a button to toggle visibility.
o	Option A (Status Only): Counterparty sees the task is done but cannot open the file.
o	Option B (Full Release): Counterparty can download the file (for deeds, sketches, etc.).
C. The Custom Requirement Injector
The Lawyer can manually add unique tasks (e.g., "Divorce Decree" or "Special Permit") on the fly, assigning them to a specific party with custom instructions in both Bulgarian and English.
________________________________________
3. TECHNICAL ARCHITECTURE & SECURITY
A. Database & Storage
•	Storage: Encrypted S3-compatible buckets in an EU region (GDPR compliance).
•	Database: PostgreSQL with Row-Level Security (RLS). No user can query data outside their assigned deal_room_id.
•	Bilingual Schema: Every title/task field must support _bg and _en suffixes.
B. The Immutable Audit Log
Every single action is recorded:
•	Who viewed/uploaded/approved?
•	When (Timestamp)?
•	What was the specific action? This log is read-only and serves as the legal "Black Box" of the transaction.
________________________________________
4. THE NOTARY BUNDLE (THE OUTPUT)
At the end of the deal, the system generates a professional ZIP export:
•	Structured Folders: 01_Identity, 02_Property, 03_Financials, 04_Legal.
•	Master Index: A bilingual PDF summary with the Agenzia logo, listing every document and its verification timestamp.
________________________________________
5. AI VIBE-CODING SKILL (PROMPT)
Copy and paste this into Antigravity, Cursor, or Windsurf:
Role: Senior Full-Stack Engineer & Security Architect. Task: Build "Deal Room" for agenzia.bg. Logic: > 1. Implement a "Gatekeeper" permission model. All uploads stay private until the Agency Lawyer toggles can_view for the counterparty. 2. Support Privacy-Aware Custom Docs: Lawyer must be able to verify a task is done without necessarily sharing the file content. 3. Build a bilingual (BG/EN) UI with a "Dual-Lane" timeline for Buyer/Seller tasks. 4. Enable "Proxy Uploads" for Agents. 5. Create an automated "Notary Bundle" export (ZIP + Bilingual PDF Index). Tech Stack: Next.js, Tailwind CSS, Supabase with RLS enabled.
________________________________________
6. VISUAL DESIGN PROMPT (UI/UX)
Use this in v0.dev or Midjourney:
"High-fidelity Desktop UI for 'Deal Room'. Branding: agenzia.bg (Midnight Blue, Gold, Teal). Features: Bilingual toggle, vertical progress map, and a 'Lawyer Review' dashboard. The aesthetic is 'Neutral Judge'—authoritative, clean, and high-trust. Show a split-screen progress tracker for a real estate transaction."
________________________________________
7. BILINGUAL REJECTION REASONS
•	Image Quality: "Unreadable copy." / "Нечетливо копие."
•	Expired: "Document expired." / "Изтекъл срок."
•	Missing Signature: "Missing signature." / "Липсва подпис."
Additional information: just take whatever is not repetative or anything you can build on. 
Detailed Functional Modules
1. The "Neutral Judge" Dashboard (Admin/Lawyer)
The core oversight engine where the Agency Lawyer manages the "Firewall."

Dual-Lane View: A split-screen showing the Buyer’s progress and Seller’s progress side-by-side.

Verification Queue: A staging area for all new uploads. Items remain "Private" until the Lawyer clicks Verify & Release.

Custom Task Injector: A tool for the Lawyer to add non-standard requirements (e.g., "Foreign Divorce Decree") on the fly, with bilingual titles and descriptions.

2. The "Success Path" Portal (Client/Participant)
A mobile-first experience designed to eliminate the "What's happening?" anxiety.

Vertical Timeline: A clear path from Onboarding to Closing. Completed steps are green; the current step pulses.

Privacy-Aware Icons: If a document is verified but sensitive, the client sees a "Checkmark" (Status) but the "Download" button is locked (Privacy Firewall).

The "Action Card": If a document is rejected, a high-priority card appears at the top with the Lawyer's reason in their preferred language.

3. The Proxy Upload System (Agent)
Allows your staff to assist clients without bypassing legal security.

Collaborative Upload: Agents can upload files for their clients.

Attribution Tracking: The system logs: "Uploaded by Agent Ivan on behalf of Seller Maria."

4. Gated Multi-Channel Communication
Public Thread: General updates for all parties.

Legal Channel: A restricted space only for the Agency Lawyer and external legal counsels.

Internal Notes: A hidden channel for Agency staff only.

🔒 III. Security & Data Architecture
Philosophy: Data is locked by logic, not just by passwords.

Database: PostgreSQL with Row-Level Security (RLS). No user can access a file unless their participant_id matches the deal_id and the permissions table grants view_access.

Storage: AWS S3 (EU-Frankfurt Region) with AES-256 encryption at rest.

Audit Log: An immutable "Black Box" that records:

Actor (Who)

Action (Uploaded/Viewed/Released/Downloaded)

Timestamp (When - to the millisecond)

IP Address (Where)

📂 IV. The Notary Bundle (Final Output)
The ultimate CX differentiator. At the end of the deal, one click generates:

A Structured ZIP: Folders: 01_Identity, 02_Property, 03_Financials, 04_Legal.

Bilingual Master Index (PDF): A professional cover sheet with the Agenzia.bg logo, listing every document, its issue date, and the "Lawyer Verified" timestamp.

🤖 V. The "Vibe Coding" Skill Set
Copy and paste the text below into your AI tool (Antigravity/Cursor):

System Skill: Deal Room Architect Identity: Senior Full-Stack Developer for agenzia.bg. Task: Build a bilingual (BG/EN) transaction portal with a "Neutral Judge" permission model. Mandatory Logic:

Permission Firewall: Documents uploaded by one side are HIDDEN from the counterparty by default. Only the Agency Lawyer role can trigger release_visibility.

Metadata Privacy: Support a state where a task is marked VERIFIED (visible) but the file remains LOCKED (not downloadable) for the counterparty.

Bilingual Schema: Every title/instruction field must support _bg and _en.

Proxy Upload: Allow the Agent role to upload to a Client's task, maintaining an audit trail of the uploader.

Export Engine: Build a function to zip all APPROVED files into categorized folders with a bilingual PDF index cover page. Design Vibe: Midnight Blue, Teal, and Gold. High-end, clean, and authoritative.
