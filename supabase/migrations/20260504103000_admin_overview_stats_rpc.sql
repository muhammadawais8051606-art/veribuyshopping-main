-- Admin overview stats RPC that can read protected tables safely.
-- Uses SECURITY DEFINER so dashboard stats can load from a single endpoint.

CREATE OR REPLACE FUNCTION public.get_admin_overview_stats()
RETURNS TABLE (
  users_count bigint,
  approved_sellers_count bigint,
  pending_sellers_count bigint,
  orders_count bigint,
  gmv_completed numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT count(*) FROM public.profiles),
    (SELECT count(*) FROM public.seller_profiles WHERE status = 'approved'),
    (SELECT count(*) FROM public.seller_profiles WHERE status = 'pending'),
    (SELECT count(*) FROM public.orders),
    COALESCE((SELECT sum(total) FROM public.orders WHERE status = 'completed'), 0)::numeric;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_overview_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_overview_stats() TO anon, authenticated;
