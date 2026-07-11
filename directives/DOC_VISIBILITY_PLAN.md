# Deal Room — Document Visibility & Deal Authority
## Build Plan (for sign-off before implementation)

Status: DRAFT — awaiting product-owner approval. No live-database changes until approved.

---

## 1. Principles (the model we agreed)

1. **Progress is transparent.** Every participant can see the *names of the documents expected* of each party and their *status* (outstanding / uploaded / approved / rejected). The whole table sees who's provided what and who's holding things up.
2. **Content is Agenzia-gated.** The actual file opens only when Agenzia opens it — decided **per document, per participant**. Default is **closed** to counterparties.
3. **You always keep your own uploads.** A participant can always open a file they themselves submitted.
4. **Agenzia hosts the room.** Only Agenzia staff make the rules (set grants, advance stages). Guests — clients, outside lawyers — are subject to the gate.
5. **No one hosts a deal they're a party in.** A staff member who joins a deal as a buyer/seller is *recused* on that deal only (guest there), keeping full authority everywhere else.

---

## 2. Authority model: global staff vs. deal host

Today "staff" is one global switch (`is_staff()`), which grants full access to **every** deal. We split it into two levels:

- **Global staff** — unchanged. Governs the admin panel, user management, the cross-deal index, and every deal the person is **not** a party in.
- **Deal host** — new. `is_deal_host(deal) = is_staff() AND NOT recused_from(deal)`. This is the check that guards a *specific* deal's content and controls.

**Recusal** (`recused_from(deal)`) is true when the staff member holds a **party seat** on that deal:
- Auto-recused for party roles: **buyer, seller, bank_representative** (final list = open decision #1).
- Plus a manual **"recuse" switch** on the participant record for edge cases a role label doesn't capture.
- Fail-safe: a staff-member-as-party defaults to **recused (closed)**; granting host access is always a deliberate act.

Professional seats (Agenzia lawyer/agent/notary acting for the deal) are **not** party seats → they keep host authority. An outside client's lawyer has no Agenzia staff account at all → guest.

---

## 3. Two visibility layers

### Layer A — Progress (transparent to all deal participants)
Comes from **tasks/requirements**, which already hold: the expected document name, who it's expected from, and a status. We ensure every deal participant can see the deal's requirement list + statuses (names + status only — never file content). This is the "round-table awareness."

### Layer B — Content (gated)
The uploaded **file** (preview/download). Served only to:
- the **deal host** (Agenzia staff not recused on this deal), OR
- the **uploader** (their own file), OR
- a participant with an explicit **grant** for that document.

Everything else sees the progress (Layer A) but cannot open the file.

---

## 4. Data model changes (additive)

**4a. New table `public.document_grants`**
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| document_id | uuid → documents(id) on delete cascade | |
| participant_id | uuid → participants(id) on delete cascade | the grantee |
| granted_by | uuid → users(id) | who opened it (audit) |
| granted_at | timestamptz default now() | |

Unique `(document_id, participant_id)`. A row = "this participant may open this document."

**4b. New column `public.deal_participants.recused boolean` (default false)**
Marks a participant as recused from host authority on that deal. Auto-set true when a staff user is added in a party role; also settable manually.

**4c. No new field for progress** — the expected-document names already live on `tasks`.

---

## 5. Database functions & RLS

**New/updated `SECURITY DEFINER` functions (locked down like the others):**
- `is_deal_host(deal_uuid)` → `is_staff() AND NOT (caller is a recused/party participant in deal_uuid)`
- `can_open_document(doc_uuid)` → `is_deal_host(doc.deal) OR doc.uploaded_by = auth.uid() OR EXISTS grant(doc, current_participant_id())`

**Policy changes:**
- `documents` (content/row): replace the blanket `is_staff()` all-access with `is_deal_host(...)`, plus uploader, plus grant — so a recused staff member no longer reads their own deal's counterparty files.
- `document_grants`: insert/delete allowed to **deal host only**; select to host + the grantee.
- `tasks` (progress): ensure deal participants can read requirement names + status for their deal (Layer A).
- **Content enforcement in `getDocumentSignedUrl`**: add an explicit `can_open_document` check *before* signing, so the 60-second URL is only ever minted for someone allowed to open the file (defence in depth, not just row RLS).

---

## 6. Invite guard & role cleanup (folds in audit item #3)

- Inviting an external participant **never** assigns a global staff role. External invitees get a defined **guest** role (proposal: reuse `viewer`), never admin/lawyer/staff.
- Only an Agenzia admin can grant a global staff role, via Settings (already staff-only after the API-auth fix).
- Clean up the stray `user` role (Tommy's account) → map to the guest role; block the invite path from ever minting `user` again.

---

## 7. Attorney control surface (UI)

- **Per-document access control** in the deal review view: on each uploaded document, a "Who can open this" checklist of the deal's participants. Tick = grant, untick = revoke. Every change **audit-logged**.
- **Shortcuts**: "Open to the whole buyer side", "Open to all participants" — same power, less clicking.
- **Recusal**: adding a staff member in a party role auto-recuses them with a visible "Recused — party to this deal" badge; a manual recuse toggle in participant management.
- **Progress board**: confirm the requirements view shows expected-document names + status to all participants.

---

## 8. Migration, backfill & rollback

- **Migration** (idempotent, additive): create `document_grants`, add `deal_participants.recused`, create the two functions, update the policies.
- **Backfill (no surprises):** for every document currently visible under today's rules (status `released`/`shared`), create grants for the deal's current active participants — so migrating does **not** suddenly hide anything people could already see. New uploads after migration follow the default-closed rule.
- **Rollback notes:** drop `document_grants`, drop the `recused` column, drop the new functions, restore the prior `documents` policies (kept verbatim in the migration file). Purely reversible.

---

## 9. Testing (before deploy)

On the audit branch + local, against the live project, verify:
- A **non-granted** participant **cannot** fetch a file (signed-URL request denied) — the core security assertion.
- A **granted** participant can; an **uploader** can always open their own.
- A **deal host** sees all content in that deal.
- A **recused staff** member (party) **cannot** open the counterparty's content in their own deal, but retains full access to their *other* deals + admin panel.
- **Progress** (requirement names + status) is visible to all deal participants throughout.
- Security regression added to `scripts/security-regression.ts`.

---

## 10. Phasing

- **Phase A** — DB migration (grants table, recused column, functions, policies) + backfill + invite guard + role cleanup.
- **Phase B** — content enforcement in `getDocumentSignedUrl` + document RLS.
- **Phase C** — attorney UI (grant control + recusal) + progress board.
- **Phase D** — live test, then deploy.

---

## 11. Open decisions (need your answer before Phase A)

1. **Party roles that auto-recuse** — confirm: buyer, seller, bank_representative. (Add/remove any?)
2. **Progress detail** — show requirement *name + status* only (recommended), or also expose that N files were uploaded / their count?
3. **Backfill** — grant currently-released documents to current participants on migrate, so nothing is hidden retroactively (recommended)?
4. **Guest role name** — reuse existing `viewer`, or introduce an explicit `guest` / `external` role?
