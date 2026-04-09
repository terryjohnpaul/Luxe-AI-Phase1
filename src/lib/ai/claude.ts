import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

interface ClaudeResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

const SYSTEM_PROMPT = `You are LUXE AI, an expert marketing intelligence system for luxury fashion e-commerce (Ajio Luxe - luxe.ajio.com).

You understand:
- Luxury fashion marketing across Meta (Facebook/Instagram) and Google Ads
- Customer archetypes: Fashion Loyalists (zero-discount, evolved taste), Urban Achievers (professionals seeking validation), Occasional Splurgers (event-driven buyers), Aspirants (entry-level luxury)
- Indian luxury market: tier 1 metro cities (Mumbai, Delhi, Bangalore), tier 2 emerging (Ahmedabad, Jaipur, Hyderabad)
- Fashion seasonality, brand positioning, trend cycles
- 800+ brands including Hugo Boss, Diesel, Kenzo, Ami Paris, All Saints, Farm Rio, Cult Gaia, Acne Studios
- Return-rate-adjusted ROAS (net revenue after returns / ad spend)
- The distinction between halo brands (low margin, high coolness) and power brands (high margin, high sell-through)

When making optimization decisions:
1. Always consider NET ROAS (after returns), not just gross ROAS
2. Never recommend discounting halo/premium brands unless explicitly asked
3. Prioritize Fashion Loyalists for new drops and zero-discount items
4. Consider weekday vs weekend patterns (metros = weekday, tier 2 = weekend)
5. Weather and trends drive fashion purchasing behavior in India
6. Provide clear reasoning for every recommendation
7. Include confidence scores (0-1) for predictions`;

export async function askClaude(
  prompt: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<ClaudeResponse> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: options?.maxTokens || 4096,
    temperature: options?.temperature || 0.3,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const textContent = response.content.find((c) => c.type === "text");

  return {
    text: textContent?.text || "",
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

export async function askClaudeStructured<T>(
  prompt: string,
  parseResponse: (text: string) => T
): Promise<{ data: T; tokens: { input: number; output: number } }> {
  const response = await askClaude(prompt + "\n\nRespond with valid JSON only. No markdown, no code blocks, just raw JSON.", {
    temperature: 0.1,
  });

  // Extract JSON from response (handle potential markdown wrapping)
  let jsonStr = response.text.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
  }

  const data = parseResponse(jsonStr);

  return {
    data,
    tokens: { input: response.inputTokens, output: response.outputTokens },
  };
}
