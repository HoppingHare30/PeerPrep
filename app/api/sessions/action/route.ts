import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createDailyRoom } from '@/lib/daily/client';
import { sendEmail, getSessionAcceptedHtml, getSlotsRejectedHtml } from '@/lib/resend/client';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Verify Authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request payload
    const { sessionId, action, slot, note } = await request.json();
    if (!sessionId || !action) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 3. Fetch current session details
    const { data: session, error: fetchErr } = await supabase
      .from('sessions')
      .select(`
        *,
        interviewee:interviewee_id (name, email),
        interviewer:interviewer_id (name, email),
        company:company_id (name, slug)
      `)
      .eq('id', sessionId)
      .single();

    if (fetchErr || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify currently authed user is the interviewer for this session
    if (session.interviewer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const seekerName = session.interviewee?.name || 'PeerPrep User';
    const seekerEmail = session.interviewee?.email || '';
    const helperName = session.interviewer?.name || 'Your Peer';
    const companyName = session.company?.name || 'Target Company';
    const companySlug = session.company?.slug || '';

    // ── CASE A: CONFIRM SLOT & ACCEPT ─────────────────────────────────────
    if (action === 'accept') {
      if (!slot || !slot.date || !slot.time) {
        return NextResponse.json({ error: 'Missing slot parameters' }, { status: 400 });
      }

      // Convert proposed slot string date/time to ISO timestamptz
      const scheduledAtIso = new Date(`${slot.date}T${slot.time}`).toISOString();

      // a. Generate Daily.co video room via REST API
      let dailyRoomUrl = '';
      try {
        const room = await createDailyRoom(scheduledAtIso);
        dailyRoomUrl = room.url;
      } catch (roomErr: any) {
        console.error('Failed to create Daily.co room, falling back to empty link:', roomErr);
        dailyRoomUrl = 'https://daily.co/'; // fallback placeholder
      }

      // b. Update session status, room URL, and confirmed scheduled time
      const { error: updateErr } = await supabase
        .from('sessions')
        .update({
          status: 'accepted',
          scheduled_at: scheduledAtIso,
          daily_room_url: dailyRoomUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (updateErr) throw updateErr;

      // c. Trigger asynchronous Groq AI Question Generation (Supabase Edge Function)
      try {
        const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-questions`;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (serviceKey) {
          console.log(`📡 Triggering async question generation for session=${sessionId}, company=${companySlug}...`);
          fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({
              session_id: sessionId,
              company_slug: companySlug,
            }),
          }).catch((err) => console.error('Edge function async fetch error:', err));
        } else {
          console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY missing, skipping edge function trigger.');
        }
      } catch (edgeErr) {
        console.error('Failed to trigger async question generator:', edgeErr);
      }

      // d. Create in-app notifications
      await supabase.from('notifications').insert([
        {
          user_id: session.interviewee_id,
          type: 'session_accepted',
          message: `Your interview request for ${companyName} has been accepted by ${helperName} for ${slot.date} at ${slot.time}!`,
          session_id: sessionId,
        },
        {
          user_id: session.interviewer_id,
          type: 'session_accepted',
          message: `You confirmed the mock interview with ${seekerName} for ${slot.date} at ${slot.time}.`,
          session_id: sessionId,
        }
      ]);

      // e. Send transactional confirmation email
      if (seekerEmail) {
        const htmlContent = getSessionAcceptedHtml(
          seekerName,
          helperName,
          companyName,
          `${slot.date} at ${slot.time}`
        );
        await sendEmail({
          to: seekerEmail,
          subject: `Interview Confirmed: ${companyName} with ${helperName}`,
          html: htmlContent,
        });
      }

      return NextResponse.json({ success: true, status: 'accepted' });
    }

    // ── CASE B: REJECT SLOTS (slots_rejected) ──────────────────────────────
    if (action === 'slots_rejected') {
      const { error: updateErr } = await supabase
        .from('sessions')
        .update({
          status: 'slots_rejected',
          rejection_note: note || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (updateErr) throw updateErr;

      // In-app alert
      await supabase.from('notifications').insert({
        user_id: session.interviewee_id,
        type: 'slots_rejected',
        message: `${helperName} wants to interview you for ${companyName}, but needs different time slots. ${
          note ? `Note: "${note}"` : ''
        }`,
        session_id: sessionId,
      });

      // Email dispatch
      if (seekerEmail) {
        const htmlContent = getSlotsRejectedHtml(seekerName, helperName, companyName, note);
        await sendEmail({
          to: seekerEmail,
          subject: `Reschedule Request: Mock Interview for ${companyName}`,
          html: htmlContent,
        });
      }

      return NextResponse.json({ success: true, status: 'slots_rejected' });
    }

    // ── CASE C: DECLINE REQUEST (cancelled) ────────────────────────────────
    if (action === 'decline') {
      const { error: updateErr } = await supabase
        .from('sessions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (updateErr) throw updateErr;

      // In-app alert
      await supabase.from('notifications').insert({
        user_id: session.interviewee_id,
        type: 'session_cancelled',
        message: `Sorry, ${helperName} is unable to take your request for ${companyName} right now.`,
        session_id: sessionId,
      });

      // Email notification
      if (seekerEmail) {
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; background-color: #FAF7F2; color: #2C2416;">
            <h3>Interview Request Declined</h3>
            <p>Hello <strong>${seekerName}</strong>,</p>
            <p>Sorry, <strong>${helperName}</strong> is unable to conduct your mock interview for <strong>${companyName}</strong> right now.</p>
            <p>Try searching for other available peers from your college dashboard!</p>
          </div>
        `;
        await sendEmail({
          to: seekerEmail,
          subject: `Request Update: Mock Interview for ${companyName}`,
          html: htmlContent,
        });
      }

      return NextResponse.json({ success: true, status: 'cancelled' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Session action error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
