export const CLUB_BAHIA_TIME_ZONE = 'America/Los_Angeles';

interface WallClockParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function integerPart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): number {
  const value = Number(parts.find((part) => part.type === type)?.value);
  if (!Number.isInteger(value)) {
    throw new Error(`Could not read ${type} from the venue time.`);
  }
  return value;
}

function wallClockParts(date: Date, timeZone: string): WallClockParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  return {
    year: integerPart(parts, 'year'),
    month: integerPart(parts, 'month'),
    day: integerPart(parts, 'day'),
    hour: integerPart(parts, 'hour'),
    minute: integerPart(parts, 'minute'),
  };
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function parseVenueInput(value: string): WallClockParts | null {
  const match = value
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const parsed = {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
  };
  if (
    parsed.month < 1 ||
    parsed.month > 12 ||
    parsed.day < 1 ||
    parsed.day > 31 ||
    parsed.hour < 0 ||
    parsed.hour > 23 ||
    parsed.minute < 0 ||
    parsed.minute > 59
  ) {
    return null;
  }
  return parsed;
}

function sameWallClock(left: WallClockParts, right: WallClockParts): boolean {
  return (
    left.year === right.year &&
    left.month === right.month &&
    left.day === right.day &&
    left.hour === right.hour &&
    left.minute === right.minute
  );
}

export function formatUtcForVenueInput(
  value: string | undefined,
  timeZone = CLUB_BAHIA_TIME_ZONE,
): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = wallClockParts(date, timeZone);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function venueInputToUtc(
  value: string,
  timeZone = CLUB_BAHIA_TIME_ZONE,
): string | undefined {
  const desired = parseVenueInput(value);
  if (!desired) return undefined;

  const desiredAsUtc = Date.UTC(
    desired.year,
    desired.month - 1,
    desired.day,
    desired.hour,
    desired.minute,
  );
  let candidate = desiredAsUtc;

  for (let iteration = 0; iteration < 4; iteration += 1) {
    const observed = wallClockParts(new Date(candidate), timeZone);
    const observedAsUtc = Date.UTC(
      observed.year,
      observed.month - 1,
      observed.day,
      observed.hour,
      observed.minute,
    );
    const correction = desiredAsUtc - observedAsUtc;
    candidate += correction;
    if (correction === 0) break;
  }

  const finalDate = new Date(candidate);
  if (!sameWallClock(wallClockParts(finalDate, timeZone), desired)) {
    return undefined;
  }
  return finalDate.toISOString();
}
