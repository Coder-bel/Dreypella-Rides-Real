
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'trips') THEN
    CREATE TABLE public.trips (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      route TEXT NOT NULL,
      travel_date DATE NOT NULL,
      departure_time TIME NOT NULL,
      price INTEGER NOT NULL DEFAULT 2000,
      available_seats INTEGER NOT NULL DEFAULT 14,
      pickup_points TEXT[] NOT NULL DEFAULT '{}',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
  END IF;
END $$;

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trips' AND policyname = 'Anyone can view active trips') THEN
    CREATE POLICY "Anyone can view active trips"
      ON public.trips FOR SELECT
      TO authenticated
      USING (is_active = true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trips' AND policyname = 'Admins can insert trips') THEN
    CREATE POLICY "Admins can insert trips"
      ON public.trips FOR INSERT
      TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trips' AND policyname = 'Admins can update trips') THEN
    CREATE POLICY "Admins can update trips"
      ON public.trips FOR UPDATE
      TO authenticated
      USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trips' AND policyname = 'Admins can delete trips') THEN
    CREATE POLICY "Admins can delete trips"
      ON public.trips FOR DELETE
      TO authenticated
      USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
