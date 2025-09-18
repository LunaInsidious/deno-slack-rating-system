import { assertAlmostEquals, assertEquals } from "@std/assert";
import { RatingCalculator } from "../../services/rating_calculator.ts";
import type { Content } from "../../schemas/index.ts";

// テスト用のコンテンツ設定
const testContent: Content = {
  id: "test",
  name: "Test Content",
  default_rating: 1500,
  slope: 32,
  temperature: 400,
  created_at: "2023-01-01T00:00:00.000Z",
  updated_at: "2023-01-01T00:00:00.000Z",
};

Deno.test("RatingCalculator - 2人対戦でのレーティング計算", () => {
  const calculator = new RatingCalculator();
  const participantIds = ["player1", "player2"];
  const ratings = new Map([["player1", 1500], ["player2", 1450]]);
  const scores = new Map([["player1", 85], ["player2", 90]]);

  const deltas = calculator.calculateRatingChanges(participantIds, ratings, scores, testContent);

  // player2が勝利しているので、player2のレーティングが上がり、player1が下がる
  const player1Delta = deltas.get("player1")!;
  const player2Delta = deltas.get("player2")!;

  assertEquals(player1Delta < 0, true, "負けたプレイヤーのレーティングは下がる");
  assertEquals(player2Delta > 0, true, "勝ったプレイヤーのレーティングは上がる");

  // レーティング変動の合計は0に近い（保存則）
  assertAlmostEquals(player1Delta + player2Delta, 0, 0.1, "レーティング変動の合計は0に近い");
});

Deno.test("RatingCalculator - 同点の場合", () => {
  const calculator = new RatingCalculator();
  const participantIds = ["player1", "player2"];
  const ratings = new Map([["player1", 1500], ["player2", 1500]]);
  const scores = new Map([["player1", 80], ["player2", 80]]);

  const deltas = calculator.calculateRatingChanges(participantIds, ratings, scores, testContent);

  const player1Delta = deltas.get("player1")!;
  const player2Delta = deltas.get("player2")!;

  // 同点かつ同レーティングの場合、変動は小さい
  assertAlmostEquals(player1Delta, 0, 1, "同点の場合、レーティング変動は小さい");
  assertAlmostEquals(player2Delta, 0, 1, "同点の場合、レーティング変動は小さい");

  // レーティング変動の合計は0に近い
  assertAlmostEquals(player1Delta + player2Delta, 0, 0.1, "同点の場合、レーティング変動はほぼ0");
});

Deno.test("RatingCalculator - 3人対戦でのレーティング計算", () => {
  const calculator = new RatingCalculator();
  const participantIds = ["player1", "player2", "player3"];
  const ratings = new Map([["player1", 1600], ["player2", 1500], ["player3", 1400]]);
  const scores = new Map([["player1", 70], ["player2", 85], ["player3", 90]]);

  const deltas = calculator.calculateRatingChanges(participantIds, ratings, scores, testContent);

  const player1Delta = deltas.get("player1")!;
  const player2Delta = deltas.get("player2")!;
  const player3Delta = deltas.get("player3")!;

  // player3が1位、player2が2位、player1が3位
  assertEquals(player3Delta > 0, true, "1位のプレイヤーのレーティングは上がる");
  assertEquals(player1Delta < 0, true, "3位のプレイヤーのレーティングは下がる");

  // レーティング変動の合計は0に近い
  assertAlmostEquals(
    player1Delta + player2Delta + player3Delta,
    0,
    0.1,
    "3人対戦でもレーティング変動の合計は0に近い",
  );
});

Deno.test("RatingCalculator - ゼロ点対策", () => {
  const calculator = new RatingCalculator();
  const participantIds = ["player1", "player2"];
  const ratings = new Map([["player1", 1500], ["player2", 1500]]);
  // 片方が0点
  const scores = new Map([["player1", 0], ["player2", 100]]);

  const deltas = calculator.calculateRatingChanges(participantIds, ratings, scores, testContent);

  const player1Delta = deltas.get("player1")!;
  const player2Delta = deltas.get("player2")!;

  assertEquals(player1Delta < 0, true, "0点のプレイヤーのレーティングは下がる");
  assertEquals(player2Delta > 0, true, "勝利プレイヤーのレーティングは上がる");
  assertEquals(isFinite(player1Delta), true, "ゼロ点でも有限な値が計算される");
  assertEquals(isFinite(player2Delta), true, "ゼロ点でも有限な値が計算される");
});

Deno.test("RatingCalculator - 空の参加者配列", () => {
  const calculator = new RatingCalculator();
  const participantIds: string[] = [];
  const ratings = new Map();
  const scores = new Map();

  const deltas = calculator.calculateRatingChanges(participantIds, ratings, scores, testContent);

  assertEquals(deltas.size, 0, "空の配列の場合、空のMapが返される");
});

Deno.test("RatingCalculator - 数値安定性テスト", () => {
  const calculator = new RatingCalculator();
  const participantIds = ["player1", "player2"];
  const ratings = new Map([["player1", 2000], ["player2", 1000]]); // 大きなレーティング差
  const scores = new Map([["player1", 50], ["player2", 100]]);

  const deltas = calculator.calculateRatingChanges(participantIds, ratings, scores, testContent);

  const player1Delta = deltas.get("player1")!;
  const player2Delta = deltas.get("player2")!;

  assertEquals(isFinite(player1Delta), true, "大きなレーティング差でも有限な値");
  assertEquals(isFinite(player2Delta), true, "大きなレーティング差でも有限な値");
  assertEquals(isNaN(player1Delta), false, "NaNにならない");
  assertEquals(isNaN(player2Delta), false, "NaNにならない");
});
