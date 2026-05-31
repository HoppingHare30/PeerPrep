'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { COMPANY_FALLBACK_QUESTIONS } from '@/constants/questions-fallback';
import {
  Video,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  AlertCircle,
  ExternalLink,
  FileText,
  CheckCircle2,
  ListTodo,
  Smile,
  Code,
  BookOpen,
  MessageSquarePlus,
  Send,
  Loader2,
  Zap
} from 'lucide-react';

interface SessionWorkspaceClientProps {
  session: any;
  currentUserId: string;
  isInterviewer: boolean;
}

export default function SessionWorkspaceClient({
  session,
  currentUserId,
  isInterviewer,
}: SessionWorkspaceClientProps) {
  const router = useRouter();
  const supabase = createClient();

  // Local reactive states
  const [sessionData, setSessionData] = useState<any>(session);
  const [forceLive, setForceLive] = useState(false);
  const [expandedDSA, setExpandedDSA] = useState<Record<string, boolean>>({});
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const [resumeSignedUrl, setResumeSignedUrl] = useState<string | null>(null);

  // Poll for AI questions if not yet populated or if DSA questions are missing (mainly for interviewer)
  const [isAiGenerating, setIsAiGenerating] = useState(
    isInterviewer && (!session.questions_json || !session.questions_json.dsa || session.questions_json.dsa.length === 0)
  );

  // Feedback form states
  const [problemSolving, setProblemSolving] = useState<number>(0);
  const [communication, setCommunication] = useState<number>(0);
  const [codeQuality, setCodeQuality] = useState<number>(0);
  const [clarity, setClarity] = useState<number>(0);
  const [timeManagement, setTimeManagement] = useState<number>(0);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Auto-Fallback triggering to bypass blocking infinite spinner
  useEffect(() => {
    if (isInterviewer && (!sessionData.questions_json || !sessionData.questions_json.dsa || sessionData.questions_json.dsa.length === 0) && isAiGenerating) {
      const timer = setTimeout(async () => {
        console.log('⏰ Question generation delay. Loading local cache sheet immediately...');
        const { data } = await supabase
          .from('sessions')
          .select('questions_json')
          .eq('id', session.id)
          .single();

        if (data?.questions_json && data.questions_json.dsa && data.questions_json.dsa.length > 0) {
          setSessionData((prev: any) => ({ ...prev, questions_json: data.questions_json }));
          setIsAiGenerating(false);
          return;
        }

        const companySlug = sessionData.company?.slug || 'Google';

        // Fetch direct company questions list from local question_cache
        const { data: cacheData } = await supabase
          .from('question_cache')
          .select('questions_json, fallback_hints_json')
          .eq('company_slug', companySlug)
          .maybeSingle();

        let fallbacks = [];
        if (cacheData && cacheData.questions_json && cacheData.questions_json.length > 0) {
          fallbacks = cacheData.fallback_hints_json || cacheData.questions_json.map((q: any) => ({
            id: q.id,
            title: q.title,
            bruteForce: 'Brute-force nested loops or basic array traversal.',
            optimal: 'Hash maps or two-pointer comparison techniques.',
            timeComplexity: 'O(N)',
            spaceComplexity: 'O(N)',
          }));
        } else {
          // Use our highly-curated local premium constants!
          fallbacks = COMPANY_FALLBACK_QUESTIONS[companySlug] || COMPANY_FALLBACK_QUESTIONS['Google'];
        }

        const mockSheet = {
          dsa: fallbacks,
          hr: [
            `Why do you want to join ${companySlug}?`,
            'Tell me about a time you handled conflict.',
            'Describe a situation where you had a tight deadline.'
          ],
          projects: [
            'Walk me through the architecture of your recent project.',
            'What would you redesign from scratch?',
            'How did you handle state management?'
          ],
          generatedAt: new Date().toISOString(),
          fallbackUsed: true
        };

        // Optimistically set state to unblock interviewer
        setSessionData((prev: any) => ({ ...prev, questions_json: mockSheet }));
        setIsAiGenerating(false);
        
        // Update database silently
        await supabase
          .from('sessions')
          .update({ questions_json: mockSheet })
          .eq('id', session.id);
          
      }, 4000); // 4 second timeout to clear loading screen

      return () => clearTimeout(timer);
    }
  }, [isInterviewer, sessionData.questions_json, isAiGenerating, session.id, supabase, sessionData.company]);

  // Polling hook (if questions_json is empty)
  useEffect(() => {
    if (!isAiGenerating || sessionData.questions_json) return;

    const interval = setInterval(async () => {
      console.log('Polling for questions sheet generation...');
      const { data } = await supabase
        .from('sessions')
        .select('questions_json')
        .eq('id', session.id)
        .single();

      if (data?.questions_json) {
        setSessionData((prev: any) => ({ ...prev, questions_json: data.questions_json }));
        setIsAiGenerating(false);
        toast.success('AI mock questions sheet prepared!');
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isAiGenerating, sessionData.questions_json, session.id, supabase]);

  // Realtime Supabase postgres channel hook to sync checklists & status dynamically
  useEffect(() => {
    const channel = supabase
      .channel(`session_workspace_${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${session.id}`,
        },
        (payload: any) => {
          console.log('⚡ Realtime session update payload:', payload.new);
          setSessionData((prev: any) => ({
            ...prev,
            status: payload.new.status || prev.status,
            questions_json: payload.new.questions_json || prev.questions_json,
            questions_checked: payload.new.questions_checked || prev.questions_checked,
            daily_room_url: payload.new.daily_room_url || prev.daily_room_url,
            scheduled_at: payload.new.scheduled_at || prev.scheduled_at,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session.id, supabase]);

  // Fetch signed resume URL if sharing is allowed & user is interviewer
  useEffect(() => {
    if (isInterviewer && sessionData.resume_shared && sessionData.interviewee?.resume_url) {
      const fetchResume = async () => {
        const { data, error } = await supabase.storage
          .from('resumes')
          .createSignedUrl(sessionData.interviewee.resume_url, 60 * 60 * 2);
        if (data) {
          setResumeSignedUrl(data.signedUrl);
        } else if (error) {
          console.error('Failed to create signed resume link:', error);
        }
      };
      fetchResume();
    }
  }, [isInterviewer, sessionData.resume_shared, sessionData.interviewee, supabase]);

  // 1. Countdown timer setup
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const scheduledTime = new Date(sessionData.scheduled_at).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = scheduledTime - now;

      if (difference <= 0) {
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [sessionData.scheduled_at]);

  // 2. Interview elapsed timer (counts up when live)
  useEffect(() => {
    const scheduledTime = new Date(sessionData.scheduled_at).getTime();

    const updateElapsed = () => {
      const now = new Date().getTime();
      const elapsedMs = now - scheduledTime;

      // If it hasn't scheduled yet, just show 00:00
      if (elapsedMs < 0) {
        setElapsedTime('00:00');
        return;
      }

      const minutes = Math.floor(elapsedMs / 1000 / 60);
      const seconds = Math.floor((elapsedMs / 1000) % 60);

      const displayMin = minutes < 10 ? `0${minutes}` : `${minutes}`;
      const displaySec = seconds < 10 ? `0${seconds}` : `${seconds}`;

      setElapsedTime(`${displayMin}:${displaySec}`);
    };

    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [sessionData.scheduled_at]);

  // Toggle checklist checkboxes remotely & sync
  const handleToggleQuestion = async (qId: string) => {
    const currentChecked = Array.isArray(sessionData.questions_checked)
      ? sessionData.questions_checked
      : [];
    let updatedChecked;

    if (currentChecked.includes(qId)) {
      updatedChecked = currentChecked.filter((id: string) => id !== qId);
    } else {
      updatedChecked = [...currentChecked, qId];
    }

    // Local optimistic update
    setSessionData((prev: any) => ({
      ...prev,
      questions_checked: updatedChecked,
    }));

    // Database update
    const { error } = await supabase
      .from('sessions')
      .update({ questions_checked: updatedChecked })
      .eq('id', session.id);

    if (error) {
      toast.error('Failed to sync checklist update');
      console.error(error);
    }
  };

  // Submit Rating Feedback Form
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      problemSolving === 0 ||
      communication === 0 ||
      codeQuality === 0 ||
      clarity === 0 ||
      timeManagement === 0
    ) {
      toast.error('Please complete all 5 rating metrics before submitting.');
      return;
    }

    setIsSubmittingFeedback(true);
    const toastId = toast.loading('Submitting mock evaluation scoresheet...');

    try {
      const response = await fetch('/api/sessions/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          problemSolvingScore: problemSolving,
          communicationScore: communication,
          codeQualityScore: codeQuality,
          clarityScore: clarity,
          timeManagementScore: timeManagement,
          notes: feedbackNotes,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to submit feedback');

      toast.success('Evaluation saved successfully! Thank you.', { id: toastId });
      router.push('/sessions');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Feedback submission failed', { id: toastId });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleLeaveSession = () => {
    if (window.confirm('Are you sure you want to leave this session screen?')) {
      router.push('/sessions');
    }
  };

  // Derived state to check if workspace is active
  const isLive = forceLive || timeLeft === null || sessionData.status === 'completed';
  const companyName = sessionData.company?.name || 'Target Company';
  const peerName = isInterviewer
    ? sessionData.interviewee?.name
    : sessionData.interviewer?.name;

  // Render a score circle builder helper
  const renderScoreSelector = (
    label: string,
    currentVal: number,
    setVal: (val: number) => void
  ) => {
    return (
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-text-primary">{label}</span>
          <span className="text-primary font-bold">{currentVal || '—'} / 5</span>
        </div>
        <div className="flex justify-between gap-1.5">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setVal(num)}
              className={`flex-1 py-1 text-center rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                currentVal === num
                  ? 'bg-primary border-primary text-white scale-105 shadow-sm shadow-primary/25'
                  : 'bg-surface border-border text-text-secondary hover:bg-orange-tint hover:text-primary hover:border-primary/20'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ==========================================
  // 1. PRE-SESSION LOBBY STATE (COUNTDOWN ACTIVE)
  // ==========================================
  if (!isLive) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
        <div className="max-w-2xl w-full bg-surface border border-border rounded-2xl shadow-md p-6 sm:p-10 text-center space-y-8 relative overflow-hidden">
          {/* Decorative gradients */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary via-orange-tint to-secondary" />

          {/* Lobby Header */}
          <div className="space-y-2">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-orange-tint text-primary border border-primary/10">
              <Clock className="h-3.5 w-3.5 mr-1.5 animate-pulse" />
              Upcoming Mock Lobby
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
              {companyName} Interview Room
            </h1>
            <p className="text-sm text-text-secondary">
              Meeting your peer <span className="font-bold text-text-primary">{peerName}</span>
            </p>
          </div>

          {/* Countdown Clock Display */}
          {timeLeft ? (
            <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-sm mx-auto">
              {[
                { label: 'Days', val: timeLeft.days },
                { label: 'Hrs', val: timeLeft.hours },
                { label: 'Mins', val: timeLeft.minutes },
                { label: 'Secs', val: timeLeft.seconds },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-background/80 border border-border rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center shadow-inner"
                >
                  <span className="text-xl sm:text-3xl font-extrabold text-primary font-mono tabular-nums leading-none mb-1">
                    {item.val < 10 ? `0${item.val}` : item.val}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-text-secondary text-sm">Initializing room access...</div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto pt-4 border-t border-border">
            <button
              onClick={() => router.push('/sessions')}
              className="px-5 py-2.5 border border-border text-text-secondary hover:text-text-primary rounded-xl text-sm font-semibold transition bg-surface cursor-pointer shadow-sm flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </button>

            <button
              onClick={() => setForceLive(true)}
              className="px-6 py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-sm font-bold transition cursor-pointer shadow-sm hover:shadow shadow-primary/20 flex items-center justify-center"
            >
              <Video className="h-4 w-4 mr-2" />
              Enter Room Early
            </button>
          </div>

          {/* Guidelines / Prep list */}
          <div className="bg-background/40 border border-border/80 rounded-xl p-5 text-left max-w-lg mx-auto space-y-3">
            <h3 className="text-xs font-extrabold text-text-primary tracking-wide uppercase flex items-center">
              <Zap className="h-4 w-4 mr-1.5 text-primary" />
              Pre-Session Checklist:
            </h3>
            <ul className="text-xs text-text-secondary space-y-2 list-disc list-inside">
              <li>Open a notebook or favorite code playground in a separate window.</li>
              <li>Test your microphone, camera, and network speed prior to start.</li>
              <li>Maintain a respectful and learning-centric college peer environment.</li>
              {isInterviewer ? (
                <li className="font-semibold text-primary">
                  Interviewer: Your tailored AI coding hints will render once you enter!
                </li>
              ) : (
                <li>Candidate: The question sheet is hidden from you to simulate a real-world test.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. LIVE-SESSION WORKSPACE STATE (COUNTDOWN ELAPSED / BYPASSED)
  // ==========================================
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans select-none animate-in fade-in duration-300">
      {/* ── HEADER NAVIGATION BAR ── */}
      <header className="h-14 border-b border-border bg-surface px-4 sm:px-6 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleLeaveSession}
            className="p-1.5 rounded-lg border border-border hover:bg-orange-tint/40 text-text-secondary hover:text-text-primary transition cursor-pointer"
            title="Leave Session"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-extrabold text-text-primary leading-tight flex items-center">
              {companyName} Mock
              <span className="ml-2 px-2 py-0.5 text-[9px] font-extrabold rounded-full bg-primary/10 text-primary border border-primary/5">
                {isInterviewer ? 'Interviewer view' : 'Candidate view'}
              </span>
            </h2>
            <p className="text-[10px] text-text-secondary truncate">
              Peer: {peerName}
            </p>
          </div>
        </div>

        {/* Live interview metrics */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-xs font-semibold bg-orange-tint/50 border border-primary/10 text-primary px-3 py-1 rounded-full animate-pulse shadow-inner">
            <Clock className="h-3.5 w-3.5" />
            <span className="font-mono">{elapsedTime}</span>
          </div>

          <button
            onClick={handleLeaveSession}
            className="px-3.5 py-1.5 border border-destructive text-destructive hover:bg-red-50 rounded-lg text-xs font-bold transition cursor-pointer shadow-sm"
          >
            Exit Workspace
          </button>
        </div>
      </header>

      {/* ── MAIN WORKSPACE AREA ── */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* PANEL A: INTERVIEWER-ONLY LEFT QUESTION ACCORDIONS (Width: 28%) */}
        {isInterviewer && (
          <aside className="w-80 border-r border-border bg-surface flex flex-col shrink-0 overflow-y-auto divide-y divide-border hidden md:flex animate-in slide-in-from-left duration-300">
            {/* AI Generation Loading Skeleton */}
            {isAiGenerating ? (
              <div className="p-6 space-y-4 animate-pulse flex-1 flex flex-col justify-center text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-xs font-extrabold text-text-primary">
                  Groq AI is processing hints...
                </p>
                <p className="text-[10px] text-text-secondary">
                  Generating optimal complexities & structure tailored to {companyName}...
                </p>
              </div>
            ) : (
              <>
                {/* 1. Header widget with Candidate Resume if shared */}
                {sessionData.resume_shared && (
                  <div className="p-4 bg-orange-tint/15 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-text-secondary tracking-wider uppercase">
                        Candidate Resume
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-green-tint text-secondary rounded-full font-bold border border-secondary/15">
                        Shared
                      </span>
                    </div>
                    {resumeSignedUrl ? (
                      <a
                        href={resumeSignedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-full py-1.5 border border-primary text-primary hover:bg-orange-tint/80 font-bold rounded-lg text-xs transition cursor-pointer shadow-sm"
                      >
                        <FileText className="h-3.5 w-3.5 mr-2" />
                        Open Candidate Resume
                      </a>
                    ) : (
                      <div className="text-[10px] text-text-secondary italic flex items-center justify-center py-2 bg-background border border-border rounded-lg">
                        <Loader2 className="h-3 w-3 animate-spin mr-1.5 text-primary" />
                        Signing resume bucket url...
                      </div>
                    )}
                  </div>
                )}

                {/* 2. DSA Technical Questions section */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center space-x-1.5 text-xs font-extrabold text-text-primary uppercase tracking-wider pb-1 border-b border-border/60">
                    <Code className="h-4 w-4 text-primary" />
                    <span>DSA Code Questions ({sessionData.questions_json?.dsa?.length || 0})</span>
                  </div>

                  {sessionData.questions_json?.dsa && sessionData.questions_json.dsa.length > 0 ? (
                    <div className="space-y-3">
                      {sessionData.questions_json.dsa.map((q: any) => {
                        const isExpanded = !!expandedDSA[q.id];
                        const isChecked = sessionData.questions_checked?.includes(q.id);

                        return (
                          <div
                            key={q.id}
                            className={`border border-border/80 rounded-xl overflow-hidden transition-all bg-background/30 hover:border-primary/20 ${
                              isChecked ? 'opacity-70 bg-green-tint/10 border-secondary/20' : ''
                            }`}
                          >
                            {/* Card Accordion Trigger */}
                            <div className="p-3 flex items-start gap-2.5">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleQuestion(q.id)}
                                className="mt-0.5 h-3.5 w-3.5 border-border text-primary rounded focus:ring-primary cursor-pointer accent-primary"
                              />

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span
                                    onClick={() => handleToggleQuestion(q.id)}
                                    className={`text-xs font-bold leading-snug cursor-pointer select-none truncate hover:underline ${
                                      isChecked
                                        ? 'line-through text-text-secondary'
                                        : 'text-text-primary'
                                    }`}
                                  >
                                    {q.title}
                                  </span>
                                  <button
                                    onClick={() =>
                                      setExpandedDSA({
                                        ...expandedDSA,
                                        [q.id]: !isExpanded,
                                      })
                                    }
                                    className="p-0.5 hover:bg-orange-tint rounded transition cursor-pointer shrink-0 text-text-secondary"
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="h-3.5 w-3.5" />
                                    ) : (
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Accordion Content (Brute force & Optimal hints) */}
                            {isExpanded && (
                              <div className="px-3 pb-3 pt-1 border-t border-border/60 bg-surface/50 text-[10.5px] space-y-2.5 text-text-secondary leading-relaxed">
                                <div>
                                  <span className="font-extrabold text-primary block mb-0.5">
                                    Brute Force:
                                  </span>
                                  <p>{q.bruteForce}</p>
                                </div>
                                <div className="border-t border-border/40 pt-1.5">
                                  <span className="font-extrabold text-secondary block mb-0.5">
                                    Optimal:
                                  </span>
                                  <p>{q.optimal}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40 font-mono text-[9px]">
                                  <div className="bg-background/80 p-1 rounded border border-border text-center">
                                    <span className="font-bold block text-text-secondary text-[8px]">
                                      Time
                                    </span>
                                    <span className="text-text-primary font-semibold">
                                      {q.timeComplexity}
                                    </span>
                                  </div>
                                  <div className="bg-background/80 p-1 rounded border border-border text-center">
                                    <span className="font-bold block text-text-secondary text-[8px]">
                                      Space
                                    </span>
                                    <span className="text-text-primary font-semibold">
                                      {q.spaceComplexity}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-[10px] text-text-secondary italic">
                      No DSA questions available for this company.
                    </div>
                  )}
                </div>

                {/* 3. behavioral / HR Questions section */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center space-x-1.5 text-xs font-extrabold text-text-primary uppercase tracking-wider pb-1 border-b border-border/60">
                    <Smile className="h-4 w-4 text-primary" />
                    <span>Behavioral & HR</span>
                  </div>

                  {sessionData.questions_json?.hr && sessionData.questions_json.hr.length > 0 ? (
                    <div className="space-y-2.5">
                      {sessionData.questions_json.hr.map((question: string, index: number) => {
                        const qId = `hr_${index}`;
                        const isChecked = sessionData.questions_checked?.includes(qId);

                        return (
                          <div
                            key={qId}
                            className={`p-2.5 border border-border/80 rounded-xl bg-background/30 flex items-start gap-2.5 ${
                              isChecked ? 'opacity-70 bg-green-tint/10 border-secondary/20' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleQuestion(qId)}
                              className="mt-0.5 h-3.5 w-3.5 border-border text-primary rounded focus:ring-primary cursor-pointer accent-primary"
                            />
                            <p
                              onClick={() => handleToggleQuestion(qId)}
                              className={`text-[10.5px] leading-relaxed cursor-pointer select-none ${
                                isChecked
                                  ? 'line-through text-text-secondary'
                                  : 'text-text-primary font-medium'
                              }`}
                            >
                              {question}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-[10px] text-text-secondary italic">
                      No HR questions prepared.
                    </div>
                  )}
                </div>

                {/* 4. project architecture Questions section */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center space-x-1.5 text-xs font-extrabold text-text-primary uppercase tracking-wider pb-1 border-b border-border/60">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span>System & Projects</span>
                  </div>

                  {sessionData.questions_json?.projects &&
                  sessionData.questions_json.projects.length > 0 ? (
                    <div className="space-y-2.5">
                      {sessionData.questions_json.projects.map(
                        (question: string, index: number) => {
                          const qId = `project_${index}`;
                          const isChecked = sessionData.questions_checked?.includes(qId);

                          return (
                            <div
                              key={qId}
                              className={`p-2.5 border border-border/80 rounded-xl bg-background/30 flex items-start gap-2.5 ${
                                isChecked ? 'opacity-70 bg-green-tint/10 border-secondary/20' : ''
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleQuestion(qId)}
                                className="mt-0.5 h-3.5 w-3.5 border-border text-primary rounded focus:ring-primary cursor-pointer accent-primary"
                              />
                              <p
                                onClick={() => handleToggleQuestion(qId)}
                                className={`text-[10.5px] leading-relaxed cursor-pointer select-none ${
                                  isChecked
                                    ? 'line-through text-text-secondary'
                                    : 'text-text-primary font-medium'
                                }`}
                              >
                                {question}
                              </p>
                            </div>
                          );
                        }
                      )}
                    </div>
                  ) : (
                    <div className="text-[10px] text-text-secondary italic">
                      No custom project questions prepared.
                    </div>
                  )}
                </div>
              </>
            )}
          </aside>
        )}

        {/* PANEL B: SHARED VIDEO DIAL-IN ROOM (Width: 25% or 50% or 100%) */}
        <main className="flex-1 bg-surface flex flex-col p-4 overflow-hidden relative">
          {sessionData.daily_room_url ? (
            <div className="flex-1 bg-[#1C1C1A] border border-border rounded-2xl flex flex-col overflow-hidden relative shadow-inner">
              {/* Daily Video calling frame */}
              <iframe
                src={(sessionData.daily_room_url || '').replace('meet.ffmuc.net', 'jitsi.belnet.be').replace('meet.jit.si', 'jitsi.belnet.be')}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                className="w-full flex-1 border-none"
                title={`${companyName} Mock Interview Call`}
              ></iframe>

              {/* Shared Fallback warning footer */}
              <div className="bg-[#252523] px-4 py-2 border-t border-border/20 flex items-center justify-between text-[10px] sm:text-xs text-text-secondary font-medium">
                <span className="flex items-center">
                  <AlertCircle className="h-3.5 w-3.5 mr-1 text-primary" />
                  If video fails to load, please authorize browser camera permissions.
                </span>
                <a
                  href={(sessionData.daily_room_url || '').replace('meet.ffmuc.net', 'jitsi.belnet.be').replace('meet.jit.si', 'jitsi.belnet.be')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-bold hover:underline flex items-center shrink-0 ml-4 cursor-pointer"
                >
                  Open External Room Link
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-background/50 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="bg-orange-tint p-4 rounded-full text-primary w-14 h-14 flex items-center justify-center mx-auto shadow-inner">
                <AlertCircle className="h-6 w-6 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-text-primary">
                  Video Room Link Awaiting Confirmation
                </h3>
                <p className="text-xs text-text-secondary max-w-sm">
                  The Jitsi Meet calling channel is still spinning up. Please hold tight, or reload
                  if it doesn't appear in 15 seconds.
                </p>
              </div>
            </div>
          )}
        </main>

        {/* PANEL C: INTERVIEWER-ONLY RIGHT STRUCTURAL FEEDBACK SLIDERS (Width: 22%) */}
        {isInterviewer && (
          <aside className="w-80 border-l border-border bg-surface flex flex-col shrink-0 overflow-y-auto divide-y divide-border hidden lg:flex animate-in slide-in-from-right duration-300">
            <div className="p-4 bg-orange-tint/15">
              <div className="flex items-center space-x-1.5 text-xs font-extrabold text-text-primary uppercase tracking-wider pb-1 border-b border-border/60">
                <MessageSquarePlus className="h-4 w-4 text-primary" />
                <span>Structured Scoresheet</span>
              </div>
              <p className="text-[10px] text-text-secondary mt-1">
                Provide metrics in real-time. Candidate will see these results once submitted.
              </p>
            </div>

            <form onSubmit={handleSubmitFeedback} className="p-4 flex-1 flex flex-col space-y-4">
              {/* problem solving selector */}
              {renderScoreSelector('Problem Solving', problemSolving, setProblemSolving)}

              {/* communication selector */}
              {renderScoreSelector('Communication & Presentation', communication, setCommunication)}

              {/* code quality selector */}
              {renderScoreSelector('Code Quality & Design', codeQuality, setCodeQuality)}

              {/* clarity of thought selector */}
              {renderScoreSelector('Clarity of Thought', clarity, setClarity)}

              {/* time management selector */}
              {renderScoreSelector('Time Management', timeManagement, setTimeManagement)}

              {/* Written Notes */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-semibold text-text-primary">
                  Constructive Assessment Notes:
                </label>
                <textarea
                  required
                  placeholder="Provide precise details, e.g. 'Strong recursion but struggled with dynamic programming space optimization. Communication was very polished, but code comments could be improved.'"
                  rows={6}
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  className="w-full px-2.5 py-2 bg-background border border-border rounded-xl text-xs text-text-primary placeholder-text-secondary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary leading-relaxed"
                />
              </div>

              {/* Submit evaluation */}
              <button
                type="submit"
                disabled={isSubmittingFeedback}
                className="w-full mt-auto py-2.5 px-4 bg-secondary hover:bg-secondary/95 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-md shadow-secondary/15"
              >
                {isSubmittingFeedback ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                    Finalizing Evaluation...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5 mr-2" />
                    Complete & Submit Feedback
                  </>
                )}
              </button>
            </form>
          </aside>
        )}
      </div>
    </div>
  );
}
