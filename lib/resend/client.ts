export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  if (!apiKey) {
    console.warn('⚠️ RESEND_API_KEY is not configured in server environment. Skipping email sending.');
    return false;
  }

  try {
    console.log(`📡 Dispatching email via Resend to ${to}: "${subject}"...`);
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: `PeerPrep <${fromEmail}>`,
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`❌ Resend API returned error: ${response.statusText} - ${errText}`);
      return false;
    }

    const data = await response.json();
    console.log(`✅ Email sent successfully via Resend. ID: ${data.id}`);
    return true;
  } catch (err) {
    console.error('❌ Resend email dispatch failed:', err);
    return false;
  }
}

// ── EMAIL TEMPLATE GENERATORS ─────────────────────────────────────────────

export function getSessionRequestHtml(helperName: string, seekerName: string, company: string, note?: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px border #E8E0D5; border-radius: 12px; background-color: #FAF7F2; color: #2C2416;">
      <h2 style="color: #C4622D; margin-bottom: 20px; border-bottom: 2px solid #C4622D; padding-bottom: 10px;">New Interview Request!</h2>
      <p>Hello <strong>${helperName}</strong>,</p>
      <p>You have received a new mock interview request from your college peer, <strong>${seekerName}</strong>!</p>
      <div style="background-color: #FFFFFF; padding: 15px; border-radius: 8px; border: 1px solid #E8E0D5; margin: 20px 0;">
        <p style="margin: 0 0 10px 0;"><strong>Target Company:</strong> ${company}</p>
        ${note ? `<p style="margin: 0;"><strong>Message:</strong> "${note}"</p>` : ''}
      </div>
      <p>Please log in to your PeerPrep dashboard to review their proposed time slots, confirm a slot, or decline the request.</p>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/sessions" style="background-color: #C4622D; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Review Request</a>
      </div>
      <p style="font-size: 11px; color: #7A6E64; margin-top: 40px; border-top: 1px solid #E8E0D5; padding-top: 15px;">
        This is an automated notification from PeerPrep. Confidential.
      </p>
    </div>
  `;
}

export function getSessionAcceptedHtml(seekerName: string, helperName: string, company: string, dateStr: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px border #E8E0D5; border-radius: 12px; background-color: #FAF7F2; color: #2C2416;">
      <h2 style="color: #4A7C59; margin-bottom: 20px; border-bottom: 2px solid #4A7C59; padding-bottom: 10px;">Mock Interview Confirmed!</h2>
      <p>Hello <strong>${seekerName}</strong>,</p>
      <p>Great news! <strong>${helperName}</strong> has accepted your mock interview request for <strong>${company}</strong>!</p>
      <div style="background-color: #FFFFFF; padding: 15px; border-radius: 8px; border: 1px solid #E8E0D5; margin: 20px 0;">
        <p style="margin: 0 0 10px 0;"><strong>Scheduled Time:</strong> ${dateStr}</p>
        <p style="margin: 0;"><strong>Daily.co Video Room:</strong> Created & Ready</p>
      </div>
      <p>Both of you can join the call directly from the PeerPrep Session screen at the scheduled time.</p>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/sessions" style="background-color: #4A7C59; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Go to My Sessions</a>
      </div>
      <p style="font-size: 11px; color: #7A6E64; margin-top: 40px; border-top: 1px solid #E8E0D5; padding-top: 15px;">
        This is an automated notification from PeerPrep. Confidential.
      </p>
    </div>
  `;
}

export function getSlotsRejectedHtml(seekerName: string, helperName: string, company: string, note?: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px border #E8E0D5; border-radius: 12px; background-color: #FAF7F2; color: #2C2416;">
      <h2 style="color: #991B1B; margin-bottom: 20px; border-bottom: 2px solid #991B1B; padding-bottom: 10px;">Proposed Slots Declined</h2>
      <p>Hello <strong>${seekerName}</strong>,</p>
      <p><strong>${helperName}</strong> would love to interview you for <strong>${company}</strong>, but none of the proposed slots worked for them.</p>
      ${note ? `
      <div style="background-color: #FFFFFF; padding: 15px; border-radius: 8px; border: 1px solid #E8E0D5; margin: 20px 0;">
        <p style="margin: 0;"><strong>Helper's Note:</strong> "${note}"</p>
      </div>` : ''}
      <p>Please send them a new request proposing different dates and times that might work better!</p>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/search" style="background-color: #C4622D; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Find Peer Profiles</a>
      </div>
      <p style="font-size: 11px; color: #7A6E64; margin-top: 40px; border-top: 1px solid #E8E0D5; padding-top: 15px;">
        This is an automated notification from PeerPrep. Confidential.
      </p>
    </div>
  `;
}
