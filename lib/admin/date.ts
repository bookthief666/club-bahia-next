export type LocalDate = `${number}-${number}-${number}`;

export function getVenueToday(now: Date = new Date()): LocalDate {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}` as LocalDate;
}

export function localDateToVenueDate(date: string, hour = 20): Date {
  // Los Angeles is UTC-7/-8; noon/evening avoids date rollover for tests and fixture defaults.
  return new Date(`${date}T${String(hour).padStart(2, '0')}:00:00-07:00`);
}

export function eventLocalDate(iso: string): LocalDate {
  return getVenueToday(new Date(iso));
}

export function addDays(date: LocalDate, days: number): LocalDate {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10) as LocalDate;
}
