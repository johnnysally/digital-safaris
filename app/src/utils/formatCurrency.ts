export const formatCurrency = (amount: number, currency = "KES") => {
  const value = Number(amount);
  if (Number.isNaN(value)) return "";
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export default formatCurrency;