-- =========================================================================
-- PeerPrep Storage Configuration (Private "resumes" Bucket Setup)
-- =========================================================================

-- 1. Create the private "resumes" storage bucket if it does not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  false, -- private bucket (secured using signed URLs)
  5242880, -- 5MB limit
  '{"application/pdf"}'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy: Allow authenticated users to upload resumes
CREATE POLICY "Allow authenticated users to upload resumes"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'resumes'
);

-- 3. Policy: Allow authenticated users to read resumes
CREATE POLICY "Allow authenticated users to read resumes"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'resumes'
);

-- 4. Policy: Allow authenticated users to delete resumes
CREATE POLICY "Allow authenticated users to delete resumes"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'resumes'
);
