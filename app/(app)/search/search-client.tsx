'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PREDEFINED_COMPANIES } from '@/constants/companies';
import { USER_ROLES } from '@/constants/roles';
import UserCard from '@/components/search/user-card';
import { Search, RotateCcw, Copy, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SearchClientProps {
  currentUserId: string;
  currentUserCollege: string;
}

export default function SearchClient({ currentUserId, currentUserCollege }: SearchClientProps) {
  const supabase = createClient();

  // Filter States
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedType, setSelectedType] = useState('');
  
  // Data States
  const [peers, setPeers] = useState<any[]>([]);
  const [isFirstFromCollege, setIsFirstFromCollege] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPeers = async () => {
    setIsLoading(true);
    try {
      // 1. First, check if there are ANY available users from the same college (to determine the "First from college" empty state)
      const { count, error: countErr } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('college', currentUserCollege)
        .eq('availability', true)
        .neq('id', currentUserId);

      if (countErr) throw countErr;
      
      const collegeHasPeers = (count || 0) > 0;
      setIsFirstFromCollege(!collegeHasPeers);

      if (!collegeHasPeers) {
        setPeers([]);
        setIsLoading(false);
        return;
      }

      // 2. Query peers with active filters
      let selectQuery = 'id, name, college, graduation_year, skills, availability';
      const hasFilters = selectedCompany || selectedRole || selectedType;

      if (hasFilters) {
        // Use inner join constraint in PostgREST to filter out users that don't match the selected company mapping
        selectQuery += `, user_companies!inner(id, role, type, companies!inner(name, slug))`;
      } else {
        // Standard outer join when no company filter is applied
        selectQuery += `, user_companies(id, role, type, companies(name, slug))`;
      }

      let query = supabase
        .from('users')
        .select(selectQuery)
        .eq('college', currentUserCollege)
        .eq('availability', true)
        .neq('id', currentUserId);

      // Apply dynamic PostgREST filters on nested join
      if (selectedCompany) {
        query = query.eq('user_companies.companies.slug', selectedCompany);
      }
      if (selectedRole) {
        query = query.eq('user_companies.role', selectedRole);
      }
      if (selectedType) {
        query = query.eq('user_companies.type', selectedType);
      }

      const { data, error } = await query;
      if (error) throw error;

      setPeers(data || []);
    } catch (err) {
      console.error('Search query failed:', err);
      toast.error('Search failed. Please try reloading.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPeers();
  }, [selectedCompany, selectedRole, selectedType]);

  const handleResetFilters = () => {
    setSelectedCompany('');
    setSelectedRole('');
    setSelectedType('');
    toast.success('Filters cleared.');
  };

  const handleCopyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/signup`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success('Invite link copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* ── FILTER ROW ── */}
      <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-4">
        {/* Company Filter */}
        <div className="flex-1">
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Company</label>
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
          >
            <option value="">All Companies</option>
            {PREDEFINED_COMPANIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Role Filter */}
        <div className="flex-1">
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Target Role</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
          >
            <option value="">All Roles</option>
            {USER_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="flex-1">
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Status</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
          >
            <option value="">All Statuses</option>
            <option value="targeting">Targeting</option>
            <option value="experienced">Experienced / Interviewed</option>
          </select>
        </div>

        {/* Reset Action */}
        <div className="md:self-end">
          <button
            onClick={handleResetFilters}
            className="w-full md:w-auto flex items-center justify-center px-4 py-2 border border-border rounded-lg bg-surface text-sm font-semibold text-text-primary hover:bg-orange-tint hover:text-primary transition duration-150 cursor-pointer h-[38px] shadow-sm"
            title="Reset all filters"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* ── PEER GRID RESULTS ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm text-text-secondary">Searching whitelisted peer pool...</p>
        </div>
      ) : isFirstFromCollege ? (
        /* Empty State: First from college */
        <div className="bg-surface border border-border rounded-xl p-10 shadow-sm text-center max-w-xl mx-auto space-y-6">
          <div className="bg-orange-tint p-4 rounded-full text-primary w-16 h-16 flex items-center justify-center mx-auto shadow-inner">
            <Users className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-text-primary">First from your College!</h2>
            <p className="text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
              Looks like you are the first available interviewer from <span className="font-semibold">{currentUserCollege}</span>. Share PeerPrep with your college groups to practice together!
            </p>
          </div>
          <button
            onClick={handleCopyInviteLink}
            className="inline-flex items-center py-2.5 px-6 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary/95 transition duration-150 cursor-pointer"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Campus Invite Link
          </button>
        </div>
      ) : peers.length === 0 ? (
        /* Empty State: No results found */
        <div className="bg-surface border border-border rounded-xl p-10 shadow-sm text-center max-w-xl mx-auto space-y-5">
          <div className="bg-orange-tint p-4 rounded-full text-primary w-16 h-16 flex items-center justify-center mx-auto shadow-inner">
            <Search className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-text-primary">No available peers found</h2>
            <p className="text-sm text-text-secondary max-w-md mx-auto">
              We couldn't find any available peer interviewers matching your selected company and role filters at {currentUserCollege}.
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center py-2 px-4 border border-primary text-primary hover:bg-orange-tint rounded-lg text-sm font-semibold transition cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Results Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {peers.map((peer) => (
            <UserCard
              key={peer.id}
              id={peer.id}
              name={peer.name}
              college={peer.college}
              graduationYear={peer.graduation_year}
              skills={peer.skills || []}
              availability={peer.availability}
              companyRoles={peer.user_companies || []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
