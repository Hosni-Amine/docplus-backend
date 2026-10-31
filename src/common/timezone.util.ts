/** Weekday keys matching office.workingHours. */
export const WEEKDAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

export type ZonedDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekdayKey: WeekdayKey;
  dateKey: string;
};

const WEEKDAY_SHORT_TO_KEY: Record<string, WeekdayKey> = {
  Sun: 'sunday',
  Mon: 'monday',
  Tue: 'tuesday',
  Wed: 'wednesday',
  Thu: 'thursday',
  Fri: 'friday',
  Sat: 'saturday',
};

/** True when `timeZone` is a valid IANA name (e.g. Europe/Paris). */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** Prefer office timezone; fall back to APP_TIMEZONE / Europe/Paris. */
export function resolveTimeZone(
  candidate: string | null | undefined,
  fallback = 'Europe/Paris',
): string {
  if (candidate && isValidTimeZone(candidate.trim())) {
    return candidate.trim();
  }
  if (fallback && isValidTimeZone(fallback)) {
    return fallback;
  }
  return 'Europe/Paris';
}

/** Read calendar / clock parts of an instant in a given IANA timezone. */
export function getZonedParts(
  date: Date,
  timeZone: string,
): ZonedDateTimeParts {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    weekday: 'short',
  });
  const parts = Object.fromEntries(
    dtf
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;

  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  const hour = Number(parts.hour === '24' ? '0' : parts.hour);
  const minute = Number(parts.minute);
  const weekdayKey = WEEKDAY_SHORT_TO_KEY[parts.weekday] ?? 'monday';
  const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return { year, month, day, hour, minute, weekdayKey, dateKey };
}

/**
 * Convert a wall-clock date/time in `timeZone` to a UTC Date.
 */
export function wallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const asLocal = getZonedParts(new Date(utcGuess), timeZone);
  const asLocalMs = Date.UTC(
    asLocal.year,
    asLocal.month - 1,
    asLocal.day,
    asLocal.hour,
    asLocal.minute,
    0,
  );
  const offset = asLocalMs - utcGuess;
  return new Date(utcGuess - offset);
}

/** UTC bounds for a calendar day in `timeZone` (inclusive start, exclusive end). */
export function zonedDayRange(
  year: number,
  month: number,
  day: number,
  timeZone: string,
): { start: Date; end: Date } {
  const start = wallTimeToUtc(year, month, day, 0, 0, timeZone);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  const end = wallTimeToUtc(
    next.getUTCFullYear(),
    next.getUTCMonth() + 1,
    next.getUTCDate(),
    0,
    0,
    timeZone,
  );
  return { start, end };
}

/** Parse "HH:mm" → { hour, minute }. */
export function parseHm(
  value?: string | null,
): { hour: number; minute: number } | null {
  if (!value) {
    return null;
  }
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }
  return { hour, minute };
}

/** Subtract one hour from HH:mm (wraps at midnight). */
export function subtractOneHour(
  hour: number,
  minute: number,
): { hour: number; minute: number } {
  if (hour === 0) {
    return { hour: 23, minute };
  }
  return { hour: hour - 1, minute };
}

export function formatHm(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
