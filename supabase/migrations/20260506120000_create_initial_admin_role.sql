-- Assign the first admin role to an existing Supabase auth user.
-- Replace the email below with the actual first admin email before running the migration.

DO $$
DECLARE
  v_uid uuid;
BEGIN
  SELECT id INTO v_uid
  FROM auth.users
  WHERE email = 'okikibeloved@gmail.com'
  LIMIT 1;

  IF v_uid IS NULL THEN
    RAISE NOTICE 'No auth user found for okikibeloved@gmail.com. Please create the user first or update the email in this migration.';
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    SELECT v_uid, 'admin'::app_role
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = v_uid
        AND role = 'admin'::app_role
    );
    RAISE NOTICE 'Admin role assigned to user %.', v_uid;
  END IF;
END $$;
