# Document 06: Implementation Plan
**PeerPrep — Peer Mock Interview Platform**  
**Version 1.0 — June 2026**

---

## 1. Build Philosophy
* **Core Loop First:** Build the core loop completely before adding secondary features: Register $\rightarrow$ Search peers $\rightarrow$ Request session $\rightarrow$ Accept session $\rightarrow$ Live interview $\rightarrow$ Submit feedback $\rightarrow$ Session history.
* **Database First:** Never construct frontend code or API endpoints before the underlying database schemas, RLS policies, and indexes exist.
* **Modular Progress:** Commit code after completing each phase. Each phase is designed to be a fully working, shippable increment.
* **Development Schedule:** Estimated 3 days solo sprint:
  * **Day 1:** Phases 1–4
  * **Day 2:** Phases 5–8
  * **Day 3:** Phases 9–11

---

## 2. Implementation Phases

### Phase 1: Project Setup & Configuration
* Initialize Next.js project with TypeScript and Tailwind CSS in root.
* Install dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `daily-co`, `zod`, `react-hook-form`, `date-fns`, `lucide-react`, `papaparse`, `sonner`, `@tanstack/react-query`.
* Configure Tailwind theme with color tokens (`beige`, `orange`, `green`) in `tailwind.config.js` and `app/globals.css`.
* Configure `.env.local` with keys (Supabase, Daily.co, Groq, Resend, Cron secret).
* Set up OAuth credentials in Google Cloud Console and link to Supabase.
* Create constants mapping in `/constants`: whitelisted email domains, tech companies, SDE roles.
* *Verification:* Project builds and runs locally at `localhost:3000` with no errors.

### Phase 2: Database Schema & Migrations
* Write SQL migrations for all 7 tables: `users`, `companies`, `user_companies`, `sessions`, `feedback`, `notifications`, and `question_cache`.
* Establish foreign keys, unique constraints, and indexes on performance-critical query paths (e.g. `user_companies.company_id`, `users.college`, `sessions.status`).
* Enable RLS on all tables and apply RLS policies (see Backend Schema document).
* Seed `companies` table with all companies from the GitHub CSV repo folder list (~40 companies).
* Seed `question_cache` table by parsing GitHub CSVs for the top 10 most common companies.
* *Verification:* Database successfully migrates. RLS policies block unauthenticated access. Top 10 company caches populated.

### Phase 3: Authentication & Onboarding
* Implement Next.js Supabase Auth middleware to protect routes (`/dashboard`, `/search`, `/profile`, `/sessions`, `/session`).
* Add onboarding check to middleware: redirect users with `onboarding_complete = false` to `/onboarding`.
* Build `/signup`, `/login`, and `/verify` email screens.
* Implement college domain auto-detection during email validation against domain whitelists.
* Build `/onboarding` step-by-step wizard (name/year, company/role selects, skills, resume PDF upload to private bucket).
* *Verification:* Sign up $\rightarrow$ domain check $\rightarrow$ verify $\rightarrow$ onboarding flow works end-to-end. Uncompleted onboarding is blocked.

### Phase 4: Layout & Navigation
* Build the root app responsive shell: Left Sidebar (Desktop) and Bottom Tab Bar (Mobile).
* Implement availability toggle component connected to `users.availability`, with immediate loading feedback.
* Build the notification bell dropdown with real-time unread count badges and click-to-dismiss states.
* Apply typography and custom colors from the UI Brief.
* *Verification:* Layout renders seamlessly on desktop, tablet, and mobile. Active links highlight. Availability updates live.

### Phase 5: Profile System
* Build `/profile/[id]` view showing name, year, college, targeting/experienced badges, and availability status.
* Build `/profile/settings` form to update details, manage company-role listings (many-to-many), and upload/replace resumes.
* Build reusable user card components for discovery feeds.
* *Verification:* Profiles load correctly. Modifying details, company entries, and resumes updates tables immediately.

### Phase 6: Search & Discovery
* Build `/search` page containing search inputs and filter selectors (Company, Role, Targeting/Experienced).
* Implement search query scoping: filter matches to the logged-in user's college, availability set to `true`, and exclude the user themselves.
* Layout cards in a responsive grid.
* Add empty states for no matches or when a user is the first from their college (generate invite link).
* *Verification:* Query execution runs under 2 seconds. Scope constraints are strictly enforced.

### Phase 7: Session Request Flow
* Build 'Request Interview' modal on profiles: company selector, 1–5 proposed slots, resume share toggle, and notes.
* Implement request creation: save session as `pending`, generate in-app alerts and Resend email notification for the Helper.
* Build `/sessions` dashboard showing history, status badges, and filter toggles.
* Build request review view for Helpers to Accept (pick slot $\rightarrow$ status `accepted` $\rightarrow$ create Daily.co room), Reject proposed slots (set status `slots_rejected` + note), or Decline entirely (status `cancelled`).
* *Verification:* Complete scheduling flow works. Video room generates. Duplicate request prevention works.

### Phase 8: AI Question Generation
* Write the `generate-questions` Supabase Edge Function to fetch CSV questions, invoke Groq (Llama 3.1 8B) for brute/optimal code hints, append HR/project questions, and update session rows.
* Build Next.js API `/api/questions/generate` and integrate client polling on the session screen using React Query.
* Build loading state indicators for the seeker and interviewer.
* Build weekly question cache updater using Vercel Cron.
* *Verification:* Dynamic question sheets generate under 15 seconds. Fallbacks activate correctly if API fails.

### Phase 9: Session Screen
* Build `/session/[id]` page supporting pre-session (questions full-width read-only) and live-session (3-panel) states.
* Live-session UI: Left (questions list with hints and checklist), Center (Daily.co video iframe), Right (live feedback form).
* Save checklist checked states and feedback drafts to Supabase in real time.
* Secure page: Interviewees can *never* view the question sheet or the feedback form.
* *Verification:* Meeting connects. Panel elements render and stack on mobile. Checklist state persists. Feedback saves.

### Phase 10: Feedback, History & Admin
* Build feedback viewer for seekers displaying 1-5 visual star ratings for all categories and comments.
* Add completed session options to history page (`View Feedback` or `Awaiting Feedback`).
* Build `/admin` portal displaying user list, deactivation controls, and session status breakdowns.
* Implement session reminders (24h and 1h prior) and feedback reminders (2h post-session) via Vercel Cron.
* *Verification:* Seekers can access feedback, admins can deactivate users, crons trigger correct email templates.

### Phase 11: Polish, Edge Cases & Deployment
* Add skeleton loaders to grids and lists.
* Add form validations and handle error boundaries.
* Set up automated Supabase daily ping cron to keep free tier active.
* Deploy frontend to Vercel, configure production environment variables, and run live tests on HTTPS.
* *Verification:* Production site works without errors on all target viewports.

---

## 3. Timeline & Effort Summary
| Phase | Core Focus | Estimated Effort | Target Schedule |
| :---: | :--- | :---: | :---: |
| **1** | Project Setup & Configuration | 2–3 hours | Day 1 |
| **2** | Database Schema & Migrations | 2–3 hours | Day 1 |
| **3** | Authentication & Onboarding | 3–4 hours | Day 1 |
| **4** | Layout & Navigation | 2 hours | Day 1 |
| **5** | Profile System | 2 hours | Day 2 |
| **6** | Search & Discovery | 2 hours | Day 2 |
| **7** | Session Request Flow | 3–4 hours | Day 2 |
| **8** | AI Question Generation | 2–3 hours | Day 2 |
| **9** | Session Screen | 3–4 hours | Day 3 |
| **10**| Feedback, History & Admin | 2 hours | Day 3 |
| **11**| Polish, Edge Cases & Deployment | 2–3 hours | Day 3 |
