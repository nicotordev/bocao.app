export function resolveIntlLocale(locale?: string): string {
  return locale === "es" ? "es-CL" : "en-US";
}

export function elapsedMinutesSince(date: Date): number {
  return Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000));
}

export function formatTimeInTimezone(
  date: Date,
  timezone: string,
  locale?: string,
): string {
  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).format(date);
}

export function formatMediumDateInTimezone(
  date: Date,
  timezone: string,
  locale?: string,
): string {
  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    dateStyle: "medium",
    timeZone: timezone,
  }).format(date);
}

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

function getHourInTimezone(date: Date, timezone: string) {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    }).format(date),
  );
}

export function dateInputToUtcStart(dateStr: string, timezone: string): Date {
  const [year, month, day] = dateStr.split("-").map((part) => Number(part));
  let utcMs = Date.UTC(year, month - 1, day, 0, 0, 0, 0);

  while (utcMs < Date.UTC(year, month - 1, day + 2, 0, 0, 0, 0)) {
    const candidate = new Date(utcMs);

    if (
      formatDateInputValue(candidate, timezone) === dateStr &&
      getHourInTimezone(candidate, timezone) === 0
    ) {
      return candidate;
    }

    utcMs += 15 * 60 * 1000;
  }

  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

export function dateInputToUtcEnd(dateStr: string, timezone: string): Date {
  const start = dateInputToUtcStart(dateStr, timezone);
  const nextDay = formatDateInputValue(
    new Date(start.getTime() + 36 * 60 * 60 * 1000),
    timezone,
  );

  return new Date(dateInputToUtcStart(nextDay, timezone).getTime() - 1);
}
