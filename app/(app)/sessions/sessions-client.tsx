'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  Video,
  User,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock3,
  ExternalLink,
  ChevronDown,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';

interface SessionsClientProps {
  initialSessions: any[];
  currentUserId: string;
}

export default function SessionsClient({ initialSessions, currentUserId }: SessionsClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [sessions, setSessions] = useState<any[]>(initialSessions);
  const [activeTab, setActiveTab] = useState<'seeker' | 'helper'>('seeker');
  const [statusFilter, setStatusFilter] = useState('all');

  // Helper review state
  const [selectedSlots, setSelectedSlots] = useState<Record<string, number>>({});
  const [rejectionNotes, setRejectionNotes] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Filter sessions by tab and status
  const filteredSessions = sessions.filter((s) => {
    const isSeeker = s.interviewee_id === currentUserId;
    const isHelper = s.interviewer_id === currentUserId;
    
    if (activeTab === 'seeker' && !isSeeker) return false;
    if (activeTab === 'helper' && !isHelper) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return s.status === 'pending' || s.status === 'slots_rejected';
    if (statusFilter === 'confirmed') return s.status === 'accepted';
    if (statusFilter === 'completed') return s.status === 'completed';
    if (statusFilter === 'cancelled') return s.status === 'cancelled' || s.status === 'expired';
    return true;
  });

  const handleAction = async (
    sessionId: string,
    action: 'accept' | 'slots_rejected' | 'decline',
    slotIndex?: number
  ) => {
    setActionLoading((prev) => ({ ...prev, [sessionId]: true }));
    const toastId = toast.loading(`${action === 'accept' ? 'Confirming slot' : action === 'decline' ? 'Declining request' : 'Sending reschedule request'}...`);

    try {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) throw new Error('Session not found');

      let payload: any = { sessionId, action };

      if (action === 'accept') {
        const index = slotIndex !== undefined ? slotIndex : selectedSlots[sessionId];
        if (index === undefined) {
          toast.error('Please select one of the proposed time slots.', { id: toastId });
          setActionLoading((prev) => ({ ...prev, [sessionId]: false }));
          return;
        }
        payload.slot = session.proposed_slots[index];
      }

      if (action === 'slots_rejected') {
        const note = rejectionNotes[sessionId]?.trim();
        payload.note = note || undefined;
      }

      const response = await fetch('/api/sessions/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update request');

      toast.success(
        action === 'accept'
          ? 'Mock interview confirmed! Daily.co room ready.'
          : action === 'decline'
          ? 'Request declined.'
          : 'Reschedule request sent.',
        { id: toastId }
      );

      // Local update
      const updatedStatus = result.status;
      setSessions(
        sessions.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                status: updatedStatus,
                scheduled_at: action === 'accept' ? new Date(`${payload.slot.date}T${payload.slot.time}`).toISOString() : s.scheduled_at,
                daily_room_url: action === 'accept' ? result.daily_room_url || s.daily_room_url : s.daily_room_url,
                rejection_note: action === 'slots_rejected' ? payload.note : s.rejection_note,
              }
            : s
        )
      );

      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Action failed.', { id: toastId });
    } finally {
      setActionLoading((prev) => ({ ...prev, [sessionId]: false }));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-tint text-primary border border-primary/10">
            <Clock3 className="h-3 w-3 mr-1" />
            Pending Review
          </span>
        );
      case 'slots_rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-tint text-primary border border-primary/10">
            <AlertCircle className="h-3 w-3 mr-1" />
            Reschedule Requested
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-tint text-secondary border border-secondary/10">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Confirmed
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-tint text-secondary border border-secondary/10">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-destructive border border-destructive/10">
            <XCircle className="h-3 w-3 mr-1" />
            Declined
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-text-secondary border border-border">
            <XCircle className="h-3 w-3 mr-1" />
            Expired
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── TABS AND FILTERS ROW ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-border pb-4">
        {/* Role Tabs */}
        <div className="flex space-x-2 bg-orange-tint/40 p-1 rounded-lg border border-border self-start">
          <button
            onClick={() => {
              setActiveTab('seeker');
              setStatusFilter('all');
            }}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
              activeTab === 'seeker'
                ? 'bg-surface text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Practice as Candidate (Seeker)
          </button>
          <button
            onClick={() => {
              setActiveTab('helper');
              setStatusFilter('all');
            }}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
              activeTab === 'helper'
                ? 'bg-surface text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Mentorship as Interviewer (Helper)
          </button>
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-text-secondary hidden sm:inline">Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-surface border border-border rounded-lg text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Sessions</option>
            <option value="pending">Pending Requests</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Declined / Expired</option>
          </select>
        </div>
      </div>

      {/* ── LIST SESSIONS ── */}
      {filteredSessions.length === 0 ? (
        /* Empty State */
        <div className="bg-surface border border-border rounded-xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-sm">
          <div className="bg-orange-tint p-4 rounded-full text-primary w-14 h-14 flex items-center justify-center mx-auto shadow-inner">
            <Calendar className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-text-primary">No sessions found</h2>
            <p className="text-sm text-text-secondary">
              {activeTab === 'seeker'
                ? "You haven't requested any mock interviews yet. Find a peer to practice with!"
                : "You don't have any incoming mock interview requests right now."}
            </p>
          </div>
          {activeTab === 'seeker' && (
            <Link
              href="/search"
              className="inline-flex items-center py-2 px-5 border border-transparent rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary/95 transition cursor-pointer shadow-sm"
            >
              Search available peers
            </Link>
          )}
        </div>
      ) : (
        /* Sessions List Grid */
        <div className="space-y-4">
          {filteredSessions.map((session) => {
            const isSeekerTab = activeTab === 'seeker';
            const peer = isSeekerTab ? session.interviewer : session.interviewee;
            const peerName = peer?.name || 'Your Peer';
            const peerCollege = peer?.college || 'Same College';
            const companyName = session.company?.name || 'Target Company';
            const isPending = session.status === 'pending';
            const isConfirmed = session.status === 'accepted';
            const isCompleted = session.status === 'completed';
            const isLoading = actionLoading[session.id] || false;

            return (
              <div
                key={session.id}
                className="bg-surface border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                {/* Details Column */}
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-sm font-extrabold text-text-primary font-sans">{companyName}</span>
                    <span className="text-text-secondary">·</span>
                    <span className="text-xs text-text-secondary flex items-center">
                      <Briefcase className="h-3.5 w-3.5 mr-1" />
                      {isSeekerTab ? 'Candidate' : 'Interviewer'}
                    </span>
                    {getStatusBadge(session.status)}
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {peerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary">
                        {isSeekerTab ? 'Interviewer' : 'Candidate'}:{' '}
                        <span className="font-semibold text-text-primary">{peerName}</span>
                      </p>
                      <p className="text-[10px] text-text-secondary">{peerCollege}</p>
                    </div>
                  </div>

                  {/* Confirmed Schedule Info */}
                  {isConfirmed && session.scheduled_at && (
                    <div className="bg-green-tint/40 p-2.5 rounded-lg border border-secondary/20 flex items-center space-x-2 text-xs text-secondary font-medium">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Confirmed Time:{' '}
                        {new Date(session.scheduled_at).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}

                  {/* Seeker rejection state display */}
                  {session.status === 'slots_rejected' && isSeekerTab && (
                    <div className="bg-orange-tint p-3 rounded-lg border border-border space-y-1">
                      <p className="text-xs font-semibold text-primary">Reschedule Request received:</p>
                      <p className="text-xs italic text-text-primary">
                        "{session.rejection_note || 'None of these proposed slots worked for me. Please propose different times!'}"
                      </p>
                      <Link
                        href={`/profile/${peer?.id}?request=true`}
                        className="inline-block mt-1 text-xs text-primary font-bold hover:underline"
                      >
                        Propose New Slots &rarr;
                      </Link>
                    </div>
                  )}
                </div>

                {/* Interaction Actions Column */}
                <div className="w-full md:w-auto self-stretch md:self-center flex flex-col items-stretch md:items-end justify-center">
                  
                  {/* HELPER REVIEW FLOW: PENDING ACTIONS */}
                  {isPending && !isSeekerTab && (
                    <div className="space-y-4 p-4 border border-border rounded-xl bg-background/50 w-full md:w-80">
                      <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1">
                          Select Proposed Time Slot:
                        </label>
                        <select
                          value={selectedSlots[session.id] ?? ''}
                          onChange={(e) =>
                            setSelectedSlots({
                              ...selectedSlots,
                              [session.id]: parseInt(e.target.value, 10),
                            })
                          }
                          className="w-full px-2 py-1.5 bg-surface border border-border rounded-md text-xs text-text-primary focus:ring-1 focus:ring-primary"
                        >
                          <option value="">-- Choose Slot --</option>
                          {session.proposed_slots.map((slot: any, idx: number) => (
                            <option key={idx} value={idx}>
                              {slot.date} at {slot.time}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAction(session.id, 'accept')}
                          disabled={isLoading || selectedSlots[session.id] === undefined}
                          className="flex-1 py-1.5 px-3 border border-transparent rounded-md text-xs font-bold text-white bg-secondary hover:bg-secondary/95 disabled:opacity-50 transition cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleAction(session.id, 'decline')}
                          disabled={isLoading}
                          className="py-1.5 px-3 border border-border rounded-md text-xs font-semibold bg-surface text-destructive hover:bg-red-50 disabled:opacity-50 transition cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>

                      <div className="pt-2 border-t border-border space-y-2">
                        <input
                          type="text"
                          maxLength={200}
                          placeholder="Rejection note (Optional)"
                          value={rejectionNotes[session.id] ?? ''}
                          onChange={(e) =>
                            setRejectionNotes({
                              ...rejectionNotes,
                              [session.id]: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1 bg-surface border border-border rounded-md text-[10px] text-text-primary placeholder-text-secondary focus:ring-1 focus:ring-primary"
                        />
                        <button
                          onClick={() => handleAction(session.id, 'slots_rejected')}
                          disabled={isLoading}
                          className="w-full py-1 text-center border border-primary text-primary hover:bg-orange-tint rounded-md text-[10px] font-bold transition cursor-pointer"
                        >
                          Propose Reschedule
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SEEKER PENDING STATUS WAIT */}
                  {isPending && isSeekerTab && (
                    <div className="text-center md:text-right space-y-1">
                      <p className="text-xs text-text-secondary">
                        Proposed {session.proposed_slots.length} time slots. Awaiting peer review...
                      </p>
                      {session.request_note && (
                        <p className="text-[11px] text-text-secondary italic max-w-xs truncate">
                          Note: "{session.request_note}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* ACCEPTED CONFIRMED WORKSPACE BUTTONS */}
                  {isConfirmed && (
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      <Link
                        href={`/session/${session.id}`}
                        className="flex items-center justify-center py-2 px-5 border border-transparent rounded-lg text-xs font-bold text-white bg-primary hover:bg-primary/95 transition duration-150 shadow-sm cursor-pointer"
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Enter Session Screen
                      </Link>
                      
                      {session.daily_room_url && (
                        <a
                          href={session.daily_room_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center py-1 text-center text-[10px] font-semibold text-text-secondary hover:text-primary transition"
                        >
                          <span>Open raw room link</span>
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* COMPLETED INTERVIEW STATUS */}
                  {isCompleted && (
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/sessions?feedback=${session.id}`} // Links to feedback modal we build in Phase 10
                        className="py-2 px-5 border border-primary text-primary hover:bg-orange-tint rounded-lg text-xs font-bold transition shadow-sm text-center cursor-pointer"
                      >
                        View Structured Feedback
                      </Link>
                    </div>
                  )}

                  {/* CANCELLED STATUS */}
                  {(session.status === 'cancelled' || session.status === 'expired') && (
                    <span className="text-xs text-text-secondary italic">
                      Session Terminated
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
