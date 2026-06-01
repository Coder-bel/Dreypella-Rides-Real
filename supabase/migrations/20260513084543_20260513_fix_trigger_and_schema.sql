/*
  # Fix handle_new_user trigger and align schema mismatches

  1. Fix Trigger
    - Update handle_new_user to read 'phone' key (not 'phone_number') from metadata
    - This matches what Auth.tsx sends in user_meta_data

  2. Add missing columns to dispatches and bookings
    - Add aliases and backfill data for code compatibility

  3. Fix RLS policies for user_roles
    - Ensure proper policies are in place
*/

-- Drop the old trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the old function
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved handle_new_user function that reads 'phone' correctly
CREATE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    phone_number,
    email,
    role
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- Add missing columns to dispatches if needed
ALTER TABLE IF EXISTS dispatches ADD COLUMN IF NOT EXISTS tracking_id text UNIQUE;
ALTER TABLE IF EXISTS dispatches ADD COLUMN IF NOT EXISTS biker_phone text;
ALTER TABLE IF EXISTS dispatches ADD COLUMN IF NOT EXISTS biker_assigned text;
ALTER TABLE IF EXISTS dispatches ADD COLUMN IF NOT EXISTS delivery_type text DEFAULT 'next-day';
ALTER TABLE IF EXISTS dispatches ADD COLUMN IF NOT EXISTS price numeric;
ALTER TABLE IF EXISTS dispatches ADD COLUMN IF NOT EXISTS dropoff text;
ALTER TABLE IF EXISTS dispatches ADD COLUMN IF NOT EXISTS pickup text;

-- Backfill dispatches columns
UPDATE dispatches
SET tracking_id = 'DRP-' || SUBSTRING(CAST(id AS text), 1, 8)
WHERE tracking_id IS NULL;

UPDATE dispatches
SET dropoff = delivery_location
WHERE dropoff IS NULL AND delivery_location IS NOT NULL;

UPDATE dispatches
SET pickup = pickup_location
WHERE pickup IS NULL AND pickup_location IS NOT NULL;

UPDATE dispatches
SET delivery_type = LOWER(delivery_option)
WHERE delivery_type IS NULL AND delivery_option IS NOT NULL;

UPDATE dispatches
SET price = estimated_price
WHERE price IS NULL AND estimated_price IS NOT NULL;

UPDATE dispatches
SET tracking_id = tracking_number
WHERE tracking_id IS NULL AND tracking_number IS NOT NULL;

UPDATE dispatches
SET biker_phone = assigned_biker_phone
WHERE biker_phone IS NULL AND assigned_biker_phone IS NOT NULL;

-- Add missing columns to bookings if needed
ALTER TABLE IF EXISTS bookings ADD COLUMN IF NOT EXISTS pickup text;
ALTER TABLE IF EXISTS bookings ADD COLUMN IF NOT EXISTS passengers integer DEFAULT 1;
ALTER TABLE IF EXISTS bookings ADD COLUMN IF NOT EXISTS price numeric;

-- Backfill bookings columns
UPDATE bookings
SET pickup = pickup_location
WHERE pickup IS NULL AND pickup_location IS NOT NULL;

UPDATE bookings
SET passengers = seats
WHERE passengers IS NULL AND seats IS NOT NULL;

UPDATE bookings
SET price = amount
WHERE price IS NULL AND amount IS NOT NULL;

-- Map bikers table columns
ALTER TABLE IF EXISTS bikers ADD COLUMN IF NOT EXISTS whatsapp_number text;

UPDATE bikers
SET whatsapp_number = phone_number
WHERE whatsapp_number IS NULL AND phone_number IS NOT NULL;

-- Ensure RLS is enabled on user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;

-- Create new policies
CREATE POLICY "Users can view their own role"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Add unique constraint on user_id, role pair if it doesn't exist
DO $$
BEGIN
  ALTER TABLE user_roles
    ADD CONSTRAINT user_roles_user_id_role_unique
    UNIQUE (user_id, role);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;
