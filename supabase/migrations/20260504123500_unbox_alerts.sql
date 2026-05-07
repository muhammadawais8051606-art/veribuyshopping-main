-- Alerts generated when orders require open-box verification instructions.

CREATE TABLE IF NOT EXISTS public.order_unbox_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_target text NOT NULL DEFAULT 'muhammadawais8051606@gmail.com',
  header text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_unbox_alerts DISABLE ROW LEVEL SECURITY;
