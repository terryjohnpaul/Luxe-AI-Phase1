/**
 * Entertainment Signals — Bollywood, OTT, Award Shows, Fashion Weeks
 * Detects: Movie releases, Netflix/Prime drops, award shows, fashion weeks
 * Source: TMDB API (free) + static calendar
 * Cost: FREE
 */

import { Signal, signalId, expiresIn } from "./types";

// Major Bollywood/entertainment events that drive fashion
const ENTERTAINMENT_CALENDAR_2026 = [
  // Award Shows
  { name: "Filmfare Awards 2026", date: "2026-02-15", type: "award_show", impact: "Red carpet looks drive 'get the look' searches for 1 week", fashionTrigger: "Red carpet inspired: gowns, blazers, statement accessories" },
  { name: "IIFA Awards 2026", date: "2026-06-20", type: "award_show", impact: "Biggest Bollywood fashion moment. Celebrity outfits go viral.", fashionTrigger: "Celebrity-inspired outfits, designer replicas, party wear" },
  { name: "Met Gala 2026", date: "2026-05-04", type: "award_show", impact: "Global fashion moment. Indian celebs attending drive Indian searches.", fashionTrigger: "Avant-garde fashion, high fashion inspiration, statement pieces" },
  { name: "Oscars 2026", date: "2026-03-15", type: "award_show", impact: "Global red carpet. If Indian film nominated, massive spike.", fashionTrigger: "Black tie, formal luxury, evening wear" },

  // Fashion Weeks
  { name: "Lakme Fashion Week (Mumbai)", date: "2026-03-12", type: "fashion_week", impact: "Defines Indian fashion trends for the season", fashionTrigger: "New trends, designer collaborations, seasonal must-haves" },
  { name: "FDCI India Couture Week (Delhi)", date: "2026-07-22", type: "fashion_week", impact: "Bridal and couture fashion", fashionTrigger: "Wedding fashion, ethnic luxury, couture inspiration" },
  { name: "Milan Fashion Week", date: "2026-09-22", type: "fashion_week", impact: "Hugo Boss, Diesel, Versace, Prada showcase — our brands!", fashionTrigger: "Next season preview. Whatever shown on runway = what to stock." },
  { name: "Paris Fashion Week", date: "2026-09-28", type: "fashion_week", impact: "Ami Paris, Kenzo, Jacquemus showcase", fashionTrigger: "French luxury trends, Ami Paris and Kenzo new collections" },

  // Major OTT releases known to drive fashion
  { name: "Made in Heaven Season 3 (expected)", date: "2026-06-01", type: "ott_release", impact: "Wedding fashion bible for Indian audience. Every outfit gets searched.", fashionTrigger: "Wedding guest fashion, ethnic luxury, designer wear, statement jewelry" },
  { name: "Fabulous Lives vs Bollywood Wives S3 (expected)", date: "2026-09-01", type: "ott_release", impact: "Luxury lifestyle aspiration. Every brand shown gets a demand spike.", fashionTrigger: "Luxury brands shown on screen, designer bags, premium lifestyle" },
  { name: "Emily in Paris Season 5 (expected)", date: "2026-10-01", type: "ott_release", impact: "Drives French fashion searches globally. Ami Paris, Kenzo beneficiaries.", fashionTrigger: "Parisian fashion aesthetic, bold colors, French luxury brands" },

  // Music Festivals
  { name: "NH7 Weekender", date: "2026-12-05", type: "music_festival", impact: "Festival fashion for young audience", fashionTrigger: "Festival fashion: streetwear, boho luxury, sunglasses, boots" },
  { name: "Lollapalooza India", date: "2026-01-25", type: "music_festival", impact: "Urban youth fashion moment", fashionTrigger: "Concert outfits, streetwear luxury, statement pieces" },
  { name: "Sunburn Festival", date: "2026-12-28", type: "music_festival", impact: "EDM festival fashion", fashionTrigger: "Party wear, rave-inspired, bold accessories, sunglasses" },
];

async function fetchBollywoodReleases(): Promise<any[]> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return [];

  try {
    const today = new Date().toISOString().split("T")[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const resp = await fetch(
      `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&region=IN&with_original_language=hi&primary_release_date.gte=${today}&primary_release_date.lte=${nextMonth}&sort_by=popularity.desc`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!resp.ok) return [];
    const data = await resp.json();
    return data.results?.slice(0, 5) || [];
  } catch {
    return [];
  }
}

export async function getEntertainmentSignals(): Promise<Signal[]> {
  const today = new Date();
  const signals: Signal[] = [];

  // === CALENDAR-BASED ENTERTAINMENT EVENTS ===
  for (const event of ENTERTAINMENT_CALENDAR_2026) {
    const eventDate = new Date(event.date);
    const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const daysSince = Math.ceil((today.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));

    // Pre-event signal
    if (daysUntil > 0 && daysUntil <= 14) {
      signals.push({
        id: signalId("entertainment", event.name.toLowerCase().replace(/\s+/g, "-")),
        type: event.type === "ott_release" ? "ott_release" : "entertainment",
        source: "entertainment-calendar",
        title: `${event.name} in ${daysUntil} days`,
        description: `${event.impact}`,
        location: event.type === "fashion_week" ? "Fashion industry" : "Pan India",
        severity: daysUntil <= 3 ? "high" : "medium",
        triggersWhat: event.fashionTrigger,
        targetArchetypes: ["Fashion Loyalist", "Urban Achiever"],
        suggestedBrands: event.name.includes("Milan") ? ["Hugo Boss", "Diesel", "Versace", "Prada"] :
                         event.name.includes("Paris") ? ["Ami Paris", "Kenzo", "Jacquemus"] :
                         ["All brands"],
        suggestedAction: `${event.name} in ${daysUntil} days. Prepare related campaign. Push: ${event.fashionTrigger}`,
        confidence: 0.85,
        expiresAt: eventDate,
        data: event,
        detectedAt: today,
      });
    }

    // Post-event signal (1 week after — "get the look" window)
    if (daysSince > 0 && daysSince <= 7) {
      signals.push({
        id: signalId("entertainment-post", event.name.toLowerCase().replace(/\s+/g, "-")),
        type: "entertainment",
        source: "entertainment-calendar",
        title: `Post ${event.name} — "Get the Look" window`,
        description: `${event.name} happened ${daysSince} days ago. Audience searching for similar styles. Capitalize on the buzz.`,
        location: "Pan India",
        severity: daysSince <= 3 ? "high" : "medium",
        triggersWhat: event.fashionTrigger,
        targetArchetypes: ["Fashion Loyalist", "Aspirant"],
        suggestedBrands: ["All relevant brands"],
        suggestedAction: `Create "Get the Look" content inspired by ${event.name}. Push similar styles from our catalog.`,
        confidence: 0.75,
        expiresAt: expiresIn(168),
        data: { event, daysSince },
        detectedAt: today,
      });
    }
  }

  // === TMDB: Upcoming Bollywood releases ===
  const movies = await fetchBollywoodReleases();
  for (const movie of movies) {
    const releaseDate = new Date(movie.release_date);
    const daysUntil = Math.ceil((releaseDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil > 0 && daysUntil <= 14) {
      signals.push({
        id: signalId("bollywood", `movie-${movie.id}`),
        type: "entertainment",
        source: "tmdb-api",
        title: `Bollywood release: "${movie.title}" in ${daysUntil} days`,
        description: `Upcoming Bollywood movie. Lead actors' fashion choices will influence searches. Monitor for celebrity outfit moments post-release.`,
        location: "Pan India",
        severity: "low",
        triggersWhat: "Styles worn by lead actors, movie-inspired fashion",
        targetArchetypes: ["Fashion Loyalist", "Aspirant"],
        suggestedBrands: ["Diesel", "Kenzo", "Hugo Boss"],
        suggestedAction: `Monitor "${movie.title}" lead actors' outfits post-release. Prepare 'as seen in' content if brand alignment exists.`,
        confidence: 0.50,
        expiresAt: new Date(releaseDate.getTime() + 14 * 24 * 60 * 60 * 1000),
        data: movie,
        detectedAt: today,
      });
    }
  }

  return signals;
}
