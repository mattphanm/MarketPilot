const MONTHS = new Map([
  ["jan", 0],
  ["january", 0],
  ["feb", 1],
  ["february", 1],
  ["mar", 2],
  ["march", 2],
  ["apr", 3],
  ["april", 3],
  ["may", 4],
  ["jun", 5],
  ["june", 5],
  ["jul", 6],
  ["july", 6],
  ["aug", 7],
  ["august", 7],
  ["sep", 8],
  ["sept", 8],
  ["september", 8],
  ["oct", 9],
  ["october", 9],
  ["nov", 10],
  ["november", 10],
  ["dec", 11],
  ["december", 11],
]);

type DateParts = {
  year: number;
  month: number;
  day: number;
};

type TimeParts = {
  hour: number;
  minute: number;
};

export type TradeDateParseResult =
  | { ok: true; iso: string }
  | { ok: false; error: string };

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function normalizeYear(value: string | undefined, fallbackYear: number) {
  if (!value) {
    return fallbackYear;
  }

  const year = Number(value);

  if (!Number.isInteger(year)) {
    return null;
  }

  if (value.length === 2) {
    return 2000 + year;
  }

  return year;
}

function parseTime(value: string): TimeParts | null {
  const colonMatch = value.match(/^(\d{1,2}):(\d{2})$/);

  if (colonMatch) {
    const hour = Number(colonMatch[1]);
    const minute = Number(colonMatch[2]);

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return { hour, minute };
    }

    return null;
  }

  const compactMatch = value.match(/^(\d{3,4})$/);

  if (!compactMatch) {
    return null;
  }

  const compact = compactMatch[1];
  const hour = Number(compact.slice(0, -2));
  const minute = Number(compact.slice(-2));

  if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
    return { hour, minute };
  }

  return null;
}

function parseDatePart(value: string, referenceDate: Date): DateParts | null {
  const fallbackYear = referenceDate.getFullYear();
  const normalized = value.trim().toLowerCase();

  if (normalized === "today") {
    return {
      year: referenceDate.getFullYear(),
      month: referenceDate.getMonth() + 1,
      day: referenceDate.getDate(),
    };
  }

  if (normalized === "yesterday") {
    const date = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate() - 1
    );

    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    };
  }

  const isoMatch = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

  if (isoMatch) {
    return {
      year: Number(isoMatch[1]),
      month: Number(isoMatch[2]),
      day: Number(isoMatch[3]),
    };
  }

  const slashMatch = normalized.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);

  if (slashMatch) {
    const year = normalizeYear(slashMatch[3], fallbackYear);

    if (year === null) {
      return null;
    }

    return {
      year,
      month: Number(slashMatch[1]),
      day: Number(slashMatch[2]),
    };
  }

  const monthMatch = normalized.match(
    /^([a-z]{3,9})\.?\s+(\d{1,2})(?:,?\s+(\d{2,4}))?$/
  );

  if (monthMatch) {
    const month = MONTHS.get(monthMatch[1]);
    const year = normalizeYear(monthMatch[3], fallbackYear);

    if (month === undefined || year === null) {
      return null;
    }

    return {
      year,
      month: month + 1,
      day: Number(monthMatch[2]),
    };
  }

  return null;
}

function isValidLocalDate(date: Date, parts: DateParts & TimeParts) {
  return (
    date.getFullYear() === parts.year &&
    date.getMonth() === parts.month - 1 &&
    date.getDate() === parts.day &&
    date.getHours() === parts.hour &&
    date.getMinutes() === parts.minute
  );
}

export function parseTradeDateInput(
  value: string,
  referenceDate = new Date()
): TradeDateParseResult {
  const input = value.trim().replace(/(\d)T(\d)/i, "$1 $2").replace(/\s+/g, " ");

  if (!input) {
    return { ok: false, error: "Enter a date and 24-hour time." };
  }

  if (/(?:\d\s*|\b)(?:am|pm|a\.m\.|p\.m\.)(?:\b|$)/i.test(input)) {
    return { ok: false, error: "Use 24-hour time without AM or PM." };
  }

  const timeOnly = parseTime(input);
  const today = {
    year: referenceDate.getFullYear(),
    month: referenceDate.getMonth() + 1,
    day: referenceDate.getDate(),
  };

  if (timeOnly) {
    const date = new Date(
      today.year,
      today.month - 1,
      today.day,
      timeOnly.hour,
      timeOnly.minute
    );

    return { ok: true, iso: date.toISOString() };
  }

  const match = input.match(/^(.*?)\s+(?:at\s+)?(\d{1,2}:\d{2}|\d{3,4})$/i);

  if (!match) {
    return {
      ok: false,
      error: "Enter a date with 24-hour time, like 2026-06-20 14:30.",
    };
  }

  const dateParts = parseDatePart(match[1], referenceDate);
  const timeParts = parseTime(match[2]);

  if (!dateParts || !timeParts) {
    return {
      ok: false,
      error: "Enter a valid date with 24-hour time.",
    };
  }

  const date = new Date(
    dateParts.year,
    dateParts.month - 1,
    dateParts.day,
    timeParts.hour,
    timeParts.minute
  );

  if (!isValidLocalDate(date, { ...dateParts, ...timeParts })) {
    return {
      ok: false,
      error: "Enter a valid date with 24-hour time.",
    };
  }

  return { ok: true, iso: date.toISOString() };
}

export function formatTradeDateInput(iso: string | null | undefined) {
  if (!iso) {
    return "";
  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
