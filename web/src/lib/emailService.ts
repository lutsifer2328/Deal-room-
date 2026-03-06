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

  try {
    const { data, error } = await resend.emails.send({
      from: 'Agenzia Deal Room <notify@dealroom.online>',
      to: [to],
      subject: subject,
      html: getEliteEmailHtml({
        name: name,
        actionLink: actionLink,
      })
    });

    if (error) {
      console.error('❌ Resend API Error:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Email sent successfully! ID: ${data?.id}`);
    return { success: true, messageId: data?.id };

  } catch (error: any) {
    console.error('❌ Email Service Exception:', error);
    return { success: false, error: error?.message || String(error) };
  }
}

export function getEliteEmailHtml({
  name,
  actionLink,
}: {
  name: string;
  actionLink: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.8; color: #1a1a1a; background-color: #f8fafc; margin: 0; padding: 0; }
    .wrapper { padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden; }
    .header { padding: 50px 40px; text-align: left; border-bottom: 1px solid #f1f5f9; }
    .logo-img { height: 40px; width: auto; }
    .content { padding: 50px 60px; }
    h1 { font-size: 22px; font-weight: 600; color: #0f172a; margin-bottom: 30px; letter-spacing: -0.02em; }
    h3 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #14b8a6; margin-top: 40px; margin-bottom: 10px; }
    p { margin-bottom: 20px; font-size: 15px; color: #475569; }
    .dual-lang { border-top: 1px solid #f1f5f9; margin-top: 40px; padding-top: 40px; }
    .button-container { margin: 50px 0; text-align: left; }
    .button { background-color: #0f172a; color: #ffffff !important; padding: 16px 40px; text-decoration: none; border-radius: 2px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block; }
    .footer { padding: 40px; background: #f8fafc; text-align: left; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    .legal { line-height: 1.4; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div style="background-color: #11141b; padding: 40px 20px; text-align: center;">
        <img src="https://dealroom.online/email-badge.png" alt="DEAL ROOM - POWERED BY AGENZIA" style="height: 180px; width: auto; display: inline-block;">
      </div>
      <div class="content">
        <h1>Private Deal Room Invitation</h1>
        
        <p>Hello <strong>${name}</strong>,</p>
        <p>You have been invited to the <strong>Agenzia Deal Room</strong> — an exclusive, high-security environment for the management of your property portfolio.</p>

        <h3>The Experience</h3>
        <p>This is your digital concierge. Access verified documents, track deal milestones, and manage sensitive communications in one centralized, encrypted hub.</p>

        <h3>Security First</h3>
        <p>Your privacy is our priority. This sovereign environment ensures that all data remains confidential and protected by industry-leading security protocols.</p>

        <div class="button-container">
          <a href="${actionLink}" class="button">Access Deal Room</a>
        </div>

        <div class="dual-lang">
          <h1>Покана за достъп</h1>
          <p>Здравейте, <strong>${name}</strong>,</p>
          <p>Каним Ви в <strong>Agenzia Deal Room</strong> — Вашата частна и сигурна среда за професионално управление на имотни трансакции.</p>
          
          <h3>Какво е Deal Room?</h3>
          <p>Вашият дигитален център за документация и проследяване на сделки в реално време, далеч от несигурността на стандартната кореспонденция.</p>

          <h3>Сигурност</h3>
          <p>Сигурността на Вашите данни е наш приоритет. Платформата използва криптирана архитектура, гарантираща пълна конфиденциалност.</p>
          
          <div class="button-container">
            <a href="${actionLink}" class="button">Активирай достъп</a>
          </div>
        </div>
      </div>
      <div class="footer">
        <div class="legal">
          © 2026 AGENZIA. All rights reserved.<br>
          This communication is confidential. Sent via our secure infrastructure at dealroom.online.
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Staff-Specific Invitation Email
 * Focuses on Management & Ease of Use rather than Security.
 */
export async function sendStaffInviteEmail(
  to: string,
  name: string,
  actionLink: string,
  role: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {

  if (!resend) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 MOCK STAFF EMAIL (Resend Not Configured)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`To: ${to}`);
    console.log(`Role: ${role}`);
    console.log(`Link: ${actionLink}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return { success: true };
  }

  console.log(`\n===== 📨 SENDING STAFF EMAIL VIA RESEND (${to}) =====`);

  const subject = "Your New Command Center: Agenzia Deal Room | Вашият нов команден център: Agenzia Deal Room";

  try {
    const { data, error } = await resend.emails.send({
      from: 'Agenzia Deal Room <notify@dealroom.online>',
      to: [to],
      subject: subject,
      html: getStaffEmailHtml({
        name: name,
        actionLink: actionLink,
      })
    });

    if (error) {
      console.error('❌ Resend API Error:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Staff Email sent successfully! ID: ${data?.id}`);
    return { success: true, messageId: data?.id };

  } catch (error: any) {
    console.error('❌ Email Service Exception:', error);
    return { success: false, error: error?.message || String(error) };
  }
}

export function getStaffEmailHtml({
  name,
  actionLink,
}: {
  name: string;
  actionLink: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.8; color: #1a1a1a; background-color: #f8fafc; margin: 0; padding: 0; }
    .wrapper { padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden; }
    .header { padding: 50px 40px; text-align: left; border-bottom: 1px solid #f1f5f9; }
    .logo-img { height: 40px; width: auto; }
    .content { padding: 50px 60px; }
    h1 { font-size: 22px; font-weight: 600; color: #0f172a; margin-bottom: 30px; letter-spacing: -0.02em; }
    h3 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #14b8a6; margin-top: 40px; margin-bottom: 10px; }
    p { margin-bottom: 20px; font-size: 15px; color: #475569; }
    .dual-lang { border-top: 1px solid #f1f5f9; margin-top: 40px; padding-top: 40px; }
    .button-container { margin: 50px 0; text-align: left; }
    .button { background-color: #0f172a; color: #ffffff !important; padding: 16px 40px; text-decoration: none; border-radius: 2px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block; }
    .footer { padding: 40px; background: #f8fafc; text-align: left; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    .legal { line-height: 1.4; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div style="background-color: #11141b; padding: 40px 20px; text-align: center;">
        <img src="https://dealroom.online/email-badge.png" alt="DEAL ROOM - POWERED BY AGENZIA" style="height: 180px; width: auto; display: inline-block;">
      </div>
      <div class="content">
        <h1>Private Deal Room Invitation</h1>
        
        <p>Hello <strong>${name}</strong>,</p>
        <p>You have been invited to the <strong>Agenzia Deal Room</strong> — your secure portal for managing the agency's property portfolio.</p>

        <h3>Effortless Management</h3>
        <p>Stop chasing paperwork. Manage documents, track approvals, and view your entire portfolio in one high-performance dashboard.</p>

        <h3>Real-Time Intelligence</h3>
        <p>Get instant notifications when clients upload documents or complete tasks. Close deals faster with zero friction.</p>

        <div class="button-container">
          <a href="${actionLink}" class="button">Access Your Dashboard</a>
        </div>

        <div class="dual-lang">
          <h1>Покана за достъп</h1>
          <p>Здравейте, <strong>${name}</strong>,</p>
          <p>Каним Ви в <strong>Agenzia Deal Room</strong> — Вашият сигурен портал за управление на портфейла с имоти на агенцията.</p>
          
          <h3>Лесно управление</h3>
          <p>Спрете да търсите документи. Управлявайте файлове, проследявайте одобрения и вижте целия си портфейл в едно високопроизводително табло.</p>

          <h3>Интелигентност в реално време</h3>
          <p>Получавайте незабавни известия, когато клиентите качват документи или изпълняват задачи. Сключвайте сделки по-бързо и без излишно напрежение.</p>
          
          <div class="button-container">
            <a href="${actionLink}" class="button">Достъп до вашето табло</a>
          </div>
        </div>
      </div>
      <div class="footer">
        <div class="legal">
          © 2026 AGENZIA. All rights reserved.<br>
          This communication is confidential. Sent via our secure infrastructure at dealroom.online.
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Task Assigned Notification
 */
export async function sendTaskNotificationEmail(
  to: string,
  name: string,
  actionLink: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {

  if (!resend) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 MOCK NOTIFICATION (Resend Not Configured)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`To: ${to}`);
    console.log(`Event: TASK ASSIGNED`);
    console.log(`Link: ${actionLink}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return { success: true };
  }

  console.log(`\n===== 📨 SENDING TASK NOTIFICATION VIA RESEND (${to}) =====`);

  const subject = "New Task: Action Required | Нова задача: Изисква се действие";

  try {
    const { data, error } = await resend.emails.send({
      from: 'Agenzia Deal Room <notify@dealroom.online>',
      to: [to],
      subject: subject,
      html: getTaskNotificationHtml({
        name: name,
        actionLink: actionLink,
      })
    });

    if (error) {
      console.error('❌ Resend API Error:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Task Notification sent successfully! ID: ${data?.id}`);
    return { success: true, messageId: data?.id };

  } catch (error: any) {
    console.error('❌ Email Service Exception:', error);
    return { success: false, error: error?.message || String(error) };
  }
}

export function getTaskNotificationHtml({
  name,
  actionLink,
}: {
  name: string;
  actionLink: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.8; color: #1a1a1a; background-color: #f8fafc; margin: 0; padding: 0; }
    .wrapper { padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden; }
    .header { padding: 50px 40px; text-align: left; border-bottom: 1px solid #f1f5f9; }
    .logo-img { height: 40px; width: auto; }
    .content { padding: 50px 60px; }
    h1 { font-size: 22px; font-weight: 600; color: #0f172a; margin-bottom: 30px; letter-spacing: -0.02em; }
    h3 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #14b8a6; margin-top: 40px; margin-bottom: 10px; }
    p { margin-bottom: 20px; font-size: 15px; color: #475569; }
    .dual-lang { border-top: 1px solid #f1f5f9; margin-top: 40px; padding-top: 40px; }
    .button-container { margin: 50px 0; text-align: left; }
    .button { background-color: #0f172a; color: #ffffff !important; padding: 16px 40px; text-decoration: none; border-radius: 2px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block; }
    .footer { padding: 40px; background: #f8fafc; text-align: left; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    .legal { line-height: 1.4; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div style="background-color: #11141b; padding: 40px 20px; text-align: center;">
        <img src="https://dealroom.online/email-badge.png" alt="DEAL ROOM - POWERED BY AGENZIA" style="height: 180px; width: auto; display: inline-block;">
      </div>
      <div class="content">
        <h1>Action Required</h1>
        
        <p>Hello <strong>${name}</strong>,</p>
        <p>You have a new task requiring your attention. Please log in to your secure Deal Room to review the requirements and upload the necessary documents.</p>

        <div class="button-container">
          <a href="${actionLink}" class="button">View Task</a>
        </div>

        <div class="dual-lang">
          <h1>Изисква се действие</h1>
          <p>Здравейте, <strong>${name}</strong>,</p>
          <p>Имате нова задача, която изисква Вашето внимание. Моля, влезте във Вашата защитена Deal Room, за да прегледате изискванията и да качите необходимите документи.</p>
          
          <div class="button-container">
            <a href="${actionLink}" class="button">Вижте задачата</a>
          </div>
        </div>
      </div>
      <div class="footer">
        <div class="legal">
          © 2026 AGENZIA. All rights reserved.<br>
          This communication is confidential. Sent via our secure infrastructure at dealroom.online.
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Timeline Progressed Notification
 */
export async function sendTimelineNotificationEmail(
  to: string,
  name: string,
  actionLink: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {

  if (!resend) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 MOCK NOTIFICATION (Resend Not Configured)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`To: ${to}`);
    console.log(`Event: TIMELINE PROGRESSED`);
    console.log(`Link: ${actionLink}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return { success: true };
  }

  console.log(`\n===== 📨 SENDING TIMELINE NOTIFICATION VIA RESEND (${to}) =====`);

  const subject = "Deal Update: Timeline Progressed | Обновяване: Напредък по сделката";

  try {
    const { data, error } = await resend.emails.send({
      from: 'Agenzia Deal Room <notify@dealroom.online>',
      to: [to],
      subject: subject,
      html: getTimelineNotificationHtml({
        name: name,
        actionLink: actionLink,
      })
    });

    if (error) {
      console.error('❌ Resend API Error:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Timeline Notification sent successfully! ID: ${data?.id}`);
    return { success: true, messageId: data?.id };

  } catch (error: any) {
    console.error('❌ Email Service Exception:', error);
    return { success: false, error: error?.message || String(error) };
  }
}

export function getTimelineNotificationHtml({
  name,
  actionLink,
}: {
  name: string;
  actionLink: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.8; color: #1a1a1a; background-color: #f8fafc; margin: 0; padding: 0; }
    .wrapper { padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden; }
    .header { padding: 50px 40px; text-align: left; border-bottom: 1px solid #f1f5f9; }
    .logo-img { height: 40px; width: auto; }
    .content { padding: 50px 60px; }
    h1 { font-size: 22px; font-weight: 600; color: #0f172a; margin-bottom: 30px; letter-spacing: -0.02em; }
    h3 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #14b8a6; margin-top: 40px; margin-bottom: 10px; }
    p { margin-bottom: 20px; font-size: 15px; color: #475569; }
    .dual-lang { border-top: 1px solid #f1f5f9; margin-top: 40px; padding-top: 40px; }
    .button-container { margin: 50px 0; text-align: left; }
    .button { background-color: #0f172a; color: #ffffff !important; padding: 16px 40px; text-decoration: none; border-radius: 2px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block; }
    .footer { padding: 40px; background: #f8fafc; text-align: left; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    .legal { line-height: 1.4; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div style="background-color: #11141b; padding: 40px 20px; text-align: center;">
        <img src="https://dealroom.online/email-badge.png" alt="DEAL ROOM - POWERED BY AGENZIA" style="height: 180px; width: auto; display: inline-block;">
      </div>
      <div class="content">
        <h1>Timeline Progressed</h1>
        
        <p>Hello <strong>${name}</strong>,</p>
        <p>Great news! Your deal timeline has progressed. You are one step closer to closing your deal.</p>

        <div class="button-container">
          <a href="${actionLink}" class="button">View Timeline</a>
        </div>

        <div class="dual-lang">
          <h1>Напредък по сделката</h1>
          <p>Здравейте, <strong>${name}</strong>,</p>
          <p>Страхотни новини! Графикът на Вашата сделка напредна. Вие сте една крачка по-близо до финализиране на сделката.</p>
          
          <div class="button-container">
            <a href="${actionLink}" class="button">Вижте графика</a>
          </div>
        </div>
      </div>
      <div class="footer">
        <div class="legal">
          © 2026 AGENZIA. All rights reserved.<br>
          This communication is confidential. Sent via our secure infrastructure at dealroom.online.
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
