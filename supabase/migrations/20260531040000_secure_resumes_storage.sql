-- =========================================================================
-- PeerPrep Secure Resume Storage RLS Policies (Option B)
-- Centralized Security: Centralizes storage access boundary directly in PostgreSQL.
-- =========================================================================

-- 1. Re-secure Read Policy (SELECT)
-- Drops the old open read policy and replaces it with a session-locked check.
DROP POLICY IF EXISTS "Allow authenticated users to read resumes" ON storage.objects;
DROP POLICY IF EXISTS "Allow session interviewers to read resumes" ON storage.objects;

CREATE POLICY "Allow session interviewers to read resumes"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'resumes' AND (
    -- Case A: The user is fetching their own resume file
    (storage.foldername(name))[2] = auth.uid()::text
    OR
    -- Case B: The user is the interviewer of a session where the interviewee's resume is shared
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE interviewee_id::text = (storage.foldername(name))[2]
        AND interviewer_id = auth.uid()
        AND resume_shared = true
    )
  )
);

-- 2. Re-secure Upload Policy (INSERT)
-- Restricts file uploads so users can ONLY upload to their own designated folder path.
DROP POLICY IF EXISTS "Allow authenticated users to upload resumes" ON storage.objects;

CREATE POLICY "Allow authenticated users to upload resumes"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- 3. Re-secure Delete Policy (DELETE)
-- Restricts file deletions so users can ONLY delete files from their own folder path.
DROP POLICY IF EXISTS "Allow authenticated users to delete resumes" ON storage.objects;

CREATE POLICY "Allow authenticated users to delete resumes"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[2] = auth.uid()::text
);
