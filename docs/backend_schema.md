# Document 05: Backend Schema
**PeerPrep — Peer Mock Interview Platform**  
**Version 1.0 — June 2026**

---

## 1. Database Tables

### `users`
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Matches Supabase Auth user ID. |
| `email` | `text` | UNIQUE, NOT NULL | Verified institutional email. |
| `name` | `text` | NOT NULL | Display name. |
| `college` | `text` | NOT NULL | Auto-derived from email domain at signup. |
| `graduation_year` | `integer` | NOT NULL | 4-digit graduation year, e.g., `2026`. |
| `skills` | `text[]` | DEFAULT `'{}'` | Array of skill strings. |
| `resume_url` | `text` | NULLABLE | Supabase Storage path (not a public URL). |
| `availability` | `boolean` | DEFAULT `true` | `true` = visible in search. |
| `onboarding_complete`| `boolean` | DEFAULT `false` | Gates access to main app. |
| `role` | `text` | DEFAULT `'user'` | `'user'` \| `'admin'`. |
| `created_at` | `timestamptz`| DEFAULT `now()` | Record creation timestamp. |

### `companies`
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier. |
| `name` | `text` | UNIQUE, NOT NULL | Display name, e.g., `'Google'`. |
| `slug` | `text` | UNIQUE, NOT NULL | Matches GitHub folder names, e.g., `'Google'`. |
| `created_at` | `timestamptz`| DEFAULT `now()` | Record creation timestamp. |

### `user_companies`
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier. |
| `user_id` | `uuid` | NOT NULL, FK $\rightarrow$ `users.id` ON DELETE CASCADE | Owner. |
| `company_id` | `uuid` | NOT NULL, FK $\rightarrow$ `companies.id` ON DELETE CASCADE | Associated company. |
| `role` | `text` | NOT NULL | `'SDE'` \| `'AI-ML'` \| `'Data Engineer'` \| `'Product'` \| `'Other'`. |
| `type` | `text` | NOT NULL | `'targeting'` \| `'experienced'`. |
| `created_at` | `timestamptz`| DEFAULT `now()` | Record creation timestamp. |
* **Constraint:** `UNIQUE(user_id, company_id, role)` to prevent duplicate entries.

### `sessions`
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier. |
| `interviewee_id` | `uuid` | NOT NULL, FK $\rightarrow$ `users.id` | Seeker who requested mock. |
| `interviewer_id` | `uuid` | NULLABLE, FK $\rightarrow$ `users.id` | Assigned when Helper accepts. |
| `company_id` | `uuid` | NOT NULL, FK $\rightarrow$ `companies.id` | Target company. |
| `status` | `text` | NOT NULL, DEFAULT `'pending'` | Enum: `pending` \| `slots_rejected` \| `accepted` \| `completed` \| `cancelled` \| `expired`. |
| `proposed_slots` | `jsonb` | NOT NULL | Array of up to 5 `{date, time}` objects. |
| `scheduled_at` | `timestamptz`| NULLABLE | Slot confirmed by Helper. |
| `daily_room_url` | `text` | NULLABLE | Daily.co API generated link. |
| `resume_shared` | `boolean` | DEFAULT `false` | Seeker's consent to share resume. |
| `request_note` | `text` | NULLABLE | Max 500 chars note from Seeker. |
| `rejection_note` | `text` | NULLABLE | Max 200 chars note from Helper on slot rejection. |
| `questions_json` | `jsonb` | NULLABLE | Generated question sheet (async via Edge function). |
| `questions_checked`| `jsonb` | DEFAULT `'[]'` | Array of checked question IDs. |
| `created_at` | `timestamptz`| DEFAULT `now()` | Record creation timestamp. |
| `updated_at` | `timestamptz`| DEFAULT `now()` | Record update timestamp. |

### `feedback`
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier. |
| `session_id` | `uuid` | NOT NULL, UNIQUE, FK $\rightarrow$ `sessions.id` | One feedback record per session. |
| `clarity_score` | `integer` | NULLABLE, CHECK (1–5) | Clarity of Thought rating. |
| `communication_score`| `integer`| NULLABLE, CHECK (1–5) | Communication rating. |
| `problem_solving_score`|`integer`| NULLABLE, CHECK (1–5) | Problem-Solving Approach rating. |
| `code_quality_score`| `integer` | NULLABLE, CHECK (1–5) | Code Quality rating. |
| `time_management_score`|`integer`| NULLABLE, CHECK (1–5) | Time Management rating. |
| `notes` | `text` | NULLABLE | Free text comments; no limit. |
| `created_at` | `timestamptz`| DEFAULT `now()` | Record creation timestamp. |

### `notifications`
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier. |
| `user_id` | `uuid` | NOT NULL, FK $\rightarrow$ `users.id` ON DELETE CASCADE | Recipient. |
| `type` | `text` | NOT NULL | Enum: `session_request` \| `session_accepted` \| `slots_rejected` \| `session_cancelled` \| `feedback_ready` \| `session_reminder` \| `feedback_reminder` \| `session_expired`. |
| `message` | `text` | NOT NULL | Human-readable alert text. |
| `session_id` | `uuid` | NULLABLE, FK $\rightarrow$ `sessions.id` | Associated session link. |
| `read` | `boolean` | DEFAULT `false` | Unread/read status flag. |
| `created_at` | `timestamptz`| DEFAULT `now()` | Record creation timestamp. |

### `question_cache`
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier. |
| `company_slug` | `text` | UNIQUE, NOT NULL | Matches `companies.slug`. |
| `questions_json` | `jsonb` | NOT NULL | Parsed CSV data from GitHub repo. |
| `fallback_hints_json`| `jsonb` | NULLABLE | Pre-generated Groq hints for top 5 questions. |
| `last_refreshed_at`| `timestamptz`| NOT NULL | Checked for 7-day cache refresh cron. |

---

## 2. Row Level Security (RLS) Policies
* **`users`**
  * `Select`: Users can read all users from the same college (for search). Users can read/update their own row.
  * `Update`: Users can only update their own row. The `college` field is immutable.
* **`user_companies`**
  * `All`: Users can perform CRUD operations only on their own `user_companies` rows.
* **`sessions`**
  * `Select`: Users can only read sessions where they are `interviewee_id` OR `interviewer_id`.
  * `Insert`: Authenticated users can insert sessions as `interviewee`.
  * `Update`: Interviewees can update: `status` (cancel only), and request fields. Interviewers can update: `status`, `scheduled_at`, `daily_room_url`, `questions_checked`, and `rejection_note`. Service role can update all fields.
* **`feedback`**
  * `Select`: Only the session's `interviewee_id` and `interviewer_id` can read feedback for that session.
  * `Insert`: Only the session's `interviewer_id` can insert feedback.
  * `Update`: Feedback is immutable after insertion.
* **`notifications`**
  * `Select`: Users can only read their own notifications.
  * `Update`: Users can only update `read=true` on their own notifications.
* **`question_cache`**
  * `Select`: All authenticated users can read question cache.
  * `Insert/Update`: Service role only (via cron refresh).

---

## 3. Authentication Architecture
* **Provider:** Supabase Auth.
* **Methods:** Email/password + Google OAuth.
* **Email Verification:** Required before accessing any protected route. Supabase handles email verification sending.
* **Password Reset:** Native Supabase Auth flow with a 1-hour link expiration.
* **Session Persistence:** Supabase JWT stored in an `httpOnly` cookie via `@supabase/ssr`, auto-refreshed.
* **Route Protection:** Next.js middleware checks the session on all protected routes and redirects to `/login` if missing.
* **Onboarding Gate:** Middleware checks the `onboarding_complete` flag. Redirects to `/onboarding` if false.
* **Admin Role:** `role = 'admin'` configured in database, role-checked server-side on `/admin` route.
* **College Auto-Detection:** Domain extracted from email address, verified against domain whitelists at signup, stored as `users.college` (immutable).

---

## 4. File Storage
* **Bucket:** `resumes` (Private bucket — no public access permitted).
* **Path pattern:** `resumes/{user_id}/{filename}.pdf`.
* **Constraints:** PDF format only, max size 5MB (validated client and server-side).
* **Access method:** Signed URLs only. Generated server-side using the Supabase Service Role Key.
* **URL Expiry:** 24 hours.
* **Access policy:** Owner can always access. Interviewers can only access if the session status is `accepted`. Access is blocked after session turns `completed` (no new signed URLs are issued to the interviewer).

---

## 5. Supabase Edge Function: `generate-questions`
* **Trigger:** POST request to `/functions/v1/generate-questions` from Next.js `/api/daily` (upon slot acceptance).
* **Input:** `{ session_id: string, company_slug: string }`
* **Steps:**
  1. Fetch DSA questions from `question_cache` for `company_slug`.
  2. Select the top 5 questions ordered by `frequency_score` descending.
  3. Format a single Groq prompt requesting brute-force and optimal code approaches and time/space complexities for each question.
  4. Call the Groq API (`Llama 3.1 8B` model).
  5. Parse the returned markdown or JSON into structured objects.
  6. Append 3–5 HR questions and 2–3 project questions tailored to the company.
  7. Update `sessions SET questions_json = {...} WHERE id = session_id`.
* **Fallback:** If Groq fails (network or rate limit), read `fallback_hints_json` from `question_cache`.
* **Timeout limit:** `150 seconds` (Supabase Edge Function threshold — plenty for Groq).
