export type LocalDate = `${number}-${number}-${number}`;

const VENUE_TIME_ZONE = 'America/Los_Angeles';

type DateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function getZonedParts(date: Date): DateTimeParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: VENUE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? '0');
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour') % 24, minute: get('minute'), second: get('second') };
}

export function formatVenueDateTime(iso: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: VENUE_TIME_ZONE,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(typeof iso === 'string' ? new Date(iso) : iso).replace(',', '');
}

export function formatVenueTime(iso: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: VENUE_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
  }).format(typeof iso === 'string' ? new Date(iso) : iso);
}

export function eventLocalTime(iso: string): string {
  const parts = getZonedParts(new Date(iso));
  return `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
}

export function formatVenueMonth(date: LocalDate): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date.slice(0, 7)}-01T12:00:00Z`));
}

export function getVenueToday(now: Date = new Date()): LocalDate {
  const parts = getZonedParts(now);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}` as LocalDate;
}

export function localDateToVenueDate(date: string, hour = 20, minute = 0, second = 0): Date {
  const [year, month, day] = date.split('-').map(Number);
  const desiredUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  let instant = new Date(desiredUtc);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const actual = getZonedParts(instant);
    const actualAsUtc = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second);
    const delta = desiredUtc - actualAsUtc;
    if (delta === 0) return instant;
    instant = new Date(instant.getTime() + delta);
  }

  return instant;
}

export function eventLocalDate(iso: string): LocalDate {
  return getVenueToday(new Date(iso));
}

export function addDays(date: LocalDate, days: number): LocalDate {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10) as LocalDate;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function addMonthsClamped(date: LocalDate, months: number): LocalDate {
  const [year, month, day] = date.split('-').map(Number);
  const targetMonthIndex = year * 12 + (month - 1) + months;
  const targetYear = Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12 + 1;
  const targetDay = Math.min(day, daysInMonth(targetYear, targetMonth));
  return `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}` as LocalDate;
}
