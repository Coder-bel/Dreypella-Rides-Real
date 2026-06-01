CREATE OR REPLACE FUNCTION public.get_biker_login_email(_company_code text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.bikers
   WHERE company_code = upper(_company_code)
   LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_biker_login_email(text) TO anon, authenticated;