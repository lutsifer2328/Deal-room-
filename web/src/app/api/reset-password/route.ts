import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Generate a recovery link via Supabase admin API
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dealroom.online';
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${siteUrl}/auth/callback`
      }
    });

    if (linkError) {
      console.error('Failed to generate recovery link:', linkError.message);
      // Don't reveal whether the user exists or not for security
      return NextResponse.json({ success: true });
    }

    const actionLink = linkData?.properties?.action_link;
    if (!actionLink) {
      console.error('No action_link returned');
      return NextResponse.json({ success: true });
    }

    // Fetch user name for the email template
    const { data: user } = await supabaseAdmin.from('users').select('name').eq('email', email).single();
    const userName = user?.name || 'User';

    // Send via Resend with our branded template
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const { Resend } = await import('resend');
      const resend = new Resend(resendApiKey);

      // Build a recovery-specific email using the branded template
      const { data, error } = await resend.emails.send({
        from: 'Agenzia Deal Room <notify@dealroom.online>',
        to: [email],
        subject: 'Reset Your Password — Agenzia Deal Room',
        html: getResetPasswordEmailHtml({ name: userName, actionLink })
      });

      if (error) {
        console.error('❌ Resend error:', error);
      } else {
        console.log(`✅ Reset password email sent via Resend to ${email} (ID: ${data?.id})`);
      }
    } else {
      console.log('📧 [MOCK] Reset password link for', email, ':', actionLink);
    }

    // Always return success (don't reveal if user exists)
    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getResetPasswordEmailHtml({ name, actionLink }: { name: string; actionLink: string }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.8; color: #1a1a1a; background-color: #f8fafc; margin: 0; padding: 0; }
    .wrapper { padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden; }
    .content { padding: 50px 60px; }
    h1 { font-size: 22px; font-weight: 600; color: #0f172a; margin-bottom: 30px; letter-spacing: -0.02em; }
    p { margin-bottom: 20px; font-size: 15px; color: #475569; }
    .button-container { margin: 40px 0; text-align: left; }
    .button { background-color: #0f172a; color: #ffffff !important; padding: 16px 40px; text-decoration: none; border-radius: 2px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block; }
    .footer { padding: 40px; background: #f8fafc; text-align: left; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    .dual-lang { border-top: 1px solid #f1f5f9; margin-top: 40px; padding-top: 40px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div style="background-color: #11141b; padding: 40px 20px; text-align: center;">
        <img src="https://dealroom.online/email-badge.png" alt="DEAL ROOM - POWERED BY AGENZIA" style="height: 180px; width: auto; display: inline-block;">
      </div>
      <div class="content">
        <h1>Password Reset Request</h1>
        
        <p>Hello <strong>${name}</strong>,</p>
        <p>We received a request to reset the password for your <strong>Agenzia Deal Room</strong> account. Click the button below to set a new password:</p>

        <div class="button-container">
          <a href="${actionLink}" class="button">Reset Password</a>
        </div>

        <p style="font-size: 13px; color: #94a3b8;">If you did not request a password reset, you can safely ignore this email. This link will expire in 24 hours.</p>

        <div class="dual-lang">
          <h1>Нулиране на парола</h1>
          <p>Здравейте, <strong>${name}</strong>,</p>
          <p>Получихме заявка за нулиране на паролата на вашия акаунт в <strong>Agenzia Deal Room</strong>. Натиснете бутона по-долу, за да зададете нова парола:</p>
          
          <div class="button-container">
            <a href="${actionLink}" class="button">Нулирай Паролата</a>
          </div>

          <p style="font-size: 13px; color: #94a3b8;">Ако не сте заявили нулиране, може спокойно да игнорирате този имейл.</p>
        </div>
      </div>
      <div class="footer">
        © 2026 AGENZIA. All rights reserved.<br>
        This communication is confidential. Sent via our secure infrastructure at dealroom.online.
      </div>
    </div>
  </div>
</body>
</html>`;
}
