export const fmtINR = (v: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(v);

export const fmtNum = (v: number) =>
  new Intl.NumberFormat("en-IN").format(Math.round(v));

export const fmtPct = (v: number) => `${v.toFixed(2)}%`;

export const fmtROAS = (v: number) => (v > 0 ? `${v.toFixed(1)}x` : "--");

export const safe = (v: unknown): number => {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(v);
  return isNaN(n) || !isFinite(n) ? 0 : n;
};

const STRIP_PREFIXES = [
  "luxe_", "bau_", "meta_", "prosp_", "retarget_", "test_",
  "old_", "seasonal_", "asc_",
];

const MONTH_MAP: Record<string, string> = {
  jan: "Jan", feb: "Feb", mar: "Mar", apr: "Apr",
  may: "May", jun: "Jun", june: "Jun", jul: "Jul", july: "Jul",
  aug: "Aug", sep: "Sep", oct: "Oct", nov: "Nov", dec: "Dec",
};

export function humanizeCampaignName(raw: string): string {
  if (!raw) return "--";
  let name = raw.toLowerCase();

  // Strip known prefixes
  for (const prefix of STRIP_PREFIXES) {
    if (name.startsWith(prefix)) name = name.slice(prefix.length);
  }
  // Strip secondary prefixes after first pass
  for (const prefix of STRIP_PREFIXES) {
    if (name.startsWith(prefix)) name = name.slice(prefix.length);
  }

  // Split by underscores
  const parts = name.split("_").filter(Boolean);

  // Extract date suffix (e.g., "apr26", "june25")
  let dateSuffix = "";
  if (parts.length > 1) {
    const last = parts[parts.length - 1];
    const monthMatch = last.match(/^([a-z]+)(\d{2})$/);
    if (monthMatch && MONTH_MAP[monthMatch[1]]) {
      dateSuffix = `${MONTH_MAP[monthMatch[1]]} '${monthMatch[2]}`;
      parts.pop();
    }
  }

  // Title case each word
  const titleCased = parts.map((w) => {
    // Keep known acronyms uppercase
    if (["dpa", "ios", "asc", "ugc", "pmax"].includes(w)) return w.toUpperCase();
    if (w === "1pct") return "1%";
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(" ");

  return dateSuffix ? `${titleCased} — ${dateSuffix}` : titleCased;
}
