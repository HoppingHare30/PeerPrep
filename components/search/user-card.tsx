'use client';

import Link from 'next/link';
import { User, MapPin, Briefcase, ChevronRight } from 'lucide-react';

interface CompanyRole {
  id: string;
  role: string;
  type: 'targeting' | 'experienced';
  companies: {
    name: string;
  };
}

interface UserCardProps {
  id: string;
  name: string;
  college: string;
  graduationYear: number;
  skills: string[];
  availability: boolean;
  companyRoles?: CompanyRole[];
}

export default function UserCard({
  id,
  name,
  college,
  graduationYear,
  skills,
  availability,
  companyRoles = []
}: UserCardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4">
      {/* Top Details */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-border">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-text-primary text-base leading-tight hover:text-primary transition-colors">
                <Link href={`/profile/${id}`}>{name}</Link>
              </h3>
              <p className="text-xs text-text-secondary flex items-center mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                {college} ({graduationYear})
              </p>
            </div>
          </div>

          {/* Availability Badge */}
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              availability
                ? 'bg-green-tint text-secondary border-secondary/20'
                : 'bg-orange-tint/40 text-text-secondary border-border'
            }`}
          >
            {availability ? 'Available' : 'Unavailable'}
          </span>
        </div>

        {/* Company Mappings Badges */}
        {companyRoles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {companyRoles.slice(0, 4).map((entry) => (
              <span
                key={entry.id}
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                  entry.type === 'experienced'
                    ? 'bg-green-tint text-secondary border-secondary/20'
                    : 'bg-orange-tint text-primary border-primary/20'
                }`}
              >
                <Briefcase className="h-3 w-3 mr-1 opacity-70" />
                {entry.type === 'experienced' ? 'Exp:' : 'Tgt:'} {entry.companies.name} ({entry.role})
              </span>
            ))}
            {companyRoles.length > 4 && (
              <span className="text-[10px] text-text-secondary self-center font-medium pl-1">
                +{companyRoles.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Skills & CTA */}
      <div className="space-y-4 pt-2 border-t border-border">
        {/* Skills Tags */}
        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-tint/40 text-text-secondary border border-border"
              >
                {skill}
              </span>
            ))}
            {skills.length > 3 && (
              <span className="text-[10px] text-text-secondary self-center font-medium pl-1">
                +{skills.length - 3}
              </span>
            )}
          </div>
        ) : (
          <p className="text-[11px] italic text-text-secondary">No skills listed yet.</p>
        )}

        {/* CTA Button */}
        <Link
          href={`/profile/${id}`}
          className="w-full flex items-center justify-center py-2 px-4 border border-border rounded-md bg-surface text-sm font-semibold text-text-primary hover:bg-orange-tint hover:text-primary transition duration-150 shadow-sm"
        >
          <span>View Profile</span>
          <ChevronRight className="h-4 w-4 ml-1.5" />
        </Link>
      </div>
    </div>
  );
}
