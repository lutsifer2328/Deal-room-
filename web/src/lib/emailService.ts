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

export async function sendInvitationEmail(
    to: string,
    name: string,
    dealTitle: string,
    dealAddress: string,
    role: string,
    inviterName: string,
    token: string
): Promise<boolean> {
    // Generate invitation URL
    const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/invite/${token}`;

    // Create email template
    const email: EmailTemplate = {
        to,
        subject: `You've been invited to "${dealTitle}"`,
        html: generateInvitationHTML(name, dealTitle, dealAddress, role, inviterName, inviteUrl),
        text: generateInvitationText(name, dealTitle, dealAddress, role, inviterName, inviteUrl)
    };

    // Mock email sending - log to console with preview
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 INVITATION EMAIL SENT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`To: ${email.to}`);
    console.log(`Subject: ${email.subject}`);
    console.log('');
    console.log('Email Content:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(email.text);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n🔗 Invitation Link: ${inviteUrl}\n`);

    // TODO: Uncomment when deploying with real email service
    /*
    try {
        await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(email)
        });
        return true;
    } catch (error) {
        console.error('Failed to send email:', error);
        return false;
    }
    */

    return true; // Mock success
}

function generateInvitationHTML(
    name: string,
    dealTitle: string,
    dealAddress: string,
    role: string,
    inviterName: string,
    inviteUrl: string
): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0C3B2E; color: white; padding: 30px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; background: #30A189; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>AGENZIA</h1>
            <p>Real Estate Deal Room</p>
        </div>
        <div class="content">
            <h2>Hi ${name},</h2>
            <p>${inviterName} has invited you to participate in a real estate deal as <strong>${role.toUpperCase()}</strong>.</p>
            
            <p><strong>Deal Details:</strong></p>
            <ul>
                <li>Title: ${dealTitle}</li>
                <li>Property: ${dealAddress}</li>
                <li>Your Role: ${role}</li>
            </ul>
            
            <p>Click the button below to set up your account and get started:</p>
            
            <p style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}" class="button">Accept Invitation</a>
            </p>
            
            <p style="font-size: 12px; color: #666;">
                Or copy this link: ${inviteUrl}
            </p>
        </div>
        <div class="footer">
            <p>© 2026 Agenzia. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
}

function generateInvitationText(
    name: string,
    dealTitle: string,
    dealAddress: string,
    role: string,
    inviterName: string,
    inviteUrl: string
): string {
    return `
Hi ${name},

${inviterName} has invited you to participate in a real estate deal as ${role.toUpperCase()}.

Deal Details:
- Title: ${dealTitle}
- Property: ${dealAddress}
- Your Role: ${role}

Click here to set up your account and get started:
${inviteUrl}

---
© 2026 Agenzia. All rights reserved.
    `.trim();
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<boolean> {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 PASSWORD RESET EMAIL (Mock)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`To: ${email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // TODO: Replace with real email service
    return true;
}

/**
 * Send staff invitation email with login credentials using Resend
 */
export async function sendStaffInviteEmail(
    to: string,
    name: string,
    email: string,
    password: string,
    role: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login`;

    // If Resend is not configured, fall back to console logging
    if (!resend) {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 STAFF INVITATION EMAIL (Mock - Resend not configured)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`To: ${to}`);
        console.log(`Name: ${name}`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log(`Role: ${role}`);
        console.log(`Login URL: ${loginUrl}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        return { success: true };
    }

    // ALWAYS log for testing purposes, especially in dev mode or free tier
    console.log('\n===== 📨 OUTGOING EMAIL (Staff) =====');
    console.log(`To: ${to}`);
    console.log(`Password: ${password}`);
    console.log('=====================================\n');

    try {
        const { data, error } = await resend.emails.send({
            from: 'Agenzia Deal Room <onboarding@resend.dev>',  // Using Resend test domain for now
            to: [to],
            subject: 'Welcome to Agenzia Deal Room',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 8px 8px 0 0; }
                        .header h1 { color: #00b4d8; margin: 0; font-size: 24px; }
                        .header p { color: #00b4d8; margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; }
                        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px; }
                        .credentials { background: #f8f9fa; border-left: 4px solid #00b4d8; border-radius: 6px; padding: 20px; margin: 20px 0; }
                        .credentials p { margin: 10px 0; }
                        .credentials strong { color: #1a1a2e; }
                        .credentials code { background: #e9ecef; padding: 2px 6px; border-radius: 3px; font-family: monospace; color: #495057; }
                        .button { display: inline-block; background: #00b4d8; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
                        .footer { text-align: center; color: #6c757d; font-size: 14px; margin-top: 30px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>DEAL ROOM</h1>
                            <p>Powered by Agenzia</p>
                        </div>
                        <div class="content">
                            <h2 style="color: #1a1a2e;">Welcome, ${name}!</h2>
                            <p>You have been added to Agenzia Deal Room as <strong>${role}</strong>. Your account has been created and is ready to use.</p>
                            
                            <div class="credentials">
                                <p><strong>Email:</strong> <code>${email}</code></p>
                                <p><strong>Temporary Password:</strong> <code>${password}</code></p>
                            </div>
                            
                            <p><strong>Important:</strong> For security reasons, please change your password after logging in for the first time. You can do this from the Settings page.</p>
                            
                            <div style="text-align: center;">
                                <a href="${loginUrl}" class="button">Log In Now</a>
                            </div>
                            
                            <p style="font-size: 14px; color: #6c757d; margin-top: 30px;">If you didn't expect this invitation, please contact your administrator.</p>
                        </div>
                        <div class="footer">
                            <p>© 2026 Agenzia. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        });

        if (error) {
            console.error('❌ Resend email error:', error);
            return { success: false, error: error.message };
        }

        console.log('✅ Staff invitation email sent successfully:', data?.id);
        return { success: true, messageId: data?.id };
    } catch (error: any) {
        console.error('❌ Email service error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send external invitation email with magic link using Resend
 */
export async function sendExternalInviteEmail(
    to: string,
    actionLink: string,
    role: string,
    dealId?: string // Optional context
): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // If Resend is not configured, fall back to console logging
    if (!resend) {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 EXTERNAL INVITATION EMAIL (Mock)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`To: ${to}`);
        console.log(`Role: ${role}`);
        console.log(`Action Link: ${actionLink}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        return { success: true };
    }

    // ALWAYS log for testing purposes
    console.log('\n===== 📨 OUTGOING EMAIL (External) =====');
    console.log(`To: ${to}`);
    console.log(`Action Link: ${actionLink}`);
    console.log('========================================\n');

    try {
        const { data, error } = await resend.emails.send({
            from: 'Agenzia Deal Room <invites@resend.dev>', // Use separate sender if needed
            to: [to],
            // TODO: Inject Deal ID if relevant
            subject: `Action Required: You have been invited to Agenzia Deal Room`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #0C3B2E; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px; }
                        .button { display: inline-block; background: #30A189; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
                        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>AGENZIA</h1>
                            <p>Real Estate Deal Room</p>
                        </div>
                        <div class="content">
                            <h2>You've been invited!</h2>
                            <p>You have been invited to participate in a transaction on Agenzia Deal Room as <strong>${role}</strong>.</p>
                            
                            <p>To access the deal room and set up your secure account, please click the button below. This link acts as your secure key.</p>
                            
                            <div style="text-align: center;">
                                <a href="${actionLink}" class="button">Activate Account & Set Password</a>
                            </div>
                            
                            <p style="font-size: 14px; color: #6c757d; margin-top: 30px;">
                                <strong>Note:</strong> This link will expire in 24 hours. If it expires, request a new invitation from your administrator.
                            </p>
                        </div>
                        <div class="footer">
                            <p>© 2026 Agenzia. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });

        if (error) {
            console.error('❌ Resend email error:', error);
            return { success: false, error: error.message };
        }

        console.log('✅ External invitation email sent successfully:', data?.id);
        return { success: true, messageId: data?.id };
    } catch (error: any) {
        console.error('❌ Email service error:', error);
        return { success: false, error: error.message };
    }
}

