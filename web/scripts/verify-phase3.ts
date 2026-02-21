import dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

import { rateLimit } from '../src/lib/limiter.ts';

// Mock suite for verification
async function runVerification() {
    console.log('Starting Phase 3 Verification...');
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'MISSING');
    console.log('Service Key:', (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY) ? 'OK' : 'MISSING');

    // 1. Test Rate Limiter Logic
    console.log('\nTesting Rate Limiter...');
    const testKey = `test:${Date.now()}`;

    // Should succeed 5 times (limit 5)
    for (let i = 0; i < 5; i++) {
        const res = await rateLimit(testKey, 5, 20); // shortened window for test
        if (!res.ok) console.error(`❌ Iteration ${i + 1} FAILED:`, res);
        else console.log(`✅ Iteration ${i + 1}: OK, Remaining: ${res.remaining}`);
    }

    // Should fail on 6th
    const failRes = await rateLimit(testKey, 5, 20);
    if (!failRes.ok) console.log('✅ Iteration 6: BLOCKED (Expected)');
    else console.error('❌ Iteration 6: SUCCEEDED (Unexpected)');

    console.log('\nVerification Complete.');
}

runVerification().catch(console.error);
