
-- Restrict EXECUTE on the new functions to authenticated users only
REVOKE ALL ON FUNCTION public.verify_order(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.dispute_order(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_order(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dispute_order(uuid) TO authenticated;

-- protect_order_fields is a trigger function — revoke direct execute from clients
REVOKE ALL ON FUNCTION public.protect_order_fields() FROM PUBLIC, anon, authenticated;
