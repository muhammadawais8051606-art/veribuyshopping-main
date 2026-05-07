
-- 1. Replace customer UPDATE policy on orders to prevent tampering with sensitive fields
DROP POLICY IF EXISTS "Customers update own orders" ON public.orders;

-- Customers can only update non-sensitive fields (shipping_address) while pending
CREATE POLICY "Customers update own pending orders limited"
ON public.orders
FOR UPDATE
USING (
  (auth.uid() = customer_id AND status = 'pending_payment')
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  (auth.uid() = customer_id AND status = 'pending_payment')
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Trigger to prevent customers from changing protected columns
CREATE OR REPLACE FUNCTION public.protect_order_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins bypass
  IF has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Customers cannot modify these fields directly
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.veribuy_verified_at IS DISTINCT FROM OLD.veribuy_verified_at
     OR NEW.total IS DISTINCT FROM OLD.total
     OR NEW.customer_id IS DISTINCT FROM OLD.customer_id THEN
    RAISE EXCEPTION 'Cannot modify protected order fields directly. Use verify_order() or dispute_order().';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_order_fields_trigger ON public.orders;
CREATE TRIGGER protect_order_fields_trigger
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.protect_order_fields();

-- 2. Secure functions for VeriBuy verification flow
CREATE OR REPLACE FUNCTION public.verify_order(_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _customer uuid;
  _status order_status;
BEGIN
  SELECT customer_id, status INTO _customer, _status
  FROM public.orders WHERE id = _order_id;

  IF _customer IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF _customer <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF _status <> 'awaiting_unbox_verification' THEN
    RAISE EXCEPTION 'Order is not awaiting verification';
  END IF;

  UPDATE public.orders
  SET status = 'completed',
      veribuy_verified_at = now()
  WHERE id = _order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.dispute_order(_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _customer uuid;
  _status order_status;
BEGIN
  SELECT customer_id, status INTO _customer, _status
  FROM public.orders WHERE id = _order_id;

  IF _customer IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF _customer <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF _status NOT IN ('shipped', 'awaiting_unbox_verification') THEN
    RAISE EXCEPTION 'Order cannot be disputed at this stage';
  END IF;

  UPDATE public.orders
  SET status = 'disputed'
  WHERE id = _order_id;
END;
$$;

-- 3. Tighten order_items INSERT to validate seller_id and unit_price against product
DROP POLICY IF EXISTS "Customers create order items" ON public.order_items;

CREATE POLICY "Customers create valid order items"
ON public.order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.customer_id = auth.uid()
      AND o.status = 'pending_payment'
  )
  AND EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = order_items.product_id
      AND p.seller_id = order_items.seller_id
      AND p.price = order_items.unit_price
      AND p.is_active = true
  )
);
