export const CURRENT_GRADE10_SCHOOL_YEAR = 2027;
export const RECENT_GRADE10_YEAR_COUNT = 3;

export function toLatestGrade10Year(rawYear: unknown): number {
  const parsed = Number(rawYear);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : CURRENT_GRADE10_SCHOOL_YEAR;
}

export function getRecentGrade10StartYear(latestYear: number): number {
  return latestYear - RECENT_GRADE10_YEAR_COUNT + 1;
}
