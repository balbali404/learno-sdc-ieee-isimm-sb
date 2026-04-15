export const sanitizeCount = (value: number | null | undefined): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.round(value));
};

export const formatBadgeCount = (value: number, limit = 99): string => {
  const safeValue = sanitizeCount(value);

  if (safeValue > limit) {
    return `${limit}+`;
  }

  return String(safeValue);
};
