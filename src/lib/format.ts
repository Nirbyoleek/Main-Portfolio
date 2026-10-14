// Small helpers for dates and durations shown on the page.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const parse = (ym: string | null | undefined): { y: number; m: number } => {
  if (!ym) {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() + 1 };
  }
  const [y, m] = ym.split("-").map(Number);
  return { y, m };
};

/** "2024-08" → "Aug 2024"; null → "Present". */
export const monthLabel = (ym: string | null): string => {
  if (!ym) return "Present";
  const { y, m } = parse(ym);
  return `${MONTHS[m - 1]} ${y}`;
};

/** Whole months from start to end, counting both ends. */
export const monthsBetween = (start: string, end: string | null): number => {
  const a = parse(start);
  const b = parse(end);
  return Math.max(1, (b.y - a.y) * 12 + (b.m - a.m) + 1);
};

/** 27 → "2 yrs 3 mos" */
export const durationLabel = (months: number): string => {
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts: string[] = [];
  if (y) parts.push(`${y} yr${y > 1 ? "s" : ""}`);
  if (m) parts.push(`${m} mo${m > 1 ? "s" : ""}`);
  return parts.join(" ") || "1 mo";
};

/** Total months across roles, without double-counting overlaps. */
export const totalMonths = (roles: { start: string; end: string | null }[]): number => {
  const seen = new Set<number>();
  roles.forEach((r) => {
    const a = parse(r.start);
    const n = monthsBetween(r.start, r.end);
    for (let i = 0; i < n; i++) {
      const idx = a.y * 12 + (a.m - 1) + i;
      seen.add(idx);
    }
  });
  return seen.size;
};
