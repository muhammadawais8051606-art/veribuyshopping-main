-- Fix permission denied for has_role + add support tickets + product approval workflow

-- 1) Restore execute permissions for role helper functions (was revoked earlier)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_roles(uuid) TO anon, authenticated;

-- 2) Support tickets (seller help & feedback)
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers insert own support tickets" ON public.support_tickets;
CREATE POLICY "Sellers insert own support tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Sellers view own support tickets" ON public.support_tickets;
CREATE POLICY "Sellers view own support tickets"
  ON public.support_tickets FOR SELECT
  USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Admins view all support tickets" ON public.support_tickets;
CREATE POLICY "Admins view all support tickets"
  ON public.support_tickets FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update support tickets" ON public.support_tickets;
CREATE POLICY "Admins update support tickets"
  ON public.support_tickets FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3) Product approval + open-box badge
-- Add status column (pending/active/rejected) while keeping is_active for backward compatibility
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','rejected'));

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS open_box_enabled boolean NOT NULL DEFAULT true;

-- Backfill status from legacy is_active
UPDATE public.products
SET status = CASE WHEN is_active IS TRUE THEN 'active' ELSE 'rejected' END
WHERE status IS NULL;

-- Keep legacy is_active synced from status
CREATE OR REPLACE FUNCTION public.sync_products_is_active_from_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.is_active := (NEW.status = 'active');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_products_sync_is_active ON public.products;
CREATE TRIGGER trg_products_sync_is_active
  BEFORE INSERT OR UPDATE OF status
  ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_products_is_active_from_status();

-- Replace product policies to support pending workflow
DROP POLICY IF EXISTS "Anyone views active products" ON public.products;
DROP POLICY IF EXISTS "Approved sellers create products" ON public.products;
DROP POLICY IF EXISTS "Sellers update own products" ON public.products;
DROP POLICY IF EXISTS "Sellers delete own products" ON public.products;

CREATE POLICY "Public views active products" ON public.products
  FOR SELECT USING (
    status = 'active'
    OR auth.uid() = seller_id
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Sellers publish products as pending" ON public.products
  FOR INSERT WITH CHECK (
    auth.uid() = seller_id
    AND status = 'pending'
  );

CREATE POLICY "Sellers update own pending/rejected products" ON public.products
  FOR UPDATE USING (
    auth.uid() = seller_id
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    auth.uid() = seller_id
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Sellers delete own products" ON public.products
  FOR DELETE USING (
    auth.uid() = seller_id
    OR public.has_role(auth.uid(), 'admin')
  );

