import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/resend/client';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Verify Authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request payload
    const {
      sessionId,
      clarityScore,
      communicationScore,
      problemSolvingScore,
      codeQualityScore,
      timeManagementScore,
      notes,
    } = await request.json();

    if (
      !sessionId ||
      clarityScore === undefined ||
      communicationScore === undefined ||
      problemSolvingScore === undefined ||
      codeQualityScore === undefined ||
      timeManagementScore === undefined
    ) {
      return NextResponse.json({ error: 'Missing rating score parameters' }, { status: 400 });
    }

    // Score bounds check (1 to 5)
    const validateScore = (score: any) => {
      const parsed = parseInt(score, 10);
      return !isNaN(parsed) && parsed >= 1 && parsed <= 5;
    };

    if (
      !validateScore(clarityScore) ||
      !validateScore(communicationScore) ||
      !validateScore(problemSolvingScore) ||
      !validateScore(codeQualityScore) ||
      !validateScore(timeManagementScore)
    ) {
      return NextResponse.json({ error: 'Scores must be integers between 1 and 5' }, { status: 400 });
    }

    // 3. Fetch session details to check permission & retrieve peer emails
    const { data: session, error: fetchErr } = await supabase
      .from('sessions')
      .select(`
        *,
        interviewee:interviewee_id (name, email),
        interviewer:interviewer_id (name, email),
        company:company_id (name)
      `)
      .eq('id', sessionId)
      .single();

    if (fetchErr || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Ensure that only the designated interviewer is allowed to submit feedback
    if (session.interviewer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: Only the interviewer can submit feedback' }, { status: 403 });
    }

    // Check if session is already completed or cancelled
    if (session.status === 'completed') {
      return NextResponse.json({ error: 'Feedback already submitted for this session' }, { status: 400 });
    }
    if (session.status === 'cancelled' || session.status === 'expired') {
      return NextResponse.json({ error: 'Cannot submit feedback for a terminated session' }, { status: 400 });
    }

    // 4. Database Transaction / Sequential Updates
    
    // a. Insert record in public.feedback table
    const { error: feedbackErr } = await supabase
      .from('feedback')
      .insert({
        session_id: sessionId,
        clarity_score: parseInt(clarityScore, 10),
        communication_score: parseInt(communicationScore, 10),
        problem_solving_score: parseInt(problemSolvingScore, 10),
        code_quality_score: parseInt(codeQualityScore, 10),
        time_management_score: parseInt(timeManagementScore, 10),
        notes: notes?.trim() || null,
      });

    if (feedbackErr) {
      console.error('Failed to insert feedback:', feedbackErr);
      return NextResponse.json({ error: `Feedback save failed: ${feedbackErr.message}` }, { status: 500 });
    }

    // b. Update session status to completed
    const { error: updateSessionErr } = await supabase
      .from('sessions')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (updateSessionErr) {
      console.error('Failed to complete session status:', updateSessionErr);
      // Not returning here to ensure we still notify, but logging is critical
    }

    // c. Write in-app notifications
    const seekerName = session.interviewee?.name || 'Candidate';
    const helperName = session.interviewer?.name || 'Interviewer';
    const companyName = session.company?.name || 'Target Company';

    await supabase.from('notifications').insert([
      {
        user_id: session.interviewee_id,
        type: 'feedback_ready',
        message: `Your mock interview feedback from ${helperName} for ${companyName} is ready! Check out your score sheet now.`,
        session_id: sessionId,
      },
      {
        user_id: session.interviewer_id,
        type: 'feedback_ready',
        message: `Feedback for ${seekerName}'s mock interview has been successfully saved. Thank you for mentoring!`,
        session_id: sessionId,
      }
    ]);

    // d. Dispatch transactional email to candidate using Resend
    const seekerEmail = session.interviewee?.email;
    if (seekerEmail) {
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E8E0D5; border-radius: 12px; background-color: #FAF7F2; color: #2C2416; line-height: 1.6;">
          <h2 style="color: #4A7C59; margin-top: 0; margin-bottom: 20px; border-bottom: 2px solid #4A7C59; padding-bottom: 12px; font-weight: 800; font-size: 22px;">Mock Interview Feedback Ready!</h2>
          <p style="font-size: 15px; margin-bottom: 16px;">Hello <strong>${seekerName}</strong>,</p>
          <p style="font-size: 15px; margin-bottom: 20px;">Your PeerPrep interviewer, <strong>${helperName}</strong>, has finalized the structured feedback for your mock interview targeting <strong>${companyName}</strong>!</p>
          
          <div style="background-color: #FFFFFF; padding: 20px; border-radius: 8px; border: 1px solid #E8E0D5; margin: 24px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: #C4622D; font-size: 16px; font-weight: 700; border-bottom: 1px dashed #E8E0D5; padding-bottom: 8px;">Detailed Core Scores:</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr style="border-bottom: 1px solid #FAF7F2;">
                <td style="padding: 8px 0; font-weight: 600; color: #7A6E64;">Problem Solving:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #2C2416;">${problemSolvingScore} / 5</td>
              </tr>
              <tr style="border-bottom: 1px solid #FAF7F2;">
                <td style="padding: 8px 0; font-weight: 600; color: #7A6E64;">Communication:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #2C2416;">${communicationScore} / 5</td>
              </tr>
              <tr style="border-bottom: 1px solid #FAF7F2;">
                <td style="padding: 8px 0; font-weight: 600; color: #7A6E64;">Coding Quality:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #2C2416;">${codeQualityScore} / 5</td>
              </tr>
              <tr style="border-bottom: 1px solid #FAF7F2;">
                <td style="padding: 8px 0; font-weight: 600; color: #7A6E64;">Clarity of Thought:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #2C2416;">${clarityScore} / 5</td>
              </tr>
              <tr style="border-bottom: 1px solid #FAF7F2;">
                <td style="padding: 8px 0; font-weight: 600; color: #7A6E64;">Time Management:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #2C2416;">${timeManagementScore} / 5</td>
              </tr>
            </table>
            
            ${notes ? `
            <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #E8E0D5;">
              <h4 style="margin: 0 0 8px 0; color: #2C2416; font-size: 14px; font-weight: 700;">Interviewer Feedback & Notes:</h4>
              <p style="margin: 0; font-style: italic; color: #2C2416; font-size: 13.5px; background: #FAF7F2; padding: 12px; border-radius: 6px; border-left: 3px solid #C4622D;">
                "${notes}"
              </p>
            </div>
            ` : ''}
          </div>
          
          <p style="font-size: 14px; margin-bottom: 24px;">Log in to PeerPrep to review this scorecard, check your overall progress charts, and schedule more mock sessions to polish your skills.</p>
          
          <div style="text-align: center; margin-bottom: 28px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/sessions" style="background-color: #4A7C59; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 14px; box-shadow: 0 2px 4px rgba(74,124,89,0.2);">Go to My Sessions</a>
          </div>
          
          <p style="font-size: 11px; color: #7A6E64; margin-top: 40px; border-top: 1px solid #E8E0D5; padding-top: 16px;">
            This is an automated notification from PeerPrep. Confidential.
          </p>
        </div>
      `;

      await sendEmail({
        to: seekerEmail,
        subject: `Feedback Ready: ${companyName} Mock Interview with ${helperName}`,
        html: emailHtml,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Feedback submit API error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
