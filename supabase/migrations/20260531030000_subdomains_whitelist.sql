-- =========================================================================
-- PeerPrep Subdomain Whitelist Support for Student Signups
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  email_domain text;
  college_name text;
  display_name text;
BEGIN
  -- Extract domain from email (case-insensitive)
  email_domain := lower(split_part(NEW.email, '@', 2));
  
  -- Check whitelist allowing both exact domain match and department/campus subdomains
  -- Order by length descending so the most specific subdomain matches first
  SELECT name INTO college_name 
  FROM public.college_whitelist 
  WHERE domain = email_domain OR email_domain LIKE '%.' || domain
  ORDER BY length(domain) DESC
  LIMIT 1;
  
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
