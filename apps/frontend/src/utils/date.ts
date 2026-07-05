export const CURRENT_GRADE10_SCHOOL_YEAR = 2027;
export const RECENT_GRADE10_YEAR_COUNT = 3;

export const getCurrentSchoolYear = (): number => {
  return CURRENT_GRADE10_SCHOOL_YEAR;
};

export const formatSchoolYear = (endYear: number | string | undefined | null): string => {
  if (!endYear) return 'N/A';
  if (typeof endYear === 'string' && endYear.includes('-')) return endYear;
  const y = parseInt(endYear as string, 10);
  if (isNaN(y)) return endYear as string;
  return `${y - 1}-${y}`;
};

export const getRecentSchoolYears = (count: number = RECENT_GRADE10_YEAR_COUNT): number[] => {
  const currentYear = getCurrentSchoolYear();
  const years: number[] = [];
  for (let i = 0; i < count; i++) {
    years.push(currentYear - i);
  }
  return years;
};
