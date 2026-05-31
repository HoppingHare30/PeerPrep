import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Video,
  User,
  Briefcase,
  ArrowRight,
  TrendingUp,
  Award,
  CheckCircle2,
  Users,
  Compass,
  Plus
} from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. Authenticate User
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // 2. Fetch User Profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // 3. Fetch All Sessions for Seeker & Helper
  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      *,
      interviewee:interviewee_id (id, name, college),
      interviewer:interviewer_id (id, name, college),
      company:company_id (id, name, slug),
      feedback:feedback(*)
    `)
    .or(`interviewee_id.eq.${user.id},interviewer_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  const typedSessions = sessions || [];

  // Filter completed and upcoming confirmed sessions
  const completedSessions = typedSessions.filter(s => s.status === 'completed');
  const upcomingSessions = typedSessions.filter(s => s.status === 'accepted' && s.scheduled_at);

  // Sort upcoming sessions to get the absolute next one
  const nextSession = upcomingSessions
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0];

  // Calculate Average Feedback Scores if any exist
  const feedbacksReceived = completedSessions
    .filter(s => s.interviewee_id === user.id && s.feedback)
    .map(s => s.feedback);

  let averageScore = 0;
  let hasFeedback = false;

  if (feedbacksReceived.length > 0) {
    hasFeedback = true;
    let totalSum = 0;
    feedbacksReceived.forEach(f => {
      const avg = (f.clarity_score + f.communication_score + f.problem_solving_score + f.code_quality_score + f.time_management_score) / 5;
      totalSum += avg;
    });
    averageScore = parseFloat((totalSum / feedbacksReceived.length).toFixed(1));
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ── GREETING HERO SECTION ── */}
      <div className="bg-orange-tint/40 border border-border rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
            Welcome back, <span className="text-primary">{profile.name}</span>!
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary">
            Practice like it's real. Prepare with campus peers from{' '}
            <span className="font-semibold text-text-primary">{profile.college}</span>.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/search"
            className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold transition shadow-md shadow-primary/10 cursor-pointer"
          >
            <Compass className="h-4 w-4 mr-2" />
            Find Interviewers
          </Link>
          <Link
            href="/sessions"
            className="inline-flex items-center px-4 py-2 border border-border bg-surface text-text-primary hover:bg-orange-tint/40 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            My Sessions
          </Link>
        </div>
      </div>

      {/* ── DYNAMIC HIGHLIGHT STATS GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Practice Sessions Completed */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Total Mocks Completed
            </span>
            <div className="bg-green-tint text-secondary p-2 rounded-lg">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-text-primary">
              {completedSessions.length}
            </div>
            <p className="text-[10px] text-text-secondary">
              {completedSessions.filter(s => s.interviewee_id === user.id).length} as Candidate ·{' '}
              {completedSessions.filter(s => s.interviewer_id === user.id).length} as Interviewer
            </p>
          </div>
        </div>

        {/* Avg Feedback Rating */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Average Score Received
            </span>
            <div className="bg-orange-tint text-primary p-2 rounded-lg">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-text-primary">
              {hasFeedback ? `${averageScore} / 5.0` : '—'}
            </div>
            <p className="text-[10px] text-text-secondary">
              {hasFeedback
                ? `Calculated from ${feedbacksReceived.length} peer evaluations`
                : 'No evaluations received yet'}
            </p>
          </div>
        </div>

        {/* Active Campus Members */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              My Campus Scope
            </span>
            <div className="bg-primary/10 text-primary p-2 rounded-lg">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-extrabold text-text-primary truncate">
              {profile.college}
            </div>
            <p className="text-[10px] text-text-secondary">
              Graduation Year: {profile.graduation_year || 'Not specified'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: UPCOMING SESSIONS AND RECENT LIST */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Next Confirmed Mock session banner */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-text-primary uppercase tracking-wider">
              Next Live Mock Interview
            </h3>

            {nextSession ? (
              <div className="bg-surface border border-primary/20 rounded-xl p-6 shadow-sm space-y-4 hover:border-primary transition duration-150">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="space-y-1.5">
                    <span className="text-xs font-extrabold px-2.5 py-0.5 bg-green-tint text-secondary rounded-full border border-secondary/10">
                      Confirmed Room
                    </span>
                    <h4 className="text-lg font-extrabold text-text-primary leading-tight">
                      {nextSession.company?.name || 'Target Company'} Mock Session
                    </h4>
                    <div className="flex items-center space-x-4 text-xs text-text-secondary">
                      <span className="flex items-center">
                        <User className="h-3.5 w-3.5 mr-1" />
                        {nextSession.interviewee_id === user.id
                          ? `Interviewer: ${nextSession.interviewer?.name}`
                          : `Candidate: ${nextSession.interviewee?.name}`}
                      </span>
                    </div>
                  </div>

                  <div className="bg-orange-tint/40 border border-primary/10 px-4 py-2.5 rounded-xl text-center shadow-inner shrink-0">
                    <Calendar className="h-4 w-4 text-primary mx-auto mb-1" />
                    <span className="block text-[11px] font-extrabold text-text-primary">
                      {new Date(nextSession.scheduled_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="block text-[9px] text-text-secondary font-semibold font-mono mt-0.5">
                      {new Date(nextSession.scheduled_at).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-border/60">
                  <span className="text-[10px] text-text-secondary flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1 text-primary animate-pulse" />
                    Join room when timer hits zero!
                  </span>

                  <Link
                    href={`/session/${nextSession.id}`}
                    className="inline-flex items-center px-4 py-1.5 bg-primary hover:bg-primary/95 text-white rounded-lg text-xs font-extrabold transition shadow-sm cursor-pointer"
                  >
                    Enter Workspace
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-surface/50 border border-dashed border-border rounded-xl p-8 text-center text-text-secondary text-xs">
                No upcoming mock sessions confirmed. Visit search to invite a peer!
              </div>
            )}
          </div>

          {/* 2. Recent activity history lists */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-text-primary uppercase tracking-wider">
                Recent Sessions History
              </h3>
              <Link
                href="/sessions"
                className="text-xs text-primary font-bold hover:underline flex items-center"
              >
                All sessions &rarr;
              </Link>
            </div>

            {typedSessions.length > 0 ? (
              <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm divide-y divide-border">
                {typedSessions.slice(0, 4).map((session) => {
                  const isSeeker = session.interviewee_id === user.id;
                  const peer = isSeeker ? session.interviewer : session.interviewee;
                  const peerName = peer?.name || 'Peer';

                  return (
                    <div
                      key={session.id}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-orange-tint/10 transition duration-150"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span className="text-xs font-extrabold text-text-primary">
                            {session.company?.name || 'Target Company'}
                          </span>
                          <span className="text-[9px] font-bold text-text-secondary uppercase">
                            · {isSeeker ? 'Candidate' : 'Interviewer'}
                          </span>
                        </div>
                        <p className="text-[10px] text-text-secondary mt-0.5 truncate">
                          Peer: {peerName}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                            session.status === 'completed'
                              ? 'bg-green-tint text-secondary border-secondary/15'
                              : session.status === 'accepted'
                              ? 'bg-green-tint/50 text-secondary border-secondary/10'
                              : session.status === 'pending'
                              ? 'bg-orange-tint text-primary border-primary/10'
                              : 'bg-gray-100 text-text-secondary border-border'
                          }`}
                        >
                          {session.status}
                        </span>

                        <Link
                          href="/sessions"
                          className="p-1 border border-border hover:bg-surface rounded text-text-secondary hover:text-text-primary transition"
                        >
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-surface/50 border border-dashed border-border rounded-xl p-8 text-center text-text-secondary text-xs">
                You haven't requested or participated in any sessions yet.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: PROFILE METRICS & SKILLS SUMMARY */}
        <div className="space-y-6">
          {/* 1. Skills tags box widget */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-text-primary uppercase tracking-wider pb-1.5 border-b border-border/60">
              My Interview Skills
            </h3>

            {profile.skills && profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((skill: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-orange-tint/50 text-primary border border-primary/10 rounded-lg text-[10px] font-bold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-text-secondary italic">
                No skills tagged. Go to Settings to list your languages and frameworks!
              </p>
            )}

            <Link
              href="/profile/settings"
              className="inline-flex w-full justify-center items-center py-1.5 border border-border hover:bg-orange-tint/40 text-text-secondary hover:text-text-primary text-[10.5px] font-bold rounded-lg transition shadow-sm cursor-pointer"
            >
              Update Settings
            </Link>
          </div>

          {/* 2. Structured prep metrics checklist */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-text-primary uppercase tracking-wider pb-1.5 border-b border-border/60">
              Preparation Tips
            </h3>

            <div className="space-y-3 text-xs leading-relaxed text-text-secondary">
              <div className="flex items-start">
                <div className="mt-0.5 p-0.5 bg-green-tint text-secondary rounded mr-2.5 shrink-0">
                  <CheckCircle2 className="h-3 w-3" />
                </div>
                <p>
                  <strong>Target Companies:</strong> Keep your list updated in settings to receive tailored peer recommendations.
                </p>
              </div>

              <div className="flex items-start">
                <div className="mt-0.5 p-0.5 bg-green-tint text-secondary rounded mr-2.5 shrink-0">
                  <CheckCircle2 className="h-3 w-3" />
                </div>
                <p>
                  <strong>Resume Shared:</strong> Keeping your resume shared lets interviewers inspect project files easily during calls.
                </p>
              </div>

              <div className="flex items-start">
                <div className="mt-0.5 p-0.5 bg-green-tint text-secondary rounded mr-2.5 shrink-0">
                  <CheckCircle2 className="h-3 w-3" />
                </div>
                <p>
                  <strong>Availability Toggle:</strong> Turn availability off when studying to pause incoming mock request alerts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
