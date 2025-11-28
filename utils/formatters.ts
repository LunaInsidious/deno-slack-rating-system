import { NO_READER_USER_ID } from "../config/constant.ts";

export function formatRatingChange(delta: number): string {
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(2)}`;
}

export function formatPlayerMention(playerId: string): string {
  if (playerId === NO_READER_USER_ID) {
    return "読み手なし";
  }
  if (playerId.startsWith("U")) {
    return `<@${playerId}>`;
  }
  return playerId;
}

export function generateMatchId(): string {
  return crypto.randomUUID();
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}
