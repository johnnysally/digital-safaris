export function formatCurrency(
  amount: number | null | undefined,
  currency = "KES"
): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return `${currency} 0`;
  }
  const formatted = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return formatted;
}

export function formatAmount(
  amount: number | null | undefined,
  currency = "KES"
): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return "0";
  }
  return `${currency} ${new Intl.NumberFormat("en-KE").format(amount)}`;
}

export default formatCurrency;