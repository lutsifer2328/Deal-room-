// Mock Email Service
// TODO: Replace with real email service (Resend, SendGrid, etc.) when deploying

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
