function pad(value: number) {
  return String(value).padStart(2, "0");
}

const DEFAULT_BUSINESS_TIME_ZONE = "Pacific/Auckland";

function resolveBusinessTimeZone() {
  const configuredTimeZone = process.env.NEXT_PUBLIC_APP_TIME_ZONE?.trim();

  if (!configuredTimeZone) {
    return DEFAULT_BUSINESS_TIME_ZONE;
  }

  try {
    new Intl.DateTimeFormat("en-CA", {
      timeZone: configuredTimeZone,
    }).format(new Date(0));

    return configuredTimeZone;
  } catch {
    return DEFAULT_BUSINESS_TIME_ZONE;
  }
}

export const BUSINESS_TIME_ZONE = resolveBusinessTimeZone();

const zonedDateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

type ZonedDateParts = {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getZonedDateParts(date: Date): ZonedDateParts {
  const parts = zonedDateTimeFormatter.formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, Number(value)]),
  ) as Record<string, number>;

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hours: values.hour,
    minutes: values.minute,
    seconds: values.second,
  };
}

function getTimeZoneOffsetMilliseconds(date: Date) {
  const parts = getZonedDateParts(date);

  return (
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hours,
      parts.minutes,
      parts.seconds,
      0,
    ) - date.getTime()
  );
}

function matchesRequestedLocalDateTime(
  date: Date,
  requested: Omit<ZonedDateParts, "seconds">,
) {
  const parts = getZonedDateParts(date);

  return (
    parts.year === requested.year &&
    parts.month === requested.month &&
    parts.day === requested.day &&
    parts.hours === requested.hours &&
    parts.minutes === requested.minutes
  );
}

export function startOfCurrentMinute(date: Date) {
  const currentMinute = new Date(date);
  currentMinute.setSeconds(0, 0);
  return currentMinute;
}

export function parseLocalDateAndTime(dateValue: string, timeValue: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return null;
  }

  if (!/^\d{2}:\d{2}$/.test(timeValue)) {
    return null;
  }

  const [year, month, day] = dateValue.split("-").map(Number);
  const [hours, minutes] = timeValue.split(":").map(Number);
  const requestedDateTime = {
    year,
    month,
    day,
    hours,
    minutes,
  };
  const utcGuess = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);
  const initialOffset = getTimeZoneOffsetMilliseconds(new Date(utcGuess));
  let parsedDate = new Date(utcGuess - initialOffset);
  const resolvedOffset = getTimeZoneOffsetMilliseconds(parsedDate);

  if (resolvedOffset !== initialOffset) {
    parsedDate = new Date(utcGuess - resolvedOffset);
  }

  if (!matchesRequestedLocalDateTime(parsedDate, requestedDateTime)) {
    return null;
  }

  return parsedDate;
}

export function formatDateForInput(date: Date) {
  const { year, month, day } = getZonedDateParts(date);
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function formatTimeForInput(date: Date) {
  const { hours, minutes } = getZonedDateParts(date);
  return `${pad(hours)}:${pad(minutes)}`;
}

export function formatDateForDisplay(dateValue: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }

  const [year, month, day] = dateValue.split("-");
  return `${day}/${month}/${year}`;
}

export function formatTimeForDisplay(timeValue: string) {
  if (!/^\d{2}:\d{2}$/.test(timeValue)) {
    return timeValue;
  }

  return timeValue;
}

export function formatDateTimeForDatabase(date: Date) {
  const { hours, minutes } = getZonedDateParts(date);
  return `${formatDateForInput(date)} ${pad(hours)}:${pad(minutes)}:00`;
}

export function getUpcomingWindow(now: Date) {
  const start = startOfCurrentMinute(now);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return { start, end };
}

export function formatDatabaseDateTimeForDisplay(dateTimeValue: string) {
  const match = dateTimeValue.match(
    /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})(?::\d{2})?$/,
  );

  if (!match) {
    return dateTimeValue;
  }

  const [, year, month, day, hours, minutes] = match;
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
