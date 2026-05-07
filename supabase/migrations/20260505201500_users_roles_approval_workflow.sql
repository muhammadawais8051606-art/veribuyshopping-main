-- Unified marketplace users table linked to auth.users
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  shop_name text,
  phone text,
  address text,
  role text NOT NULL CHECK (role IN ('buyer', 'seller', 'admin')),
  status text NOT NULL CHECK (status IN ('active', 'pending', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile row" ON public.users;
CREATE POLICY "Users can view own profile row"
  ON public.users FOR SELECT
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

DROP POLICY IF EXISTS "Users can insert own row" ON public.users;
CREATE POLICY "Users can insert own row"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own row limited" ON public.users;
CREATE POLICY "Users can update own row limited"
  ON public.users FOR UPDATE
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ))
  WITH CHECK (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

-- Ensure required buyer-facing categories exist (compatible with existing UUID categories table)
INSERT INTO public.categories(name, slug)
VALUES
  ('Electronics', 'electronics'),
  ('Fashion', 'fashion'),
  ('Home & Kitchen', 'home-kitchen'),
  ('Books', 'books'),
  ('Toys', 'toys'),
  ('Sports', 'sports'),
  ('Beauty', 'beauty')
ON CONFLICT (name) DO NOTHING;

-- Seller report view (compatible with existing UUID product/order schema)
CREATE OR REPLACE VIEW public.seller_sales_summary AS
SELECT
  p.seller_id,
  date_trunc('day', o.created_at) AS report_date,
  COUNT(DISTINCT o.id) AS orders_count,
  COALESCE(SUM(oi.quantity), 0)::bigint AS items_sold,
  COALESCE(SUM(oi.quantity * oi.unit_price), 0)::numeric(12,2) AS total_sales
FROM public.order_items oi
JOIN public.orders o ON o.id = oi.order_id
JOIN public.products p ON p.id = oi.product_id
WHERE o.status = 'completed'
GROUP BY p.seller_id, date_trunc('day', o.created_at);
