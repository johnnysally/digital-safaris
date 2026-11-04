export const formatNumber = (n: number | string): string => {
  const v = Number(n);
  if (Number.isNaN(v)) return '0';
  try {
    return new Intl.NumberFormat('en-KE').format(v);
  } catch {
    return String(v);
  }
};

export const formatCompact = (n: number | string): string => {
  const v = Number(n);
  if (Number.isNaN(v)) return '0';
  try {
    return new Intl.NumberFormat('en-KE', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(v);
  } catch {
    return String(v);
  }
};

export default formatNumber;