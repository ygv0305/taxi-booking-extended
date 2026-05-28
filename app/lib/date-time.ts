function pad(value: number) {
  return String(value).padStart(2, "0");
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
  const parsedDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day ||
    parsedDate.getHours() !== hours ||
    parsedDate.getMinutes() !== minutes
  ) {
    return null;
  }

  return parsedDate;
}

export function formatDateForInput(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatTimeForInput(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
  return `${formatDateForInput(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
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
