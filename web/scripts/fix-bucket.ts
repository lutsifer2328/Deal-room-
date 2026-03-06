import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixBucket() {
    console.log("Checking storage buckets...");
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
        console.error("Error listing buckets:", bucketsError);
        return;
    }

    console.log("Existing buckets:", buckets.map(b => b.name));

    const bucketName = 'documents';
    if (!buckets.find(b => b.name === bucketName)) {
        console.log(`Bucket '${bucketName}' not found. Creating...`);
        const { data, error } = await supabase.storage.createBucket(bucketName, {
            public: false,
            fileSizeLimit: 52428800, // 50MB
        });

        if (error) {
            console.error(`Failed to create bucket '${bucketName}':`, error);
        } else {
            console.log(`Successfully created bucket '${bucketName}'.`);
        }
    } else {
        console.log(`Bucket '${bucketName}' already exists.`);
    }

    // Set up storage policies just in case
    const { error: sqlError } = await supabase.rpc('execute_sql', {
        query: `
      -- Create policies for storage.objects if they don't exist
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload documents') THEN
          CREATE POLICY "Authenticated users can upload documents" 
          ON storage.objects FOR INSERT 
          TO authenticated 
          WITH CHECK (bucket_id = 'documents');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can read documents') THEN
          CREATE POLICY "Authenticated users can read documents" 
          ON storage.objects FOR SELECT 
          TO authenticated 
          USING (bucket_id = 'documents');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can update documents') THEN
          CREATE POLICY "Authenticated users can update documents" 
          ON storage.objects FOR UPDATE 
          TO authenticated 
          USING (bucket_id = 'documents');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can delete documents') THEN
          CREATE POLICY "Authenticated users can delete documents" 
          ON storage.objects FOR DELETE 
          TO authenticated 
          USING (bucket_id = 'documents');
        END IF;
      END
      $$;
    `
    });
    if (sqlError) {
        // If we don't have execute_sql RPC, we might just have to inform the user to do it
        console.log("Could not run storage policies setup automatically, it might already be fine or need manual setup.");
    } else {
        console.log("Storage policies verified/applied.");
    }
}

fixBucket().catch(console.error);
