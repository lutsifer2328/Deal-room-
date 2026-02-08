// Email Service using Resend
import { Resend } from 'resend';

// Initialize Resend client (will be undefined if API key not set)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface EmailTemplate {
    to: string;
    subject: string;
    html: string;
    text: string;
}

/**
 * Unified Invitation Email (Staff & External)
 * Sends a magic link for the user to set their password and log in.
 */
export async function sendInviteEmail(
    to: string,
    name: string,
    actionLink: string,
    role: string,
    dealTitle?: string,
    isExistingUser: boolean = false
): Promise<{ success: boolean; messageId?: string; error?: string }> {

    // If Resend is not configured, fall back to console logging
    if (!resend) {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 MOCK EMAIL (Resend Not Configured)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`To: ${to}`);
        console.log(`Role: ${role}`);
        console.log(`Link: ${actionLink}`);
        console.log(`Type: ${isExistingUser ? 'New Deal Notification' : 'Welcome/Invite'}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        return { success: true };
    }

    console.log(`\n===== 📨 SENDING EMAIL VIA RESEND (${to}) =====`);

    const subject = isExistingUser
        ? `New Deal Access: ${dealTitle || 'Agenzia Deal Room'}`
        : `Welcome to Agenzia Deal Room`;

    const headline = isExistingUser
        ? `You've been added to a new deal`
        : `Welcome, ${name}!`;

    const bodyText = isExistingUser
        ? `You have been granted access to <strong>${dealTitle || 'a new deal'}</strong> as <strong>${role}</strong>.`
        : `You have been invited to Agenzia Deal Room as <strong>${role}</strong>. Please set up your account to get started.`;

    const buttonText = isExistingUser
        ? `View Deal`
        : `Activate Account & Set Password`;

    try {
        const { data, error } = await resend.emails.send({
            from: 'Agenzia Deal Room <invites@resend.dev>', // Update this when you have a custom domain
            to: [to],
            // bcc: ['admin@agenzia.com'], // Optional: Audit log
            subject: subject,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a2e; }
                        .container { max-width: 600px; margin: 0 auto; padding: 0; }
                        .header { background: #0f172a; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                        .logo { font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #14b8a6; }
                        .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; }
                        .button { display: inline-block; background: #0d9488; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; text-align: center; margin: 25px 0; }
                        .footer { text-align: center; padding: 30px; color: #64748b; font-size: 13px; }
                        .role-badge { background: #f0f9ff; color: #0369a1; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 0.9em; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="logo">AGENZIA</div>
                            <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">DEAL ROOM</div>
                        </div>
                        <div class="content">
                            <h2 style="margin-top: 0; color: #0f172a;">${headline}</h2>
                            <p>${bodyText}</p>
                            
                            <!-- Deal Context -->
                            ${dealTitle ? `
                            <div style="background: #f8fafc; border-left: 4px solid #0d9488; padding: 15px; margin: 20px 0;">
                                <div style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: bold;">Deal</div>
                                <div style="font-size: 16px; font-weight: 600; color: #0f172a;">${dealTitle}</div>
                            </div>
                            ` : ''}

                            <div style="text-align: center;">
                                <a href="${actionLink}" class="button">${buttonText}</a>
                            </div>

                            <p style="font-size: 14px; color: #64748b; margin-top: 30px;">
                                <strong>Security Note:</strong> This link is valid for 24 hours. Do not share it with anyone.
                            </p>
                        </div>
                        <div class="footer">
                            <p>© 2026 Agenzia Deal Room. All rights reserved.</p>
                            <p>If you did not expect this invitation, please ignore this email.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });

        if (error) {
            console.error('❌ Resend API Error:', error);
            return { success: false, error: error.message };
        }

        console.log(`✅ Email sent successfully! ID: ${data?.id}`);
        return { success: true, messageId: data?.id };

    } catch (error: any) {
        console.error('❌ Email Service Exception:', error);
        return { success: false, error: error.message };
    }
}

