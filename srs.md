# PeerPrep — Software Requirements Specification (SRS)
**Version 1.0 — June 2026**

---

## 1. Product Overview

### 1.1 Problem Statement
Students targeting specific tech companies (SDE, AI/ML roles) lack access to structured, human-led mock interview practice. Current solutions are fragmented: informal senior-junior chats are unstructured, while automated platforms lack genuine human interaction. PeerPrep combines both — structured, company-specific interview practice with real peer-to-peer human interaction.

### 1.2 Product Vision
PeerPrep is a web-based, two-sided peer mock interview platform where any student can act as an interviewer for companies they have experience with, and as an interviewee for companies they are targeting — with AI-assisted question delivery, embedded video calling, and structured feedback.

### 1.3 Technology Stack
| Layer | Technology | Plan / Notes |
| :--- | :--- | :--- |
| **Frontend + Backend** | Next.js (App Router) | Latest stable |
| **Database + Auth** | Supabase (PostgreSQL + Auth) | Free tier |
| **File Storage** | Supabase Storage | Private bucket, free tier |
| **Video Calling** | Daily.co API | Embedded iframe, free tier — 2,000 participant-minutes |
| **AI / LLM** | Groq API (Llama 3.1 8B) | Free tier — 14,400 req/day |
| **Email Notifications** | Resend | Free tier — 3,000 emails/month |
| **Question Bank** | GitHub Raw CSV (snehasishroy repo) | Cached weekly server-side |
| **Hosting** | Vercel | Free tier — 10s serverless timeout |
| **Cron Jobs** | Vercel Cron | Free tier — daily DB ping + reminders |
| **Styling** | Tailwind CSS | Latest stable |

> [!WARNING]
> **Daily.co Free Tier Limit**
> Daily.co charges based on participant-minutes (not room creation). A 60-minute session with 2 participants = 120 participant-minutes. The free tier includes 2,000 participant-minutes, equating to approximately 16–17 full sessions. Room generation at acceptance is free. Plan to upgrade Daily.co when user sessions grow beyond early prototype stage.

### 1.4 College Domain Whitelist
At launch, the following institutional email domains are whitelisted. Adding new domains requires only a one-line config update — no code changes.

| Domain | Institution |
| :--- | :--- |
| `iitr.ac.in` | IIT Roorkee |
| `iitb.ac.in` | IIT Bombay |
| `iitd.ac.in` | IIT Delhi |
| `iitm.ac.in` | IIT Madras |
| `iitk.ac.in` | IIT Kanpur |
| `iitkgp.ac.in` | IIT Kharagpur |
| `iitg.ac.in` | IIT Guwahati |
| `iith.ac.in` | IIT Hyderabad |
| `bits-pilani.ac.in` | BITS Pilani |
| `pilani.bits-pilani.ac.in` | BITS Pilani (Pilani campus) |
| `goa.bits-pilani.ac.in` | BITS Pilani (Goa campus) |
| `hyderabad.bits-pilani.ac.in`| BITS Pilani (Hyderabad campus) |
| `nitt.edu` | NIT Trichy |
| `nitw.ac.in` | NIT Warangal |
| `mnnit.ac.in` | MNNIT Allahabad |

---

## 2. Stakeholders & Personas

### 2.1 User Roles
Roles in PeerPrep are fluid — the same user may act as an Interviewee for their target company (e.g. Google) and as an Interviewer for another company (e.g. Amazon) within the same week. Role is determined per session, not per account.

| Role | Description | Primary Goal |
| :--- | :--- | :--- |
| **Seeker (Interviewee)** | A student seeking mock interview practice for a specific company/role | Find a willing peer, get structured practice, receive feedback |
| **Helper (Interviewer)** | A student conducting a mock interview for a company they know | Build communication skills, give back to community |
| **Admin** | Platform administrator (solo developer) | Monitor usage, deactivate bad actors |

### 2.2 Persona Profiles
| Attribute | Persona 1: The Seeker | Persona 2: The Helper |
| :--- | :--- | :--- |
| **Primary goal** | Get structured mock interview practice for Company X | Conduct an interview, build communication skills |
| **Core pain point** | Cannot find someone willing to conduct an interview | Does not know what questions to ask; fears running out of time |
| **What platform gives them**| Searchable peer pool, slot-based scheduling, resume sharing | AI question sheet with hints, structured feedback form, embedded video |
| **Success signal** | Session completed and structured feedback received | Session conducted smoothly with clear question structure |
| **Motivation** | Anxiety about upcoming tech interviews | Goodwill, mentorship culture, skill reinforcement |

---

## 3. Functional Requirements

All requirements below are **Finalized** unless otherwise noted. Vague terms have been explicitly resolved to measurable, testable criteria.

### 3.1 Authentication & Onboarding
* **FR-001: Email Registration & Verification**  
  The system shall allow a new user to register using a valid institutional email address. The system shall send a verification link to that email and shall not grant platform access until the email is verified.
* **FR-002: College Auto-Detection from Email Domain**  
  The system shall derive and store the user's college automatically by matching their verified email domain against the server-side college domain whitelist. The user shall not be able to manually edit the college field. If the domain is not in the whitelist, the system shall display: *"Your institution is not yet supported. We are expanding soon!"* and block registration.
* **FR-003: Google OAuth**  
  The system shall support Google OAuth as an alternative to email/password registration, implemented via Supabase Auth. For Google OAuth sign-ups, the system shall verify that the Google account's email domain exists in the college domain whitelist. If not, registration shall be blocked. Email is marked verified automatically upon OAuth sign-in.
* **FR-004: Guided Onboarding Flow**  
  Upon first login after email verification, the system shall present a sequential guided onboarding flow: 
  * **Step 1 (mandatory):** Name pre-filled from signup, user enters graduation year (numeric input).
  * **Step 2 (mandatory):** User searches and selects at least one company from the predefined list, selects a role (SDE / AI-ML / Data Engineer / Product / Other), and selects a status (Targeting / Experienced).
  * **Step 3 (optional):** User may add skills and/or upload a resume (PDF only, max 5MB).
  * *Note:* Steps 1 and 2 cannot be skipped. If the user closes the browser mid-onboarding, the system shall resume from the last incomplete step on next login.
* **FR-005: Company-Role Management**  
  The system shall allow a user to add, edit, or delete their company-role entries at any time from their profile settings page. Each entry shall store: company (from predefined list), role, and status (targeting / experienced). A user may have multiple entries.
* **FR-006: Resume Management**  
  The system shall allow a user to upload or replace their resume (PDF only, max 5MB) at any time from their profile settings page. Resume upload shall not be mandatory at signup or onboarding.
* **FR-007: Password Reset**  
  The system shall provide a Forgot Password flow (implemented via Supabase Auth) allowing users registered with email/password to request a password reset link sent to their verified email. The reset link shall expire after 1 hour.
* **FR-008: Profile Editing Post-Onboarding**  
  The system shall provide a profile settings page where a logged-in user can edit their name, graduation year, skills, resume, and availability toggle at any time after onboarding completion.

### 3.2 Discovery & Search
* **FR-009: College-Scoped Discovery**  
  The system shall restrict all user search and discovery results to users belonging to the same college as the logged-in user, determined by verified email domain. Users from other colleges shall never appear in search results.
* **FR-010: Search & Filter Interface**  
  The system shall provide a search interface allowing users to filter peers by: (1) company name (from predefined list), (2) target role (SDE / AI-ML / Data Engineer / Other), (3) status (targeting / experienced). Search results shall include only users whose availability toggle is set to ON. The logged-in user shall be excluded from their own search results.
* **FR-011: User Card Display**  
  Each user card in search results shall display: name, graduation year, skills (if added), company-role entries with targeting/experienced badge, and availability status. When no results are found, the system shall display: *"No available interviewers found for this company. Try removing filters or check back later."* When the user is the first from their college, the system shall display: *"Looks like you are the first from your college! Invite peers to join."* with a shareable link.
* **FR-012: Availability Toggle**  
  The system shall provide an availability toggle on each user's profile. When set to OFF, the user shall not appear in any search results. When set to ON, the user shall be visible to peers from the same college. The default state at onboarding completion shall be ON.

### 3.3 Session Request Flow
* **FR-013: Send Session Request**  
  The system shall allow a logged-in user (Seeker) to send a session request to another user (Helper) from that user's profile page. The request shall include:
  1. Target company, pre-populated from the Seeker's own company-role entries.
  2. Between 1 and 5 proposed time slots (each with date and time).
  3. Resume share decision — if Yes, the system shall check for an existing resume; if none exists, the system shall prompt the Seeker to upload one before proceeding; if No, the system proceeds without any resume prompt.
  4. An optional note (max 500 characters).
  * *Note:* If a pending session request already exists between the same two users for the same company, the system shall block submission and display: *"You already have a pending request with this user for this company."*
* **FR-014: Session Request Notifications**  
  The system shall notify the Helper of a new session request via an in-app notification. The system shall additionally send an email notification to the Helper's verified email address via Resend, on a best-effort basis.
* **FR-015: Helper Response — Accept, Reject Slots, or Decline**  
  Upon receiving a session request, the Helper shall be presented with all proposed time slots and three options:
  1. **Select one slot to confirm:** The system shall proceed to Daily.co room generation and session confirmation.
  2. **None of these slots work:** The Helper may optionally add a short note (max 200 characters); the session status shall be set to `slots_rejected`; the Seeker shall be notified with the Helper's note and may send a new request with different slots.
  3. **Decline entirely:** The session status shall be set to `cancelled`; the Seeker shall receive a polite system-generated message: *"Sorry, this user is unable to take your request right now."*
* **FR-016: Session Acceptance — Daily.co Room Generation**  
  Upon the Helper selecting a confirmed time slot, the system shall automatically generate a Daily.co video room via the Daily.co REST API (server-side, via Next.js API route). The room shall be configured to expire 2 hours after the scheduled session time. The generated room URL shall be stored in the session record. The system shall notify the Seeker with the confirmed date, time, and embedded session page link. Neither party shall be required to manually paste a meeting link.
* **FR-017: AI Question Sheet Generation**  
  Upon session acceptance (slot confirmed), the system shall trigger Groq API question generation as a background process (async, via Supabase Edge Function to avoid Vercel 10-second timeout). The session screen shall display a *"Generating question sheet..."* indicator. The question sheet shall contain:
  1. Up to 5 DSA questions fetched from the GitHub CSV for the relevant company, ordered by frequency score descending, each with an AI-generated brute-force approach, optimal approach, and time/space complexity.
  2. 3–5 HR questions tailored to the company.
  3. 2–3 project-related questions.
  * *Access:* The question sheet shall be visible only to the Interviewer. 
  * *Fallback:* If Groq fails, the system retries once after 3 seconds; if retry fails, the system serves pre-cached static fallback questions for that company; if the company has no cache, the interviewer sees: *"Question sheet unavailable. You can proceed with your own questions."*
* **FR-018: Session Request Auto-Expiry**  
  If a Helper has not responded to a pending session request within 72 hours of it being sent, the system shall automatically set the session status to `expired` and notify the Seeker: *"Your session request has expired. You can send a new one."*
* **FR-019: Session Auto-Expiry (Abandoned)**  
  If a session's `scheduled_at` time has passed by more than 24 hours and the session status is still `accepted` (i.e. feedback has not been submitted), the system shall automatically set the session status to `expired`.

### 3.4 Interview Session
* **FR-020: Session Screen — Pre-Session State**  
  After session acceptance and before the `scheduled_at` time, the system shall display the session screen in pre-session state to the Interviewer: the question sheet is displayed full-width in read-only mode (checklist inactive), the meeting link is visible, and no feedback form is shown. This allows the Interviewer to review and prepare questions before the session begins.
* **FR-021: Session Screen — Live-Session State**  
  At or after the `scheduled_at` time, the system shall transition the session screen to live-session state displaying three panels:
  1. **Left panel:** Question sheet with interactive DSA checklist, HR questions, and project questions.
  2. **Centre panel:** Daily.co video call embedded via iframe with microphone, camera, and autoplay permissions.
  3. **Right panel:** Feedback form.
  * *Notes:* A fallback link (*"Open video in new tab"*) shall be displayed below the iframe for browsers that block camera access in iframes. On mobile and tablet viewports (below 1024px), panels shall stack vertically in the order: video call, question sheet, feedback form.
* **FR-022: Interactive Question Checklist**  
  The question sheet shall render each DSA question as an interactive checklist item. The Interviewer may check off questions as they are asked during the session. Checking all questions shall not be mandatory. Checked state shall be saved to Supabase in real time. The Interviewee shall not see the question sheet or checklist at any point.
* **FR-023: Feedback Form**  
  The session screen shall display a feedback form accessible to the Interviewer only, without requiring navigation away from the session screen. The feedback form shall contain the following fields, all optional except the submit action:
  1. Clarity of Thought (rating 1 to 5)
  2. Communication (rating 1 to 5)
  3. Problem-Solving Approach (rating 1 to 5)
  4. Code Quality (rating 1 to 5)
  5. Time Management (rating 1 to 5)
  6. Additional Notes (free text, no character limit)
  * *Submission:* The Interviewer may submit the form at any point during or after the session. The system shall require at least one field to be filled before submission is permitted.

### 3.5 Post-Session & Feedback
* **FR-024: Feedback Submission & Notification**  
  Upon feedback submission by the Interviewer, the system shall: (1) update session status to `completed`; (2) store the feedback record linked to the session in Supabase; (3) notify the Interviewee via in-app notification and Resend email that feedback is available; (4) make the feedback visible to both the Interviewee and the Interviewer in their respective session history records.
* **FR-025: Feedback Access Control**  
  Feedback shall be strictly one-way. The Interviewee may view feedback submitted by the Interviewer but shall have no ability to respond to, dispute, or edit it. Feedback records shall only be accessible to the two session participants, enforced via Supabase Row Level Security policies. Any attempt to access feedback by an unauthorized user shall return a 403 response.
* **FR-026: Session History**  
  The system shall provide each user with a session history page displaying all sessions they have participated in, both as Interviewer and Interviewee, in reverse chronological order. Each row shall display: date, company, role, capacity (Interviewer/Interviewee), session status, and a *View Feedback* link for completed sessions. If feedback was not submitted by the Interviewer, the completed session shall display *"Awaiting Feedback"* instead of the *View Feedback* link.
* **FR-027: Feedback Submission Reminder**  
  If a session's `scheduled_at` time has passed by more than 2 hours and the Interviewer has not submitted feedback, the system shall send the Interviewer a single in-app and email reminder: *"Don't forget to submit feedback for your session with [name]."* Only one reminder shall be sent per session.
* **FR-028: Session Reminders**  
  The system shall send in-app and email reminder notifications to both session participants 24 hours before and 1 hour before the `scheduled_at` time. Reminders shall be triggered via Vercel Cron.

### 3.6 Admin
* **FR-029: Admin Interface**  
  The system shall provide an admin interface accessible only to users with the admin role (assigned directly in Supabase). The admin interface shall display: (1) total number of registered users; (2) total number of sessions broken down by status (pending, accepted, completed, cancelled, expired, slots_rejected); (3) ability to deactivate any user account. Deactivated users shall be immediately prevented from logging in.

---

## 4. Use Cases

### UC-001: User Registration & Onboarding
* **Actor:** New User
* **Preconditions:** User has a valid institutional email. User has not previously registered.
* **Postconditions:** Account created, email verified, profile complete, availability ON, user on dashboard.
* **Main Flow:**
  1. User navigates to PeerPrep and clicks Sign Up or Continue with Google.
  2. **Email/password:** user enters name, institutional email, password -> system sends verification email -> user clicks link -> system verifies.
  3. **Google OAuth:** user selects institutional Google account -> system checks domain whitelist -> proceeds.
  4. System redirects to onboarding Step 1 — user confirms name, enters graduation year.
  5. Step 2 — user searches company, selects role, selects targeting/experienced. Repeatable for multiple entries. At least one required.
  6. Step 3 — user optionally adds skills and/or uploads resume (PDF, max 5MB).
  7. User clicks Finish — profile created, availability set to ON, redirected to dashboard.
* **Alternate & Exception Flows:**
  * **A1 (User skips Step 3):** Onboarding completes without skills or resume.
  * **A2 (Browser closed mid-onboarding):** System resumes from last incomplete step on next login.
  * **E1 (Email already registered):** System displays error, blocks duplicate account creation.
  * **E2 (Verification link expired):** System offers Resend verification email.
  * **E3 (Resume invalid):** Inline error, user can retry or skip.
  * **E4 (Non-whitelisted domain):** System displays *"Your institution is not yet supported"* and blocks registration.

### UC-002: Search & Discover Interviewer
* **Actor:** Seeker (logged-in user)
* **Preconditions:** User logged in, onboarding complete. At least one other same-college user with availability ON exists.
* **Postconditions:** Seeker views filtered peer list and selects one to view profile.
* **Main Flow:**
  1. Seeker navigates to Search page.
  2. System displays default list of same-college available users.
  3. Seeker enters company name, optionally filters by role and targeting/experienced status.
  4. System returns matching user cards.
  5. Seeker clicks a card to view full profile.
  6. Seeker decides to send a session request (proceeds to UC-003).
* **Alternate & Exception Flows:**
  * **A1 (No filters):** Results ordered by number of company-role entries (most active first).
  * **A2 (No matches):** System displays *"No available interviewers found. Try removing filters."*
  * **A3:** Own profile excluded from all results.
  * **E1 (No same-college users):** System displays *"You are the first from your college!"* with share link.

### UC-003: Send & Accept Session Request
* **Actors:** Seeker (initiator), Helper (recipient)
* **Preconditions:** Both users logged in, same college, Helper has availability ON. No duplicate pending request exists.
* **Postconditions:** Session accepted, Daily.co room generated, AI question sheet triggered, both parties notified.
* **Main Flow:**
  1. Seeker opens Helper profile, clicks Request Interview.
  2. Seeker selects company (from own company-role entries), proposes 1–5 time slots, chooses resume share Yes/No, adds optional note.
  3. If resume share Yes and no resume exists: system prompts Seeker to upload resume first.
  4. Seeker submits -> session created with status pending -> Helper notified via in-app + email.
  5. Helper opens request, reviews slots and Seeker details.
  6. Helper selects a slot -> system creates Daily.co room -> stores URL -> session status: `accepted` -> Seeker notified -> AI question generation triggered.
* **Alternate & Exception Flows:**
  * **A1 (Helper rejects slots):** Helper selects *"None of these slots work"* with optional note -> status: `slots_rejected` -> Seeker notified -> Seeker can send new request.
  * **A2 (Helper declines):** Helper declines -> status: `cancelled` -> Seeker receives polite system message.
  * **A3 (Expired request):** 72 hours pass with no response -> status: `expired` -> Seeker notified.
  * **A4 (Seeker cancels):** Seeker cancels before Helper responds -> status: `cancelled`.
  * **A5 (Groq fails):** Groq API fails at question generation -> system retries once -> if fails, serves cached fallback -> session proceeds.
  * **E1 (Duplicate request):** System blocks and displays *"You already have a pending request with this user for this company"*.
  * **E2 (Past dates):** All proposed dates in the past -> system displays inline validation error.

### UC-004: Conduct Interview Session
* **Actors:** Interviewer (Helper), Interviewee (Seeker)
* **Preconditions:** Session status is `accepted`. AI question sheet generated. `scheduled_at` time has arrived.
* **Postconditions:** Interview conducted. Questions tracked. Feedback submitted. Session status: `completed`.
* **Pre-Session (before scheduled_at):**
  1. Interviewer navigates to session — sees question sheet full-width (read-only), meeting link visible.
  2. Interviewer reviews DSA questions, brute/optimal hints, HR and project questions.
* **Live Session (at or after scheduled_at):**
  1. Session screen transitions: Left panel (question checklist), Centre panel (Daily.co video iframe), Right panel (feedback form).
  2. Both users join video call via embedded iframe (or fallback new tab link).
  3. Interviewer checks off DSA questions as asked — state saved in real time.
  4. Interviewer fills feedback form progressively during session.
  5. Interviewer clicks Submit Feedback — system validates at least one field filled.
  6. Session status updated to `completed` — Interviewee notified.
* **Alternate & Exception Flows:**
  * **A1 (Tab closed):** Interviewer closes tab mid-session: checked questions and partial feedback saved; state restored on return.
  * **A2 (Interviewee perspective):** Interviewee views session screen: sees video and session details only; never sees question sheet or feedback form.
  * **E1 (Empty feedback):** Empty feedback form submission attempt -> system displays *"Please fill at least one field"*.
  * **E2 (Question load fail):** Question sheet fails to load -> system displays retry button; feedback form remains functional.

### UC-005: View Feedback & Session History
* **Actors:** Interviewee, Interviewer
* **Preconditions:** At least one session with status `completed` exists. Feedback submitted.
* **Postconditions:** User has viewed feedback. No data modified.
* **Main Flow — Interviewee:**
  1. Interviewee receives in-app + email notification that feedback is available.
  2. Navigates to session history page.
  3. Clicks View Feedback on a completed session.
  4. System displays: ratings for all 5 categories (visual score display), free text notes.
  5. Interviewee reads feedback — no response or edit action available.
* **Main Flow — Interviewer:**
  1. Interviewer navigates to session history.
  2. Clicks View Feedback — sees the feedback they submitted as a read-only record.
* **Exception Flows:**
  * **E1 (Unauthorized access):** Unauthorized URL access -> system returns 403.
  * **E2 (No history):** No completed sessions -> system displays *"No completed sessions yet. Start by requesting or accepting an interview."*

---

## 5. Data Model

### 5.1 Schema Overview
| Table | Description | Key Fields |
| :--- | :--- | :--- |
| **`users`** | One record per registered user | `id`, `name`, `email`, `college`, `graduation_year`, `skills[]`, `resume_url`, `availability`, `created_at` |
| **`companies`** | Predefined company list (seeded from GitHub repo) | `id`, `name`, `slug` |
| **`user_companies`**| User's company-role associations (many-to-many) | `id`, `user_id` (FK), `company_id` (FK), `role`, `type` (`targeting`/`experienced`) |
| **`sessions`** | Mock interview session records | `id`, `interviewee_id` (FK), `interviewer_id` (FK), `company_id` (FK), `status`, `scheduled_at`, `daily_room_url`, `resume_shared`, `proposed_slots` (JSON), `questions_json`, `created_at` |
| **`feedback`** | Structured feedback per completed session | `id`, `session_id` (FK), `clarity_score`, `communication_score`, `problem_solving_score`, `code_quality_score`, `time_management_score`, `notes`, `created_at` |
| **`notifications`** | In-app notification records | `id`, `user_id` (FK), `type`, `message`, `read`, `created_at` |

### 5.2 Session Status Enum
| Status | Meaning | Next Possible States |
| :--- | :--- | :--- |
| `pending` | Request sent, awaiting Helper response | `accepted`, `slots_rejected`, `cancelled`, `expired` |
| `slots_rejected` | Helper rejected proposed slots (not the request) | `pending` (new request sent) |
| `accepted` | Slot confirmed, Daily.co room generated | `completed`, `expired` |
| `completed` | Feedback submitted by Interviewer | *None (terminal)* |
| `cancelled` | Declined by Helper or cancelled by Seeker | *None (terminal)* |
| `expired` | No response in 72hrs (pending) or 24hrs past scheduled_at (accepted) | *None (terminal)* |

### 5.3 Resume Access Policy
Resumes are stored in a private Supabase Storage bucket. Access is granted exclusively via server-generated signed URLs (24-hour expiry) under these conditions:
1. The resume owner accesses their own resume.
2. An Interviewer accesses a shared resume while the session status is `accepted`.

After session status changes to `completed`, the system shall not generate new signed URLs for the Interviewer. The Interviewee retains permanent access to their own resume.

---

## 6. Non-Functional Requirements

### 6.1 Performance
* **NFR-001: Search Response Time**  
  The system shall return search results within 2 seconds of query submission, measured from submission to results rendered on screen, under a concurrent load of up to 200 users.
* **NFR-002: AI Question Generation Time**  
  The system shall complete Groq API question generation and populate the session's `questions_json` field within 15 seconds of session acceptance. Generation shall occur asynchronously via a Supabase Edge Function. The acceptance confirmation shall not be blocked by generation. The session screen shall poll for `questions_json` every 2 seconds and display a *"Generating question sheet..."* indicator until populated.
* **NFR-003: UI Interaction Feedback**  
  All interactive elements (buttons, form fields, toggles) shall provide immediate visual feedback (loading state, disabled state, success/error state) within 100ms of user interaction.
* **NFR-004: Concurrent User Capacity**  
  The system shall be designed to support up to 200 concurrent users across multiple colleges. Initial deployment shall be validated at 50 concurrent users.

### 6.2 Security
* **NFR-005: API Key Security**  
  All API keys (Groq, Supabase service role, Daily.co, Resend) shall be stored as server-side environment variables and accessed exclusively via Next.js API routes or Supabase Edge Functions. No API key shall be exposed to the client-side JavaScript bundle.
* **NFR-006: Resume Privacy**  
  Resumes shall be stored in a private Supabase Storage bucket and never publicly accessible via URL. All access shall be via server-side signed URLs with a 24-hour expiry, restricted to the conditions defined in Section 5.3.
* **NFR-007: Feedback Access Control**  
  Session feedback records shall only be accessible to the two session participants, enforced via Supabase Row Level Security (RLS) policies. Unauthorized access attempts shall return a 403 response.
* **NFR-008: HTTPS Only**  
  All data transmission between client and server shall occur over HTTPS only. Supabase and Vercel enforce this by default.

### 6.3 Usability
* **NFR-009: Responsive Design**  
  The application shall be fully responsive and functional on: mobile (min 375px), tablet (min 768px), and desktop (min 1280px). On viewports below 1024px, the three-panel session screen shall stack vertically: video call on top, question sheet in middle, feedback form at bottom.
* **NFR-010: Design Quality**  
  The visual design shall follow a clean, structured aesthetic referencing LeetCode's information density and layout familiarity. The design shall avoid generic unstyled component defaults, default Tailwind color palettes, and indiscriminate glassmorphism. Typography, spacing, and color usage shall be intentional and consistent across all pages. The application shall be clearly distinguishable from generic AI-generated web interfaces.

### 6.4 Availability & Reliability
* **NFR-011: Supabase Inactivity Prevention**  
  The system shall implement a daily automated ping to the Supabase database to prevent free-tier inactivity pause (which occurs after 7 days of inactivity). This shall be implemented as a Vercel Cron Job running once every 24 hours at 00:00 UTC.
* **NFR-012: Groq API Fallback**  
  In the event of a Groq API failure or rate limit error: (1) the system shall retry the request once after a 3-second delay; (2) if retry fails, the system shall serve pre-cached question hints from a static fallback JSON file seeded at build time for the top 10 most common companies; (3) if the company has no cache entry, the Interviewer shall see *"Question sheet unavailable. You can proceed with your own questions."* The session shall proceed normally in all fallback cases.
* **NFR-013: GitHub CSV Caching**  
  DSA question data fetched from the GitHub repository shall be cached server-side in Supabase and refreshed once every 7 days. The system shall never fetch directly from GitHub Raw API on a per-session-acceptance basis.

### 6.5 Data Retention
* **NFR-014: Data Retention Policy**  
  Session records, feedback, and question sheets shall be retained indefinitely unless a user deletes their account. Upon account deletion, all personally identifiable data belonging to that user shall be removed within 30 days.

---

## 7. Constraints & Assumptions

### 7.1 Technical Constraints
| ID | Constraint | Impact & Mitigation |
| :--- | :--- | :--- |
| **TC-001** | Vercel free tier: 10s serverless timeout | Groq generation moved to Supabase Edge Function (150s timeout). Vercel triggers; client polls. |
| **TC-002** | Supabase free tier: 500MB DB, 1GB storage | Resume size-limited to 5MB. Daily ping cron prevents pause (NFR-011). |
| **TC-003** | Groq free tier: 30 req/min, 14,400 req/day | Single prompt per session. Static fallback cache for Groq downtime (NFR-012). |
| **TC-004** | GitHub Raw API: 60 requests/hour per IP | CSV cached in Supabase, refreshed weekly. Never fetched per request (NFR-013). |
| **TC-005** | Next.js serverless functions: no memory state | All state in Supabase. No in-memory caching. |
| **TC-006** | Google OAuth setup required | One-time setup (~30 min). Must complete before auth works. |
| **TC-007** | Daily.co free tier: 2,000 participant-min | 16–17 full sessions. Upgrade plan when user base grows. |
| **TC-008** | Daily.co API key: server-side only | Room creation via Next.js API route only. Room URL is shareable. |
| **TC-009** | College domain whitelist server-side | Adding colleges requires config update, no code change. |
| **TC-010** | Resend free tier: 3,000 emails/month, 100/day | Sufficient for prototype. Monitor usage. |

### 7.2 Out of Scope — v1
* **SC-001:** Real-time in-app chat between users
* **SC-002:** Question upvoting / community contributions
* **SC-003:** Mobile native app (iOS/Android)
* **SC-004:** Payment or compensation for Interviewers
* **SC-005:** Company verification of interviewer claims
* **SC-006:** System design interview questions
* **SC-007:** Interview recording or transcription
* **SC-008:** Rich HTML email templates
* **SC-009:** Real-time AI question suggestions during live session
* **SC-010:** User-initiated account deletion
* **SC-011:** Auto-cancel sessions when a user is deactivated

### 7.3 Assumptions
* **AS-001:** Institutional email domains are unique per college (e.g. `iitr.ac.in` = IIT Roorkee only). Risk: domain collision breaks college-scoping. Mitigation: manual curation.
* **AS-002:** GitHub Raw CSV structure remains public and stable. Risk: question fetching breaks. Mitigation: server-side weekly caching.
* **AS-003:** Groq free tier remains available. Risk: AI features break. Mitigation: static fallback cache (NFR-012).
* **AS-004:** Daily.co free tier continues to offer 2,000 participant-minutes. Risk: video calling breaks. Mitigation: upgrade plan.
* **AS-005:** Users self-report experience honestly (trust-based in v1).
* **AS-006:** Target companies have corresponding folders in the CSV repo.
* **AS-007:** Vercel Cron is available on the free tier.
* **AS-008:** Users access platform on modern Chrome/Firefox/Edge browsers.

---

## 8. Requirements Traceability Matrix

| User Goal | Requirement(s) | Use Case |
| :--- | :--- | :--- |
| Register and verify identity | `FR-001, FR-002, FR-003` | `UC-001` |
| Complete profile with companies and roles | `FR-004, FR-005` | `UC-001` |
| Upload resume optionally | `FR-006` | `UC-001` |
| Reset forgotten password | `FR-007` | `UC-001` |
| Edit profile post-onboarding | `FR-008` | *None* |
| Find peers to interview me | `FR-009, FR-010, FR-011` | `UC-002` |
| Signal availability to others | `FR-012` | `UC-002` |
| Send a session request with multiple slots | `FR-013, FR-014` | `UC-003` |
| Share resume with interviewer | `FR-013` | `UC-003` |
| Accept, reject slots, or decline a request | `FR-015` | `UC-003` |
| Auto-generate video meeting room | `FR-016` | `UC-003` |
| Get AI-generated question sheet | `FR-017` | `UC-004` |
| Handle unanswered / abandoned sessions | `FR-018, FR-019` | `UC-003` |
| Review questions before session starts | `FR-020` | `UC-004` |
| Conduct session with video + questions + feedback | `FR-021, FR-022, FR-023` | `UC-004` |
| Receive and view structured feedback | `FR-024, FR-025, FR-026` | `UC-005` |
| Get reminded about upcoming sessions | `FR-028` | *None* |
| Be nudged to submit feedback | `FR-027` | *None* |
| View all past sessions | `FR-026` | `UC-005` |
| Admin moderation and stats | `FR-029` | *None* |
| College-scoped discovery | `FR-009, TC-009` | `UC-002` |
| Resume privacy after session | `NFR-006, FR-025` | *None* |
| Platform stays alive on free tier | `NFR-011, NFR-013` | *None* |
| Graceful AI failure handling | `NFR-012, FR-017` | `UC-003` |

---

## 9. Build Priority (3-Day Sprint)

* **🔴 Must Have (Day 1–2):** `FR-001–006, FR-009–017, FR-020–026` (~2 days effort)
* **🟡 Should Have (Day 2–3):** `FR-007, FR-008, FR-012, FR-022, FR-027, FR-028, FR-029` (~0.5 days effort)
* **🟢 Nice to Have (Day 3):** `NFR-011 (cron), NFR-012 (fallback cache), NFR-013 (CSV cache), FR-018, FR-019` (~0.5 days effort)

> [!TIP]
> **Build Recommendation**  
> Start with the Must-Have requirements to get the core transaction loop working: Register -> Search -> Request -> Accept -> Live Session -> Submit Feedback -> View History. Layer in Should-Have and Nice-to-Have specifications as time allows.
