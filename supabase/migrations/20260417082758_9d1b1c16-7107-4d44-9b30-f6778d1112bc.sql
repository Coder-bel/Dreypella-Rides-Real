
-- Add 'biker' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'biker';

-- Extend bikers table with onboarding fields
ALTER TABLE public.bikers
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS company_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS plate_number text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending_signup',
  ADD COLUMN IF NOT EXISTS user_id uuid;

-- Make whatsapp_number/email tolerant for onboarded-not-yet-signed-up bikers
ALTER TABLE public.bikers ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.bikers ALTER COLUMN email SET DEFAULT '';

-- Index for fast code lookups
CREATE INDEX IF NOT EXISTS idx_bikers_company_code ON public.bikers(company_code);

-- Allow admins to insert/update bikers (onboarding + status changes)
DROP POLICY IF EXISTS "Admins can insert bikers" ON public.bikers;
CREATE POLICY "Admins can insert bikers" ON public.bikers
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update bikers" ON public.bikers;
CREATE POLICY "Admins can update bikers" ON public.bikers
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow newly-signed-up bikers to claim their pending row by company_code
DROP POLICY IF EXISTS "Bikers can claim own row" ON public.bikers;
CREATE POLICY "Bikers can claim own row" ON public.bikers
  FOR UPDATE TO authenticated
  USING (status = 'pending_signup' OR user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Bikers can view their own row
DROP POLICY IF EXISTS "Bikers can view own row" ON public.bikers;
CREATE POLICY "Bikers can view own row" ON public.bikers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- Allow biker self-assignment of role after company_code validation
-- (We handle this via a security definer function so anon signups can't escalate)
CREATE OR REPLACE FUNCTION public.claim_biker_code(_company_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_biker_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT id INTO v_biker_id
  FROM public.bikers
  WHERE company_code = _company_code
    AND status = 'pending_signup'
    AND user_id IS NULL
  LIMIT 1;

  IF v_biker_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.bikers
  SET user_id = v_uid, status = 'active'
  WHERE id = v_biker_id;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'biker'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_biker_code(text) TO authenticated;
