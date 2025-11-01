export type Frequency = "weekly" | "monthly" | "yearly";

export type PaymentMethod = "Credit" | "Debit" | "Cash" | "Pix";

export const PAYMENT_METHOD_OPTIONS: PaymentMethod[] = [
  "Credit",
  "Debit",
  "Cash",
  "Pix",
];

export const CREDIT_PAYMENT_METHOD: PaymentMethod = "Credit";

export const requiresAccountSelection = (
  paymentMethod: PaymentMethod | "" | null | undefined
) => paymentMethod === CREDIT_PAYMENT_METHOD;

export const calculateNextDueDate = (
  startDate: string,
  frequency: Frequency
): string => {
  if (!startDate) return "";

  const date = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";

  const next = new Date(date);

  switch (frequency) {
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      break;
  }

  return next.toISOString().split("T")[0];
};

export const toStartOfDayISOString = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
};
