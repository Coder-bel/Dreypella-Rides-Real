-- 1) Add active flag to bikers
ALTER TABLE public.bikers
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- 2) Lock dispatches to a single biker
ALTER TABLE public.dispatches
  ADD COLUMN IF NOT EXISTS assigned_biker_id uuid;

-- Allow ANY authenticated biker to SEE pending dispatches (so they can accept)
DROP POLICY IF EXISTS "Bikers can view dispatches" ON public.dispatches;
CREATE POLICY "Bikers can view available or own dispatches"
  ON public.dispatches FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'biker'::app_role)
    AND (
      (status = 'pending' AND assigned_biker_id IS NULL)
      OR assigned_biker_id IN (SELECT id FROM public.bikers WHERE user_id = auth.uid())
    )
  );

-- Replace old anon update policy with claim/own-update for authenticated bikers
DROP POLICY IF EXISTS "Bikers can update dispatch status" ON public.dispatches;
CREATE POLICY "Bikers can update assigned dispatches"
  ON public.dispatches FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'biker'::app_role)
    AND assigned_biker_id IN (SELECT id FROM public.bikers WHERE user_id = auth.uid())
  );

-- Atomic claim function (first-come-first-served lock)
CREATE OR REPLACE FUNCTION public.claim_dispatch(_dispatch_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_biker public.bikers%ROWTYPE;
  v_updated int;
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid, 'biker'::app_role) THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_a_biker');
  END IF;

  SELECT * INTO v_biker FROM public.bikers
   WHERE user_id = v_uid AND is_active = true LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'biker_inactive');
  END IF;

  UPDATE public.dispatches
     SET assigned_biker_id = v_biker.id,
         biker_assigned    = v_biker.full_name,
         biker_phone       = v_biker.whatsapp_number,
         status            = 'assigned'
   WHERE id = _dispatch_id
     AND assigned_biker_id IS NULL
     AND status = 'pending';
  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_taken');
  END IF;

  RETURN jsonb_build_object('success', true, 'biker_phone', v_biker.whatsapp_number, 'biker_name', v_biker.full_name);
END;
$$;

-- Mark dispatch delivered (only by assigned biker)
CREATE OR REPLACE FUNCTION public.mark_dispatch_delivered(_dispatch_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_updated int;
BEGIN
  UPDATE public.dispatches d
     SET status = 'completed'
   WHERE d.id = _dispatch_id
     AND d.assigned_biker_id IN (SELECT id FROM public.bikers WHERE user_id = auth.uid());
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

-- 3) OTP table for password resets (all roles)
CREATE TABLE IF NOT EXISTS public.password_reset_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,            -- phone OR email
  role text NOT NULL,                  -- 'user' | 'biker' | 'admin'
  user_id uuid,                        -- target auth user id
  otp_hash text NOT NULL,              -- sha256 hex of code
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  attempts int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pr_otps_identifier ON public.password_reset_otps(identifier, role, expires_at);
ALTER TABLE public.password_reset_otps ENABLE ROW LEVEL SECURITY;
-- No client policies — only edge functions (service role) access this table.

-- 4) Admin invites
CREATE TABLE IF NOT EXISTS public.admin_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  invite_code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',  -- pending | used | expired
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  invited_by uuid,
  used_by uuid,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view invites" ON public.admin_invites
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create invites" ON public.admin_invites
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND invited_by = auth.uid());

-- 5) Dedicated admins table (for phone, full name, dual verification)
CREATE TABLE IF NOT EXISTS public.admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  is_super boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admins"
  ON public.admins FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update own admin row"
  ON public.admins FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Claim admin invite (atomic): called from /admin-signup AFTER user signs up
CREATE OR REPLACE FUNCTION public.claim_admin_invite(_invite_code text, _full_name text, _email text, _phone text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_inv public.admin_invites%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO v_inv FROM public.admin_invites
    WHERE invite_code = _invite_code FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_code');
  END IF;
  IF v_inv.status <> 'pending' OR v_inv.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'expired_or_used');
  END IF;
  IF lower(v_inv.email) <> lower(_email) THEN
    RETURN jsonb_build_object('success', false, 'error', 'email_mismatch');
  END IF;

  INSERT INTO public.admins (user_id, full_name, email, phone)
    VALUES (v_uid, _full_name, _email, _phone)
    ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
    VALUES (v_uid, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.admin_invites
     SET status = 'used', used_by = v_uid, used_at = now()
   WHERE id = v_inv.id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 6) Realtime for dispatches (so all bikers see new orders instantly)
ALTER TABLE public.dispatches REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='dispatches'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.dispatches';
  END IF;
END $$;