
-- Create bikers table for storing biker registration info
CREATE TABLE public.bikers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  whatsapp_number text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.bikers ENABLE ROW LEVEL SECURITY;

-- Allow anon to read bikers (for biker login check and WhatsApp lookup)
CREATE POLICY "Anon can view bikers" ON public.bikers FOR SELECT TO anon USING (true);

-- Allow anon to insert bikers (for biker signup)
CREATE POLICY "Anon can insert bikers" ON public.bikers FOR INSERT TO anon WITH CHECK (true);

-- Allow authenticated admins to view bikers
CREATE POLICY "Admins can view bikers" ON public.bikers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
