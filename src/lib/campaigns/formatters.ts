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
