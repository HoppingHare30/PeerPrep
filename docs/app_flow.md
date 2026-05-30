# Document 03: App Flow
**PeerPrep — Peer Mock Interview Platform**  
**Version 1.0 — June 2026**

---

## 1. Pages & Routes
| Route | Page Name | Access | Description |
| :--- | :--- | :--- | :--- |
| `/` | Landing Page | Public | Hero, value proposition, sign up / log in CTAs. |
| `/login` | Login | Public (unauthed) | Email/password + Google OAuth login. |
| `/signup` | Sign Up | Public (unauthed) | Email/password + Google OAuth registration. |
| `/verify` | Email Verification | Public | Prompt to check email; resend link option. |
| `/onboarding`| Onboarding | Authed, incomplete profile | 3-step guided profile setup; cannot skip steps 1–2. |
| `/dashboard` | Dashboard | Authed | Upcoming sessions, recent activity, quick actions. |
| `/search` | Search | Authed | Search and filter peers by company, role, experience. |
| `/profile/[id]`| User Profile | Authed | View any user's public profile; send request from here. |
| `/profile/settings`| Profile Settings| Authed (own) | Edit name, year, skills, resume, companies, availability. |
| `/sessions` | Session History | Authed | All past and upcoming sessions (interviewer + interviewee). |
| `/session/[id]`| Session Screen | Authed (participant) | Pre-session: question sheet. Live: video + questions + feedback. |
| `/admin` | Admin Panel | Admin role only | Usage stats, user list, deactivation controls. |

---

## 2. Navigation Structure
* **Desktop ($\ge 1024$px):** Fixed left sidebar, `240px` wide. Contains: PeerPrep logo, navigation links (Dashboard, Search, Sessions, Profile, Settings, Admin), user avatar + name at bottom, and an availability toggle.
* **Mobile ($< 1024$px):** Fixed bottom tab bar with 4 icons: Dashboard, Search, Sessions, Profile.
* **Active State:** Muted orange left border + orange text on sidebar links.
* **Session Screen:** Sidebar and bottom nav are **hidden** — full screen is dedicated to the interview workspace.

---

## 3. Entry Points
| User State | First Screen | Redirect Logic |
| :--- | :--- | :--- |
| **Brand new visitor** | `/` | Sign Up CTA $\rightarrow$ `/signup` $\rightarrow$ verify $\rightarrow$ `/onboarding` $\rightarrow$ `/dashboard` |
| **Returning user (logged out)** | `/login` | Login $\rightarrow$ if onboarding incomplete $\rightarrow$ `/onboarding`, else $\rightarrow$ `/dashboard` |
| **Logged in user hitting `/`** | `/dashboard` | Redirected to `/dashboard` immediately. |
| **Logged in, onboarding incomplete** | `/onboarding`| Every protected route checks the `onboarding_complete` flag and redirects if `false`. |
| **Admin user** | `/dashboard` | Admin link visible in sidebar; `/admin` accessible. |

---

## 4. Core User Journeys

### Core Journey 1: Seeker Finds and Books an Interview
1. **Land on Search (`/search`):** User arrives from dashboard or sidebar. Sees default list of available same-college peers.
2. **Filter by Company + Role:** User types 'Google', selects 'SDE', optionally filters by 'Experienced'. Results update.
3. **View a Profile (`/profile/[id]`):** User clicks a peer card. Sees their name, year, skills, company history, and session counts.
4. **Open Request Form:** User clicks 'Request Interview'. Modal/drawer opens with request form.
5. **Fill Request:** Selects company (pre-populated), proposes 1–5 time slots, chooses resume share (Yes/No), and adds an optional note. Submits.
6. **Await Response:** Redirected to `/sessions`. Session shows status `Pending`. In-app + email notification sent to the Helper.
7. **Helper Accepts:** Helper selects one slot. Session status $\rightarrow$ `Accepted`. Daily.co room created. Seeker notified.
8. **Join Session (`/session/[id]`):** At scheduled time, seeker opens session screen. Sees video call + session details. No question sheet.
9. **Receive Feedback:** After interviewer submits feedback, seeker receives notification and views structured ratings under `/sessions`.

### Core Journey 2: Helper Conducts an Interview
1. **Receive Request Notification:** Helper opens request from notification or `/sessions`.
2. **Review Request:** Sees seeker's name, target company, proposed slots, optional resume, and optional note.
3. **Accept + Pick Slot:** Helper selects one slot. System creates Daily.co room and triggers Groq question generation.
4. **Pre-Session Review:** Helper opens `/session/[id]` before scheduled time. Sees question sheet full-width (read-only) with DSA hints, HR, and project questions.
5. **Live Session:** At scheduled time, screen transitions to 3 panels (Left: questions, Center: video, Right: feedback).
6. **Conduct Interview:** Helper asks questions, checks them off in real time, and fills out the feedback form progressively.
7. **Submit Feedback:** Helper clicks 'Submit Feedback'. Session status $\rightarrow$ `Completed`. Seeker is notified and ratings are saved.

---

## 5. Auth & Onboarding Flow
1. **Sign Up:** User enters details on `/signup` or registers via Google OAuth.
2. **Verify Email:** Verification email sent via Supabase. College domain check matched against whitelist. Users.college is set.
3. **Onboarding Step 1:** `/onboarding` $\rightarrow$ Confirm name, enter graduation year (mandatory).
4. **Onboarding Step 2:** Search and add companies + roles + targeting/experienced status (mandatory, at least one).
5. **Onboarding Step 3 (Optional):** Add skills, upload resume (PDF $\le$ 5MB).
6. **Dashboard:** Onboarding complete flag set. Availability set to `ON`. User lands on `/dashboard`.

---

## 6. Empty States
| Page / Component | Empty State Message | Action |
| :--- | :--- | :--- |
| **Search results** | *"No available interviewers found for this company. Try removing filters or check back later."* | Clear filters button |
| **Search (first from college)** | *"Looks like you're the first from your college! Invite peers to join."* | Copy invite link button |
| **Session history** | *"No sessions yet. Start by searching for an interviewer or making yourself available."* | Go to Search CTA |
| **Dashboard (no sessions)**| *"Nothing scheduled yet. Find a peer to practice with."* | Go to Search CTA |
| **Question sheet (Groq failed)**| *"Question sheet unavailable. You can proceed with your own questions."* | Retry button |
| **Feedback (not submitted)**| *"Awaiting feedback from your interviewer."* | — |

---

## 7. Redirect Logic Summary
* **Successful sign up:** $\rightarrow$ `/verify` (if email not yet verified).
* **Email verified:** $\rightarrow$ `/onboarding` (if profile incomplete).
* **Onboarding complete:** $\rightarrow$ `/dashboard`.
* **Login (complete profile):** $\rightarrow$ `/dashboard`.
* **Login (incomplete onboarding):** $\rightarrow$ `/onboarding` (resumes from last step).
* **Logout:** $\rightarrow$ `/`.
* **Unauthorized access to protected route:** $\rightarrow$ `/login`.
* **Admin accesses `/admin` without role:** $\rightarrow$ `/dashboard` (shows 403).
* **Session feedback submitted:** $\rightarrow$ `/sessions`.
* **Password reset link clicked:** $\rightarrow$ `/login` with reset form.
