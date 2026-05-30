import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Briefcase, FileText, ArrowLeft, Settings, CalendarRange } from 'lucide-react';

interface ProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id: profileId } = await params;
  const supabase = await createClient();

  // 1. Fetch current logged in user
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) {
    redirect('/login');
  }

  // 2. Fetch the target profile
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, name, email, college, graduation_year, skills, resume_url, availability')
    .eq('id', profileId)
    .single();

  if (profileError || !profile) {
    notFound();
  }

  // 3. Fetch the logged in user's college domain to verify same-college scope constraint
  const { data: currentUserProfile } = await supabase
    .from('users')
    .select('college')
    .eq('id', currentUser.id)
    .single();

  const isOwner = currentUser.id === profile.id;
  const isSameCollege = currentUserProfile?.college === profile.college;

  // Enforce same-college visibility scoping, returning 404/Not Found for cross-college links
  if (!isOwner && !isSameCollege) {
    notFound();
  }

  // 4. Fetch the company-role entries for this user
  const { data: companyRoles } = await supabase
    .from('user_companies')
    .select(`
      id,
      role,
      type,
      company_id,
      companies (
        name,
        slug
      )
    `)
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false });

  // 5. Generate signed resume URL if the viewer is the owner
  let signedResumeUrl = '';
  if (isOwner && profile.resume_url) {
    const { data: signedData } = await supabase.storage
      .from('resumes')
      .createSignedUrl(profile.resume_url, 60 * 60 * 2); // 2 hours expiry
    
    if (signedData) {
      signedResumeUrl = signedData.signedUrl;
    }
  }

  const nameLetter = profile.name.charAt(0).toUpperCase();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back CTA Button */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center text-sm font-semibold text-text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Dashboard
        </Link>

        {isOwner && (
          <Link
            href="/profile/settings"
            className="flex items-center text-sm font-semibold text-primary hover:text-primary/80 transition-colors border border-primary/20 bg-orange-tint/40 px-3 py-1.5 rounded-lg shadow-sm"
          >
            <Settings className="h-4 w-4 mr-1.5" />
            Edit Profile Settings
          </Link>
        )}
      </div>

      {/* Main Profile Grid Card */}
      <div className="bg-surface border border-border rounded-xl p-8 sm:p-10 shadow-sm space-y-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 pb-6 border-b border-border">
          {/* Avatar and Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
            <div className="h-20 w-20 rounded-full bg-primary text-white flex items-center justify-center font-bold text-3xl border-2 border-border shadow-sm">
              {nameLetter}
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-text-primary tracking-tight font-sans">
                {profile.name}
              </h2>
              <p className="text-sm font-medium text-text-secondary flex items-center justify-center sm:justify-start">
                <MapPin className="h-4 w-4 mr-1.5 text-primary/75" />
                {profile.college}
                <span className="mx-2">·</span>
                Class of {profile.graduation_year || 'N/A'}
              </p>

              {/* Availability Indicator */}
              <div className="pt-1">
                <span
                  className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold border ${
                    profile.availability
                      ? 'bg-green-tint text-secondary border-secondary/20'
                      : 'bg-orange-tint/40 text-text-secondary border-border'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full mr-2 ${
                      profile.availability ? 'bg-secondary animate-pulse' : 'bg-text-secondary'
                    }`}
                  />
                  {profile.availability ? 'Available for Mock Interviews' : 'Not Available'}
                </span>
              </div>
            </div>
          </div>

          {/* Action CTA for viewing other profiles */}
          {!isOwner && (
            <div className="w-full sm:w-auto pt-4 sm:pt-0">
              {profile.availability ? (
                <Link
                  href={`/profile/${profile.id}?request=true`}
                  className="w-full sm:w-auto flex items-center justify-center py-2.5 px-5 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary/95 transition duration-150 cursor-pointer"
                >
                  <CalendarRange className="h-5 w-5 mr-2" />
                  Request Mock Interview
                </Link>
              ) : (
                <button
                  disabled
                  className="w-full sm:w-auto flex items-center justify-center py-2.5 px-5 border border-border rounded-lg bg-orange-tint/30 text-sm font-semibold text-text-secondary cursor-not-allowed"
                >
                  Interviews Disabled
                </button>
              )}
            </div>
          )}
        </div>

        {/* Company Experience & Goals Grid */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-text-primary tracking-tight">
            Target & Experienced Companies
          </h3>
          
          {!companyRoles || companyRoles.length === 0 ? (
            <p className="text-sm italic text-text-secondary">No company entries added yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {companyRoles.map((entry: any) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 border border-border rounded-xl bg-background/50 shadow-sm"
                >
                  <div className="space-y-1">
                    <span className="font-semibold text-text-primary text-sm">
                      {entry.companies.name}
                    </span>
                    <p className="text-xs text-text-secondary flex items-center">
                      <Briefcase className="h-3 w-3 mr-1 opacity-70" />
                      Role: {entry.role}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      entry.type === 'experienced'
                        ? 'bg-green-tint text-secondary border-secondary/20'
                        : 'bg-orange-tint text-primary border-primary/20'
                    }`}
                  >
                    {entry.type === 'experienced' ? 'Interviewed / Experienced' : 'Targeting'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skills Tag Section */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-lg font-bold text-text-primary tracking-tight">Skills & Tech Stack</h3>
          {!profile.skills || profile.skills.length === 0 ? (
            <p className="text-sm italic text-text-secondary">No skills listed yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-tint/40 text-text-secondary border border-border"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Resume Section */}
        {profile.resume_url && (
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-lg font-bold text-text-primary tracking-tight">Resume</h3>
            <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-orange-tint/20">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <span className="text-sm font-semibold text-text-primary block">Resume PDF</span>
                  <span className="text-xs text-text-secondary block">
                    {isOwner ? 'Your uploaded resume' : 'Resume shared for upcoming mocks'}
                  </span>
                </div>
              </div>
              
              {isOwner && signedResumeUrl ? (
                <a
                  href={signedResumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1.5 px-4 border border-primary text-primary hover:bg-orange-tint rounded-lg text-xs font-bold transition shadow-sm"
                >
                  View / Download PDF
                </a>
              ) : (
                <span className="text-xs text-text-secondary font-medium italic">
                  Private storage bucket access
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
