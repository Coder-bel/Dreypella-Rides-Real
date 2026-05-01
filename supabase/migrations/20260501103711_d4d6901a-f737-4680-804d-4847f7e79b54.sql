-- Align with existing app: new dispatches start as 'pending_delivery'
DROP POLICY IF EXISTS "Bikers can view available or own dispatches" ON public.dispatches;
CREATE POLICY "Bikers can view available or own dispatches"
  ON public.dispatches FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'biker'::app_role)
    AND (
      (status = 'pending_delivery' AND assigned_biker_id IS NULL)
      OR assigned_biker_id IN (SELECT id FROM public.bikers WHERE user_id = auth.uid())
    )
  );

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
     AND status = 'pending_delivery';
  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_taken');
  END IF;

  RETURN jsonb_build_object('success', true, 'biker_phone', v_biker.whatsapp_number, 'biker_name', v_biker.full_name);
END;
$$;