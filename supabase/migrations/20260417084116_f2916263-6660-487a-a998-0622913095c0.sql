CREATE OR REPLACE FUNCTION public.get_users_overview()
RETURNS TABLE (
  user_id uuid,
  full_name text,
  email text,
  phone text,
  matric_number text,
  created_at timestamptz,
  total_rides bigint,
  total_packages bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    p.full_name,
    u.email::text AS email,
    p.phone,
    p.matric_number,
    p.created_at,
    COALESCE(b.cnt, 0) AS total_rides,
    COALESCE(d.cnt, 0) AS total_packages
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*)::bigint AS cnt FROM public.bookings GROUP BY user_id
  ) b ON b.user_id = p.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*)::bigint AS cnt FROM public.dispatches GROUP BY user_id
  ) d ON d.user_id = p.user_id
  ORDER BY p.created_at DESC;
END;
$$;