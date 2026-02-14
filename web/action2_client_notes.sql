-- ACTION 2: Create Missing "Client Notes" Table
-- Internal CRM notes for participants, visible only to staff/admin.

CREATE TABLE public.client_notes (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  participant_id uuid NOT NULL,
  content text NOT NULL,
  is_pinned boolean DEFAULT false,
  created_by uuid NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT client_notes_pkey PRIMARY KEY (id),
  CONSTRAINT client_notes_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES participants (id) ON DELETE CASCADE,
  CONSTRAINT client_notes_created_by_fkey FOREIGN KEY (created_by) REFERENCES users (id)
) TABLESPACE pg_default;

-- Security: Only Internal Staff/Admins can see notes
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view/edit notes" ON client_notes
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'staff', 'lawyer', 'broker')
  )
);
