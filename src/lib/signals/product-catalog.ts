/**
 * luxury retailers Hero Product Catalog
 * Maps each brand to their top-selling / hero products on luxe.ajio.com
 * Used to enrich signals with specific product recommendations.
 */

export interface HeroProduct {
  name: string;
  category: string;
  priceINR: number;
  heroAngle: string; // Why this product is the hero for ads
  searchTerms: string[]; // What people search for
}

export const HERO_PRODUCTS: Record<string, HeroProduct[]> = {
  "Hugo Boss": [
    { name: "BOSS Slim-Fit Suit", category: "Suits", priceINR: 38000, heroAngle: "India's #1 searched luxury suit brand. Wedding + office crossover.", searchTerms: ["hugo boss suit india", "boss suit price"] },
    { name: "BOSS Polo Shirt", category: "Polos", priceINR: 7499, heroAngle: "Entry-point product. High volume, repeat purchase.", searchTerms: ["hugo boss polo", "boss polo shirt"] },
    { name: "BOSS Oxford Shirt", category: "Shirts", priceINR: 8999, heroAngle: "Workwear staple. IT professionals buying for new job.", searchTerms: ["hugo boss shirt", "boss formal shirt india"] },
  ],
  "Coach": [
    { name: "Coach Tabby Shoulder Bag 26", category: "Bags", priceINR: 39500, heroAngle: "Coach's #1 bestseller globally. Every luxury bag search lands here.", searchTerms: ["coach tabby bag", "coach bag india price"] },
    { name: "Coach Willow Tote", category: "Bags", priceINR: 32000, heroAngle: "Work-to-weekend bag. Professional women's top pick.", searchTerms: ["coach tote bag", "coach willow"] },
    { name: "Coach Wallet", category: "Wallets", priceINR: 8500, heroAngle: "Top gifting item. Valentine's + birthday bestseller.", searchTerms: ["coach wallet", "coach wallet price india"] },
  ],
  "Diesel": [
    { name: "Diesel 1DR Shoulder Bag", category: "Bags", priceINR: 24500, heroAngle: "Globally trending #1 bag on Lyst. Instagram viral.", searchTerms: ["diesel 1dr bag", "diesel bag india"] },
    { name: "Diesel Slim Jeans", category: "Jeans", priceINR: 12000, heroAngle: "Diesel's DNA product. Denim loyalists.", searchTerms: ["diesel jeans india", "diesel slim fit"] },
  ],
  "Versace": [
    { name: "Versace Medusa Sunglasses", category: "Sunglasses", priceINR: 19500, heroAngle: "Most searched Versace product in India. Summer essential.", searchTerms: ["versace sunglasses", "versace medusa glasses india"] },
    { name: "Versace Medusa Belt", category: "Belts", priceINR: 22000, heroAngle: "Status symbol. Instagram flex product.", searchTerms: ["versace belt india", "versace medusa belt"] },
  ],
  "Jimmy Choo": [
    { name: "Jimmy Choo Bing Mules", category: "Shoes", priceINR: 62000, heroAngle: "Red carpet shoe. Wedding season hero product.", searchTerms: ["jimmy choo bing", "jimmy choo heels india"] },
    { name: "Jimmy Choo Bon Bon Bag", category: "Bags", priceINR: 85000, heroAngle: "Evening bag icon. Celebrity favorite.", searchTerms: ["jimmy choo bag", "jimmy choo clutch"] },
  ],
  "Michael Kors": [
    { name: "MK Jet Set Tote", category: "Bags", priceINR: 23500, heroAngle: "Entry-level luxury bag. Highest volume on luxury retailers.", searchTerms: ["michael kors bag india", "mk jet set"] },
    { name: "MK Parker Watch", category: "Watches", priceINR: 18000, heroAngle: "Gift-perfect. Birthday + anniversary bestseller.", searchTerms: ["michael kors watch india", "mk watch price"] },
  ],
  "Kate Spade": [
    { name: "Kate Spade Spencer Wallet", category: "Wallets", priceINR: 6500, heroAngle: "Top gifting product. Under ₹10K luxury gift.", searchTerms: ["kate spade wallet india", "kate spade price"] },
    { name: "Kate Spade Knott Bag", category: "Bags", priceINR: 25000, heroAngle: "Everyday luxury bag. Work-appropriate.", searchTerms: ["kate spade bag india", "kate spade knott"] },
  ],
  "Marc Jacobs": [
    { name: "Marc Jacobs Snapshot Bag", category: "Bags", priceINR: 27000, heroAngle: "Most Instagrammed Marc Jacobs product. Gen Z favorite.", searchTerms: ["marc jacobs snapshot", "marc jacobs bag india"] },
    { name: "Marc Jacobs Tote Bag", category: "Bags", priceINR: 18000, heroAngle: "The Tote Bag viral moment. Canvas + leather.", searchTerms: ["marc jacobs tote bag", "the tote bag marc jacobs"] },
  ],
  "Emporio Armani": [
    { name: "Emporio Armani Blazer", category: "Blazers", priceINR: 35000, heroAngle: "Board meeting essential. Italian tailoring for Indian professionals.", searchTerms: ["armani blazer india", "emporio armani suit"] },
    { name: "EA Logo T-shirt", category: "T-shirts", priceINR: 8500, heroAngle: "Eagle logo tee. Entry-point Armani.", searchTerms: ["emporio armani tshirt", "armani t shirt india"] },
  ],
  "Max Mara": [
    { name: "Max Mara Structured Coat", category: "Coats", priceINR: 72000, heroAngle: "The iconic camel coat. Timeless investment piece.", searchTerms: ["max mara coat india", "max mara camel coat"] },
    { name: "Max Mara Wrap Dress", category: "Dresses", priceINR: 45000, heroAngle: "Power dressing. Corporate women's favorite.", searchTerms: ["max mara dress", "max mara india"] },
  ],
  "Kenzo": [
    { name: "Kenzo Tiger Sweatshirt", category: "Sweatshirts", priceINR: 24500, heroAngle: "The iconic Tiger. Streetwear + luxury crossover.", searchTerms: ["kenzo tiger", "kenzo sweatshirt india"] },
    { name: "Kenzo Boke Flower Tee", category: "T-shirts", priceINR: 12000, heroAngle: "New Kenzo icon. Fresh, younger audience.", searchTerms: ["kenzo t shirt", "kenzo boke flower"] },
  ],
  "Swarovski": [
    { name: "Swarovski Tennis Bracelet", category: "Jewelry", priceINR: 8500, heroAngle: "Gift bestseller. Every occasion works.", searchTerms: ["swarovski bracelet india", "swarovski price"] },
    { name: "Swarovski Pendant Necklace", category: "Jewelry", priceINR: 6500, heroAngle: "Under ₹10K luxury gift. Valentine's + Rakhi hero.", searchTerms: ["swarovski necklace india", "swarovski pendant"] },
  ],
  "All Saints": [
    { name: "AllSaints Balfern Leather Jacket", category: "Jackets", priceINR: 22000, heroAngle: "Iconic biker jacket. AllSaints DNA product.", searchTerms: ["allsaints leather jacket", "allsaints balfern"] },
  ],
  "Lacoste": [
    { name: "Lacoste Classic Polo", category: "Polos", priceINR: 5500, heroAngle: "The crocodile polo. Volume driver.", searchTerms: ["lacoste polo india", "lacoste t shirt price"] },
  ],
  "Farm Rio": [
    { name: "Farm Rio Printed Midi Dress", category: "Dresses", priceINR: 18000, heroAngle: "Vacation dress. Tropical print statement.", searchTerms: ["farm rio dress", "farm rio india"] },
  ],
  "Self Portrait": [
    { name: "Self Portrait Lace Midi Dress", category: "Dresses", priceINR: 35000, heroAngle: "The party dress brand. Wedding guest hero.", searchTerms: ["self portrait dress", "self portrait india"] },
  ],
  "Bottega Veneta": [
    { name: "Bottega Veneta Cassette Bag", category: "Bags", priceINR: 195000, heroAngle: "Intrecciato icon. The quiet luxury status symbol.", searchTerms: ["bottega veneta bag india", "bottega cassette"] },
  ],
  "Jacquemus": [
    { name: "Jacquemus Le Chiquito", category: "Bags", priceINR: 42000, heroAngle: "The viral mini bag. Instagram's most photographed.", searchTerms: ["jacquemus bag india", "le chiquito"] },
  ],
  "Zimmermann": [
    { name: "Zimmermann Floral Midi Dress", category: "Dresses", priceINR: 45000, heroAngle: "Vacation luxury. Resort wear perfection.", searchTerms: ["zimmermann dress india", "zimmermann resort"] },
  ],
};

/**
 * Get hero products for a brand. Returns top 2 most relevant.
 */
export function getHeroProducts(brandName: string): HeroProduct[] {
  return HERO_PRODUCTS[brandName] || [];
}

/**
 * Get a single hero product for a brand (the #1 bestseller).
 */
export function getTopHero(brandName: string): HeroProduct | null {
  const products = HERO_PRODUCTS[brandName];
  return products?.[0] || null;
}

/**
 * Given a signal type, pick the most relevant hero product for a brand.
 */
export function getHeroForContext(brandName: string, context: string): HeroProduct | null {
  const products = HERO_PRODUCTS[brandName];
  if (!products || products.length === 0) return null;

  const ctx = context.toLowerCase();

  // Context-aware product selection
  if (ctx.includes("wedding") || ctx.includes("ceremony") || ctx.includes("party")) {
    // Prefer occasion-appropriate products, then highest-priced (most premium) item
    const occasionProd = products.find(p => p.category === "Dresses" || p.category === "Shoes" || p.category === "Suits" || p.category === "Blazers" || p.category === "Bags");
    if (occasionProd) return occasionProd;
    // Fallback: most expensive = most "occasion worthy"
    return [...products].sort((a, b) => b.priceINR - a.priceINR)[0];
  }
  if (ctx.includes("gift") || ctx.includes("valentine") || ctx.includes("birthday") || ctx.includes("rakhi")) {
    return products.find(p => p.category === "Wallets" || p.category === "Jewelry" || p.category === "Watches") || products[0];
  }
  if (ctx.includes("office") || ctx.includes("interview") || ctx.includes("work") || ctx.includes("professional")) {
    return products.find(p => p.category === "Suits" || p.category === "Blazers" || p.category === "Shirts") || products[0];
  }
  if (ctx.includes("salary") || ctx.includes("payday") || ctx.includes("earned") || ctx.includes("appraisal")) {
    // For payday signals, pick accessible entry-point products (lower price = impulse buy)
    const sorted = [...products].sort((a, b) => a.priceINR - b.priceINR);
    return sorted.find(p => p.priceINR <= 15000) || sorted[0];
  }
  if (ctx.includes("summer") || ctx.includes("heat") || ctx.includes("sun")) {
    return products.find(p => p.category === "Sunglasses" || p.category === "Polos" || p.category === "Dresses") || products[0];
  }
  if (ctx.includes("trend") || ctx.includes("viral") || ctx.includes("instagram")) {
    return products.find(p => p.heroAngle.toLowerCase().includes("viral") || p.heroAngle.toLowerCase().includes("instagram")) || products[0];
  }

  return products[0];
}
