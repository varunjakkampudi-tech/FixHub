import type { Category, DemoState } from "./demo-model";

type AvailabilityState = Pick<DemoState, "bookings" | "merchants">;

export function eligibleMerchants(
  state: AvailabilityState,
  cityId: string,
  category: Category,
  date: string,
) {
  const dateValue = new Date(`${date}T12:00:00`);
  if (!Number.isFinite(dateValue.getTime())) return [];

  const activeByMerchant = new Map<string, number>();
  for (const booking of state.bookings) {
    if (
      !booking.merchantId ||
      ["complete", "cancelled", "expired", "disputed"].includes(booking.status)
    ) continue;
    activeByMerchant.set(booking.merchantId, (activeByMerchant.get(booking.merchantId) ?? 0) + 1);
  }

  const weekday = dateValue.getDay();
  return state.merchants.filter(
    (merchant) => merchant.skills.includes(category)
      && (merchant.cityIds ?? ["tanuku"]).includes(cityId)
      && merchant.status === "active"
      && (merchant.verification ?? "approved") === "approved"
      && merchant.capacity > (activeByMerchant.get(merchant.id) ?? 0)
      && (merchant.workDays ?? [0, 1, 2, 3, 4, 5, 6]).includes(weekday)
      && !(merchant.blackouts ?? []).includes(date),
  );
}
