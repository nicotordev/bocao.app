export function formatDateInputValue(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getTodayDateInputValue(timezone: string): string {
  return formatDateInputValue(new Date(), timezone);
}

export function createDefaultOrdersDateRange(timezone: string) {
  const today = getTodayDateInputValue(timezone);

  return {
    from: today,
    to: today,
  };
}

export function isOrdersDefaultDateRange(
  from: string,
  to: string,
  timezone: string,
): boolean {
  const today = getTodayDateInputValue(timezone);
  return from === today && to === today;
}
