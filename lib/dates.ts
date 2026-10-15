/**
 * Date helpers.
 *
 * Bondhu Circle only operates in Dhaka, so every date is rendered in
 * `Asia/Dhaka` regardless of where the server runs or which timezone the
 * reader is in — a meetup at 5pm must read as 5pm. `Intl` does the work
 * (including Bengali numerals for `bn`), which keeps this isomorphic: the
 * same helpers are safe in Server and Client Components.
 */

const TIME_ZONE = "Asia/Dhaka";

function formatter(locale: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", {
    timeZone: TIME_ZONE,
    ...options,
  });
}

/** "Sun 3 Nov · 17:00" */
export function formatDateTime(date: Date, locale: string): string {
  const day = formatter(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
  const time = formatter(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
  return `${day} · ${time}`;
}

/** "Sun 3 Nov" */
export function formatDate(date: Date, locale: string): string {
  return formatter(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

/** "3 Nov, 17:00" */
export function formatDayTime(date: Date, locale: string): string {
  const day = formatter(locale, { day: "numeric", month: "short" }).format(date);
  const time = formatter(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
  return `${day}, ${time}`;
}

/** "3 November 2026" */
export function formatFullDate(date: Date, locale: string): string {
  return formatter(locale, { day: "numeric", month: "long", year: "numeric" }).format(date);
}

/** `<input type="date">` value for a moment, in Dhaka time. Always ASCII. */
export function toDateInputValue(date: Date): string {
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return iso;
}

/** `<input type="time">` value for a moment, in Dhaka time. Always ASCII. */
export function toTimeInputValue(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

/** Both form-input values for an activity's date and time. */
export function toDhakaInputValues(date: Date): { date: string; time: string } {
  return { date: toDateInputValue(date), time: toTimeInputValue(date) };
}
