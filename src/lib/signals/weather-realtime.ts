/**
 * Real-Time Weather Signals
 * Wraps the existing WeatherAPI integration into the signal format
 * Source: WeatherAPI.com (free: 1M calls/month)
 * Cost: FREE
 */

import { Signal, signalId, expiresIn } from "./types";

const INDIAN_CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai",
  "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow",
  "Chandigarh", "Kochi", "Goa", "Indore", "Surat",
  "Gurgaon", "Noida", "Nagpur", "Coimbatore", "Vadodara",
];

interface WeatherData {
  city: string;
  tempC: number;
  feelsLikeC: number;
  humidity: number;
  precipMm: number;
  condition: string;
  aqi?: number;
  windKph: number;
}

async function fetchWeather(city: string): Promise<WeatherData | null> {
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) return null;

  try {
    const resp = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}&aqi=yes`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    return {
      city,
      tempC: data.current.temp_c,
      feelsLikeC: data.current.feelslike_c,
      humidity: data.current.humidity,
      precipMm: data.current.precip_mm,
      condition: data.current.condition.text,
      aqi: data.current.air_quality?.pm2_5,
      windKph: data.current.wind_kph,
    };
  } catch {
    return null;
  }
}

export async function getWeatherSignals(): Promise<Signal[]> {
  const today = new Date();
  const signals: Signal[] = [];
  const apiKey = process.env.WEATHER_API_KEY;

  if (!apiKey) {
    signals.push({
      id: signalId("weather", "no-api-key"),
      type: "weather",
      source: "demo",
      title: "Weather signals inactive (add WEATHER_API_KEY)",
      description: "Add WEATHER_API_KEY to .env (free from weatherapi.com) to enable real-time weather signals for 20 Indian cities.",
      location: "Pan India",
      severity: "low",
      triggersWhat: "Weather-appropriate fashion recommendations",
      targetArchetypes: ["All"],
      suggestedBrands: ["All"],
      suggestedAction: "Configure WEATHER_API_KEY in settings.",
      confidence: 0.0,
      expiresAt: expiresIn(24),
      data: {},
      detectedAt: today,
    });
    return signals;
  }

  // Fetch weather for key cities (batch in groups of 5)
  const citiesToCheck = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Hyderabad", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow"];

  for (let i = 0; i < citiesToCheck.length; i += 5) {
    const batch = citiesToCheck.slice(i, i + 5);
    const results = await Promise.all(batch.map(c => fetchWeather(c)));

    for (const weather of results) {
      if (!weather) continue;

      // === HEATWAVE (>40°C) ===
      if (weather.tempC > 40) {
        signals.push({
          id: signalId("weather", `heatwave-${weather.city.toLowerCase()}`),
          type: "weather",
          source: "weatherapi",
          title: `${weather.city} heatwave: ${weather.tempC}°C`,
          description: `Extreme heat in ${weather.city}. Push lightweight fabrics, sunglasses, summer accessories. People want to look good without overheating.`,
          location: weather.city,
          severity: weather.tempC > 44 ? "critical" : "high",
          triggersWhat: "Linen shirts, cotton polos, sunglasses, light colors, summer dresses, breathable fabrics",
          targetArchetypes: ["Urban Achiever", "Fashion Loyalist"],
          suggestedBrands: ["Hugo Boss", "Michael Kors", "Coach", "Jimmy Choo"],
          suggestedAction: `Push summer essentials in ${weather.city}. Sunglasses + linen prominent. Morning (7-9 AM) and evening (7-11 PM) ads.`,
          confidence: 0.85,
          expiresAt: expiresIn(6),
          data: weather,
          detectedAt: today,
        });
      }

      // === COLD SNAP (<15°C) ===
      if (weather.tempC < 15) {
        signals.push({
          id: signalId("weather", `cold-${weather.city.toLowerCase()}`),
          type: "weather",
          source: "weatherapi",
          title: `${weather.city} cold snap: ${weather.tempC}°C`,
          description: `Temperature below 15°C in ${weather.city}. Push jackets, blazers, scarves, winter accessories, layering pieces.`,
          location: weather.city,
          severity: weather.tempC < 8 ? "high" : "medium",
          triggersWhat: "Jackets, blazers, scarves, boots, coats, layering pieces, warm accessories",
          targetArchetypes: ["Urban Achiever", "Fashion Loyalist", "Aspirant"],
          suggestedBrands: ["All Saints", "Hugo Boss", "Moncler", "Diesel"],
          suggestedAction: `Activate winter/outerwear campaigns for ${weather.city}. Push jackets and layering.`,
          confidence: 0.85,
          expiresAt: expiresIn(6),
          data: weather,
          detectedAt: today,
        });
      }

      // === HEAVY RAIN ===
      if (weather.precipMm > 10) {
        signals.push({
          id: signalId("weather", `rain-${weather.city.toLowerCase()}`),
          type: "weather",
          source: "weatherapi",
          title: `${weather.city} heavy rain (${weather.precipMm}mm)`,
          description: `Significant rain in ${weather.city}. People staying indoors = more online browsing. Push monsoon-appropriate fashion.`,
          location: weather.city,
          severity: weather.precipMm > 30 ? "high" : "medium",
          triggersWhat: "Monsoon-ready fashion, waterproof accessories, cozy indoor wear, rain boots, umbrellas",
          targetArchetypes: ["All — rain drives indoor browsing for everyone"],
          suggestedBrands: ["All Saints", "Hugo Boss", "Coach"],
          suggestedAction: `Rain in ${weather.city} = 40% more online browsing. Boost digital campaigns for ${weather.city}. Monsoon collection + 'cozy day' messaging.`,
          confidence: 0.75,
          expiresAt: expiresIn(6),
          data: weather,
          detectedAt: today,
        });
      }

      // === POOR AIR QUALITY (AQI > 150) ===
      if (weather.aqi && weather.aqi > 150) {
        signals.push({
          id: signalId("weather", `aqi-${weather.city.toLowerCase()}`),
          type: "weather",
          source: "weatherapi",
          title: `${weather.city} poor AQI: ${Math.round(weather.aqi)} PM2.5`,
          description: `Air quality unhealthy in ${weather.city}. People staying indoors and browsing online 40% more. Double down on digital ads for this city.`,
          location: weather.city,
          severity: weather.aqi > 300 ? "high" : "medium",
          triggersWhat: "Indoor browsing spike = opportunity. Push all categories. People have time to browse.",
          targetArchetypes: ["All"],
          suggestedBrands: ["All brands"],
          suggestedAction: `AQI ${Math.round(weather.aqi)} in ${weather.city}. People indoors browsing. Increase ${weather.city} campaign budgets 20%. They have time and attention.`,
          confidence: 0.70,
          expiresAt: expiresIn(6),
          data: weather,
          detectedAt: today,
        });
      }

      // === PLEASANT WEATHER + WEEKEND ===
      const isWeekend = today.getDay() === 0 || today.getDay() === 6;
      if (isWeekend && weather.tempC >= 20 && weather.tempC <= 30 && weather.precipMm === 0) {
        signals.push({
          id: signalId("weather", `pleasant-${weather.city.toLowerCase()}`),
          type: "weather",
          source: "weatherapi",
          title: `Beautiful weekend in ${weather.city} (${weather.tempC}°C, ${weather.condition})`,
          description: `Perfect weather for going out in ${weather.city}. People will be dining out, brunching, shopping. Push outdoor/casual luxury.`,
          location: weather.city,
          severity: "low",
          triggersWhat: "Brunch outfits, sunglasses, outdoor casual wear, weekend fashion",
          targetArchetypes: ["Fashion Loyalist", "Urban Achiever"],
          suggestedBrands: ["Kenzo", "Farm Rio", "Diesel", "All Saints"],
          suggestedAction: `Pleasant weekend in ${weather.city}. Push outdoor/brunch/weekend fashion. Sunglasses and casual luxury.`,
          confidence: 0.65,
          expiresAt: expiresIn(12),
          data: weather,
          detectedAt: today,
        });
      }
    }

    // Small delay between batches
    if (i + 5 < citiesToCheck.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  return signals;
}
