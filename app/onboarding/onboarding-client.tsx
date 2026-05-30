'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PREDEFINED_COMPANIES } from '@/constants/companies';
import { USER_ROLES, type UserRole } from '@/constants/roles';
import { toast } from 'sonner';

interface OnboardingClientProps {
  initialName: string;
  userId: string;
}

interface AddedCompany {
  companyId: string;
  companyName: string;
  role: UserRole;
  type: 'targeting' | 'experienced';
}

export default function OnboardingClient({ initialName, userId }: OnboardingClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1 State
  const [name, setName] = useState(initialName);
  const [gradYear, setGradYear] = useState('');

  // Step 2 State
  const [addedCompanies, setAddedCompanies] = useState<AddedCompany[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('SDE');
  const [selectedType, setSelectedType] = useState<'targeting' | 'experienced'>('targeting');

  // Step 3 State
  const [skillsText, setSkillsText] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  // Navigation handlers
  const nextStep = () => {
    if (step === 1) {
      if (!name.trim()) {
        toast.error('Please enter your name.');
        return;
      }
      const year = parseInt(gradYear, 10);
      if (isNaN(year) || year < 2020 || year > 2035) {
        toast.error('Please enter a valid graduation year (e.g., 2026).');
        return;
      }
    }
    if (step === 2) {
      if (addedCompanies.length === 0) {
        toast.error('Please select and add at least one company.');
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  // Company management
  const handleAddCompany = () => {
    if (!selectedCompanyId) {
      toast.error('Please select a company.');
      return;
    }

    const companyObj = PREDEFINED_COMPANIES.find(c => c.slug === selectedCompanyId);
    if (!companyObj) return;

    // Check duplicate
    const isDuplicate = addedCompanies.some(
      c => c.companyId === selectedCompanyId && c.role === selectedRole
    );

    if (isDuplicate) {
      toast.error('You have already added this company and role combination.');
      return;
    }

    setAddedCompanies([
      ...addedCompanies,
      {
        companyId: selectedCompanyId,
        companyName: companyObj.name,
        role: selectedRole,
        type: selectedType,
      },
    ]);

    // Reset inputs
    setSelectedCompanyId('');
    toast.success(`Added ${companyObj.name} to your profile.`);
  };

  const handleRemoveCompany = (index: number) => {
    const updated = [...addedCompanies];
    updated.splice(index, 1);
    setAddedCompanies(updated);
  };

  // Skill management
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

  // File upload validation
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
    toast.success(`Uploaded: ${file.name}`);
  };

  // Onboarding submission
  const handleFinish = async () => {
    setIsLoading(true);
    const toastId = toast.loading('Finalizing onboarding...');

    try {
      let resumeUrl = '';

      // 1. Upload resume to private bucket if selected
      if (resumeFile) {
        const fileExt = resumeFile.name.split('.').pop();
        const filePath = `resumes/${userId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(filePath, resumeFile);

        if (uploadError) {
          throw new Error(`Resume upload failed: ${uploadError.message}`);
        }
        
        resumeUrl = filePath;
      }

      // 2. Insert company-role mappings sequentially
      for (const item of addedCompanies) {
        // Resolve company UUID
        const { data: companyRecord } = await supabase
          .from('companies')
          .select('id')
          .eq('slug', item.companyId)
          .single();

        if (companyRecord) {
          const { error: assocError } = await supabase
            .from('user_companies')
            .insert({
              user_id: userId,
              company_id: companyRecord.id,
              role: item.role,
              type: item.type,
            });

          if (assocError) {
            throw assocError;
          }
        }
      }

      // 3. Update public.users profile
      const { error: profileError } = await supabase
        .from('users')
        .update({
          name: name.trim(),
          graduation_year: parseInt(gradYear, 10),
          skills: skills,
          resume_url: resumeUrl || null,
          onboarding_complete: true,
          availability: true, // Default ON at onboarding completion
        })
        .eq('id', userId);

      if (profileError) {
        throw profileError;
      }

      toast.success('Onboarding complete! Welcome to PeerPrep.', { id: toastId });
      router.refresh();
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Onboarding failed. Please try again.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Tracker */}
      <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
        {[1, 2, 3].map((num) => (
          <div key={num} className="flex items-center space-x-2">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                step === num
                  ? 'bg-primary text-white'
                  : step > num
                  ? 'bg-secondary text-white'
                  : 'bg-orange-tint text-text-secondary'
              }`}
            >
              {num}
            </div>
            <span
              className={`text-xs font-medium hidden sm:inline ${
                step === num ? 'text-primary' : 'text-text-secondary'
              }`}
            >
              {num === 1 ? 'Profile Info' : num === 2 ? 'Target Companies' : 'Skills & Resume'}
            </span>
          </div>
        ))}
      </div>

      {/* STEP 1: Basic Information */}
      {step === 1 && (
        <div className="space-y-4">
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
              placeholder="e.g., 2026"
              className="mt-1 block w-full px-3 py-2 bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
            />
          </div>

          <div className="pt-4">
            <button
              onClick={nextStep}
              className="w-full py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-primary hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-primary transition cursor-pointer"
            >
              Next: Companies & Roles
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Company Selection */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-orange-tint p-4 rounded-lg border border-border text-sm text-text-primary">
            Select the companies you want to practice mock interviews for (targeting) or that you have already interviewed with (experienced).
          </div>

          <div className="grid grid-cols-1 gap-4 p-4 border border-border rounded-lg bg-surface">
            <div>
              <label className="block text-sm font-medium text-text-secondary">Select Company</label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Choose a Company --</option>
                {PREDEFINED_COMPANIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary">Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="mt-1 block w-full px-3 py-2 bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {USER_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary">Status</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as 'targeting' | 'experienced')}
                  className="mt-1 block w-full px-3 py-2 bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="targeting">Targeting</option>
                  <option value="experienced">Experienced</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddCompany}
              className="mt-2 w-full py-2 px-4 border border-primary text-primary hover:bg-orange-tint rounded-md text-sm font-medium transition cursor-pointer"
            >
              + Add Company Entry
            </button>
          </div>

          {/* List of Added Companies */}
          {addedCompanies.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-text-primary">Your Selections:</h3>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {addedCompanies.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 border border-border rounded-lg bg-surface shadow-sm"
                  >
                    <div>
                      <span className="font-semibold text-text-primary">{item.companyName}</span>
                      <span className="mx-2 text-text-secondary">·</span>
                      <span className="text-sm text-text-secondary">{item.role}</span>
                      <span className="ml-3 px-2 py-0.5 rounded text-xs font-semibold inline-block border border-transparent bg-orange-tint text-primary">
                        {item.type === 'targeting' ? 'Targeting' : 'Experienced'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveCompany(idx)}
                      className="text-destructive hover:text-destructive/80 text-sm font-medium cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-4 pt-4">
            <button
              onClick={prevStep}
              className="flex-1 py-2 px-4 border border-border rounded-md text-sm font-medium bg-surface text-text-primary hover:bg-orange-tint transition cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={nextStep}
              className="flex-grow py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-primary hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-primary transition cursor-pointer"
            >
              Next: Skills & Resume
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Skills & Resume */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Skills Input */}
          <div>
            <label className="block text-sm font-medium text-text-secondary">Skills & Keywords</label>
            <input
              type="text"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              onKeyDown={handleAddSkill}
              placeholder="e.g. React, Node, Python (Press Enter to add)"
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
                      className="ml-1.5 inline-flex items-center justify-center text-primary/70 hover:text-primary font-bold cursor-pointer"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Resume Upload */}
          <div className="pt-2">
            <label className="block text-sm font-medium text-text-secondary">
              Upload Resume (Optional, PDF format only, max 5MB)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-lg bg-surface">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-text-secondary"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v28a4 4 0 004 4h22a4 4 0 004-4V20L28 8z"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M28 8v12h12M16 28h16M16 32h16"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-text-secondary justify-center">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-surface rounded-md font-semibold text-primary hover:text-primary/80 focus-within:outline-none"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-text-secondary">PDF up to 5MB</p>
                {resumeFile && (
                  <p className="text-sm font-semibold text-secondary mt-2">
                    ✓ {resumeFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex space-x-4 pt-4">
            <button
              onClick={prevStep}
              disabled={isLoading}
              className="flex-1 py-2 px-4 border border-border rounded-md text-sm font-medium bg-surface text-text-primary hover:bg-orange-tint transition disabled:opacity-50 cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={handleFinish}
              disabled={isLoading || addedCompanies.length === 0}
              className="flex-grow py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-primary hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-primary transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Finalizing...' : 'Finish Onboarding'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
