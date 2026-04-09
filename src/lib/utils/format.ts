export function formatInr(amount: number): string {
  if (amount >= 10000000) return `INR ${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `INR ${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `INR ${(amount / 1000).toFixed(1)}K`;
  return `INR ${amount.toLocaleString("en-IN")}`;
}

export function formatNumber(num: number): string {
  if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString("en-IN");
}

export function formatPercent(num: number, decimals = 1): string {
  return `${num >= 0 ? "+" : ""}${num.toFixed(decimals)}%`;
}

export function formatRoas(roas: number): string {
  return `${roas.toFixed(1)}x`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function timeAgo(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hr ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(date);
}

export function microsToInr(micros: number | bigint): number {
  return Number(micros) / 1_000_000;
}

export function inrToMicros(inr: number): number {
  return Math.round(inr * 1_000_000);
}

// Convert Meta budget (in paise/cents) to INR
export function metaBudgetToInr(budget: string | number): number {
  return Number(budget) / 100;
}

export function inrToMetaBudget(inr: number): number {
  return Math.round(inr * 100);
}
