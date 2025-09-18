import { assertEquals } from "@std/assert";
import { MessageFormatter } from "../../services/message_formatter.ts";
import type { Match, Player } from "../../schemas/index.ts";

// テスト用のデータを作成
function createTestMatch(): Match {
  return {
    id: "test-match-123",
    reader_id: "reader123",
    participant_info: [
      {
        participant_id: "player1",
        score: 100,
        pre_rating: 1500,
        post_rating: 1494.5,
        ranking: 1,
      },
      {
        participant_id: "player2",
        score: 85,
        pre_rating: 1450,
        post_rating: 1452.0,
        ranking: 2,
      },
      {
        participant_id: "player3",
        score: 70,
        pre_rating: 1400,
        post_rating: 1403.5,
        ranking: 3,
      },
    ],
    played_at: "2023-01-01T10:00:00.000Z",
    content: {
      id: "テスト競技",
      name: "テスト競技",
    },
  };
}

function createTestPlayers(): Player[] {
  return [
    {
      id: "player1",
      name: "Player One",
      created_at: "2023-01-01T00:00:00.000Z",
      updated_at: "2023-01-01T10:05:00.000Z",
    },
    {
      id: "player2",
      name: "Player Two",
      created_at: "2023-01-01T00:00:00.000Z",
      updated_at: "2023-01-01T10:05:00.000Z",
    },
    {
      id: "player3",
      name: "Player Three",
      created_at: "2023-01-01T00:00:00.000Z",
      updated_at: "2023-01-01T10:05:00.000Z",
    },
    {
      id: "reader123",
      name: "Reader",
      created_at: "2023-01-01T00:00:00.000Z",
      updated_at: "2023-01-01T10:05:00.000Z",
    },
  ];
}

Deno.test("MessageFormatter - formatMatchResult", () => {
  const formatter = new MessageFormatter();
  const match = createTestMatch();
  const players = createTestPlayers();
  const reader = players.find((p) => p.id === "reader123");

  const result = formatter.formatMatchResult(match, reader!);

  // 基本的な要素が含まれているかチェック
  assertEquals(result.includes("🎯 *テスト競技 試合結果*"), true);
  assertEquals(result.includes("読み手: reader123"), true);
  assertEquals(result.includes("*順位表:*"), true);

  // 各プレイヤーの情報が含まれているかチェック（IDまたは名前）
  assertEquals(result.includes("player1"), true);
  assertEquals(result.includes("player2"), true);
  assertEquals(result.includes("player3"), true);

  // スコアとレーティング情報
  assertEquals(result.includes("score: 100"), true);
  assertEquals(result.includes("score: 85"), true);
  assertEquals(result.includes("score: 70"), true);

  assertEquals(result.includes("rate: 1494.5 (-5.50)"), true);
  assertEquals(result.includes("rate: 1452 (+2.00)"), true);
  assertEquals(result.includes("rate: 1403.5 (+3.50)"), true);
});

Deno.test("MessageFormatter - getRankEmoji private method behavior", () => {
  const formatter = new MessageFormatter();
  const match = createTestMatch();
  const players = createTestPlayers();
  const reader = players.find((p) => p.id === "reader123");

  const result = formatter.formatMatchResult(match, reader!);

  // ランク絵文字が正しく使われているかチェック
  assertEquals(result.includes("🥇"), true); // 1位
  assertEquals(result.includes("🥈"), true); // 2位
  assertEquals(result.includes("🥉"), true); // 3位
});
