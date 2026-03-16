
DROP POLICY IF EXISTS "Bikers can view pending dispatches" ON public.dispatches;
CREATE POLICY "Bikers can view dispatches"
ON public.dispatches
FOR SELECT
TO anon
USING (status IN ('pending_delivery', 'assigned', 'completed'));
