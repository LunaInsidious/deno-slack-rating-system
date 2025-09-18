import { assert, assertEquals } from "@std/assert";
import {
  formatPlayerMention,
  formatRatingChange,
  generateMatchId,
  getCurrentTimestamp,
} from "../../utils/formatters.ts";

Deno.test("formatRatingChange - 正の値", () => {
  assertEquals(formatRatingChange(15.5), "+15.50");
});

Deno.test("formatRatingChange - 負の値", () => {
  assertEquals(formatRatingChange(-12.3), "-12.30");
});

Deno.test("formatRatingChange - ゼロ", () => {
  assertEquals(formatRatingChange(0), "+0.00");
});

Deno.test("formatPlayerMention - SlackユーザーID", () => {
  assertEquals(formatPlayerMention("U1234567890"), "<@U1234567890>");
});

Deno.test("formatPlayerMention - 通常の文字列", () => {
  assertEquals(formatPlayerMention("testuser"), "testuser");
});

Deno.test("generateMatchId - UUIDフォーマット", () => {
  const matchId = generateMatchId();

  // UUID v4の基本的なフォーマットをチェック
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  assert(uuidRegex.test(matchId), `Generated ID ${matchId} should be a valid UUID`);
});

Deno.test("generateMatchId - ユニーク性", () => {
  const id1 = generateMatchId();
  const id2 = generateMatchId();

  assert(id1 !== id2, "Generated IDs should be unique");
});

Deno.test("getCurrentTimestamp - ISO 8601フォーマット", () => {
  const timestamp = getCurrentTimestamp();

  // ISO 8601フォーマットの基本的なチェック
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  assert(isoRegex.test(timestamp), `Timestamp ${timestamp} should be in ISO 8601 format`);

  // パース可能かチェック
  const date = new Date(timestamp);
  assert(!isNaN(date.getTime()), "Timestamp should be a valid date");
});
