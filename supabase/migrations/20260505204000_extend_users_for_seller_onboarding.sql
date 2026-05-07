ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS government_id_type text,
  ADD COLUMN IF NOT EXISTS government_id_url text,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS tax_id text,
  ADD COLUMN IF NOT EXISTS business_reg_number text,
  ADD COLUMN IF NOT EXISTS business_category text,
  ADD COLUMN IF NOT EXISTS business_description text,
  ADD COLUMN IF NOT EXISTS bank_account text;

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_status_check
  CHECK (status IN ('active', 'pending', 'approved', 'rejected', 'suspended'));

INSERT INTO public.categories(name, slug)
VALUES
  ('Automotive', 'automotive'),
  ('Grocery', 'grocery')
ON CONFLICT (name) DO NOTHING;
