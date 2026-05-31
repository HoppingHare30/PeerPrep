'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Calendar, Clock, X, Plus, Trash2, ShieldAlert } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  slug: string;
}

interface SeekerCompany {
  company_id: string;
  companies: {
    id: string;
    name: string;
    slug: string;
  };
}

interface RequestModalProps {
  helperId: string;
  helperName: string;
  currentUserId: string;
  currentUserHasResume: boolean;
  seekerCompanies: SeekerCompany[];
}

interface ProposedSlot {
  date: string;
  time: string;
}

export default function RequestModal({
  helperId,
  helperName,
  currentUserId,
  currentUserHasResume,
  seekerCompanies
}: RequestModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const isOpen = searchParams.get('request') === 'true';

  const [companyId, setCompanyId] = useState('');
  const [resumeShared, setResumeShared] = useState(false);
  const [requestNote, setRequestNote] = useState('');
  const [proposedSlots, setProposedSlots] = useState<ProposedSlot[]>([
    { date: '', time: '' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Close modal by removing query parameter
  const handleClose = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete('request');
    router.replace(`${window.location.pathname}?${params.toString()}`);
  };

  const handleAddSlot = () => {
    if (proposedSlots.length >= 5) {
      toast.error('You can propose at most 5 slots.');
      return;
    }
    setProposedSlots([...proposedSlots, { date: '', time: '' }]);
  };

  const handleRemoveSlot = (index: number) => {
    if (proposedSlots.length === 1) {
      toast.error('You must propose at least 1 slot.');
      return;
    }
    const updated = [...proposedSlots];
    updated.splice(index, 1);
    setProposedSlots(updated);
  };

  const handleSlotChange = (index: number, field: 'date' | 'time', value: string) => {
    const updated = [...proposedSlots];
    updated[index][field] = value;
    setProposedSlots(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Validations
    if (!companyId) {
      toast.error('Please select your target company.');
      return;
    }

    if (proposedSlots.some(slot => !slot.date || !slot.time)) {
      toast.error('Please fill in all date and time slots.');
      return;
    }

    // Past date checks
    const now = new Date();
    const hasPastSlots = proposedSlots.some(slot => {
      const slotDate = new Date(`${slot.date}T${slot.time}`);
      return slotDate < now;
    });

    if (hasPastSlots) {
      toast.error('All proposed time slots must be in the future.');
      return;
    }

    if (resumeShared && !currentUserHasResume) {
      toast.error('You do not have a resume uploaded. Please go to Settings to upload one first.');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Sending mock interview request...');

    try {
      // 2. Prevent duplicates: check if a pending session already exists
      const { data: duplicate, error: dupError } = await supabase
        .from('sessions')
        .select('id')
        .eq('interviewee_id', currentUserId)
        .eq('interviewer_id', helperId)
        .eq('company_id', companyId)
        .eq('status', 'pending')
        .limit(1);

      if (dupError) throw dupError;

      if (duplicate && duplicate.length > 0) {
        toast.error('You already have a pending request with this user for this company.', { id: toastId });
        setIsLoading(false);
        return;
      }

      // 3. Create Session Record
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          interviewee_id: currentUserId,
          interviewer_id: helperId,
          company_id: companyId,
          status: 'pending',
          proposed_slots: proposedSlots,
          resume_shared: resumeShared,
          request_note: requestNote.trim() || null,
        })
        .select('id, company:company_id(name)')
        .single();

      if (sessionError || !sessionData) {
        throw sessionError || new Error('Failed to create session request.');
      }

      // 4. Create in-app notification for the Helper
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: helperId,
          type: 'session_request',
          message: `New mock request received! Your peer wants to practice an interview for ${(sessionData.company as any).name}.`,
          session_id: sessionData.id,
        });

      if (notifError) {
        console.error('Failed to create in-app notification:', notifError);
      }

      // 5. Send Email via API or Resend Client helper (Invoked client side via API or direct payload)
      // Since email needs to fetch helper email safely, we can do it via a Route Handler or directly in our function.
      // A dedicated server route makes it secure: let's fetch helper email and send.
      try {
        const { data: helperProfile } = await supabase
          .from('users')
          .select('email, name')
          .eq('id', helperId)
          .single();

        const { data: seekerProfile } = await supabase
          .from('users')
          .select('name')
          .eq('id', currentUserId)
          .single();

        if (helperProfile?.email) {
          // Trigger a fetch to `/api/notifications/request` or send direct using helper credentials if needed
          // For MVP, we can fetch an endpoint or handle it inside a Next.js Server Action / API Route.
          // Let's call a post fetch to a secure email dispatcher!
          await fetch('/api/api/email/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              helperEmail: helperProfile.email,
              helperName: helperProfile.name,
              seekerName: seekerProfile?.name || 'Your Peer',
              companyName: (sessionData.company as any).name,
              note: requestNote.trim() || undefined,
            }),
          }).catch(err => console.error('Silent email fetch err:', err));
        }
      } catch (emailErr) {
        console.error('Failed to dispatch request email:', emailErr);
      }

      toast.success('Interview request sent successfully!', { id: toastId });
      handleClose();
      router.push('/sessions');
    } catch (err: any) {
      toast.error(err.message || 'Request failed. Please try again.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-surface border border-border w-full max-w-lg rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="text-lg font-bold text-text-primary">Request Mock Interview</h3>
            <p className="text-xs text-text-secondary">Propose slots to {helperName}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-text-secondary hover:bg-orange-tint hover:text-primary transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Target Company Select */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary">Target Company</label>
            <select
              required
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
            >
              <option value="">-- Select Target Company --</option>
              {seekerCompanies.map((c) => (
                <option key={c.company_id} value={c.companies.id}>
                  {c.companies.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-text-secondary">
              *Populated from your own targeted company profile.
            </p>
          </div>

          {/* Time Slots proposing (1 to 5) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-text-secondary">Propose Time Slots</label>
              <button
                type="button"
                onClick={handleAddSlot}
                className="inline-flex items-center text-xs font-bold text-primary hover:text-primary/80 transition cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-0.5" />
                Add Slot
              </button>
            </div>

            <div className="space-y-2">
              {proposedSlots.map((slot, index) => (
                <div key={index} className="flex items-center space-x-2 bg-background/50 p-2 border border-border rounded-lg shadow-sm">
                  {/* Date Input */}
                  <div className="flex-1 relative flex items-center">
                    <Calendar className="absolute left-2.5 h-4 w-4 text-text-secondary" />
                    <input
                      type="date"
                      required
                      value={slot.date}
                      onChange={(e) => handleSlotChange(index, 'date', e.target.value)}
                      className="w-full pl-9 pr-2 py-1.5 bg-surface border border-border rounded-md text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Time Input */}
                  <div className="flex-1 relative flex items-center">
                    <Clock className="absolute left-2.5 h-4 w-4 text-text-secondary" />
                    <input
                      type="time"
                      required
                      value={slot.time}
                      onChange={(e) => handleSlotChange(index, 'time', e.target.value)}
                      className="w-full pl-9 pr-2 py-1.5 bg-surface border border-border rounded-md text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveSlot(index)}
                    disabled={proposedSlots.length === 1}
                    className="p-1.5 text-destructive hover:bg-destructive/5 rounded-md transition disabled:opacity-30 cursor-pointer"
                    title="Remove slot"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Resume Sharing toggle */}
          <div className="pt-2">
            <div className="flex items-center justify-between p-3 border border-border rounded-xl bg-orange-tint/20">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-text-primary block">Share Resume</span>
                <span className="text-[11px] text-text-secondary block">
                  {currentUserHasResume 
                    ? 'Allows interviewer to view your PDF resume.' 
                    : 'Upload a resume in Settings first to enable.'}
                </span>
              </div>
              <input
                type="checkbox"
                disabled={!currentUserHasResume}
                checked={resumeShared}
                onChange={(e) => setResumeShared(e.target.checked)}
                className="h-5 w-5 rounded border-border text-primary focus:ring-primary h-5 w-5 cursor-pointer disabled:opacity-50"
              />
            </div>
            {!currentUserHasResume && (
              <p className="mt-1 text-[11px] text-destructive flex items-center">
                <ShieldAlert className="h-3 w-3 mr-1" />
                No resume uploaded. Sharing is disabled.
              </p>
            )}
          </div>

          {/* Request Note */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary">Optional Note</label>
            <textarea
              maxLength={500}
              value={requestNote}
              onChange={(e) => setRequestNote(e.target.value)}
              placeholder="Provide context, target role details, or projects you want them to review... (max 500 chars)"
              rows={3}
              className="mt-1 block w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary placeholder-text-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
            />
            <span className="text-[10px] text-text-secondary block text-right mt-1">
              {requestNote.length}/500 chars
            </span>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-border flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="py-2 px-4 border border-border rounded-lg text-sm font-semibold text-text-primary hover:bg-orange-tint transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !companyId}
              className="py-2 px-6 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary/95 transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
