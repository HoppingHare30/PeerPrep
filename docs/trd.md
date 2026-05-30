# Document 02: Technical Requirements Document (TRD)
**PeerPrep — Peer Mock Interview Platform**  
**Version 1.0 — June 2026**

---

## 1. Technology Stack
| Layer | Technology | Version / Plan | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js (App Router) | Latest stable | UI, routing, server components, API routes |
| **Language** | TypeScript | Latest stable | Type safety across frontend and backend |
| **Styling** | Tailwind CSS | Latest stable | Utility-first responsive styling |
| **Database** | Supabase (PostgreSQL) | Free tier | Primary data store, Row Level Security |
| **Authentication**| Supabase Auth | Free tier | Email/password + Google OAuth |
| **File Storage** | Supabase Storage | Free tier | Private resume storage with signed URLs |
| **Video Calling** | Daily.co API | Free tier | Embedded iframe video call on session screen (2,000 participant-min) |
| **AI / LLM** | Groq API (Llama 3.1 8B) | Free tier | Generate DSA hints, HR questions, project questions per session (14,400 req/day) |
| **Email** | Resend | Free tier | Transactional emails: notifications, reminders (3,000/month) |
| **Background Jobs**| Supabase Edge Functions| Free tier | Async Groq question generation (avoids Vercel 10s timeout) |
| **Cron Jobs** | Vercel Cron | Free tier (1 job) | Daily DB ping + session reminders |
| **Hosting** | Vercel | Free tier | Frontend + API route deployment |
| **Question Bank** | GitHub Raw CSV API | Public / free | Cached source of questions from `snehasishroy/leetcode-companywise-interview-questions` |

---

## 2. Key Libraries
| Library | Purpose |
| :--- | :--- |
| `@supabase/supabase-js` | Supabase client — auth, DB queries, storage |
| `@supabase/ssr` | Server-side Supabase auth for Next.js App Router |
| `@daily-co/daily-js` | Daily.co embedded video iframe integration |
| `zod` | Schema validation for forms and API inputs |
| `react-hook-form` | Form state management (onboarding, session request, feedback) |
| `date-fns` | Date/time formatting and manipulation for scheduling |
| `lucide-react` | Icon library — consistent iconography throughout |
| `papaparse` | CSV parsing for GitHub question bank data |
| `sonner` | Toast notification library for in-app alerts |
| `@tanstack/react-query`| Server state management and polling (question sheet generation) |

---

## 3. Environment Variables
Create a `.env.local` file in your root directory:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key     # Server-side only — never expose to client

# Daily.co
DAILY_API_KEY=your-daily-api-key                             # Server-side only

# Groq
GROQ_API_KEY=your-groq-api-key                              # Server-side only

# Resend
RESEND_API_KEY=your-resend-api-key                          # Server-side only
RESEND_FROM_EMAIL=noreply@peerprep.app                       # e.g., noreply@yourdomain.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000                    # Production: https://peerprep.vercel.app
CRON_SECRET=your-cron-secret                                 # Secret for Vercel Cron route authentication
```

---

## 4. Folder Structure
```
peerprep/
├── app/                           # Next.js App Router
│   ├── (auth)/                    # Auth group: /login, /signup, /verify
│   ├── (app)/                     # Protected group: all main app routes
│   │   ├── dashboard/             # /dashboard — home after login
│   │   ├── search/                # /search — find interviewers
│   │   ├── profile/
│   │   │   ├── [id]/              # /profile/[id] — view any user profile
│   │   │   └── settings/          # /profile/settings — edit own profile
│   │   ├── sessions/              # /sessions — session history list
│   │   └── session/[id]/          # /session/[id] — live session screen
│   ├── admin/                     # /admin — admin panel (role-gated)
│   ├── onboarding/                # /onboarding — multi-step onboarding flow
│   └── api/                       # API routes
│       ├── daily/                 # Daily.co room creation
│       ├── questions/             # GitHub CSV fetch + cache
│       ├── notifications/         # Notification helpers
│       └── cron/                  # Vercel Cron handlers
├── components/
│   ├── ui/                        # Primitive UI components (button, input, badge)
│   ├── layout/                    # Sidebar, header, mobile nav
│   ├── session/                   # Session screen panels
│   ├── search/                    # Search filters, user cards
│   └── forms/                     # Onboarding, request, feedback forms
├── lib/
│   ├── supabase/                  # Supabase client helpers (server + client)
│   ├── groq/                      # Groq prompt + question generation
│   ├── daily/                     # Daily.co API wrapper
│   ├── resend/                    # Email templates
│   └── utils/                     # Shared utilities
├── types/                         # TypeScript type definitions
├── constants/                     # College whitelist, company list, role list
└── supabase/
    ├── migrations/                # SQL migration files
    └── functions/                 # Supabase Edge Functions (Groq generation)
```

---

## 5. Technical Constraints & Mitigations
| Constraint | Impact | Mitigation |
| :--- | :--- | :--- |
| **Vercel free tier: 10s serverless timeout** | Groq generation would time out | Move generation to Supabase Edge Function (150s limit); Vercel triggers it, client polls. |
| **Supabase free tier: pauses after 7 days inactivity** | DB becomes unavailable | Vercel Cron pings DB daily at 00:00 UTC. |
| **Daily.co free tier: 2,000 participant-minutes** | ~16–17 full sessions before hitting limit | Build custom warning note in dashboard; plan upgrade on active growth. |
| **Groq free tier: 30 req/min, 14,400 req/day** | Rate limiting under heavy usage | Single prompt per session; cache static fallbacks for top 10 companies. |
| **GitHub Raw API: 60 req/hour unauthenticated** | Would break under any real usage | Cache CSV in Supabase, refresh weekly; never fetch directly on per-session basis. |
| **Resend free tier: 100 emails/day** | Limit under heavy notification load | Sufficient for MVP; upgrade on growth. |
