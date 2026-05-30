# Document 01: Product Requirements Document (PRD)
**PeerPrep — Peer Mock Interview Platform**  
**Version 1.0 — June 2026**

---

## 1. App Identity
| Field | Detail |
| :--- | :--- |
| **App Name** | PeerPrep |
| **Tagline** | Practice like it's real. Learn from peers who've been there. |
| **Version** | MVP v1.0 |
| **Platform** | Web application (responsive — desktop primary, mobile supported) |

---

## 2. Problem Statement
Students targeting software engineering roles at specific tech companies (Google, Amazon, Microsoft, etc.) lack access to structured, human-led mock interview practice. Current solutions are fragmented:
* **Informal senior-junior chats** are helpful but unstructured — no questions, no feedback, no consistency.
* **Automated platforms** (LeetCode, Pramp) provide structure but lack genuine human interaction and company-specific preparation.

PeerPrep bridges this gap: structured, company-specific mock interviews between real peers, with AI-assisted question delivery, embedded video calling, and formal feedback.

---

## 3. Target User Persona
| Attribute | Detail |
| :--- | :--- |
| **Primary user** | A 2nd–4th year engineering student at an Indian technical institution targeting a software role at a specific tech company |
| **Secondary user** | The same student acting as a peer interviewer — building communication skills and giving back to the community |
| **Pain point** | Cannot easily find a willing, available peer to conduct a structured, company-specific mock interview |
| **Motivation** | Anxiety about real interviews; desire for feedback on communication, problem-solving, and coding approach |
| **Tech comfort** | High — comfortable with LeetCode, GitHub, video calls, web apps |
| **Access device** | Primarily desktop/laptop for interview sessions; mobile for browsing and notifications |

---

## 4. Core Value Proposition
1. **Fluid roles:** The same student can be an interviewee for Google and an interviewer for Amazon.
2. **AI-assisted:** The interviewer gets a company-specific question sheet with brute/optimal hints at session time. No preparation needed.
3. **Embedded everything:** Video call, question checklist, and feedback form all live on one screen.
4. **College-scoped:** Users only see peers from their own institution, preserving community trust.
5. **Zero cost:** Entirely free for students, built on free-tier infrastructure.

---

## 5. Features — Must Have (v1)
| # | Feature | Description |
| :--- | :--- | :--- |
| 1 | **Email + Google OAuth registration** | Verified institutional email; college auto-detected from domain. |
| 2 | **Guided onboarding** | 3-step flow: profile → companies/roles → optional skills/resume. |
| 3 | **Company-role profile** | Users tag themselves as targeting or experienced per company and role. |
| 4 | **Availability toggle** | ON = visible in search; OFF = hidden. |
| 5 | **College-scoped search** | Filter peers by company, role, and experience status; same college only. |
| 6 | **Multi-slot session request** | Seeker proposes 1–5 time slots; Helper picks one or rejects all. |
| 7 | **Optional resume sharing** | Seeker can optionally share resume with session request. |
| 8 | **Auto video room generation** | Daily.co room created at acceptance; embedded iframe on session screen. |
| 9 | **AI question sheet** | Groq generates DSA hints + HR + project questions per company at booking. |
| 10 | **Interactive question checklist** | Interviewer checks off questions in real time during session. |
| 11 | **Structured feedback form** | 5 rated categories + free text; filled during session; sent to interviewee after. |
| 12 | **Session history** | Full history of sessions as interviewer and interviewee with feedback access. |
| 13 | **Notifications** | In-app + email (Resend) for all session events and reminders. |
| 14 | **Password reset** | Supabase Auth native flow. |
| 15 | **Profile editing** | Edit name, year, skills, resume, companies, availability at any time. |
| 16 | **Admin panel** | Usage stats + user deactivation. |

---

## 6. Features — Nice to Have (v2)
| Feature | Notes |
| :--- | :--- |
| **In-app chat between users** | Post-session clarification; deferred to keep v1 lean. |
| **Auto Google Meet link generation** | OAuth complexity; Daily.co covers v1 needs. |
| **Question bank upvoting / community contributions** | Community-driven question bank. |
| **System design interview questions** | Separate question type; different format needed. |
| **Interview recording / transcription** | Privacy complexity. |
| **Real-time AI question suggestions during live session** | Streaming complexity; interviewer multitasking concern. |
| **Mobile native app (iOS/Android)** | Web responsive covers v1. |
| **Payment / compensation for interviewers** | Platform is volunteer-only for v1. |

---

## 7. User Stories
* **As a Seeker:** I want to *search for peers who have interviewed at Google for SDE*, so that *I can find someone qualified to mock interview me*.
* **As a Seeker:** I want to *propose multiple time slots when requesting a session*, so that *the helper can pick what works without back-and-forth*.
* **As a Seeker:** I want to *optionally share my resume with the interviewer*, so that *they can ask me project and experience-based questions*.
* **As a Seeker:** I want to *receive structured feedback after my session*, so that *I know exactly what to improve before my real interview*.
* **As a Helper:** I want to *see a pre-generated question sheet when I accept a session*, so that *I can conduct a structured interview without preparing myself*.
* **As a Helper:** I want to *check off questions as I ask them during the session*, so that *I stay on track and don't repeat or miss questions*.
* **As a Helper:** I want to *fill a feedback form during the interview*, so that *I don't forget my observations after the call ends*.
* **As a User:** I want to *toggle my availability on and off*, so that *I only appear in search when I'm actually open to interviews*.
* **As a User:** I want to *view my full session history with feedback*, so that *I can track my progress over time*.
* **As an Admin:** I want to *view platform usage stats and deactivate users*, so that *I can monitor health and remove bad actors*.

---

## 8. Out of Scope — v1
* In-app persistent chat between users.
* Payment or compensation for interviewers.
* Company verification of interviewer experience claims (trust-based in v1).
* System design interview questions.
* Interview recording or transcription.
* Mobile native app.
* User-initiated account deletion.
* Rich HTML email templates.
* Real-time AI question suggestions during live session.

---

## 9. Success Metrics
| Metric | Target (30 days post-launch) |
| :--- | :--- |
| **Sessions completed** | $\ge 20$ completed sessions |
| **Return usage** | $\ge 40\%$ of users participate in more than one session |
| **Feedback submission rate** | $\ge 80\%$ of completed sessions have feedback submitted |
| **Search-to-request conversion** | $\ge 30\%$ of searches result in a session request sent |
| **Slot acceptance rate** | $\ge 60\%$ of requests result in an accepted session (not cancelled/expired) |
