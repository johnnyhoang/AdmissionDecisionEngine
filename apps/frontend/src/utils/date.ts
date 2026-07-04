export const getCurrentSchoolYear = (): number => {
  const now = new Date();
  const month = now.getMonth(); // 0 = Jan, 8 = Sep
  const year = now.getFullYear();
  
  // School year starts from September. If month < September (8), it belongs to previous year's term.
  return month >= 8 ? year : year - 1;
};

export const formatSchoolYear = (startYear: number | string | undefined | null): string => {
  if (!startYear) return 'N/A';
  const y = parseInt(startYear as string, 10);
  if (isNaN(y)) return startYear as string;
  return `${y}-${y + 1}`;
};

export const getRecentSchoolYears = (count: number = 4): number[] => {
  const currentYear = getCurrentSchoolYear();
  const years: number[] = [];
  for (let i = 0; i < count; i++) {
    years.push(currentYear - i);
  }
  return years;
};
