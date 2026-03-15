
-- Add columns for biker assignment and sender/receiver names
ALTER TABLE public.dispatches ADD COLUMN IF NOT EXISTS sender_name text;
ALTER TABLE public.dispatches ADD COLUMN IF NOT EXISTS receiver_name text;
ALTER TABLE public.dispatches ADD COLUMN IF NOT EXISTS biker_assigned text;
ALTER TABLE public.dispatches ADD COLUMN IF NOT EXISTS biker_phone text;

-- Anon policies so bikers (not signed in via Supabase auth) can view and update dispatches
-- NOTE: Biker auth is client-side localStorage for MVP. In production, use proper role-based auth.
CREATE POLICY "Bikers can view pending dispatches" ON public.dispatches
FOR SELECT TO anon
USING (status IN ('pending_delivery', 'assigned'));

CREATE POLICY "Bikers can update dispatch status" ON public.dispatches
FOR UPDATE TO anon
USING (status IN ('pending_delivery', 'assigned'));
