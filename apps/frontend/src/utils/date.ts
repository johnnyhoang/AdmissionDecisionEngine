export const CURRENT_GRADE10_SCHOOL_YEAR = 2026;
export const RECENT_GRADE10_YEAR_COUNT = 3;

export const getCurrentSchoolYear = (): number => {
  return CURRENT_GRADE10_SCHOOL_YEAR;
};

export const formatSchoolYear = (startYear: number | string | undefined | null): string => {
  if (!startYear) return 'N/A';
  if (typeof startYear === 'string' && startYear.includes('-')) return startYear;
  const y = parseInt(startYear as string, 10);
  if (isNaN(y)) return startYear as string;
  return `${y}-${y + 1}`;
};

export const getRecentSchoolYears = (count: number = RECENT_GRADE10_YEAR_COUNT): number[] => {
  const currentYear = getCurrentSchoolYear();
  const years: number[] = [];
  for (let i = 0; i < count; i++) {
    years.push(currentYear - i);
  }
  return years;
};
