import { assertEquals } from "@std/assert";
import {
  buildReaderAppreciationMessage,
  calculatePreviousWeekRange,
} from "../../utils/weekly_readers.ts";

Deno.test("calculatePreviousWeekRange returns previous week bounds in UTC", () => {
  const baseDate = new Date("2024-05-20T01:00:00.000Z"); // Monday 10:00 JST
  const range = calculatePreviousWeekRange(baseDate);

  assertEquals(range.startUTC.toISOString(), "2024-05-12T15:00:00.000Z");
  assertEquals(range.endUTC.toISOString(), "2024-05-19T15:00:00.000Z");
  assertEquals(range.label, "2024/05/13〜2024/05/19");
});

Deno.test("buildReaderAppreciationMessage formats thanks with counts", () => {
  const counts = new Map<string, number>([
    ["U123", 2],
    ["U456", 1],
  ]);

  const message = buildReaderAppreciationMessage(counts, "2024/05/13〜2024/05/19");

  assertEquals(
    message,
    [
      "🙌 先週 (2024/05/13〜2024/05/19) に読み手をしてくださった皆さん、ありがとうございます！",
      "",
      "- <@U123>（2回）",
      "- <@U456>（1回）",
      "",
      "引き続き対戦よろしくお願いします！",
    ].join("\n"),
  );
});

Deno.test("buildReaderAppreciationMessage handles empty readers", () => {
  const counts = new Map<string, number>();
  const message = buildReaderAppreciationMessage(counts, "2024/05/13〜2024/05/19");

  assertEquals(
    message,
    "先週 (2024/05/13〜2024/05/19) の試合で読み手をしてくれた方はいませんでした。",
  );
});
