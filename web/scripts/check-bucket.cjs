const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: buckets } = await supabase.storage.listBuckets();
    console.log("Buckets:", buckets ? buckets.map(b => b.name) : 'none');

    const docBucket = buckets?.find(b => b.name === 'documents');
    if (docBucket) {
        console.log("Documents bucket exists. Public:", docBucket.public);
    } else {
        console.log("Documents bucket NOT FOUND!");
    }
}

check();
