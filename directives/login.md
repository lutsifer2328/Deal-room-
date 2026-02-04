System Specification: Deal Room by Agenzia

1. System Architecture & Access Logic
The platform operates on a closed, invite-only ecosystem. Access is gated by two distinct entry points:

A. External Client Portal
* **Onboarding:** Users cannot register; they must be invited into a specific Deal ID.
* **Invitation Flow (Token-Based):** External invites utilize a Password-Set Token. The "Action Link" leads to a secure route where the user establishes their credentials for the first time. Invites do NOT contain a password.
* **Multi-Deal Visibility:** A single email address can be associated with multiple Deal IDs. Upon login, the user sees a dashboard containing only the deals they are participants in.
* **Identifier:** Every transaction is tracked via a unique Deal ID / Reference Number.

B. Internal Management Portal (Settings)
* **Onboarding:** Internal staff are added via the System Settings menu.
* **Invitation Flow (Credential-Based):** Internal staff receive a system-generated password via email.
* **Force Password Change:** The system enforces a mandatory password change on first login. The UI redirects to `/settings/security/update-password` and blocks all other requests until completed.
* **Global Visibility:** internal Roles (Admin, Lawyer, Staff) can view a "Global Index" of all active deals, regardless of participation.
* **Self-Assignment:** Admins, Lawyers, and Staff can "self-assign" to any deal from the Global Index to become an active participant.

2. Role-Based Access Control (RBAC)

**Internal Roles (The Facilitators)**
* **Admin:** Full System Access.
* **Lawyer:** Full Deal Management Access.
* **Staff:** Operational Access.
    *   *Restrictions:* Cannot Manage Users, Close Deals, Edit Timeline, or Export Data, even on self-assigned deals.

| Feature | Admin | Lawyer | Staff |
| :--- | :---: | :---: | :---: |
| Global Deal Index Visibility | Yes | Yes | Yes |
| Self-Assign to Deals | Yes | Yes | Yes |
| Manage Users | Yes | Yes | No |
| Create Deals | Yes | Yes | Yes |
| Edit Deals | Yes | Yes | Yes |
| Close Deals | Yes | Yes | No |
| Manage Documents | Yes | Yes | Yes |
| Edit Timeline | Yes | Yes | No |
| Export Data | Yes | Yes | No |

**External Roles (The Participants)**
External users are assigned one of the following functional labels upon being added to a Deal ID:
*   Buyer / Seller
*   Broker (Agent)
*   Attorney / Notary
*   Bank Representative

3. Communication & Email Templates

*   **Template 1: External Deal Invitation**
    *   *Subject:* Action Required: You have been added to Deal #[Deal_ID] | Deal Room by Agenzia
    *   *Body:* "You have been invited to participate in a new transaction via Deal Room by Agenzia. Deal Details: Reference #[Deal_ID], Role: [Role]. Click below to activate your account and set your password."
    *   *Action:* Link to `/auth/setup-password?token=...`

*   **Template 2: Internal Staff Onboarding**
    *   *Subject:* Welcome to the Team | Your Deal Room Internal Credentials
    *   *Body:* "An internal account has been created for you as [Role]. Temporary Password: [Generated_Password]. You will be required to change this password immediately upon first login."

*   **Template 3: Password Recovery (Global)**
    *   *Subject:* Reset your Deal Room by Agenzia password
    *   *Body:* "A request was made to reset your password. This link expires in 60 minutes."

4. Compliance & Legal Footers
*   **General:** Confidentiality notice stating the email is intended only for the addressee.
*   **Internal:** Security protocol reminder that all internal actions are logged and audited.
*   **External:** Access disclaimer stating visibility is strictly limited to the specific Deal ID assigned.

5. Required Technical Components
*   **Login Page:** Dual-purpose login (Internal/External) with "Forgotten Password" functionality.
*   **Deal Dashboard:** A list view for users with multiple Deal IDs.
*   **Global Deal Index:** Internal-only registry for "Self-Assignment".
*   **Settings Module:** An internal-only interface for Admins/Lawyers to provision new Staff accounts.


