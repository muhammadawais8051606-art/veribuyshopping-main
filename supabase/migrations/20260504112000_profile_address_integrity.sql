-- PART 2 + PART 4 data integrity updates:
-- 1) Add WhatsApp delivery contact on profiles
-- 2) Add structured address fields for mobile profile flow
-- 3) Strengthen table linkage and compatibility views (user_profiles, sellers)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp_number text;

ALTER TABLE public.customer_addresses
  ADD COLUMN IF NOT EXISTS house_number text,
  ADD COLUMN IF NOT EXISTS street text,
  ADD COLUMN IF NOT EXISTS sector text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'customer_addresses_user_id_fkey_profiles'
  ) THEN
    ALTER TABLE public.customer_addresses
      ADD CONSTRAINT customer_addresses_user_id_fkey_profiles
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE OR REPLACE VIEW public.user_profiles AS
SELECT
  p.id,
  p.email,
  p.full_name,
  p.whatsapp_number,
  p.created_at,
  p.updated_at
FROM public.profiles p;

CREATE OR REPLACE VIEW public.sellers AS
SELECT
  sp.user_id AS seller_id,
  sp.business_name,
  sp.status,
  sp.professional_email,
  sp.phone,
  sp.bank_name,
  sp.account_holder,
  sp.iban,
  sp.created_at,
  sp.updated_at
FROM public.seller_profiles sp;
