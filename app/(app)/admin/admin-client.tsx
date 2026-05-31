'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Users,
  Calendar,
  MessageSquare,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  Loader2,
  Clock
} from 'lucide-react';

interface AdminClientProps {
  initialUsers: any[];
  sessionCount: number;
  feedbackCount: number;
  currentAdminId: string;
}

export default function AdminClient({
  initialUsers,
  sessionCount,
  feedbackCount,
  currentAdminId,
}: AdminClientProps) {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [collegeFilter, setCollegeFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Get unique colleges for filtering
  const colleges = Array.from(new Set(users.map((u) => u.college))).filter(Boolean);

  // Filter users based on query and dropdowns
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.college?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      roleFilter === 'all' ||
      (roleFilter === 'admin' && u.role === 'admin') ||
      (roleFilter === 'user' && u.role === 'user');

    const matchesCollege = collegeFilter === 'all' || u.college === collegeFilter;

    return matchesSearch && matchesRole && matchesCollege;
  });

  // Handle user updates (toggles)
  const handleUserAction = async (targetUserId: string, action: 'toggle_availability' | 'toggle_admin') => {
    setActionLoading((prev) => ({ ...prev, [targetUserId]: true }));
    const toastId = toast.loading('Updating user record in database...');

    try {
      const response = await fetch('/api/admin/users/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, action }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Operation failed');

      toast.success(
        action === 'toggle_availability'
          ? 'User availability status toggled!'
          : `User role permissions updated to ${result.newRole.toUpperCase()}!`,
        { id: toastId }
      );

      // Local state update
      setUsers((prevUsers) =>
        prevUsers.map((u) => {
          if (u.id === targetUserId) {
            return {
              ...u,
              availability: action === 'toggle_availability' ? result.newAvailability : u.availability,
              role: action === 'toggle_admin' ? result.newRole : u.role,
            };
          }
          return u;
        })
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user', { id: toastId });
    } finally {
      setActionLoading((prev) => ({ ...prev, [targetUserId]: false }));
    }
  };

  // Metrics calculations
  const totalUsers = users.length;
  const activeInterviewersCount = users.filter((u) => u.availability).length;

  return (
    <div className="space-y-8">
      {/* ── ANALYTICS PANELS ROW ── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Total Users card */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-text-secondary uppercase tracking-wider">
            <span>Enrolled Students</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-extrabold text-text-primary">{totalUsers}</p>
          <div className="text-[10px] text-text-secondary">Across {colleges.length} whitelisted campuses</div>
        </div>

        {/* Active Helpers card */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-text-secondary uppercase tracking-wider">
            <span>Active Mentors</span>
            <CheckCircle2 className="h-4 w-4 text-secondary" />
          </div>
          <p className="text-2xl font-extrabold text-text-primary">{activeInterviewersCount}</p>
          <div className="text-[10px] text-text-secondary">
            {((activeInterviewersCount / (totalUsers || 1)) * 100).toFixed(0)}% of total directory size
          </div>
        </div>

        {/* Total Sessions card */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-text-secondary uppercase tracking-wider">
            <span>Mocks Arranged</span>
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-extrabold text-text-primary">{sessionCount}</p>
          <div className="text-[10px] text-text-secondary">Direct peer bookings logs</div>
        </div>

        {/* Total Feedbacks card */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-text-secondary uppercase tracking-wider">
            <span>Evals Collected</span>
            <MessageSquare className="h-4 w-4 text-secondary" />
          </div>
          <p className="text-2xl font-extrabold text-text-primary">{feedbackCount}</p>
          <div className="text-[10px] text-text-secondary">
            {sessionCount > 0 ? `${((feedbackCount / sessionCount) * 100).toFixed(0)}% completion rating` : '0%'}
          </div>
        </div>
      </div>

      {/* ── FILTERING AND SEARCH CONTROL HEADER ── */}
      <div className="bg-surface border border-border rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search users by name, email, or college..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-xs text-text-primary placeholder-text-secondary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-3">
          {/* Role Filter */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <Shield className="h-3.5 w-3.5 text-text-secondary" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-background border border-border rounded-lg text-text-primary text-[11px] font-semibold focus:outline-none"
            >
              <option value="all">All Roles</option>
              <option value="user">Standard Users</option>
              <option value="admin">Administrators</option>
            </select>
          </div>

          {/* College Filter */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <Filter className="h-3.5 w-3.5 text-text-secondary" />
            <select
              value={collegeFilter}
              onChange={(e) => setCollegeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-background border border-border rounded-lg text-text-primary text-[11px] font-semibold focus:outline-none max-w-[160px] truncate"
            >
              <option value="all">All Colleges</option>
              {colleges.map((col, idx) => (
                <option key={idx} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── USER MANAGEMENT LIST TABLE ── */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-text-secondary text-xs italic">
            No registered users match your search parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background/80 border-b border-border text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">
                  <th className="py-3 px-6">User Profile</th>
                  <th className="py-3 px-6">College</th>
                  <th className="py-3 px-6">Status Details</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {filteredUsers.map((user) => {
                  const isLoading = actionLoading[user.id] || false;
                  const isAdmin = user.role === 'admin';
                  const isSelf = user.id === currentAdminId;

                  return (
                    <tr key={user.id} className="hover:bg-orange-tint/10 transition duration-150">
                      {/* Name and email */}
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-text-primary flex items-center gap-1.5">
                              {user.name}
                              {isAdmin && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-extrabold bg-orange-tint text-primary border border-primary/10">
                                  Admin
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-text-secondary">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* College & Grad year */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-text-primary">{user.college}</div>
                        <div className="text-[10px] text-text-secondary">
                          Class of {user.graduation_year || '—'}
                        </div>
                      </td>

                      {/* availability / status details */}
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                              user.availability
                                ? 'bg-green-tint text-secondary border-secondary/15'
                                : 'bg-red-50 text-destructive border-destructive/15'
                            }`}
                          >
                            {user.availability ? 'Active Matching' : 'Matching Paused'}
                          </span>
                          
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                              user.onboarding_complete
                                ? 'bg-green-tint/50 text-secondary border-secondary/10'
                                : 'bg-orange-tint text-primary border-primary/10 animate-pulse'
                            }`}
                          >
                            {user.onboarding_complete ? 'Onboarding OK' : 'Incomplete'}
                          </span>
                        </div>
                        <div className="text-[8px] text-text-secondary font-mono mt-1">
                          Created: {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2.5 items-center">
                          {/* Toggle availability switch */}
                          <button
                            onClick={() => handleUserAction(user.id, 'toggle_availability')}
                            disabled={isLoading}
                            className={`p-1 rounded-lg border transition ${
                              user.availability
                                ? 'border-secondary text-secondary hover:bg-green-tint/50'
                                : 'border-border text-text-secondary hover:bg-orange-tint/40'
                            } cursor-pointer`}
                            title={user.availability ? 'Pause user peer matching' : 'Activate user matching'}
                          >
                            {user.availability ? (
                              <ToggleRight className="h-4.5 w-4.5" />
                            ) : (
                              <ToggleLeft className="h-4.5 w-4.5" />
                            )}
                          </button>

                          {/* Promote/demote admin badge */}
                          {!isSelf ? (
                            <button
                              onClick={() => handleUserAction(user.id, 'toggle_admin')}
                              disabled={isLoading}
                              className={`px-2 py-1 rounded-lg border text-[10px] font-bold transition flex items-center gap-1 shrink-0 ${
                                isAdmin
                                  ? 'border-destructive text-destructive hover:bg-red-50'
                                  : 'border-primary text-primary hover:bg-orange-tint/80'
                              } cursor-pointer`}
                              title={isAdmin ? 'Revoke administrative capabilities' : 'Grant admin capabilities'}
                            >
                              {isLoading ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : isAdmin ? (
                                <>
                                  <ShieldAlert className="h-3 w-3" />
                                  Demote
                                </>
                              ) : (
                                <>
                                  <Shield className="h-3 w-3" />
                                  Make Admin
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="text-[10px] text-text-secondary italic font-medium px-2 shrink-0">
                              Logged-in Admin
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
