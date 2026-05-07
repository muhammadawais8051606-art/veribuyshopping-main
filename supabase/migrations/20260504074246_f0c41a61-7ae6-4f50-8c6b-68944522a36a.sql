-- =======================================================================
-- 1. ADMIN ALLOWLIST  (security-by-allowlist, not by hardcoded credentials)
-- =======================================================================
CREATE TABLE IF NOT EXISTS public.admin_allowlist (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_allowlist ENABLE ROW LEVEL SECURITY;

-- Only existing admins can view/manage the allowlist
CREATE POLICY "Admins view allowlist" ON public.admin_allowlist FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert allowlist" ON public.admin_allowlist FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete allowlist" ON public.admin_allowlist FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed root admin email
INSERT INTO public.admin_allowlist(email) VALUES ('muhammadawais8051606@gmail.com')
  ON CONFLICT (email) DO NOTHING;

-- Helper: is the current user on the allowlist?
CREATE OR REPLACE FUNCTION public.is_admin_email(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    JOIN public.admin_allowlist a ON lower(a.email) = lower(u.email)
    WHERE u.id = _user_id
  )
$$;

-- Strip admin role from any user not on the allowlist
DELETE FROM public.user_roles ur
WHERE ur.role = 'admin'
  AND NOT public.is_admin_email(ur.user_id);

-- Auto-grant admin role to allowlisted users on signup, and prevent any other admin grant
CREATE OR REPLACE FUNCTION public.enforce_admin_allowlist()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  IF NEW.role = 'admin' AND NOT public.is_admin_email(NEW.user_id) THEN
    RAISE EXCEPTION 'Admin role can only be granted to allowlisted emails.';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS enforce_admin_allowlist_trg ON public.user_roles;
CREATE TRIGGER enforce_admin_allowlist_trg
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_admin_allowlist();

-- Extend handle_new_user to auto-give admin role to allowlisted emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name',''));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  IF EXISTS (SELECT 1 FROM public.admin_allowlist WHERE lower(email) = lower(NEW.email)) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

-- =======================================================================
-- 2. CUSTOMER ADDRESSES
-- =======================================================================
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL DEFAULT 'Home',
  full_name text NOT NULL,
  phone text,
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  state text,
  postal_code text,
  country text NOT NULL DEFAULT 'Pakistan',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own addresses" ON public.customer_addresses FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own addresses" ON public.customer_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own addresses" ON public.customer_addresses FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users delete own addresses" ON public.customer_addresses FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER touch_addresses BEFORE UPDATE ON public.customer_addresses
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =======================================================================
-- 3. ORDERS: payment method (online vs COD)
-- =======================================================================
DO $$ BEGIN CREATE TYPE public.payment_method AS ENUM ('online','cod'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method public.payment_method NOT NULL DEFAULT 'online';

-- =======================================================================
-- 4. PLATFORM BANK ACCOUNT (admin-managed)
-- =======================================================================
CREATE TABLE IF NOT EXISTS public.platform_bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text NOT NULL,
  account_title text NOT NULL,
  iban text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_bank_accounts ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view active bank accounts (shown on order confirmation)
CREATE POLICY "Authenticated view active bank" ON public.platform_bank_accounts FOR SELECT
  TO authenticated USING (is_active = true);
CREATE POLICY "Admins manage bank accounts" ON public.platform_bank_accounts FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.platform_bank_accounts(bank_name, account_title, iban) VALUES
  ('Allied Bank Limited', 'VeriBuy Official (Muhammad Awais)', 'PK92ABPA0020143711060014')
ON CONFLICT DO NOTHING;

-- =======================================================================
-- 5. COMMISSION / LEDGER / PAYOUTS / TRANSACTIONS
-- =======================================================================
-- Per-seller running balance: online_balance (paid by customer to platform, owed to seller)
-- and cod_owed (commission owed to platform from COD orders).
-- net_balance = online_balance - cod_owed   (admin pays seller this amount)
CREATE TABLE IF NOT EXISTS public.seller_ledger (
  seller_id uuid PRIMARY KEY,
  online_balance numeric(14,2) NOT NULL DEFAULT 0,
  cod_owed numeric(14,2) NOT NULL DEFAULT 0,
  lifetime_earned numeric(14,2) NOT NULL DEFAULT 0,
  lifetime_commission numeric(14,2) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.seller_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seller views own ledger" ON public.seller_ledger FOR SELECT
  USING (
    auth.uid() = seller_id
    OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.seller_team_members t
               WHERE t.seller_owner_id = seller_ledger.seller_id
                 AND t.member_user_id = auth.uid()
                 AND t.team_role = 'owner')
  );

-- Payouts (admin-confirmed bank transfers)
DO $$ BEGIN CREATE TYPE public.payout_status AS ENUM ('pending','confirmed','cancelled');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  amount numeric(14,2) NOT NULL,
  online_balance_snapshot numeric(14,2) NOT NULL,
  cod_owed_snapshot numeric(14,2) NOT NULL,
  status public.payout_status NOT NULL DEFAULT 'pending',
  reference text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  confirmed_by uuid
);
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seller views own payouts" ON public.payouts FOR SELECT
  USING (
    auth.uid() = seller_id
    OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.seller_team_members t
               WHERE t.seller_owner_id = payouts.seller_id
                 AND t.member_user_id = auth.uid()
                 AND t.team_role = 'owner')
  );
CREATE POLICY "Admins manage payouts insert" ON public.payouts FOR INSERT
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage payouts update" ON public.payouts FOR UPDATE
  USING (public.has_role(auth.uid(),'admin'));

-- Transactions: full ledger of every credit/debit
DO $$ BEGIN CREATE TYPE public.txn_type AS ENUM (
  'sale_online','sale_cod','commission_online','commission_cod','payout','adjustment'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  order_id uuid,
  payout_id uuid,
  type public.txn_type NOT NULL,
  amount numeric(14,2) NOT NULL,            -- signed: + credits to seller, - debits
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS txn_seller_idx ON public.transactions(seller_id, created_at DESC);

CREATE POLICY "Seller views own transactions" ON public.transactions FOR SELECT
  USING (
    auth.uid() = seller_id
    OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.seller_team_members t
               WHERE t.seller_owner_id = transactions.seller_id
                 AND t.member_user_id = auth.uid()
                 AND t.team_role = 'owner')
  );

-- Commission rate (system-wide default)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads settings" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "Admins write settings" ON public.platform_settings FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.platform_settings(key, value) VALUES ('commission_rate','0.03')
ON CONFLICT (key) DO NOTHING;

-- =======================================================================
-- 6. ORDER COMPLETION HOOK -> ledger + transactions
-- =======================================================================
CREATE OR REPLACE FUNCTION public.process_order_completion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  rate numeric;
  pm public.payment_method;
  rec record;
  gross numeric;
  commission numeric;
  net numeric;
BEGIN
  IF NEW.status <> 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  SELECT value::numeric INTO rate FROM public.platform_settings WHERE key='commission_rate';
  rate := COALESCE(rate, 0.03);
  pm := NEW.payment_method;

  FOR rec IN SELECT seller_id, unit_price, quantity FROM public.order_items WHERE order_id = NEW.id LOOP
    gross := rec.unit_price * rec.quantity;
    commission := round(gross * rate, 2);
    net := gross - commission;

    INSERT INTO public.seller_ledger(seller_id) VALUES (rec.seller_id) ON CONFLICT (seller_id) DO NOTHING;

    IF pm = 'online' THEN
      UPDATE public.seller_ledger
        SET online_balance = online_balance + net,
            lifetime_earned = lifetime_earned + gross,
            lifetime_commission = lifetime_commission + commission,
            updated_at = now()
      WHERE seller_id = rec.seller_id;

      INSERT INTO public.transactions(seller_id, order_id, type, amount, description)
      VALUES
        (rec.seller_id, NEW.id, 'sale_online', gross, 'Online sale credited'),
        (rec.seller_id, NEW.id, 'commission_online', -commission,
          format('Platform commission %s%%', round(rate*100,2)));
    ELSE
      -- COD: seller already collected gross from customer; platform is owed the commission
      UPDATE public.seller_ledger
        SET cod_owed = cod_owed + commission,
            lifetime_earned = lifetime_earned + gross,
            lifetime_commission = lifetime_commission + commission,
            updated_at = now()
      WHERE seller_id = rec.seller_id;

      INSERT INTO public.transactions(seller_id, order_id, type, amount, description)
      VALUES
        (rec.seller_id, NEW.id, 'sale_cod', gross, 'COD sale (collected by seller)'),
        (rec.seller_id, NEW.id, 'commission_cod', -commission,
          format('Commission owed to platform %s%%', round(rate*100,2)));
    END IF;
  END LOOP;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS process_order_completion_trg ON public.orders;
CREATE TRIGGER process_order_completion_trg
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.process_order_completion();

-- =======================================================================
-- 7. PAYOUT CONFIRMATION RPC
-- =======================================================================
CREATE OR REPLACE FUNCTION public.confirm_payout(_payout_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p record;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO p FROM public.payouts WHERE id = _payout_id FOR UPDATE;
  IF p IS NULL THEN RAISE EXCEPTION 'Payout not found'; END IF;
  IF p.status <> 'pending' THEN RAISE EXCEPTION 'Payout not pending'; END IF;

  UPDATE public.seller_ledger
    SET online_balance = 0, cod_owed = 0, updated_at = now()
  WHERE seller_id = p.seller_id;

  UPDATE public.payouts
    SET status='confirmed', confirmed_at=now(), confirmed_by=auth.uid()
  WHERE id = _payout_id;

  INSERT INTO public.transactions(seller_id, payout_id, type, amount, description)
  VALUES (p.seller_id, _payout_id, 'payout', -p.online_balance_snapshot,
          format('Payout %s confirmed', _payout_id));
END $$;

-- =======================================================================
-- 8. REALTIME
-- =======================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.payouts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.seller_ledger;