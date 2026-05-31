-- =========================================================================
-- PeerPrep Initial Schema Migration
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. COLLEGE WHITELIST TABLE ───────────────────────────────────────────
CREATE TABLE public.college_whitelist (
  domain text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Seed Whitelisted Domains
INSERT INTO public.college_whitelist (domain, name) VALUES
  ('iitr.ac.in', 'IIT Roorkee'),
  ('iitb.ac.in', 'IIT Bombay'),
  ('iitd.ac.in', 'IIT Delhi'),
  ('iitm.ac.in', 'IIT Madras'),
  ('iitk.ac.in', 'IIT Kanpur'),
  ('iitkgp.ac.in', 'IIT Kharagpur'),
  ('iitg.ac.in', 'IIT Guwahati'),
  ('iith.ac.in', 'IIT Hyderabad'),
  ('bits-pilani.ac.in', 'BITS Pilani'),
  ('pilani.bits-pilani.ac.in', 'BITS Pilani (Pilani campus)'),
  ('goa.bits-pilani.ac.in', 'BITS Pilani (Goa campus)'),
  ('hyderabad.bits-pilani.ac.in', 'BITS Pilani (Hyderabad campus)'),
  ('nitt.edu', 'NIT Trichy'),
  ('nitw.ac.in', 'NIT Warangal'),
  ('mnnit.ac.in', 'MNNIT Allahabad');

-- ── 2. USERS TABLE ───────────────────────────────────────────────────────
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  college text NOT NULL,
  graduation_year integer, -- NULLABLE initially during registration, filled in onboarding
  skills text[] DEFAULT '{}',
  resume_url text,
  availability boolean DEFAULT true,
  onboarding_complete boolean DEFAULT false,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz DEFAULT now()
);

-- Index on college and availability for scoped peer search
CREATE INDEX idx_users_college_availability ON public.users (college, availability);

-- ── 3. COMPANIES TABLE ───────────────────────────────────────────────────
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Seed Predefined Companies
INSERT INTO public.companies (name, slug) VALUES
  ('Google', 'Google'),
  ('Amazon', 'Amazon'),
  ('Microsoft', 'Microsoft'),
  ('Meta', 'Facebook'),
  ('Netflix', 'Netflix'),
  ('Apple', 'Apple'),
  ('Uber', 'Uber'),
  ('Lyft', 'Lyft'),
  ('Airbnb', 'Airbnb'),
  ('Twitter / X', 'Twitter'),
  ('Stripe', 'Stripe'),
  ('Salesforce', 'Salesforce'),
  ('Adobe', 'Adobe'),
  ('Nvidia', 'Nvidia'),
  ('Oracle', 'Oracle'),
  ('Bloomberg', 'Bloomberg'),
  ('LinkedIn', 'LinkedIn'),
  ('Goldman Sachs', 'GoldmanSachs'),
  ('JPMorgan Chase', 'JPMorgan'),
  ('Cisco', 'Cisco'),
  ('Zoom', 'Zoom'),
  ('Pinterest', 'Pinterest'),
  ('Snap', 'Snap'),
  ('Figma', 'Figma'),
  ('Roblox', 'Roblox'),
  ('Atlassian', 'Atlassian'),
  ('TikTok', 'TikTok'),
  ('Palantir', 'Palantir'),
  ('Snowflake', 'Snowflake'),
  ('Databricks', 'Databricks'),
  ('Spotify', 'Spotify'),
  ('Tesla', 'Tesla'),
  ('ByteDance', 'ByteDance'),
  ('Coinbase', 'Coinbase');

-- ── 4. USER COMPANIES TABLE (MANY-TO-MANY) ──────────────────────────────────
CREATE TABLE public.user_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('SDE', 'AI-ML', 'Data Engineer', 'Product', 'Other')),
  type text NOT NULL CHECK (type IN ('targeting', 'experienced')),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_company_role UNIQUE (user_id, company_id, role)
);

CREATE INDEX idx_user_companies_company_type ON public.user_companies (company_id, type);

-- ── 5. SESSIONS TABLE ────────────────────────────────────────────────────
CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interviewee_id uuid NOT NULL REFERENCES public.users(id),
  interviewer_id uuid REFERENCES public.users(id),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'slots_rejected', 'accepted', 'completed', 'cancelled', 'expired')),
  proposed_slots jsonb NOT NULL, -- Array of {date, time} objects
  scheduled_at timestamptz,
  daily_room_url text,
  resume_shared boolean DEFAULT false,
  request_note text, -- Max 500 chars (validated in app)
  rejection_note text, -- Max 200 chars (validated in app)
  questions_json jsonb,
  questions_checked jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_sessions_interviewee ON public.sessions (interviewee_id);
CREATE INDEX idx_sessions_interviewer ON public.sessions (interviewer_id);
CREATE INDEX idx_sessions_status ON public.sessions (status);

-- ── 6. FEEDBACK TABLE ────────────────────────────────────────────────────
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL UNIQUE REFERENCES public.sessions(id) ON DELETE CASCADE,
  clarity_score integer CHECK (clarity_score >= 1 AND clarity_score <= 5),
  communication_score integer CHECK (communication_score >= 1 AND communication_score <= 5),
  problem_solving_score integer CHECK (problem_solving_score >= 1 AND problem_solving_score <= 5),
  code_quality_score integer CHECK (code_quality_score >= 1 AND code_quality_score <= 5),
  time_management_score integer CHECK (time_management_score >= 1 AND time_management_score <= 5),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ── 7. NOTIFICATIONS TABLE ────────────────────────────────────────────────
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('session_request', 'session_accepted', 'slots_rejected', 'session_cancelled', 'feedback_ready', 'session_reminder', 'feedback_reminder', 'session_expired')),
  message text NOT NULL,
  session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id) WHERE read = false;

-- ── 8. QUESTION CACHE TABLE ──────────────────────────────────────────────
CREATE TABLE public.question_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_slug text UNIQUE NOT NULL REFERENCES public.companies(slug) ON DELETE CASCADE,
  questions_json jsonb NOT NULL,
  fallback_hints_json jsonb,
  last_refreshed_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================================
-- TRIGGERS AND FUNCTIONS
-- =========================================================================

-- Trigger to handle auth.users -> public.users sync with College Check
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  email_domain text;
  college_name text;
  display_name text;
BEGIN
  -- Extract domain from email
  email_domain := split_part(NEW.email, '@', 2);
  
  -- Check whitelist
  SELECT name INTO college_name FROM public.college_whitelist WHERE domain = email_domain;
  
  IF college_name IS NULL THEN
    RAISE EXCEPTION 'Your institution is not yet supported. We are expanding soon!';
  END IF;

  -- Use raw_user_meta_data name, or email username as fallback
  display_name := coalesce(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));

  INSERT INTO public.users (id, email, name, college, onboarding_complete)
  VALUES (NEW.id, NEW.email, display_name, college_name, false);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to make the college field immutable on update
CREATE OR REPLACE FUNCTION public.check_users_college_immutable()
RETURNS trigger AS $$
BEGIN
  IF NEW.college IS DISTINCT FROM OLD.college THEN
    RAISE EXCEPTION 'college field is immutable after registration';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_college_immutable
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.check_users_college_immutable();

-- Trigger to prevent updating feedback records (immutable once written)
CREATE OR REPLACE FUNCTION public.prevent_feedback_update()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Feedback is immutable and cannot be modified';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_feedback_update
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.prevent_feedback_update();

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) & POLICIES
-- =========================================================================

-- Helper function to fetch the currently authed user's college securely (avoids infinite RLS recursion)
CREATE OR REPLACE FUNCTION public.get_auth_user_college()
RETURNS text SECURITY DEFINER AS $$
  SELECT college FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql;

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.college_whitelist ENABLE ROW LEVEL SECURITY;

-- ── public.college_whitelist policies ──
CREATE POLICY "Allow authenticated read on whitelists"
  ON public.college_whitelist FOR SELECT TO authenticated USING (true);

-- ── public.users policies ──
CREATE POLICY "Allow same-college read or self read"
  ON public.users FOR SELECT TO authenticated
  USING (id = auth.uid() OR college = public.get_auth_user_college());

CREATE POLICY "Allow self updates"
  ON public.users FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- ── public.user_companies policies ──
CREATE POLICY "Allow select of user_companies for all authenticated users"
  ON public.user_companies FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow insert of own user_companies"
  ON public.user_companies FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow update of own user_companies"
  ON public.user_companies FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Allow delete of own user_companies"
  ON public.user_companies FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ── public.companies policies ──
CREATE POLICY "Allow all authenticated users to read companies"
  ON public.companies FOR SELECT TO authenticated USING (true);

-- ── public.sessions policies ──
CREATE POLICY "Allow read on sessions participating in"
  ON public.sessions FOR SELECT TO authenticated
  USING (interviewee_id = auth.uid() OR interviewer_id = auth.uid());

CREATE POLICY "Allow insert of sessions as interviewee"
  ON public.sessions FOR INSERT TO authenticated
  WITH CHECK (interviewee_id = auth.uid());

CREATE POLICY "Allow update of sessions participating in"
  ON public.sessions FOR UPDATE TO authenticated
  USING (interviewee_id = auth.uid() OR interviewer_id = auth.uid());

-- ── public.feedback policies ──
CREATE POLICY "Allow feedback read if session participant"
  ON public.feedback FOR SELECT TO authenticated
  USING (
    auth.uid() = (SELECT interviewee_id FROM public.sessions WHERE id = session_id) OR
    auth.uid() = (SELECT interviewer_id FROM public.sessions WHERE id = session_id)
  );

CREATE POLICY "Allow feedback insert if interviewer"
  ON public.feedback FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = (SELECT interviewer_id FROM public.sessions WHERE id = session_id)
  );

-- ── public.notifications policies ──
CREATE POLICY "Allow read of own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Allow update of own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Allow insert of notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- ── public.question_cache policies ──
CREATE POLICY "Allow all authenticated users to read question cache"
  ON public.question_cache FOR SELECT TO authenticated USING (true);
