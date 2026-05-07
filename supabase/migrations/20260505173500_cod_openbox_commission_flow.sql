-- COD + Open-box commission workflow enhancements

-- Order identity + delivery/commission tracking
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_code text,
  ADD COLUMN IF NOT EXISTS customer_full_name text,
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS customer_house_street text,
  ADD COLUMN IF NOT EXISTS customer_sector_area text,
  ADD COLUMN IF NOT EXISTS customer_city text,
  ADD COLUMN IF NOT EXISTS special_instructions text,
  ADD COLUMN IF NOT EXISTS commission_amount numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_paid_by_seller boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_orders_order_code ON public.orders(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_seller_commission_paid ON public.orders(commission_paid_by_seller);

-- Track seller -> admin commission settlements
CREATE TABLE IF NOT EXISTS public.commission_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'paid',
  admin_confirmed boolean NOT NULL DEFAULT true,
  payment_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.commission_payment_orders (
  commission_payment_id uuid NOT NULL REFERENCES public.commission_payments(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  PRIMARY KEY (commission_payment_id, order_id)
);

ALTER TABLE public.commission_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_payment_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers and admins view commission payments" ON public.commission_payments;
CREATE POLICY "Sellers and admins view commission payments"
  ON public.commission_payments FOR SELECT
  USING (auth.uid() = seller_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Sellers create own commission payments" ON public.commission_payments;
CREATE POLICY "Sellers create own commission payments"
  ON public.commission_payments FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Sellers and admins view commission payment orders" ON public.commission_payment_orders;
CREATE POLICY "Sellers and admins view commission payment orders"
  ON public.commission_payment_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.commission_payments cp
      WHERE cp.id = commission_payment_orders.commission_payment_id
        AND (cp.seller_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

DROP POLICY IF EXISTS "Sellers insert own commission payment orders" ON public.commission_payment_orders;
CREATE POLICY "Sellers insert own commission payment orders"
  ON public.commission_payment_orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.commission_payments cp
      WHERE cp.id = commission_payment_orders.commission_payment_id
        AND cp.seller_id = auth.uid()
    )
  );

-- Seller confirms commission transfer for delivered COD orders
CREATE OR REPLACE FUNCTION public.seller_mark_commission_paid(_order_ids uuid[])
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _seller uuid := auth.uid();
  _payment_id uuid;
  _amount numeric(14,2);
BEGIN
  IF _seller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _order_ids IS NULL OR array_length(_order_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'No orders selected';
  END IF;

  SELECT COALESCE(sum(commission_amount), 0)::numeric(14,2)
    INTO _amount
  FROM public.orders o
  WHERE o.id = ANY(_order_ids)
    AND o.status = 'completed'
    AND o.payment_method = 'cod'
    AND o.commission_paid_by_seller = false
    AND EXISTS (
      SELECT 1
      FROM public.order_items oi
      WHERE oi.order_id = o.id
        AND oi.seller_id = _seller
    );

  IF _amount <= 0 THEN
    RAISE EXCEPTION 'No payable commission for selected orders';
  END IF;

  INSERT INTO public.commission_payments(seller_id, amount, status, admin_confirmed)
  VALUES (_seller, _amount, 'paid', true)
  RETURNING id INTO _payment_id;

  INSERT INTO public.commission_payment_orders(commission_payment_id, order_id)
  SELECT _payment_id, o.id
  FROM public.orders o
  WHERE o.id = ANY(_order_ids)
    AND o.status = 'completed'
    AND o.payment_method = 'cod'
    AND o.commission_paid_by_seller = false
    AND EXISTS (
      SELECT 1
      FROM public.order_items oi
      WHERE oi.order_id = o.id
        AND oi.seller_id = _seller
    );

  UPDATE public.orders
  SET commission_paid_by_seller = true
  WHERE id IN (
    SELECT cpo.order_id
    FROM public.commission_payment_orders cpo
    WHERE cpo.commission_payment_id = _payment_id
  );

  -- Admin + seller notification fanout (used by realtime feeds)
  INSERT INTO public.seller_notifications(seller_id, message)
  VALUES (_seller, format('Your commission payment of PKR %s has been recorded.', to_char(_amount, 'FM9999999990.00')));

  RETURN _payment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.seller_mark_commission_paid(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.seller_mark_commission_paid(uuid[]) TO authenticated;
