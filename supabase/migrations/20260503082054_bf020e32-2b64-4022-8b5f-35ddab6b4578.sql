-- Products: team members can manage their owner's products
DROP POLICY IF EXISTS "Sellers update own products" ON public.products;
CREATE POLICY "Sellers update own products"
  ON public.products FOR UPDATE
  USING (
    auth.uid() = seller_id
    OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.seller_team_members t
               WHERE t.seller_owner_id = products.seller_id AND t.member_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Sellers delete own products" ON public.products;
CREATE POLICY "Sellers delete own products"
  ON public.products FOR DELETE
  USING (
    auth.uid() = seller_id
    OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.seller_team_members t
               WHERE t.seller_owner_id = products.seller_id AND t.member_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Approved sellers create products" ON public.products;
CREATE POLICY "Approved sellers create products"
  ON public.products FOR INSERT
  WITH CHECK (
    (
      auth.uid() = seller_id
      AND EXISTS (SELECT 1 FROM public.seller_profiles sp
                  WHERE sp.user_id = auth.uid() AND sp.status = 'approved')
    )
    OR EXISTS (
      SELECT 1 FROM public.seller_team_members t
      JOIN public.seller_profiles sp ON sp.user_id = t.seller_owner_id
      WHERE t.seller_owner_id = products.seller_id
        AND t.member_user_id = auth.uid()
        AND sp.status = 'approved'
    )
  );

-- order_items: team members can view orders for their owner's items
DROP POLICY IF EXISTS "Customers view own order items" ON public.order_items;
CREATE POLICY "Customers view own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.customer_id = auth.uid())
    OR auth.uid() = seller_id
    OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.seller_team_members t
               WHERE t.seller_owner_id = order_items.seller_id AND t.member_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Sellers view orders with their items" ON public.orders;
CREATE POLICY "Sellers view orders with their items"
  ON public.orders FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id = orders.id AND oi.seller_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.seller_team_members t ON t.seller_owner_id = oi.seller_id
      WHERE oi.order_id = orders.id AND t.member_user_id = auth.uid()
    )
  );

-- When a user signs up with an invited email, link them to their team membership
CREATE OR REPLACE FUNCTION public.link_team_member_on_signup()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  UPDATE public.seller_team_members
  SET member_user_id = NEW.id
  WHERE invited_email = NEW.email AND member_user_id IS NULL;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_link_team ON auth.users;
CREATE TRIGGER on_auth_user_link_team
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.link_team_member_on_signup();