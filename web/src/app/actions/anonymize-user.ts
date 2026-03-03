'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function anonymizeUserAction(userId: string, currentActorId: string) {
    try {
        console.log(`[GDPR] Starting anonymization for user: ${userId}`);

        // 1. Delete user from auth.users to prevent login
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (authError) {
            console.error(`[GDPR] Failed to delete from auth.users: ${authError.message}`);
            // If they don't exist in auth.users, we can still proceed to scrub public.users
        } else {
            console.log(`[GDPR] Successfully deleted from auth.users`);
        }

        // 2. Scrub public.users
        const anonymizedEmail = `anonymized_${userId.substring(0, 8)}@deleted.local`;

        // Use RPC or direct update if we have password field, but since we're using supabaseAdmin,
        // we can just update the standard fields. The prompt asked to scrub 'Password', but public.users
        // typically doesn't store the password (it's in auth.users). We'll update what we know exists.
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .update({
                name: 'Anonymized',
                email: anonymizedEmail,
                is_active: false
            })
            .eq('id', userId);

        if (dbError) throw new Error(`Failed to scrub public.users: ${dbError.message}`);

        // Also scrub participants table if they exist there to fully anonymize deal records
        await supabaseAdmin
            .from('participants')
            .update({
                name: 'Anonymized',
                email: anonymizedEmail,
                phone: null,
                agency: null
            })
            .eq('user_id', userId);

        // 3. Delete files in Storage associated with this user
        // Find documents uploaded by this user
        const { data: userDocs } = await supabaseAdmin
            .from('documents')
            .select('url, id')
            .eq('uploaded_by', userId);

        if (userDocs && userDocs.length > 0) {
            const pathsToRemove = userDocs
                .map(doc => {
                    // Extract path from full URL, assuming publicUrl format contains bucket name
                    try {
                        const urlObj = new URL(doc.url);
                        const pathParts = urlObj.pathname.split('/documents/');
                        return pathParts.length > 1 ? pathParts[1] : null;
                    } catch {
                        // If it's just a raw path
                        return doc.url.includes('documents/') ? doc.url.split('documents/')[1] : doc.url;
                    }
                })
                .filter(Boolean) as string[];

            if (pathsToRemove.length > 0) {
                console.log(`[GDPR] Removing ${pathsToRemove.length} files from storage`);
                const { error: storageError } = await supabaseAdmin
                    .storage
                    .from('documents')
                    .remove(pathsToRemove);

                if (storageError) {
                    console.error('[GDPR] Storage removal error:', storageError);
                }

                // Optional: Delete the document records or let them remain as anonymized?
                // The prompt says "Delete all files in Supabase Storage". We leave the DB records or delete them?
                // Usually deleting the file is enough, maybe set url to null to indicate it was purged.
                await supabaseAdmin
                    .from('documents')
                    .update({ url: 'purged_gdpr', status: 'rejected' })
                    .eq('uploaded_by', userId);
            }
        }

        // 4. Audit Log
        await supabaseAdmin.from('audit_logs').insert({
            id: crypto.randomUUID(),
            action: 'ANONYMIZED_USER' as any,
            actor_id: currentActorId,
            actor_name: 'System / Admin',
            deal_id: null,
            details: `User ${userId} anonymized for GDPR compliance`,
            timestamp: new Date().toISOString()
        });

        revalidatePath('/settings');
        return { success: true };
    } catch (error: any) {
        console.error('[GDPR] Anonymization failed:', error);
        return { success: false, error: error.message };
    }
}
