# PeerPrep 🎓

PeerPrep is a specialized peer-to-peer mock interview platform designed specifically for college campuses. It allows students targeting software engineering, AI/ML, and other technical roles to schedule, conduct, and review mock interviews with whitelisted peers from their own institution.

Live Production URL: **[peer-prep-opal.vercel.app](https://peer-prep-opal.vercel.app)**

---

## 🚀 Key Features

* **Institutional Domain Gating:** A secure signup verification trigger that automatically checks, parses, and maps campus subdomains (e.g., department emails) to their correct parent institution, ensuring students only interview with verified peers.
* **Airtight Privacy & Storage RLS:** High-security storage rules restricting resume PDF uploads and downloads. Resumes can only be read by their owner or by the specific peer during an active scheduled mock session.
* **AI-Generated Mock Question Sheets:** Deep integration with the **Groq API** to dynamically generate technical interview questions, brute-force hints, optimal complexity constraints, and behavioral questions tailored to target tech companies (e.g., Google, Amazon, Microsoft).
* **Structured Evaluation Scoresheets:** A post-interview evaluation form where interviewers rate candidate performance across problem-solving, communication, code quality, clarity, and time management, instantly delivering structured feedback and constructive assessments to the candidate via email.
* **In-App Realtime Signaling & Video Calls:** Integrated 100% free, WebRTC-based video calling powered by **Jitsi Meet**, with live status notifications and dynamic lobby synchronization.

---

## 🛠️ Technology Stack

* **Frontend Framework:** Next.js 15 (App Router, Server Components)
* **Styling & Design System:** Tailwind CSS with a solid, modern layout design
* **Database & Auth:** Supabase (PostgreSQL database, Row Level Security, Storage Bucket, and Google OAuth)
* **AI Engine:** Groq API (utilizing Llama 3 models) for inline hint sheet generation
* **Email Dispatcher:** Resend API for transactional confirmation and feedback emails
* **Video Communications:** Jitsi Meet API (WebRTC)

---

## 💻 Getting Started (Local Development)

### 1. Pre-requisites
* Node.js (v18+)
* A Supabase cloud database project

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory of your project and populate it with your API keys:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Engine
GROQ_API_KEY=your-groq-api-key

# Video & Email Integrations
DAILY_API_KEY=placeholder-or-your-daily-key
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=your-verified-resend-sender-email

# App URL Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Initialize Database Migrations
Apply the PostgreSQL schemas, triggers, and storage security rules to your Supabase instance by executing the migration scripts located in the `supabase/migrations/` directory:
1. Run `20260530000000_init_schema.sql` (baseline schemas, tables, and RLS).
2. Run `20260531000000_storage_setup.sql` (resume bucket initialization).
3. Run `20260531030000_subdomains_whitelist.sql` (signup domain parsing trigger).
4. Run `20260531040000_secure_resumes_storage.sql` (airtight resume bucket security policies).

### 4. Install Dependencies & Start Server
Run the following commands in your terminal:
```bash
# Install dependencies
npm install

# Start Next.js Turbopack development server
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## ☁️ Deployment on Vercel

PeerPrep is optimized for instant hosting on **Vercel**:
1. Connect your GitHub repository to Vercel.
2. Add your `.env.local` keys as **Project Environment Variables**.
3. Trigger the deployment.
4. **Post-Deployment Actions:**
   * Update the `Site URL` and `Redirect URLs` in your **Supabase Dashboard** (under Auth -> URL Configuration) to point to your live Vercel URL (e.g., `https://peer-prep-opal.vercel.app`).
   * Update the `NEXT_PUBLIC_APP_URL` variable in your Vercel Dashboard to point to your live URL, then trigger a quick redeployment.
