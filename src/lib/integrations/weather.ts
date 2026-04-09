/**
 * WeatherAPI.com Integration
 *
 * Handles: Real-time weather + forecast for Indian cities
 * Used for: Weather-triggered campaign activation/deactivation
 * Auth: API key
 * Cost: FREE (1M calls/month)
 */

const WEATHER_BASE_URL = "https://api.weatherapi.com/v1";

interface WeatherCondition {
  city: string;
  tempC: number;
  feelsLikeC: number;
  humidity: number;
  precipMm: number;
  windKph: number;
  condition: string;
  isDay: boolean;
  aqi?: number;
}

interface WeatherTrigger {
  type: string;
  city: string;
  condition: WeatherCondition;
  campaignAction: string;
}

// Top 20 Indian cities for luxury marketing
const INDIAN_CITIES = [
  { name: "Mumbai", lat: 19.076, lon: 72.878 },
  { name: "Delhi", lat: 28.614, lon: 77.209 },
  { name: "Bangalore", lat: 12.972, lon: 77.595 },
  { name: "Hyderabad", lat: 17.385, lon: 78.487 },
  { name: "Chennai", lat: 13.083, lon: 80.271 },
  { name: "Kolkata", lat: 22.573, lon: 88.364 },
  { name: "Pune", lat: 18.520, lon: 73.857 },
  { name: "Ahmedabad", lat: 23.023, lon: 72.571 },
  { name: "Jaipur", lat: 26.912, lon: 75.787 },
  { name: "Lucknow", lat: 26.847, lon: 80.947 },
  { name: "Chandigarh", lat: 30.734, lon: 76.779 },
  { name: "Kochi", lat: 9.932, lon: 76.267 },
  { name: "Goa", lat: 15.299, lon: 73.957 },
  { name: "Indore", lat: 22.720, lon: 75.858 },
  { name: "Surat", lat: 21.170, lon: 72.831 },
  { name: "Gurgaon", lat: 28.459, lon: 77.027 },
  { name: "Noida", lat: 28.535, lon: 77.391 },
  { name: "Nagpur", lat: 21.146, lon: 79.089 },
  { name: "Coimbatore", lat: 11.017, lon: 76.956 },
  { name: "Vadodara", lat: 22.307, lon: 73.181 },
];

export class WeatherClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getCurrentWeather(city: string): Promise<WeatherCondition> {
    const resp = await fetch(
      `${WEATHER_BASE_URL}/current.json?key=${this.apiKey}&q=${city}&aqi=yes`
    );

    if (!resp.ok) throw new Error(`Weather API error for ${city}: ${resp.status}`);
    const data = await resp.json();

    return {
      city,
      tempC: data.current.temp_c,
      feelsLikeC: data.current.feelslike_c,
      humidity: data.current.humidity,
      precipMm: data.current.precip_mm,
      windKph: data.current.wind_kph,
      condition: data.current.condition.text,
      isDay: data.current.is_day === 1,
      aqi: data.current.air_quality?.pm2_5,
    };
  }

  async getAllCitiesWeather(): Promise<WeatherCondition[]> {
    const results: WeatherCondition[] = [];

    // Process in batches of 5 to avoid rate limits
    for (let i = 0; i < INDIAN_CITIES.length; i += 5) {
      const batch = INDIAN_CITIES.slice(i, i + 5);
      const batchResults = await Promise.all(
        batch.map((c) => this.getCurrentWeather(c.name))
      );
      results.push(...batchResults);

      // Small delay between batches
      if (i + 5 < INDIAN_CITIES.length) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    return results;
  }

  async checkTriggers(): Promise<WeatherTrigger[]> {
    const conditions = await this.getAllCitiesWeather();
    const triggers: WeatherTrigger[] = [];

    for (const condition of conditions) {
      // Cold snap: temp below 15°C (unusual for most Indian cities)
      if (condition.tempC < 15) {
        triggers.push({
          type: "COLD_SNAP",
          city: condition.city,
          condition,
          campaignAction: `Activate light jacket/outerwear campaigns for ${condition.city}`,
        });
      }

      // Heatwave: temp above 40°C
      if (condition.tempC > 40) {
        triggers.push({
          type: "HEATWAVE",
          city: condition.city,
          condition,
          campaignAction: `Activate summer/lightweight collection for ${condition.city}`,
        });
      }

      // Heavy rain
      if (condition.precipMm > 20) {
        triggers.push({
          type: "HEAVY_RAIN",
          city: condition.city,
          condition,
          campaignAction: `Activate monsoon/indoor collection for ${condition.city}`,
        });
      }

      // Poor air quality (Delhi/NCR specific)
      if (condition.aqi && condition.aqi > 150) {
        triggers.push({
          type: "POOR_AQI",
          city: condition.city,
          condition,
          campaignAction: `Consider indoor-focused campaigns for ${condition.city}`,
        });
      }

      // Beautiful weather on weekend = outdoor/travel wear
      const dayOfWeek = new Date().getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      if (
        isWeekend &&
        condition.tempC >= 20 &&
        condition.tempC <= 30 &&
        condition.precipMm === 0 &&
        condition.condition.includes("Sunny")
      ) {
        triggers.push({
          type: "SUNNY_WEEKEND",
          city: condition.city,
          condition,
          campaignAction: `Boost outdoor/weekend/sunglasses campaigns for ${condition.city}`,
        });
      }
    }

    return triggers;
  }
}

export { INDIAN_CITIES };
export type { WeatherCondition, WeatherTrigger };
