import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createDailyRoom } from '@/lib/daily/client';
import { sendEmail, getSessionAcceptedHtml, getSlotsRejectedHtml } from '@/lib/resend/client';
import { COMPANY_FALLBACK_QUESTIONS } from '@/constants/questions-fallback';

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

      // a. Commented out Daily.co generation to use 100% free, cardless Jitsi Meet as Primary
      /*
      let dailyRoomUrl = '';
      const dailyApiKey = process.env.DAILY_API_KEY;

      if (dailyApiKey && !dailyApiKey.includes('placeholder')) {
        try {
          console.log('[Daily] Generating dynamic Daily.co video room...');
          const room = await createDailyRoom(scheduledAtIso);
          dailyRoomUrl = room.url;
        } catch (roomErr: any) {
          console.error('Failed to create Daily.co room, falling back to Jitsi Meet:', roomErr);
          dailyRoomUrl = `https://meet.jit.si/peerprep-${sessionId.substring(0, 8)}`;
        }
      } else {
        dailyRoomUrl = `https://meet.jit.si/peerprep-${sessionId.substring(0, 8)}`;
      }
      */
      
      // Jitsi Meet Room Generator (Sole Primary Video Call Room - jitsi.belnet.be Belgian Server)
      const dailyRoomUrl = `https://jitsi.belnet.be/peerprep-${sessionId.substring(0, 8)}`;
      console.log(`[Jitsi] Auto-generated Jitsi Meet conference room: ${dailyRoomUrl}`);

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

      // c. Generate and Populate Question Sheet Inline (Zero-Deployment Edge Bypass!)
      try {
        const groqApiKey = process.env.GROQ_API_KEY;
        console.log(`[Groq] Inline generator: Processing company=${companySlug}, session=${sessionId}...`);
        
        // i. Fetch Question Cache
        const { data: cacheData } = await supabase
          .from('question_cache')
          .select('questions_json, fallback_hints_json')
          .eq('company_slug', companySlug)
          .maybeSingle();

        let dsaQuestions = [];
        let fallbackHints = [];

        if (cacheData && cacheData.questions_json && cacheData.questions_json.length > 0) {
          dsaQuestions = cacheData.questions_json || [];
          fallbackHints = cacheData.fallback_hints_json || [];
        } else {
          console.log(`[Cache] DB cache empty for company=${companySlug}. Loading local fallback questions.`);
          const localFallback = COMPANY_FALLBACK_QUESTIONS[companySlug] || COMPANY_FALLBACK_QUESTIONS['Google'];
          dsaQuestions = localFallback;
          fallbackHints = localFallback;
        }

        const topDsaQuestions = dsaQuestions
          .sort((a: any, b: any) => (b.frequency || 0) - (a.frequency || 0))
          .slice(0, 5);

        let parsedDsaHints = [];
        let generationSuccess = false;

        // ii. Invoke Groq API directly using Next.js secrets if loaded
        if (groqApiKey && topDsaQuestions.length > 0 && !groqApiKey.includes('placeholder')) {
          const prompt = `
            You are an expert technical interviewer. For each of the following LeetCode/DSA questions targeting ${companySlug}, generate short, concise, and structured hints:
            1. **Brute Force Approach**: 1-2 sentence description.
            2. **Optimal Approach**: 1-2 sentence description.
            3. **Time Complexity**: Big-O notation.
            4. **Space Complexity**: Big-O notation.

            Questions:
            ${topDsaQuestions.map((q: any) => `- [ID: ${q.id}] ${q.title} (${q.difficulty} difficulty)`).join("\n")}

            Respond strictly with a valid JSON array of objects. Do not wrap in markdown code blocks like \`\`\`json.
            JSON format:
            [
              {
                "id": "question_id_here",
                "title": "question_title_here",
                "bruteForce": "brute force description",
                "optimal": "optimal description",
                "timeComplexity": "O(N)",
                "spaceComplexity": "O(1)"
              }
            ]
          `;

          try {
            console.log(`[Groq] Fetching Groq completions inline...`);
            const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${groqApiKey}`,
              },
              body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.2,
                max_tokens: 1200,
              }),
            });

            if (groqResponse.ok) {
              const groqData = await groqResponse.json();
              const jsonText = groqData.choices?.[0]?.message?.content?.trim();
              const cleanJsonText = jsonText
                .replace(/^```json/, "")
                .replace(/^```/, "")
                .replace(/```$/, "")
                .trim();

              parsedDsaHints = JSON.parse(cleanJsonText);
              if (Array.isArray(parsedDsaHints) && parsedDsaHints.length > 0) {
                generationSuccess = true;
                console.log(`[Groq Success] Hints generated successfully inline.`);
              }
            } else {
              console.warn(`Groq API returned error status: ${groqResponse.status}`);
            }
          } catch (err: any) {
            console.warn(`[Groq Warning] Inline generation failed:`, err.message);
          }
        }

        // iii. Handle Fallbacks
        if (!generationSuccess) {
          console.warn("[Groq Warning] Inline Groq failed or key placeholder. Activating local cache fallbacks.");
          if (fallbackHints && fallbackHints.length > 0) {
            parsedDsaHints = fallbackHints;
          } else {
            parsedDsaHints = topDsaQuestions.map((q: any) => ({
              id: q.id,
              title: q.title,
              bruteForce: "Brute-force simulation of the constraints. Standard recursion or nesting.",
              optimal: "Optimize using two-pointers, hash maps, sliding windows, or sorting.",
              timeComplexity: "O(N) typical",
              spaceComplexity: "O(1) auxiliary",
            }));
          }
        }

        // iv. Append HR & Project questions
        const hrQuestions = [
          `Why do you want to join ${companySlug} specifically? What values of ours resonate with you?`,
          "Tell me about a time you resolved a major technical conflict with a teammate.",
          "Describe a situation where you had to quickly adapt to a new technology under a tight deadline."
        ];

        const projectQuestions = [
          "Walk me through the architecture of your most proud technical project. What was the biggest scaling challenge?",
          "If you had to redesign your project from scratch today, what technical stack changes would you make and why?",
          "How did you handle state management and data privacy constraints in your recent projects?"
        ];

        const finalQuestionSheet = {
          dsa: parsedDsaHints,
          hr: hrQuestions,
          projects: projectQuestions,
          generatedAt: new Date().toISOString(),
          fallbackUsed: !generationSuccess,
        };

        // v. Save sheet directly to sessions table
        const { error: saveErr } = await supabase
          .from('sessions')
          .update({ questions_json: finalQuestionSheet })
          .eq('id', sessionId);

        if (saveErr) throw saveErr;
        console.log(`[Lobby] Inline questions sheet fully populated!`);
      } catch (edgeErr: any) {
        console.error('Failed to execute inline question generator:', edgeErr.message);
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
