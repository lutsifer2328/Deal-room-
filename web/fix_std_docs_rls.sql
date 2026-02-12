ALTER TABLE standard_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON standard_documents;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON standard_documents;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON standard_documents;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON standard_documents;

CREATE POLICY "Enable read access for all users" ON standard_documents
    FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON standard_documents
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON standard_documents
    FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON standard_documents
    FOR DELETE
    USING (auth.role() = 'authenticated');

SELECT count(*) as total_docs FROM standard_documents;
