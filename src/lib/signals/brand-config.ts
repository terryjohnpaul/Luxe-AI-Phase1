/**
 * Brand Tier Configuration — VERIFIED against brand official site (March 2026)
 *
 * LUXURY: Never discount, aspirational messaging only, target Loyalists, high AOV
 * PREMIUM: Selective discounts, professional messaging, target Achievers
 * ACCESSIBLE: Can discount, value messaging OK, target Aspirants, EMI options
 *
 * Sources verified:
 * - brand official site brand pages
 * - India Retailing (Reliance Brands 10 new brands article)
 * - Individual brand store pages online
 */

export type BrandTier = "luxury" | "premium" | "accessible";

export interface BrandConfig {
  name: string;
  tier: BrandTier;
  priceRange: string;
  categories: string[];        // What they actually sell online
  canDiscount: boolean;
  maxDiscountPercent: number;
  targetArchetypes: string[];
  messagingTone: string;
  showPrice: boolean;
  showEmi: boolean;
  scarcityMessaging: boolean;
  urgencyMessaging: boolean;
  ctaStyle: "aspirational" | "direct" | "value";
  adFrequency: "low" | "medium" | "high";
  retargetingWindow: number;
  contentStyle: "editorial" | "product" | "mixed";
  verified: boolean;           // Whether verified on brand official site
  storeUrl: string;            // Brand page URL
}

// ============================================================
// ALL BRANDS VERIFIED ON LUXE.AJIO.COM — March 2026
// ============================================================

export const DEFAULT_BRAND_CONFIGS: Record<string, BrandConfig> = {

  // ===================== LUXURY TIER =====================
  // Never discount. Aspirational only. Low frequency. Editorial content.

  "Bottega Veneta": {
    name: "Bottega Veneta", tier: "luxury",
    priceRange: "INR 20,000-3,00,000+",
    categories: ["Bags", "Accessories", "Shoes", "Small Leather Goods"],
    canDiscount: false, maxDiscountPercent: 0,
    targetArchetypes: ["Fashion Loyalist"],
    messagingTone: "Understated luxury. Intrecciato weave. Craftsmanship speaks louder than logos.",
    showPrice: false, showEmi: false, scarcityMessaging: true, urgencyMessaging: false,
    ctaStyle: "aspirational", adFrequency: "low", retargetingWindow: 90, contentStyle: "editorial",
    verified: true, storeUrl: "https://brand official site/b/bottega-veneta",
  },
  "Amiri": {
    name: "Amiri", tier: "luxury",
    priceRange: "INR 15,000-1,50,000",
    categories: ["Jeans", "T-shirts", "Sneakers", "Jackets", "Hoodies"],
    canDiscount: false, maxDiscountPercent: 0,
    targetArchetypes: ["Fashion Loyalist"],
    messagingTone: "LA luxury streetwear. Rock and roll meets high fashion. Premium rebellion.",
    showPrice: false, showEmi: false, scarcityMessaging: true, urgencyMessaging: false,
    ctaStyle: "aspirational", adFrequency: "low", retargetingWindow: 90, contentStyle: "editorial",
    verified: true, storeUrl: "https://brand official site/b/amiri",
  },
  "Casablanca": {
    name: "Casablanca", tier: "luxury",
    priceRange: "INR 20,000-1,20,000",
    categories: ["Shirts", "T-shirts", "Shorts", "Knitwear"],
    canDiscount: false, maxDiscountPercent: 0,
    targetArchetypes: ["Fashion Loyalist"],
    messagingTone: "Sport-meets-luxury. Tennis club aesthetic. Maximalist prints and silk.",
    showPrice: false, showEmi: false, scarcityMessaging: true, urgencyMessaging: false,
    ctaStyle: "aspirational", adFrequency: "low", retargetingWindow: 90, contentStyle: "editorial",
    verified: true, storeUrl: "https://brand official site/b/casablanca",
  },
  "Jacquemus": {
    name: "Jacquemus", tier: "luxury",
    priceRange: "INR 15,000-1,00,000",
    categories: ["Handbags", "Dresses", "Accessories"],
    canDiscount: false, maxDiscountPercent: 0,
    targetArchetypes: ["Fashion Loyalist"],
    messagingTone: "French Riviera. Minimalist sensuality. Le Chiquito icon. Art-meets-fashion.",
    showPrice: false, showEmi: false, scarcityMessaging: true, urgencyMessaging: false,
    ctaStyle: "aspirational", adFrequency: "low", retargetingWindow: 90, contentStyle: "editorial",
    verified: true, storeUrl: "https://brand official site/fc/830301004/women-handbags/brands/jacquemus",
  },
  "Jimmy Choo": {
    name: "Jimmy Choo", tier: "luxury",
    priceRange: "INR 15,000-1,50,000",
    categories: ["Shoes", "Bags", "Sunglasses", "Accessories"],
    canDiscount: false, maxDiscountPercent: 0,
    targetArchetypes: ["Fashion Loyalist", "Occasional Splurger"],
    messagingTone: "Red carpet glamour. Empowerment through elegance. The shoe every woman dreams of.",
    showPrice: false, showEmi: false, scarcityMessaging: true, urgencyMessaging: false,
    ctaStyle: "aspirational", adFrequency: "low", retargetingWindow: 90, contentStyle: "editorial",
    verified: true, storeUrl: "https://brand official site/b/jimmy-choo",
  },
  "Stella McCartney": {
    name: "Stella McCartney", tier: "luxury",
    priceRange: "INR 15,000-1,20,000",
    categories: ["Clothing", "Bags", "Accessories", "Shoes"],
    canDiscount: false, maxDiscountPercent: 0,
    targetArchetypes: ["Fashion Loyalist"],
    messagingTone: "Conscious luxury. Sustainability as sophistication. Modern femininity without cruelty.",
    showPrice: false, showEmi: false, scarcityMessaging: true, urgencyMessaging: false,
    ctaStyle: "aspirational", adFrequency: "low", retargetingWindow: 90, contentStyle: "editorial",
    verified: true, storeUrl: "https://brand official site/b/stella-mccartney",
  },
  "Zimmermann": {
    name: "Zimmermann", tier: "luxury",
    priceRange: "INR 15,000-80,000",
    categories: ["Dresses", "Swimwear", "Tops", "Bikinis"],
    canDiscount: false, maxDiscountPercent: 0,
    targetArchetypes: ["Fashion Loyalist"],
    messagingTone: "Australian bohemian luxury. Romantic femininity. Resort and vacation perfection.",
    showPrice: false, showEmi: false, scarcityMessaging: true, urgencyMessaging: false,
    ctaStyle: "aspirational", adFrequency: "low", retargetingWindow: 90, contentStyle: "editorial",
    verified: true, storeUrl: "https://brand official site/b/zimmermann",
  },
  "Marc Jacobs": {
    name: "Marc Jacobs", tier: "luxury",
    priceRange: "INR 10,000-80,000",
    categories: ["Bags", "Accessories", "Shoes"],
    canDiscount: false, maxDiscountPercent: 0,
    targetArchetypes: ["Fashion Loyalist"],
    messagingTone: "New York downtown cool. The Tote Bag icon. Playful luxury with edge.",
    showPrice: false, showEmi: false, scarcityMessaging: true, urgencyMessaging: false,
    ctaStyle: "aspirational", adFrequency: "low", retargetingWindow: 90, contentStyle: "editorial",
    verified: true, storeUrl: "https://brand official site/b/marc-jacobs",
  },
  "Max Mara": {
    name: "Max Mara", tier: "luxury",
    priceRange: "INR 20,000-1,50,000",
    categories: ["Coats", "Clothing", "Accessories"],
    canDiscount: false, maxDiscountPercent: 0,
    targetArchetypes: ["Fashion Loyalist"],
    messagingTone: "Italian tailoring excellence. The iconic camel coat. Timeless elegance.",
    showPrice: false, showEmi: false, scarcityMessaging: true, urgencyMessaging: false,
    ctaStyle: "aspirational", adFrequency: "low", retargetingWindow: 90, contentStyle: "editorial",
    verified: true, storeUrl: "https://brand official site/b/max-mara",
  },

  // ===================== PREMIUM TIER =====================
  // Selective discounts (max 20%). Mix of aspiration + product. Target Loyalists + Achievers.

  "Ami Paris": {
    name: "Ami Paris", tier: "premium",
    priceRange: "INR 6,000-45,000",
    categories: ["T-shirts", "Polos", "Sweatshirts", "Caps", "Sneakers", "Jackets"],
    canDiscount: true, maxDiscountPercent: 15,
    targetArchetypes: ["Fashion Loyalist", "Urban Achiever"],
    messagingTone: "Parisian casual luxury. The Ami de Coeur heart logo. Effortlessly cool.",
    showPrice: true, showEmi: false, scarcityMessaging: true, urgencyMessaging: false,
    ctaStyle: "aspirational", adFrequency: "medium", retargetingWindow: 60, contentStyle: "mixed",
    verified: true, storeUrl: "https://brand official site/b/ami-paris",
  },
  "Hugo Boss": {
    name: "Hugo Boss", tier: "premium",
    priceRange: "INR 3,500-35,000",
    categories: ["Polos", "Shirts", "T-shirts", "Chinos", "Blazers", "Suits", "Shoes", "Accessories"],
    canDiscount: true, maxDiscountPercent: 25,
    targetArchetypes: ["Urban Achiever", "Aspirant"],
    messagingTone: "Professional excellence. Modern confidence. German precision meets style.",
    showPrice: true, showEmi: true, scarcityMessaging: false, urgencyMessaging: false,
    ctaStyle: "direct", adFrequency: "medium", retargetingWindow: 45, contentStyle: "product",
    verified: true, storeUrl: "https://brand official site/b/hugo-boss",
  },
  "Kenzo": {
    name: "Kenzo", tier: "premium",
    priceRange: "INR 5,000-40,000",
    categories: ["T-shirts", "Sweatshirts", "Jackets", "Sneakers", "Accessories"],
    canDiscount: true, maxDiscountPercent: 20,
    targetArchetypes: ["Fashion Loyalist", "Urban Achiever"],
    messagingTone: "Japanese meets Parisian. Tiger energy. Bold print mastery. Boke Flower and Tiger icons.",
    showPrice: true, showEmi: false, scarcityMessaging: true, urgencyMessaging: false,
    ctaStyle: "aspirational", adFrequency: "medium", retargetingWindow: 60, contentStyle: "mixed",
    verified: true, storeUrl: "https://brand official site/b/kenzo",
  },
  "Diesel": {
    name: "Diesel", tier: "premium",
    priceRange: "INR 4,000-30,000",
    categories: ["Jeans", "T-shirts", "Jackets", "Sneakers", "Watches", "Bags"],
    canDiscount: true, maxDiscountPercent: 25,
    targetArchetypes: ["Urban Achiever", "Aspirant"],
    messagingTone: "Rebellious Italian. Denim DNA. For Successful Living. Bold and unapologetic.",
    showPrice: true, showEmi: true, scarcityMessaging: false, urgencyMessaging: false,
    ctaStyle: "direct", adFrequency: "medium", retargetingWindow: 45, contentStyle: "product",
    verified: true, storeUrl: "https://brand official site/b/diesel",
  },
  "Emporio Armani": {
    name: "Emporio Armani", tier: "premium",
    priceRange: "INR 5,000-50,000",
    categories: ["Shirts", "T-shirts", "Jeans", "Watches", "Sunglasses", "Accessories"],
    canDiscount: true, maxDiscountPercent: 20,
    targetArchetypes: ["Urban Achiever", "Fashion Loyalist"],
    messagingTone: "Italian sophistication. The Eagle logo. Urban elegance for the modern professional.",
    showPrice: true, showEmi: false, scarcityMessaging: false, urgencyMessaging: false,
    ctaStyle: "aspirational", adFrequency: "medium", retargetingWindow: 60, contentStyle: "mixed",
    verified: true, storeUrl: "https://brand official site/b/emporio-armani",
  },
  "Versace": {
    name: "Versace", tier: "premium",
    priceRange: "INR 5,000-60,000",
    categories: ["Shirts", "T-shirts", "Wallets", "Belts", "Sunglasses", "Accessories"],
    canDiscount: true, maxDiscountPercent: 15,
    targetArchetypes: ["Fashion Loyalist", "Urban Achiever"],
    messagingTone: "Bold glamour. Medusa heritage. Italian opulence meets contemporary design.",
    showPrice: true, showEmi: false, scarcityMessaging: true, urgencyMessaging: false,
    ctaStyle: "aspirational", adFrequency: "medium", retargetingWindow: 60, contentStyle: "mixed",
    verified: true, storeUrl: "https://brand official site/b/versace",
  },
  "Prada": {
    name: "Prada", tier: "premium",
    priceRange: "INR 5,000-35,000",
    categories: ["Fragrances", "Sunglasses", "Eyewear"],
    canDiscount: true, maxDiscountPercent: 10,
    targetArchetypes: ["Fashion Loyalist", "Urban Achiever"],
    messagingTone: "Italian intellectual luxury. Fragrance and eyewear online. Full fashion available at Prada boutiques.",
    showPrice: true, showEmi: false, scarcityMessaging: false, urgencyMessaging: false,
    ctaStyle: "aspirational", adFrequency: "low", retargetingWindow: 60, contentStyle: "editorial",
    verified: true, storeUrl: "https://brand official site/b/prada",
  },
  "Farm Rio": {
    name: "Farm Rio", tier: "premium",
    priceRange: "INR 6,000-30,000",
    categories: ["Dresses", "Tops", "Skirts", "Swimwear"],
    canDiscount: true, maxDiscountPercent: 20,
    targetArchetypes: ["Fashion Loyalist"],
    messagingTone: "Brazilian tropical joy. Vibrant prints. Vacation energy every day. Bold colors.",
    showPrice: true, showEmi: false, scarcityMessaging: false, urgencyMessaging: false,
    ctaStyle: "aspirational", adFrequency: "medium", retargetingWindow: 45, contentStyle: "editorial",
    verified: true, storeUrl: "https://brand official site/b/farm-rio",
  },
  "Cult Gaia": {
    name: "Cult Gaia", tier: "premium",
    priceRange: "INR 8,000-50,000",
    categories: ["Bags", "Dresses", "Accessories"],
    canDiscount: true, maxDiscountPercent: 15,
    targetArchetypes: ["Fashion Loyalist"],
    messagingTone: "Art-meets-fashion. The Ark bag icon. Sculptural design. Instagram-famous accessories.",
    showPrice: true, showEmi: false, scarcityMessaging: true, urgencyMessaging: false,
    ctaStyle: "aspirational", adFrequency: "medium", retargetingWindow: 60, contentStyle: "editorial",
    verified: true, storeUrl: "https://brand official site/b/cult-gaia",
  },
  "Self Portrait": {
    name: "Self Portrait", tier: "premium",
    priceRange: "INR 12,000-55,000",
    categories: ["Dresses", "Tops", "Skirts"],
    canDiscount: true, maxDiscountPercent: 20,
    targetArchetypes: ["Fashion Loyalist", "Occasional Splurger"],
    messagingTone: "Modern lace. Event-ready elegance. Architectural femininity. The party dress brand.",
    showPrice: true, showEmi: false, scarcityMessaging: false, urgencyMessaging: false,
    ctaStyle: "aspirational", adFrequency: "medium", retargetingWindow: 60, contentStyle: "editorial",
    verified: true, storeUrl: "https://brand official site/b/self-portrait",
  },
  "Acne Studios": {
    name: "Acne Studios", tier: "premium",
    priceRange: "INR 8,000-50,000",
    categories: ["T-shirts", "Sweatshirts", "Jeans", "Accessories", "Scarves"],
    canDiscount: true, maxDiscountPercent: 20,
    targetArchetypes: ["Fashion Loyalist"],
    messagingTone: "Scandinavian minimalism. Face logo. Fashion insider essential. Creative direction.",
    showPrice: true, showEmi: false, scarcityMessaging: false, urgencyMessaging: false,
    ctaStyle: "aspirational", adFrequency: "low", retargetingWindow: 60, contentStyle: "editorial",
    verified: true, storeUrl: "https://brand official site/b/acne-studios",
  },
  "Maison Kitsune": {
    name: "Maison Kitsune", tier: "premium",
    priceRange: "INR 6,000-35,000",
    categories: ["T-shirts", "Polos", "Sweatshirts", "Caps"],
    canDiscount: true, maxDiscountPercent: 20,
    targetArchetypes: ["Fashion Loyalist", "Urban Achiever"],
    messagingTone: "Franco-Japanese cool. The fox logo. Music, fashion, and coffee culture combined.",
    showPrice: true, showEmi: false, scarcityMessaging: true, urgencyMessaging: false,
    ctaStyle: "aspirational", adFrequency: "medium", retargetingWindow: 60, contentStyle: "mixed",
    verified: true, storeUrl: "https://brand official site/b/maison-kitsune",
  },
  "Y-3": {
    name: "Y-3", tier: "premium",
    priceRange: "INR 8,000-40,000",
    categories: ["Sneakers", "T-shirts", "Jackets", "Accessories"],
    canDiscount: true, maxDiscountPercent: 20,
    targetArchetypes: ["Fashion Loyalist"],
    messagingTone: "Yohji Yamamoto x Adidas. Where sport meets avant-garde. The ultimate luxury sneaker.",
    showPrice: true, showEmi: false, scarcityMessaging: true, urgencyMessaging: false,
    ctaStyle: "aspirational", adFrequency: "medium", retargetingWindow: 60, contentStyle: "editorial",
    verified: true, storeUrl: "https://brand official site/b/y-3",
  },
  "A-Cold-Wall": {
    name: "A-Cold-Wall", tier: "premium",
    priceRange: "INR 8,000-40,000",
    categories: ["T-shirts", "Jackets", "Sneakers", "Accessories"],
    canDiscount: true, maxDiscountPercent: 20,
    targetArchetypes: ["Fashion Loyalist"],
    messagingTone: "British industrial aesthetic. Architecture-inspired fashion. Samuel Ross vision.",
    showPrice: true, showEmi: false, scarcityMessaging: true, urgencyMessaging: false,
    ctaStyle: "aspirational", adFrequency: "low", retargetingWindow: 60, contentStyle: "editorial",
    verified: true, storeUrl: "https://brand official site/b/a-cold-wall",
  },
  "Sandro": {
    name: "Sandro", tier: "premium",
    priceRange: "INR 8,000-40,000",
    categories: ["Dresses", "Tops", "Jackets", "Accessories"],
    canDiscount: true, maxDiscountPercent: 25,
    targetArchetypes: ["Fashion Loyalist", "Urban Achiever"],
    messagingTone: "Parisian effortless chic. Sophisticated yet accessible French style.",
    showPrice: true, showEmi: false, scarcityMessaging: false, urgencyMessaging: false,
    ctaStyle: "aspirational", adFrequency: "medium", retargetingWindow: 45, contentStyle: "mixed",
    verified: true, storeUrl: "https://brand official site/b/sandro",
  },
  "Maje": {
    name: "Maje", tier: "premium",
    priceRange: "INR 8,000-35,000",
    categories: ["Dresses", "Tops", "Jackets", "Accessories"],
    canDiscount: true, maxDiscountPercent: 25,
    targetArchetypes: ["Fashion Loyalist", "Urban Achiever"],
    messagingTone: "Parisian cool-girl. Rebellious femininity with a French twist.",
    showPrice: true, showEmi: false, scarcityMessaging: false, urgencyMessaging: false,
    ctaStyle: "aspirational", adFrequency: "medium", retargetingWindow: 45, contentStyle: "mixed",
    verified: true, storeUrl: "https://brand official site/b/maje",
  },

  // ===================== ACCESSIBLE TIER =====================
  // Can discount up to 35-40%. Value messaging OK. EMI prominent. Target Achievers + Aspirants.

  "All Saints": {
    name: "All Saints", tier: "accessible",
    priceRange: "INR 4,000-25,000",
    categories: ["Leather Jackets", "T-shirts", "Dresses", "Denim", "Boots"],
    canDiscount: true, maxDiscountPercent: 35,
    targetArchetypes: ["Urban Achiever", "Aspirant"],
    messagingTone: "London edge. Leather jackets DNA. Accessible premium for the bold and modern.",
    showPrice: true, showEmi: true, scarcityMessaging: false, urgencyMessaging: true,
    ctaStyle: "direct", adFrequency: "high", retargetingWindow: 30, contentStyle: "product",
    verified: true, storeUrl: "https://brand official site/b/allsaints",
  },
  "Coach": {
    name: "Coach", tier: "accessible",
    priceRange: "INR 5,000-45,000",
    categories: ["Bags", "Wallets", "Belts", "Shoes", "Accessories", "Travel Bags"],
    canDiscount: true, maxDiscountPercent: 30,
    targetArchetypes: ["Urban Achiever", "Aspirant", "Occasional Splurger"],
    messagingTone: "American heritage craft. The Tabby bag. Accessible luxury. The gateway designer bag.",
    showPrice: true, showEmi: true, scarcityMessaging: false, urgencyMessaging: true,
    ctaStyle: "direct", adFrequency: "high", retargetingWindow: 30, contentStyle: "product",
    verified: true, storeUrl: "https://brand official site/b/coach",
  },
  "Michael Kors": {
    name: "Michael Kors", tier: "accessible",
    priceRange: "INR 4,000-35,000",
    categories: ["Bags", "Watches", "Sunglasses", "Wallets", "Shoes", "Clothing"],
    canDiscount: true, maxDiscountPercent: 35,
    targetArchetypes: ["Urban Achiever", "Aspirant", "Occasional Splurger"],
    messagingTone: "Jet-set glamour. MK monogram. Bold, polished, and always runway-ready.",
    showPrice: true, showEmi: true, scarcityMessaging: false, urgencyMessaging: true,
    ctaStyle: "direct", adFrequency: "high", retargetingWindow: 30, contentStyle: "product",
    verified: true, storeUrl: "https://brand official site/b/michael-kors",
  },
  "Kate Spade": {
    name: "Kate Spade", tier: "accessible",
    priceRange: "INR 4,000-30,000",
    categories: ["Bags", "Wallets", "Accessories", "Jewelry"],
    canDiscount: true, maxDiscountPercent: 35,
    targetArchetypes: ["Aspirant", "Occasional Splurger"],
    messagingTone: "Playful sophistication. Color and joy. Smart femininity with a wink.",
    showPrice: true, showEmi: true, scarcityMessaging: false, urgencyMessaging: true,
    ctaStyle: "direct", adFrequency: "high", retargetingWindow: 30, contentStyle: "product",
    verified: true, storeUrl: "https://brand official site/b/kate-spade",
  },
  "Ted Baker": {
    name: "Ted Baker", tier: "accessible",
    priceRange: "INR 3,000-18,000",
    categories: ["Shirts", "Dresses", "Bags", "Accessories"],
    canDiscount: true, maxDiscountPercent: 40,
    targetArchetypes: ["Urban Achiever", "Aspirant"],
    messagingTone: "British quirk. No ordinary designer. Attention to detail. Affordable elegance.",
    showPrice: true, showEmi: true, scarcityMessaging: false, urgencyMessaging: true,
    ctaStyle: "value", adFrequency: "high", retargetingWindow: 21, contentStyle: "product",
    verified: true, storeUrl: "https://brand official site/b/ted-baker",
  },
  "Paul Smith": {
    name: "Paul Smith", tier: "accessible",
    priceRange: "INR 5,000-25,000",
    categories: ["Shirts", "T-shirts", "Accessories", "Bags"],
    canDiscount: true, maxDiscountPercent: 35,
    targetArchetypes: ["Urban Achiever", "Aspirant"],
    messagingTone: "British wit. Rainbow stripe signature. Classic with a playful twist.",
    showPrice: true, showEmi: true, scarcityMessaging: false, urgencyMessaging: true,
    ctaStyle: "direct", adFrequency: "high", retargetingWindow: 30, contentStyle: "product",
    verified: true, storeUrl: "https://brand official site/b/paul-smith",
  },
  "Swarovski": {
    name: "Swarovski", tier: "accessible",
    priceRange: "INR 2,000-25,000",
    categories: ["Jewelry", "Watches", "Accessories", "Crystal"],
    canDiscount: true, maxDiscountPercent: 30,
    targetArchetypes: ["Aspirant", "Occasional Splurger"],
    messagingTone: "Crystal brilliance. Gift-perfect. Everyday sparkle. The entry-point to luxury jewelry.",
    showPrice: true, showEmi: true, scarcityMessaging: false, urgencyMessaging: true,
    ctaStyle: "direct", adFrequency: "high", retargetingWindow: 21, contentStyle: "product",
    verified: true, storeUrl: "https://brand official site/b/swarovski",
  },
  "TUMI": {
    name: "TUMI", tier: "accessible",
    priceRange: "INR 10,000-60,000",
    categories: ["Luggage", "Backpacks", "Travel Bags", "Accessories"],
    canDiscount: true, maxDiscountPercent: 20,
    targetArchetypes: ["Urban Achiever"],
    messagingTone: "Travel perfection. Business essential. Built to perform. The professional's luggage.",
    showPrice: true, showEmi: true, scarcityMessaging: false, urgencyMessaging: false,
    ctaStyle: "direct", adFrequency: "medium", retargetingWindow: 45, contentStyle: "product",
    verified: true, storeUrl: "https://brand official site/b/tumi",
  },
  "Armani Exchange": {
    name: "Armani Exchange", tier: "accessible",
    priceRange: "INR 3,000-20,000",
    categories: ["T-shirts", "Shirts", "Jeans", "Watches", "Accessories"],
    canDiscount: true, maxDiscountPercent: 35,
    targetArchetypes: ["Aspirant", "Urban Achiever"],
    messagingTone: "Armani DNA at accessible price. Urban streetwear with Italian flair.",
    showPrice: true, showEmi: true, scarcityMessaging: false, urgencyMessaging: true,
    ctaStyle: "direct", adFrequency: "high", retargetingWindow: 21, contentStyle: "product",
    verified: true, storeUrl: "https://brand official site/b/armani-exchange",
  },
  "G-Star Raw": {
    name: "G-Star Raw", tier: "accessible",
    priceRange: "INR 3,000-18,000",
    categories: ["Jeans", "T-shirts", "Jackets", "Shorts"],
    canDiscount: true, maxDiscountPercent: 40,
    targetArchetypes: ["Aspirant", "Urban Achiever"],
    messagingTone: "Raw denim innovation. 3D construction. Dutch design meets street culture.",
    showPrice: true, showEmi: true, scarcityMessaging: false, urgencyMessaging: true,
    ctaStyle: "value", adFrequency: "high", retargetingWindow: 21, contentStyle: "product",
    verified: true, storeUrl: "https://brand official site/b/g-star-raw",
  },
  "Replay": {
    name: "Replay", tier: "accessible",
    priceRange: "INR 3,000-15,000",
    categories: ["Jeans", "T-shirts", "Jackets"],
    canDiscount: true, maxDiscountPercent: 40,
    targetArchetypes: ["Aspirant"],
    messagingTone: "Italian denim heritage. Authentic and modern. Premium denim for every day.",
    showPrice: true, showEmi: true, scarcityMessaging: false, urgencyMessaging: true,
    ctaStyle: "value", adFrequency: "high", retargetingWindow: 21, contentStyle: "product",
    verified: true, storeUrl: "https://brand official site/b/replay",
  },
  "Roberto Cavalli": {
    name: "Roberto Cavalli", tier: "accessible",
    priceRange: "INR 5,000-30,000",
    categories: ["Sunglasses", "Accessories", "Fragrance"],
    canDiscount: true, maxDiscountPercent: 30,
    targetArchetypes: ["Fashion Loyalist", "Aspirant"],
    messagingTone: "Italian glamour. Animal prints. Bold and dramatic luxury accessories.",
    showPrice: true, showEmi: true, scarcityMessaging: false, urgencyMessaging: true,
    ctaStyle: "direct", adFrequency: "medium", retargetingWindow: 30, contentStyle: "product",
    verified: true, storeUrl: "https://brand official site/b/roberto-cavalli",
  },
  "Lacoste": {
    name: "Lacoste", tier: "accessible",
    priceRange: "INR 2,500-15,000",
    categories: ["Polos", "T-shirts", "Sneakers", "Bags", "Watches"],
    canDiscount: true, maxDiscountPercent: 35,
    targetArchetypes: ["Urban Achiever", "Aspirant"],
    messagingTone: "French sporting elegance. The crocodile. Timeless polos and relaxed luxury.",
    showPrice: true, showEmi: true, scarcityMessaging: false, urgencyMessaging: true,
    ctaStyle: "direct", adFrequency: "high", retargetingWindow: 21, contentStyle: "product",
    verified: true, storeUrl: "https://brand official site/b/lacoste",
  },
};

export function getBrandConfig(brandName: string): BrandConfig {
  return DEFAULT_BRAND_CONFIGS[brandName] || {
    name: brandName, tier: "accessible",
    priceRange: "Variable", categories: ["Various"],
    canDiscount: true, maxDiscountPercent: 30,
    targetArchetypes: ["Urban Achiever", "Aspirant"],
    messagingTone: "Premium fashion online.",
    showPrice: true, showEmi: true, scarcityMessaging: false, urgencyMessaging: true,
    ctaStyle: "direct", adFrequency: "medium", retargetingWindow: 30, contentStyle: "product",
    verified: false, storeUrl: "",
  };
}

export function getBrandsByTier(tier: BrandTier): BrandConfig[] {
  return Object.values(DEFAULT_BRAND_CONFIGS).filter(b => b.tier === tier);
}

export const TIER_RULES = {
  luxury: {
    label: "Luxury",
    description: "Never discount. Aspirational messaging only. Low ad frequency. Editorial content. Target Fashion Loyalists only.",
    rules: [
      "NEVER show discounts or sale pricing in ads",
      "NEVER use urgency messaging (limited time, hurry, act now)",
      "DO NOT show price in prospecting ads",
      "DO NOT offer EMI/pay-later options",
      "Use editorial/lifestyle imagery only",
      "Low frequency: 1-2 impressions per person per week",
      "Target only Fashion Loyalists in Tier 1 metros",
      "CTA: 'Explore' or 'Discover' — never 'Shop Now'",
      "90-day retargeting window",
      "Scarcity OK but only genuine: 'Crafted in limited numbers'",
    ],
  },
  premium: {
    label: "Premium",
    description: "Selective discounts (max 15-25%). Mix of aspiration and product. Target Loyalists + Achievers.",
    rules: [
      "Can show price in ads (pre-qualifier)",
      "Discounts OK but max 15-25%",
      "Scarcity fine ('Only 4 left') but no urgency hacks",
      "EMI only for items above INR 15,000",
      "Mix of editorial and product-focused content",
      "Medium frequency: 2-4 impressions per week",
      "Target Fashion Loyalists + Urban Achievers",
      "CTA: 'Shop Now' or 'Explore Collection'",
      "45-60 day retargeting window",
    ],
  },
  accessible: {
    label: "Accessible Luxury",
    description: "Can discount up to 35-40%. Value messaging OK. EMI prominent. Target Achievers + Aspirants.",
    rules: [
      "Show price prominently in all ads",
      "Discounts OK up to 35-40% during sales",
      "Urgency messaging OK: 'Limited stock', 'Sale ends Sunday'",
      "EMI/pay-later prominent for items above INR 5,000",
      "Product-focused content with lifestyle context",
      "Higher frequency: 3-6 impressions per week",
      "Target Urban Achievers + Aspirants + Splurgers",
      "CTA: 'Shop Now' — direct and action-oriented",
      "21-30 day retargeting window",
    ],
  },
};
