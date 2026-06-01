-- Security hardening: normalize RLS policies to prevent
-- admin/user/biker cross-access of sensitive details.
--
-- Goals:
-- 1) Admins can access admin pages/data.
-- 2) Users can only access their own profiles/bookings/dispatches/wallet.
-- 3) Bikers can only access dispatches relevant to them + their own biker row.
-- 4) Prevent any accidental read access to admin tables (admins, user_roles) for non-admins.
--
-- NOTE:
-- This migration is intentionally conservative: it removes/overrides policies
-- that are known to be conflicting/duplicated in earlier migrations.

begin;

-- Ensure role type exists (depends on earlier migrations)
-- If app_role doesn't exist yet, compilation may fail; in that case adjust.

-- =====================
-- user_roles (sensitive)
-- =====================
-- Only admins can read all roles.
-- Users can read their own role rows.
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Users can view their own role rows"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- =====================
-- admins (sensitive)
-- =====================
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can update own admin row" ON public.admins;
DROP POLICY IF EXISTS "Admins can view admins" ON public.admins;

-- Admins can read admin rows
CREATE POLICY "Admins can view admin rows"
  ON public.admins
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Only a user can update their own admin row (useful for onboarding)
-- If there is no user_id column on admins in your schema, update this policy.
-- Earlier migrations used (user_id = auth.uid()) in an UPDATE policy.
DROP POLICY IF EXISTS "Admins can update own admin row" ON public.admins;
CREATE POLICY "Admins can update own admin row"
  ON public.admins
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================
-- profiles
-- =====================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Users can access their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- =====================
-- bookings & dispatches
-- =====================
-- Admins: full read/update.
-- Users: own row only.
-- Bikers: only dispatches they can see via existing has_role logic.

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatches ENABLE ROW LEVEL SECURITY;

-- Bookings
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can insert own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON public.bookings;

CREATE POLICY "Users can view own bookings"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookings"
  ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all bookings"
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Dispatches
DROP POLICY IF EXISTS "Users can view own dispatches" ON public.dispatches;
DROP POLICY IF EXISTS "Users can insert own dispatches" ON public.dispatches;
DROP POLICY IF EXISTS "Users can update own dispatches" ON public.dispatches;
DROP POLICY IF EXISTS "Admins can view all dispatches" ON public.dispatches;
DROP POLICY IF EXISTS "Admins can update all dispatches" ON public.dispatches;
DROP POLICY IF EXISTS "Bikers can view pending dispatches" ON public.dispatches;
DROP POLICY IF EXISTS "Bikers can view all dispatches" ON public.dispatches;
DROP POLICY IF EXISTS "Bikers can view dispatches" ON public.dispatches;
DROP POLICY IF EXISTS "Bikers can update dispatch status" ON public.dispatches;
DROP POLICY IF EXISTS "Bikers can update assigned dispatches" ON public.dispatches;

-- Users can see only their dispatches (sender == user_id)
CREATE POLICY "Users can view own dispatches"
  ON public.dispatches
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dispatches"
  ON public.dispatches
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dispatches"
  ON public.dispatches
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can see/update everything in dispatches
CREATE POLICY "Admins can view all dispatches"
  ON public.dispatches
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all dispatches"
  ON public.dispatches
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Bikers visibility: rely on existing has_role('biker') logic used elsewhere.
-- If your dispatches table uses different columns than (user_id/assigned_biker_id/etc), adjust.
-- Here we provide the common pattern used in earlier migrations.
CREATE POLICY "Bikers can view available or own dispatches"
  ON public.dispatches
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'biker'::app_role)
    AND (
      status = 'pending_delivery'
      OR assigned_biker_id IN (SELECT id FROM public.bikers WHERE user_id = auth.uid())
      OR user_id = auth.uid()
    )
  );

-- Bikers can update dispatch status only when they are the assigned biker
CREATE POLICY "Bikers can update their assigned dispatches"
  ON public.dispatches
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'biker'::app_role)
    AND assigned_biker_id IN (SELECT id FROM public.bikers WHERE user_id = auth.uid())
  );

-- =====================
-- bikers
-- =====================
ALTER TABLE public.bikers ENABLE ROW LEVEL SECURITY;

-- Only admins and the biker themselves can see/update the biker row.
DROP POLICY IF EXISTS "Anon can view bikers" ON public.bikers;
DROP POLICY IF EXISTS "Bikers can view own row" ON public.bikers;
DROP POLICY IF EXISTS "Admins can view bikers" ON public.bikers;
DROP POLICY IF EXISTS "Admins can insert bikers" ON public.bikers;
DROP POLICY IF EXISTS "Admins can update bikers" ON public.bikers;
DROP POLICY IF EXISTS "Bikers can claim own row" ON public.bikers;

-- Keep anon read if you still need it for code lookup.
-- This should NOT include sensitive columns.
-- If you want stricter behavior, replace SELECT list/columns via view or remove anon policy.
CREATE POLICY "Anon can view bikers" ON public.bikers
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "Bikers can view their own row"
  ON public.bikers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view bikers"
  ON public.bikers
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert bikers"
  ON public.bikers
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update bikers"
  ON public.bikers
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- =====================
commit;


