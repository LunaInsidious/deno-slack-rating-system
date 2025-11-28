import { formatPlayerMention } from "./formatters.ts";

const DEFAULT_TIMEZONE_OFFSET_MINUTES = 9 * 60; // Asia/Tokyo (JST)

export interface WeeklyRange {
  startUTC: Date;
  endUTC: Date;
  label: string;
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function formatDateInTimezone(date: Date, offsetMinutes: number): string {
  const shifted = new Date(date.getTime() + offsetMinutes * 60 * 1000);
  const year = shifted.getUTCFullYear();
  const month = pad(shifted.getUTCMonth() + 1);
  const day = pad(shifted.getUTCDate());
  return `${year}/${month}/${day}`;
}

export function calculatePreviousWeekRange(
  baseDate: Date = new Date(),
  timezoneOffsetMinutes: number = DEFAULT_TIMEZONE_OFFSET_MINUTES,
): WeeklyRange {
  const offsetMilliseconds = timezoneOffsetMinutes * 60 * 1000;
  const baseWithOffset = new Date(baseDate.getTime() + offsetMilliseconds);

  const startOfDay = new Date(baseWithOffset);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const dayOfWeek = startOfDay.getUTCDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;

  const startOfWeek = new Date(startOfDay);
  startOfWeek.setUTCDate(startOfWeek.getUTCDate() - daysSinceMonday);

  const startOfPreviousWeek = new Date(startOfWeek);
  startOfPreviousWeek.setUTCDate(startOfPreviousWeek.getUTCDate() - 7);

  const startUTC = new Date(startOfPreviousWeek.getTime() - offsetMilliseconds);
  const endUTC = new Date(startOfWeek.getTime() - offsetMilliseconds);

  const labelStart = formatDateInTimezone(startUTC, timezoneOffsetMinutes);
  const labelEnd = formatDateInTimezone(new Date(endUTC.getTime() - 1), timezoneOffsetMinutes);
  const label = `${labelStart}〜${labelEnd}`;

  return { startUTC, endUTC, label };
}

export function buildReaderAppreciationMessage(
  readerCounts: Map<string, number>,
  rangeLabel: string,
): string {
  if (readerCounts.size === 0) {
    return `先週 (${rangeLabel}) の試合で読み手をしてくれた方はいませんでした。`; // fallback message
  }

  const sortedReaders = [...readerCounts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });

  const lines: string[] = [];
  lines.push(`🙌 先週 (${rangeLabel}) に読み手をしてくださった皆さん、ありがとうございます！`);
  lines.push("");

  for (const [readerId, count] of sortedReaders) {
    lines.push(`- ${formatPlayerMention(readerId)}（${count}回）`);
  }

  lines.push("");
  lines.push("引き続き対戦よろしくお願いします！");

  return lines.join("\n");
}
