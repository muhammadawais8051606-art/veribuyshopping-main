export type DummyProduct = {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  stock: number;
  seller_id: string;
  image_url: string;
  gallery: string[];
};

const DUMMY_SELLER_ID = "00000000-0000-0000-0000-000000000001";

export const dummyProducts: DummyProduct[] = [
  {
    id: "dummy-smartphone",
    title: "VeriBuy Verified Smartphone",
    description: "Flagship-grade performance with trusted unbox verification before payment release.",
    price: 189999,
    originalPrice: 219999,
    discountPercent: 14,
    stock: 12,
    seller_id: DUMMY_SELLER_ID,
    image_url: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    id: "dummy-wireless-buds",
    title: "Premium Wireless Buds",
    description: "Crystal-clear audio and active noise cancellation, verified at your doorstep.",
    price: 19999,
    originalPrice: 25999,
    discountPercent: 23,
    stock: 8,
    seller_id: DUMMY_SELLER_ID,
    image_url: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f37?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f37?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    id: "dummy-smartwatch",
    title: "Pro Smartwatch Series X",
    description: "Premium health tracking, calling, and endurance battery in a modern design.",
    price: 34999,
    originalPrice: 41999,
    discountPercent: 17,
    stock: 5,
    seller_id: DUMMY_SELLER_ID,
    image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    id: "dummy-laptop",
    title: "UltraBook Performance 14",
    description: "Thin, powerful, and built for creators with secure delivery verification.",
    price: 264999,
    originalPrice: 299999,
    discountPercent: 12,
    stock: 3,
    seller_id: DUMMY_SELLER_ID,
    image_url: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    id: "dummy-gaming-mouse",
    title: "Precision Gaming Mouse Pro",
    description: "High-DPI sensor and premium ergonomic grip with rapid delivery assurance.",
    price: 11999,
    originalPrice: 14999,
    discountPercent: 20,
    stock: 20,
    seller_id: DUMMY_SELLER_ID,
    image_url: "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1613141412501-9012977f1969?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    id: "dummy-speaker",
    title: "Smart Home Speaker Plus",
    description: "Room-filling audio with modern voice assistant controls and trusted delivery flow.",
    price: 28999,
    originalPrice: 34999,
    discountPercent: 17,
    stock: 6,
    seller_id: DUMMY_SELLER_ID,
    image_url: "https://images.unsplash.com/photo-1589492477829-5e65395b66cc?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1589492477829-5e65395b66cc?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1507878866276-a947ef722fee?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1200&q=80",
    ],
  },
];
