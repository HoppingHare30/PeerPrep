'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PREDEFINED_COMPANIES } from '@/constants/companies';
import { USER_ROLES, type UserRole } from '@/constants/roles';
import { toast } from 'sonner';
import { User, Briefcase, FileText, CheckCircle, Plus, Trash2, Power } from 'lucide-react';

interface InitialProfile {
  name: string;
  graduationYear: number;
  skills: string[];
  resumeUrl: string;
  availability: boolean;
}

interface CompanyRole {
  id: string;
  role: string;
  type: string;
  company_id: string;
  companies: {
    name: string;
    slug: string;
  };
}

interface SettingsClientProps {
  userId: string;
  initialProfile: InitialProfile;
  initialCompanyRoles: any[];
}

export default function SettingsClient({
  userId,
  initialProfile,
  initialCompanyRoles
}: SettingsClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(false);

  // Profile Form States
  const [name, setName] = useState(initialProfile.name);
  const [gradYear, setGradYear] = useState(String(initialProfile.graduationYear));
  const [availability, setAvailability] = useState(initialProfile.availability);
  const [skillsText, setSkillsText] = useState('');
  const [skills, setSkills] = useState<string[]>(initialProfile.skills);

  // Resume Upload State
  const [resumeUrl, setResumeUrl] = useState(initialProfile.resumeUrl);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  // Company-Roles mappings list state
  const [companyRoles, setCompanyRoles] = useState<any[]>(initialCompanyRoles);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('SDE');
  const [selectedType, setSelectedType] = useState<'targeting' | 'experienced'>('targeting');
  const [isAddingCompany, setIsAddingCompany] = useState(false);

  // Toggle availability status
  const handleToggleAvailability = async () => {
    const newStatus = !availability;
    setAvailability(newStatus); // Optimistic Update

    try {
      const { error } = await supabase
        .from('users')
        .update({ availability: newStatus })
        .eq('id', userId);

      if (error) throw error;
      toast.success(newStatus ? 'Your profile is now visible to peers!' : 'Your profile is hidden from search.');
      router.refresh();
    } catch (err) {
      setAvailability(!newStatus); // Rollback
      toast.error('Failed to toggle availability.');
    }
  };

  // Add a company mapping (user_companies insert)
  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId) {
      toast.error('Please select a company.');
      return;
    }

    const companyObj = PREDEFINED_COMPANIES.find(c => c.slug === selectedCompanyId);
    if (!companyObj) return;

    // Check duplicate locally
    const isDuplicate = companyRoles.some(
      entry => entry.companies.slug === selectedCompanyId && entry.role === selectedRole
    );

    if (isDuplicate) {
      toast.error('You have already added this company and role combination.');
      return;
    }

    setIsAddingCompany(true);
    const toastId = toast.loading(`Adding ${companyObj.name} mapping...`);

    try {
      // 1. Resolve company ID
      const { data: companyRecord, error: fetchErr } = await supabase
        .from('companies')
        .select('id')
        .eq('slug', selectedCompanyId)
        .single();

      if (fetchErr || !companyRecord) {
        throw new Error('Failed to resolve company details.');
      }

      // 2. Insert user_companies mapping
      const { data, error: insertErr } = await supabase
        .from('user_companies')
        .insert({
          user_id: userId,
          company_id: companyRecord.id,
          role: selectedRole,
          type: selectedType,
        })
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
        .single();

      if (insertErr || !data) {
        throw insertErr || new Error('Failed to save mapping.');
      }

      setCompanyRoles([data, ...companyRoles]);
      setSelectedCompanyId('');
      toast.success(`Successfully added ${companyObj.name} mapping!`, { id: toastId });
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add company mapping.', { id: toastId });
    } finally {
      setIsAddingCompany(false);
    }
  };

  // Delete a company mapping (user_companies delete)
  const handleDeleteCompany = async (id: string, name: string) => {
    const toastId = toast.loading(`Removing ${name} mapping...`);
    try {
      const { error } = await supabase
        .from('user_companies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCompanyRoles(companyRoles.filter(c => c.id !== id));
      toast.success(`Successfully removed ${name} mapping!`, { id: toastId });
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove mapping.', { id: toastId });
    }
  };

  // Resume PDF uploading
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are supported.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5MB limit.');
      return;
    }

    setResumeFile(file);
    toast.success(`Selected resume: ${file.name}`);
  };

  // Delete resume entirely from storage and DB
  const handleDeleteResume = async () => {
    if (!resumeUrl) return;
    const toastId = toast.loading('Deleting resume...');

    try {
      // 1. Delete from Supabase Storage bucket
      const { error: storageError } = await supabase.storage
        .from('resumes')
        .remove([resumeUrl]);

      if (storageError) {
        throw storageError;
      }

      // 2. Update public.users database
      const { error: dbError } = await supabase
        .from('users')
        .update({ resume_url: null })
        .eq('id', userId);

      if (dbError) {
        throw dbError;
      }

      setResumeUrl('');
      setResumeFile(null);
      toast.success('Resume deleted successfully!', { id: toastId });
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete resume.', { id: toastId });
    }
  };

  // Skills input helper
  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const cleanSkill = skillsText.trim().replace(/,$/, '');
      if (cleanSkill && !skills.includes(cleanSkill)) {
        setSkills([...skills, cleanSkill]);
        setSkillsText('');
      }
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  // Submit complete profile update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }
    const year = parseInt(gradYear, 10);
    if (isNaN(year) || year < 2020 || year > 2035) {
      toast.error('Please enter a valid graduation year (e.g., 2026).');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Saving profile changes...');

    try {
      let finalResumeUrl = resumeUrl;

      // Upload new resume file if selected
      if (resumeFile) {
        // Remove existing file if there was one
        if (resumeUrl) {
          await supabase.storage.from('resumes').remove([resumeUrl]);
        }

        const fileExt = resumeFile.name.split('.').pop();
        const filePath = `resumes/${userId}/${Date.now()}.${fileExt}`;

        const { error: uploadErr } = await supabase.storage
          .from('resumes')
          .upload(filePath, resumeFile);

        if (uploadErr) {
          throw new Error(`Resume upload failed: ${uploadErr.message}`);
        }

        finalResumeUrl = filePath;
        setResumeUrl(filePath);
        setResumeFile(null);
      }

      // Update public.users table
      const { error: dbErr } = await supabase
        .from('users')
        .update({
          name: name.trim(),
          graduation_year: year,
          skills: skills,
          resume_url: finalResumeUrl || null,
        })
        .eq('id', userId);

      if (dbErr) throw dbErr;

      toast.success('Profile settings updated successfully!', { id: toastId });
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save changes.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ── LEFT PANEL: BASIC DETAILS (2/3 width) ── */}
      <div className="lg:col-span-2 space-y-6">
        <form onSubmit={handleSaveProfile} className="bg-surface border border-border rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-border">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-text-primary">Personal Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary">Graduation Year</label>
              <input
                type="number"
                required
                value={gradYear}
                onChange={(e) => setGradYear(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Skills Keywords */}
          <div>
            <label className="block text-sm font-medium text-text-secondary">Skills & Keywords</label>
            <input
              type="text"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              onKeyDown={handleAddSkill}
              placeholder="Type skill and press Enter"
              className="mt-1 block w-full px-3 py-2 bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary transition"
            />
            {skills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-tint text-primary border border-border"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-1.5 inline-flex items-center justify-center text-primary/70 hover:text-primary font-bold"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Resume Upload Panel */}
          <div className="pt-2">
            <label className="block text-sm font-medium text-text-secondary">Resume PDF (Optional)</label>
            
            {resumeUrl ? (
              <div className="mt-1 flex items-center justify-between p-4 border border-border rounded-lg bg-orange-tint/20">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-text-primary block">Resume Uploaded</span>
                    <span className="text-xs text-text-secondary block">PDF available for shared mocks</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteResume}
                  className="flex items-center space-x-1.5 py-1.5 px-3 border border-destructive/20 text-destructive hover:bg-destructive/5 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Resume</span>
                </button>
              </div>
            ) : (
              <div className="mt-1 flex items-center justify-between p-4 border-2 border-border border-dashed rounded-lg bg-surface text-center justify-center py-6">
                <div className="space-y-1">
                  <div className="text-xs text-text-secondary justify-center flex">
                    <label
                      htmlFor="settings-file-upload"
                      className="relative cursor-pointer bg-surface rounded-md font-semibold text-primary hover:text-primary/80 focus-within:outline-none"
                    >
                      <span>Upload PDF Resume</span>
                      <input
                        id="settings-file-upload"
                        name="settings-file-upload"
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">up to 5MB</p>
                  </div>
                  {resumeFile && (
                    <p className="text-xs font-semibold text-secondary mt-1">
                      ✓ Selected: {resumeFile.name}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="py-2.5 px-6 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-primary transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* ── RIGHT PANEL: AVAILABILITY & COMPANIES (1/3 width) ── */}
      <div className="space-y-6">
        {/* Availability Toggle Block */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-border">
            <CheckCircle className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-text-primary">Search Availability</h2>
          </div>

          <div className="flex items-center justify-between bg-orange-tint p-4 rounded-xl border border-border shadow-sm">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-text-primary block">Search Visibility</span>
              <span className={`text-[10px] font-bold ${availability ? 'text-secondary' : 'text-text-secondary'}`}>
                {availability ? 'VISIBLE (ON)' : 'HIDDEN (OFF)'}
              </span>
            </div>
            <button
              onClick={handleToggleAvailability}
              className={`p-2.5 rounded-full transition duration-150 cursor-pointer ${
                availability 
                  ? 'bg-secondary text-white shadow-sm' 
                  : 'bg-surface border border-border text-text-secondary'
              }`}
              title="Toggle visibility"
            >
              <Power className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-text-secondary leading-normal">
            When VISIBLE, peers from your college can search for you and send mock interview requests. Turn OFF if you are currently occupied.
          </p>
        </div>

        {/* Company Mappings CRUD Block */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-border">
            <Briefcase className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-text-primary">Companies & Roles</h2>
          </div>

          {/* Add Company Form */}
          <form onSubmit={handleAddCompany} className="space-y-3 p-3 border border-border rounded-lg bg-background/50">
            <div>
              <label className="block text-xs font-semibold text-text-secondary">Company</label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="mt-1 block w-full px-2 py-1.5 bg-surface border border-border rounded-md text-text-primary text-xs"
              >
                <option value="">-- Select Company --</option>
                {PREDEFINED_COMPANIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-text-secondary">Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="mt-1 block w-full px-2 py-1.5 bg-surface border border-border rounded-md text-text-primary text-xs"
                >
                  {USER_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary">Status</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as 'targeting' | 'experienced')}
                  className="mt-1 block w-full px-2 py-1.5 bg-surface border border-border rounded-md text-text-primary text-xs"
                >
                  <option value="targeting">Targeting</option>
                  <option value="experienced">Experienced</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isAddingCompany || !selectedCompanyId}
              className="w-full flex items-center justify-center py-1.5 border border-transparent bg-primary hover:bg-primary/95 text-white rounded-md text-xs font-bold transition disabled:opacity-50 cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Mapping
            </button>
          </form>

          {/* List of Mapped Companies */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-text-primary">Current Companies:</h3>
            
            {companyRoles.length === 0 ? (
              <p className="text-xs italic text-text-secondary">No companies listed.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {companyRoles.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-2.5 border border-border rounded-lg bg-surface shadow-sm"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-text-primary block truncate">
                        {entry.companies.name}
                      </span>
                      <span className="text-[10px] text-text-secondary block">
                        {entry.role} · {entry.type === 'experienced' ? 'Experienced' : 'Targeting'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCompany(entry.id, entry.companies.name)}
                      className="p-1 text-destructive hover:bg-destructive/5 rounded transition cursor-pointer"
                      title="Delete mapping"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
