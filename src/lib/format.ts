export function formatNGN(amount: number): string {
  if (!Number.isFinite(amount)) return "₦0";
  try {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
  } catch {
    return "₦" + amount.toLocaleString();
  }
}
