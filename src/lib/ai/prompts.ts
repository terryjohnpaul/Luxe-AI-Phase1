/**
 * AI Prompts for all LUXE AI modules
 */

// ============================================================
// OPTIMIZATION ENGINE PROMPTS
// ============================================================

export function optimizationAnalysisPrompt(data: {
  metaMetrics: any[];
  googleMetrics: any[];
  signals: any[];
  historicalContext: string;
}) {
  return `Analyze the following marketing performance data for Ajio Luxe and provide optimization recommendations.

## Current Meta Campaign Performance (last 4 hours):
${JSON.stringify(data.metaMetrics, null, 2)}

## Current Google Campaign Performance (last 4 hours):
${JSON.stringify(data.googleMetrics, null, 2)}

## Active Signals:
${JSON.stringify(data.signals, null, 2)}

## Historical Context:
${data.historicalContext}

Analyze and return a JSON array of optimization decisions. Each decision should have:
{
  "decisions": [
    {
      "type": "budget_increase|budget_decrease|campaign_pause|campaign_resume|discount_remove|creative_refresh|audience_shift|signal_response",
      "campaignId": "campaign ID or null",
      "description": "what to do",
      "reasoning": "why — reference specific metrics",
      "confidence": 0.0-1.0,
      "autoApprove": true/false (true only if confidence > 0.8 and action is within safe bounds),
      "estimatedImpact": "expected result in INR or ROAS terms",
      "action": {
        "field": "daily_budget|status|bid_strategy",
        "currentValue": "current value",
        "newValue": "proposed value"
      }
    }
  ],
  "summary": "1-2 sentence overview of key findings"
}

Rules:
- Budget increases above 30% require autoApprove: false
- Never auto-approve discount removals (require human approval)
- Campaign pauses for sold-out products are always autoApprove: true
- Prioritize NET ROAS (consider return rates if available)
- Flag any ROAS drops >30% as urgent`;
}

// ============================================================
// AD COPY GENERATION PROMPTS
// ============================================================

export function adCopyPrompt(params: {
  brand: string;
  product: string;
  category: string;
  price: number;
  archetype: string;
  funnelStage: string;
  format: string;
}) {
  return `Generate luxury fashion ad copy for Ajio Luxe.

Brand: ${params.brand}
Product: ${params.product}
Category: ${params.category}
Price: INR ${params.price.toLocaleString("en-IN")}
Target Archetype: ${params.archetype}
Funnel Stage: ${params.funnelStage}
Ad Format: ${params.format}

Return JSON:
{
  "headlines": ["headline 1 (max 30 chars)", "headline 2", "headline 3"],
  "primaryTexts": ["primary text 1 (max 125 chars)", "primary text 2"],
  "descriptions": ["description 1 (max 90 chars)", "description 2"],
  "cta": "SHOP_NOW|LEARN_MORE|SIGN_UP",
  "hashTags": ["#hashtag1", "#hashtag2"]
}

Guidelines:
- Luxury tone: aspirational, not pushy
- No urgency hacks (no "HURRY", "LIMITED TIME")
- Show price for prospecting (pre-qualifies audience)
- Use "Learn More" CTA for cold traffic, "Shop Now" for retargeting
- Fashion Loyalists: emphasize exclusivity and newness
- Urban Achievers: emphasize professional elevation and validation
- Aspirants: emphasize accessibility and aspiration
- Splurgers: emphasize gifting and special occasions`;
}

// ============================================================
// AUDIENCE ANALYSIS PROMPTS
// ============================================================

export function archetypeAnalysisPrompt(customerData: any[]) {
  return `Analyze these customer profiles and classify each into one of four luxury fashion archetypes.

Customer Data:
${JSON.stringify(customerData, null, 2)}

Archetypes:
1. FASHION_LOYALIST: Evolved taste, shops globally, indifferent to discounts. 11 min avg on site. Buys new drops immediately.
2. URBAN_ACHIEVER: SME owners, professionals. 16 min avg on site. Seeks validation. Conservative brands (Hugo Boss, Armani).
3. OCCASIONAL_SPLURGER: Category-indifferent. Buys for others/events. High AOV, low frequency.
4. ASPIRANT: Discount-sensitive, entry luxury. First Hugo Boss polo type. Price-conscious but aspiring.

Return JSON:
{
  "classifications": [
    {
      "customerId": "id",
      "archetype": "FASHION_LOYALIST|URBAN_ACHIEVER|OCCASIONAL_SPLURGER|ASPIRANT",
      "confidence": 0.0-1.0,
      "reasoning": "why this classification",
      "predictedClv": estimated lifetime value in INR,
      "churnRisk": 0.0-1.0,
      "recommendedAction": "what marketing action to take"
    }
  ]
}`;
}

// ============================================================
// BRAND HEAT SCORE PROMPTS
// ============================================================

export function brandHeatPrompt(brandData: {
  brand: string;
  searchVolume: number;
  socialMentions: number;
  celebrityMentions: string[];
  competitorPresence: string[];
  priceRange: string;
  sellThroughRate?: number;
}) {
  return `Calculate a Brand Heat Score (0-100) for this brand on the Ajio Luxe platform.

Brand: ${brandData.brand}
Google Search Volume (India, last 30 days): ${brandData.searchVolume}
Social Media Mentions (last 30 days): ${brandData.socialMentions}
Celebrity/Influencer Mentions: ${JSON.stringify(brandData.celebrityMentions)}
Competitor Presence: ${JSON.stringify(brandData.competitorPresence)}
Price Range: ${brandData.priceRange}
Sell-Through Rate: ${brandData.sellThroughRate || "N/A"}

Score Components (weight in parentheses):
- Social Buzz (25%): volume + sentiment of brand mentions in India
- Search Demand (20%): Google search volume trend
- Global Credibility (15%): global ranking, department store presence
- Competitor Presence (10%): low = opportunity, high = saturated
- Cultural Relevance (15%): celebrity wearing, Bollywood styling
- Price-Market Fit (15%): matches Ajio Luxe sweet spots

Return JSON:
{
  "brand": "${brandData.brand}",
  "overallScore": 0-100,
  "components": {
    "socialBuzz": 0-100,
    "searchDemand": 0-100,
    "globalCredibility": 0-100,
    "competitorPresence": 0-100,
    "culturalRelevance": 0-100,
    "priceMarketFit": 0-100
  },
  "trend": "RISING|STABLE|DECLINING",
  "classification": "POWER|GROWTH|HALO|UNDERPERFORMER",
  "recommendation": "text recommendation for buying team"
}`;
}

// ============================================================
// SIGNAL INTERPRETATION PROMPTS
// ============================================================

export function signalInterpretationPrompt(signals: any[]) {
  return `Interpret these real-time signals for Ajio Luxe marketing and recommend actions.

Active Signals:
${JSON.stringify(signals, null, 2)}

For each signal, determine:
1. Is immediate action needed?
2. What marketing actions should be taken?
3. Should any campaigns be activated, boosted, or paused?
4. Should any discounts be added or removed?

Return JSON:
{
  "interpretations": [
    {
      "signalId": "id",
      "urgency": "immediate|within_1hr|within_4hr|informational",
      "actions": [
        {
          "type": "boost_campaign|pause_campaign|activate_campaign|remove_discount|create_content|alert_team",
          "target": "campaign or product identifier",
          "detail": "specific action",
          "autoExecute": true/false
        }
      ],
      "reasoning": "why these actions"
    }
  ]
}`;
}

// ============================================================
// PRODUCT DESCRIPTION PROMPTS
// ============================================================

export function productDescriptionPrompt(product: {
  brand: string;
  title: string;
  category: string;
  price: number;
  attributes: Record<string, string>;
}) {
  return `Write an SEO-optimized, luxury-appropriate product description for Ajio Luxe.

Brand: ${product.brand}
Product: ${product.title}
Category: ${product.category}
Price: INR ${product.price.toLocaleString("en-IN")}
Attributes: ${JSON.stringify(product.attributes)}

Return JSON:
{
  "optimizedTitle": "Brand name FIRST, then product, then key descriptor (max 150 chars)",
  "shortDescription": "2-3 sentences emphasizing craftsmanship and brand story (max 300 chars)",
  "longDescription": "4-6 sentences for PDP page (max 600 chars)",
  "seoMetaTitle": "max 60 chars for SEO",
  "seoMetaDescription": "max 160 chars for SEO",
  "searchKeywords": ["keyword1", "keyword2", "keyword3"]
}

Guidelines:
- Lead with brand heritage and craftsmanship
- Mention material quality and construction details
- Use aspirational but not pushy language
- Include practical styling suggestions
- No exclamation marks, no ALL CAPS, no urgency`;
}
