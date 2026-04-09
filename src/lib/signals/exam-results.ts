/**
 * Academic / Exam Results Calendar
 * When results come out, parents reward kids, students celebrate
 * Source: Static calendar
 * Cost: FREE
 */

import { Signal, signalId, expiresIn } from "./types";

const EXAM_EVENTS_2026 = [
  { name: "CBSE Class 10 Results", expectedDate: "2026-05-15", impact: "Parents reward children. Celebration shopping.", audience: "Parents of teenagers", regions: ["Pan India"] },
  { name: "CBSE Class 12 Results", expectedDate: "2026-05-20", impact: "Major milestone. Students + parents shop for college wardrobe.", audience: "18-year-olds + parents", regions: ["Pan India"] },
  { name: "ICSE/ISC Results", expectedDate: "2026-05-10", impact: "Premium school board — typically more affluent families.", audience: "Affluent families", regions: ["Pan India"] },
  { name: "JEE Main Results", expectedDate: "2026-04-25", impact: "IIT aspirants celebrate. Moving to new city = new wardrobe.", audience: "17-19 year olds, parents", regions: ["Pan India, especially Kota, Delhi, Hyderabad"] },
  { name: "NEET Results", expectedDate: "2026-06-15", impact: "Medical aspirants. Affluent families. Celebration + college prep.", audience: "17-19 year olds, affluent parents", regions: ["Pan India, South India especially"] },
  { name: "CAT Results / IIM Admissions", expectedDate: "2026-01-25", impact: "MBA admits from top IIMs. Professional wardrobe needed.", audience: "22-25 year olds", regions: ["Pan India"] },
  { name: "UPSC Results", expectedDate: "2026-04-15", impact: "Elite achievement. Celebration + professional wardrobe for IAS/IPS.", audience: "23-30 year olds", regions: ["Delhi, UP, Bihar, Rajasthan"] },
  { name: "University Convocations", expectedDate: "2026-06-01", impact: "Graduation season. Formal wear for convocation ceremony.", audience: "21-25 year olds + families", regions: ["Pan India"] },
  { name: "School Reopening", expectedDate: "2026-06-15", impact: "Parents refresh their own wardrobe along with kids'.", audience: "Parents 30-45", regions: ["Pan India"] },
  { name: "College Freshers Season", expectedDate: "2026-08-01", impact: "First week in college. Students want to make impression. Biggest youth fashion moment.", audience: "18-22 year olds", regions: ["Delhi (DU), Mumbai, Bangalore, Pune, Chennai"] },
];

export function getExamResultSignals(): Signal[] {
  const today = new Date();
  const signals: Signal[] = [];

  for (const exam of EXAM_EVENTS_2026) {
    const examDate = new Date(exam.expectedDate);
    const daysUntil = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const daysSince = Math.ceil((today.getTime() - examDate.getTime()) / (1000 * 60 * 60 * 24));

    // Pre-event: results about to come out
    if (daysUntil > 0 && daysUntil <= 7) {
      signals.push({
        id: signalId("exam-pre", exam.name.toLowerCase().replace(/\s+/g, "-")),
        type: "exam_results",
        source: "academic-calendar",
        title: `${exam.name} expected in ${daysUntil} days`,
        description: `${exam.impact} Target: ${exam.audience}. Prepare celebration + reward campaigns.`,
        location: exam.regions.join(", "),
        severity: daysUntil <= 2 ? "high" : "medium",
        triggersWhat: "Celebration outfits, reward shopping, gifting from parents",
        targetArchetypes: ["Aspirant", "Occasional Splurger"],
        suggestedBrands: ["Diesel", "All Saints", "Hugo Boss", "Coach"],
        suggestedAction: `Prepare "${exam.name} celebration" campaign. Target ${exam.audience}. Have gifting + reward messaging ready.`,
        confidence: 0.70,
        expiresAt: examDate,
        data: exam,
        detectedAt: today,
      });
    }

    // Post-results: celebration shopping window (5 days)
    if (daysSince > 0 && daysSince <= 5) {
      signals.push({
        id: signalId("exam-post", exam.name.toLowerCase().replace(/\s+/g, "-")),
        type: "exam_results",
        source: "academic-calendar",
        title: `${exam.name} just announced — celebration shopping window`,
        description: `Results came out ${daysSince} day(s) ago. ${exam.impact} Active shopping window for rewards and celebration.`,
        location: exam.regions.join(", "),
        severity: daysSince <= 2 ? "high" : "medium",
        triggersWhat: "Celebration wear, reward gifts, college-prep wardrobe, party outfits",
        targetArchetypes: ["Aspirant", "Occasional Splurger"],
        suggestedBrands: ["Diesel", "Hugo Boss", "All Saints", "Coach", "Michael Kors"],
        suggestedAction: `Launch celebration campaign NOW. "Congratulations! Celebrate with style." Target parents (gifting) and students (self-reward).`,
        confidence: 0.75,
        expiresAt: expiresIn(120),
        data: { ...exam, daysSince },
        detectedAt: today,
      });
    }
  }

  return signals;
}
