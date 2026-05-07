-- Hard lock admin access to the root allowlisted email only.
-- Add persistent seller notifications and strict 3% commission enforcement.

INSERT INTO public.admin_allowlist (email)
VALUES ('muhammadawais8051606@gmail.com')
ON CONFLICT (email) DO NOTHING;

DELETE FROM public.admin_allowlist
WHERE lower(email) <> 'muhammadawais8051606@gmail.com';

DELETE FROM public.user_roles ur
WHERE ur.role = 'admin'
  AND NOT public.is_admin_email(ur.user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = _role
      AND (
        _role <> 'admin'
        OR public.is_admin_email(_user_id)
      )
  )
$$;

-- Persistent notifications for sellers (used by realtime payout confirmations).
CREATE TABLE IF NOT EXISTS public.seller_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Seller reads own notifications" ON public.seller_notifications;
CREATE POLICY "Seller reads own notifications"
  ON public.seller_notifications FOR SELECT
  USING (
    auth.uid() = seller_id
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1
      FROM public.seller_team_members t
      WHERE t.seller_owner_id = seller_notifications.seller_id
        AND t.member_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Seller updates own notifications" ON public.seller_notifications;
CREATE POLICY "Seller updates own notifications"
  ON public.seller_notifications FOR UPDATE
  USING (
    auth.uid() = seller_id
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    auth.uid() = seller_id
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Admins insert notifications" ON public.seller_notifications;
CREATE POLICY "Admins insert notifications"
  ON public.seller_notifications FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Strictly enforce commission at 3%.
CREATE OR REPLACE FUNCTION public.process_order_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rate numeric := 0.03;
  pm public.payment_method;
  rec record;
  gross numeric;
  commission numeric;
  net numeric;
BEGIN
  IF NEW.status <> 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  pm := NEW.payment_method;

  FOR rec IN
    SELECT seller_id, unit_price, quantity
    FROM public.order_items
    WHERE order_id = NEW.id
  LOOP
    gross := rec.unit_price * rec.quantity;
    commission := round(gross * rate, 2);
    net := gross - commission;

    INSERT INTO public.seller_ledger(seller_id)
    VALUES (rec.seller_id)
    ON CONFLICT (seller_id) DO NOTHING;

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
        (rec.seller_id, NEW.id, 'commission_online', -commission, 'Platform commission 3%');
    ELSE
      UPDATE public.seller_ledger
      SET cod_owed = cod_owed + commission,
          lifetime_earned = lifetime_earned + gross,
          lifetime_commission = lifetime_commission + commission,
          updated_at = now()
      WHERE seller_id = rec.seller_id;

      INSERT INTO public.transactions(seller_id, order_id, type, amount, description)
      VALUES
        (rec.seller_id, NEW.id, 'sale_cod', gross, 'COD sale (collected by seller)'),
        (rec.seller_id, NEW.id, 'commission_cod', -commission, 'Commission owed to platform 3%');
    END IF;
  END LOOP;

  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.confirm_payout(_payout_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p record;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT *
  INTO p
  FROM public.payouts
  WHERE id = _payout_id
  FOR UPDATE;

  IF p IS NULL THEN
    RAISE EXCEPTION 'Payout not found';
  END IF;
  IF p.status <> 'pending' THEN
    RAISE EXCEPTION 'Payout not pending';
  END IF;

  UPDATE public.seller_ledger
  SET online_balance = 0,
      cod_owed = 0,
      updated_at = now()
  WHERE seller_id = p.seller_id;

  UPDATE public.payouts
  SET status = 'confirmed',
      confirmed_at = now(),
      confirmed_by = auth.uid()
  WHERE id = _payout_id;

  INSERT INTO public.transactions(seller_id, payout_id, type, amount, description)
  VALUES (
    p.seller_id,
    _payout_id,
    'payout',
    -p.amount,
    format('Payout %s confirmed', _payout_id)
  );

  INSERT INTO public.seller_notifications (seller_id, message)
  VALUES (
    p.seller_id,
    format(
      'Payout confirmed: PKR %s transferred. Your balance and admin owed ledger are now reset to zero.',
      to_char(p.amount, 'FM9999999990.00')
    )
  );
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'seller_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.seller_notifications;
  END IF;
END $$;
