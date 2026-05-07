-- VeriBuy: canonical 30-category catalog (upsert) + legacy category cleanup
BEGIN;

INSERT INTO public.categories (name, slug) VALUES
  ('Electronics', 'electronics'),
  ('Mobiles & Tablets', 'mobiles-tablets'),
  ('Computers & Laptops', 'computers-laptops'),
  ('TVs & Appliances', 'tvs-appliances'),
  ('Men''s Fashion', 'mens-fashion'),
  ('Women''s Fashion', 'womens-fashion'),
  ('Kids & Baby', 'kids-baby'),
  ('Footwear', 'footwear'),
  ('Jewelry & Watches', 'jewelry-watches'),
  ('Bags & Luggage', 'bags-luggage'),
  ('Beauty & Personal Care', 'beauty-personal-care'),
  ('Health & Wellness', 'health-wellness'),
  ('Sports & Outdoors', 'sports-outdoors'),
  ('Fitness Equipment', 'fitness-equipment'),
  ('Home & Kitchen', 'home-kitchen'),
  ('Furniture', 'furniture'),
  ('Lighting', 'lighting'),
  ('Tools & DIY', 'tools-diy'),
  ('Garden & Outdoor Living', 'garden-outdoor-living'),
  ('Automotive', 'automotive'),
  ('Pet Supplies', 'pet-supplies'),
  ('Books & Stationery', 'books-stationery'),
  ('Music & Instruments', 'music-instruments'),
  ('Movies & Games', 'movies-games'),
  ('Toys & Hobbies', 'toys-hobbies'),
  ('Baby Care', 'baby-care'),
  ('Grocery & Gourmet', 'grocery-gourmet'),
  ('Pharmacy & Medical', 'pharmacy-medical'),
  ('Office Products', 'office-products'),
  ('Industrial & Scientific', 'industrial-scientific')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- Re-point products from legacy seed slugs to new catalog where applicable
UPDATE public.products p
SET category_id = (SELECT id FROM public.categories c WHERE c.slug = 'womens-fashion' LIMIT 1)
WHERE p.category_id = (SELECT id FROM public.categories c WHERE c.slug = 'fashion' LIMIT 1);

UPDATE public.products p
SET category_id = (SELECT id FROM public.categories c WHERE c.slug = 'books-stationery' LIMIT 1)
WHERE p.category_id = (SELECT id FROM public.categories c WHERE c.slug = 'books' LIMIT 1);

UPDATE public.products p
SET category_id = (SELECT id FROM public.categories c WHERE c.slug = 'beauty-personal-care' LIMIT 1)
WHERE p.category_id = (SELECT id FROM public.categories c WHERE c.slug = 'beauty' LIMIT 1);

DELETE FROM public.categories WHERE slug IN ('fashion', 'books', 'beauty');

COMMIT;
