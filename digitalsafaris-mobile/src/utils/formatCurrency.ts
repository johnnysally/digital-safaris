export const formatCurrency = (amount: number, currency = 'KES') => {
  const value = Number(amount);
  if (Number.isNaN(value)) return '';
  try {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
};

export default formatCurrency;