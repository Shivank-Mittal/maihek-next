import type { IRestaurantStatus, ITimeWindow } from "@/models/restaurant-status";

function isInWindow(currentMinutes: number, window: ITimeWindow): boolean {
  const [openH, openM] = window.open.split(":").map(Number);
  const [closeH, closeM] = window.close.split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (openMinutes <= closeMinutes) {
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  } else {
    // Midnight-spanning window
    return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
  }
}

/**
 * Computes whether the restaurant is currently open.
 * In schedule mode, open if current time falls inside ANY of the configured windows.
 */
const DEFAULT_WINDOWS = [
  { open: "11:45", close: "14:15" },
  { open: "18:30", close: "22:30" },
];

export function computeEffectiveIsOpen(
  doc: Pick<IRestaurantStatus, "useSchedule" | "manualIsOpen" | "windows">
): boolean {
  if (!doc.useSchedule) {
    return doc.manualIsOpen;
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const windows = doc.windows?.length ? doc.windows : DEFAULT_WINDOWS;

  return windows.some((w) => isInWindow(currentMinutes, w));
}
