import { fuzzyTextMatch } from "@/lib/fuzzy-search";

/** Canonical VeriBuy storefront categories (must stay in sync with DB seed migration). */
export type VeriBuyCategoryDef = {
  name: string;
  slug: string;
  /** Extra tokens for smart search (e.g. "mobile" → Mobiles & Tablets). */
  searchAliases?: string[];
};

export const VERIBUY_CATEGORIES: VeriBuyCategoryDef[] = [
  { name: "Electronics", slug: "electronics", searchAliases: ["gadget", "tech", "electronic"] },
  { name: "Mobiles & Tablets", slug: "mobiles-tablets", searchAliases: ["mobile", "phone", "iphone", "android", "tablet", "smartphone"] },
  { name: "Computers & Laptops", slug: "computers-laptops", searchAliases: ["laptop", "computer", "pc", "macbook", "notebook"] },
  { name: "TVs & Appliances", slug: "tvs-appliances", searchAliases: ["tv", "television", "fridge", "washing machine", "appliance"] },
  { name: "Men's Fashion", slug: "mens-fashion", searchAliases: ["men", "shirt", "trouser", "kurta"] },
  { name: "Women's Fashion", slug: "womens-fashion", searchAliases: ["women", "dress", "saree", "fashion"] },
  { name: "Kids & Baby", slug: "kids-baby", searchAliases: ["kid", "child", "toddler", "baby clothes"] },
  { name: "Footwear", slug: "footwear", searchAliases: ["shoe", "sneaker", "sandal", "boot"] },
  { name: "Jewelry & Watches", slug: "jewelry-watches", searchAliases: ["watch", "jewelry", "ring", "gold"] },
  { name: "Bags & Luggage", slug: "bags-luggage", searchAliases: ["bag", "backpack", "suitcase", "luggage"] },
  { name: "Beauty & Personal Care", slug: "beauty-personal-care", searchAliases: ["beauty", "makeup", "skincare", "cosmetic"] },
  { name: "Health & Wellness", slug: "health-wellness", searchAliases: ["health", "vitamin", "supplement", "wellness"] },
  { name: "Sports & Outdoors", slug: "sports-outdoors", searchAliases: ["sport", "outdoor", "camping", "cricket"] },
  { name: "Fitness Equipment", slug: "fitness-equipment", searchAliases: ["gym", "dumbbell", "treadmill", "yoga mat"] },
  { name: "Home & Kitchen", slug: "home-kitchen", searchAliases: ["kitchen", "cookware", "home"] },
  { name: "Furniture", slug: "furniture", searchAliases: ["sofa", "bed", "table", "chair"] },
  { name: "Lighting", slug: "lighting", searchAliases: ["lamp", "led", "bulb", "chandelier"] },
  { name: "Tools & DIY", slug: "tools-diy", searchAliases: ["tool", "drill", "diy", "hardware"] },
  { name: "Garden & Outdoor Living", slug: "garden-outdoor-living", searchAliases: ["garden", "plant", "lawn", "patio"] },
  { name: "Automotive", slug: "automotive", searchAliases: ["car", "auto", "vehicle", "tyre"] },
  { name: "Pet Supplies", slug: "pet-supplies", searchAliases: ["pet", "dog", "cat", "food bowl"] },
  { name: "Books & Stationery", slug: "books-stationery", searchAliases: ["book", "notebook", "pen", "stationery"] },
  { name: "Music & Instruments", slug: "music-instruments", searchAliases: ["guitar", "piano", "music", "instrument"] },
  { name: "Movies & Games", slug: "movies-games", searchAliases: ["game", "ps5", "xbox", "dvd", "movie"] },
  { name: "Toys & Hobbies", slug: "toys-hobbies", searchAliases: ["toy", "lego", "hobby", "rc"] },
  { name: "Baby Care", slug: "baby-care", searchAliases: ["diaper", "feeding bottle", "stroller"] },
  { name: "Grocery & Gourmet", slug: "grocery-gourmet", searchAliases: ["grocery", "food", "snack", "organic"] },
  { name: "Pharmacy & Medical", slug: "pharmacy-medical", searchAliases: ["medicine", "pharmacy", "first aid"] },
  { name: "Office Products", slug: "office-products", searchAliases: ["office", "printer", "paper", "desk"] },
  { name: "Industrial & Scientific", slug: "industrial-scientific", searchAliases: ["lab", "industrial", "scientific"] },
];

export const VERIBUY_CATEGORY_SLUGS = VERIBUY_CATEGORIES.map((c) => c.slug);

export type ProductSearchRow = {
  title: string;
  description: string | null;
  categories: { name: string; slug: string } | null;
};

/** Match product title, description, category name/slug, and category search aliases (fuzzy). */
export function productMatchesSmartSearch(product: ProductSearchRow, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  if (fuzzyTextMatch(q, product.title)) return true;
  if (product.description && fuzzyTextMatch(q, product.description)) return true;
  const cat = product.categories;
  if (cat) {
    if (fuzzyTextMatch(q, cat.name)) return true;
    if (fuzzyTextMatch(q, cat.slug.replace(/-/g, " "))) return true;
  }
  for (const def of VERIBUY_CATEGORIES) {
    const aliasHit =
      def.searchAliases?.some((a) => fuzzyTextMatch(q, a)) || fuzzyTextMatch(q, def.name);
    if (aliasHit && cat?.slug === def.slug) return true;
  }
  return false;
}
