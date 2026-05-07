CREATE TABLE IF NOT EXISTS public.sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  shop_name text NOT NULL,
  business_details text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sellers DISABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.sellers TO anon, authenticated;
