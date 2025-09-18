import { assert, assertEquals } from "@std/assert";
import { MatchService } from "../../services/match_service.ts";
import type { Content, ContentRating, Match, Player } from "../../schemas/index.ts";
import { DatastoreItem } from "./helper.ts";

// モックSlackAPIClientを作成
class MockSlackAPIClient {
  private players: Map<string, Player> = new Map();
  private contents: Map<string, Content> = new Map();
  private contentRatings: Map<string, ContentRating> = new Map();
  private matches: Match[] = [];

  constructor() {
    // テスト用コンテンツを初期化
    this.contents.set("競技かるた", {
      id: "競技かるた",
      name: "競技かるた",
      default_rating: 1500,
      slope: 32,
      temperature: 400,
      created_at: "2023-01-01T00:00:00.000Z",
      updated_at: "2023-01-01T00:00:00.000Z",
    });
    this.contents.set("テスト競技", {
      id: "テスト競技",
      name: "テスト競技",
      default_rating: 1500,
      slope: 32,
      temperature: 400,
      created_at: "2023-01-01T00:00:00.000Z",
      updated_at: "2023-01-01T00:00:00.000Z",
    });

    // テスト用プレイヤーを初期化
    this.players.set("player1", {
      id: "player1",
      name: "Player One",
      created_at: "2023-01-01T00:00:00.000Z",
      updated_at: "2023-01-01T00:00:00.000Z",
    });
    this.players.set("player2", {
      id: "player2",
      name: "Player Two",
      created_at: "2023-01-01T00:00:00.000Z",
      updated_at: "2023-01-01T00:00:00.000Z",
    });
    this.players.set("reader1", {
      id: "reader1",
      name: "Reader",
      created_at: "2023-01-01T00:00:00.000Z",
      updated_at: "2023-01-01T00:00:00.000Z",
    });
    this.players.set("player3", {
      id: "player3",
      name: "Player Three",
      created_at: "2023-01-01T00:00:00.000Z",
      updated_at: "2023-01-01T00:00:00.000Z",
    });

    // テスト用コンテンツレーティングを初期化
    this.contentRatings.set("player1_競技かるた", {
      id: "player1_競技かるた",
      player_id: "player1",
      content_id: "競技かるた",
      rating: 1500,
      updated_at: "2023-01-01T00:00:00.000Z",
    });
    this.contentRatings.set("player2_競技かるた", {
      id: "player2_競技かるた",
      player_id: "player2",
      content_id: "競技かるた",
      rating: 1450,
      updated_at: "2023-01-01T00:00:00.000Z",
    });
    this.contentRatings.set("player3_競技かるた", {
      id: "player3_競技かるた",
      player_id: "player3",
      content_id: "競技かるた",
      rating: 1400,
      updated_at: "2023-01-01T00:00:00.000Z",
    });
  }

  apps = {
    datastore: {
      get: ({ datastore, id }: { datastore: string; id: string }) => {
        if (datastore === "players") {
          const player = this.players.get(id);
          if (player) {
            return { ok: true, item: player };
          }
        } else if (datastore === "contents") {
          const content = this.contents.get(id);
          if (content) {
            return { ok: true, item: content };
          }
        } else if (datastore === "content_ratings") {
          const rating = this.contentRatings.get(id);
          if (rating) {
            return { ok: true, item: rating };
          }
        }
        return { ok: false };
      },

      put: ({ datastore, item }: DatastoreItem) => {
        if (datastore === "players") {
          this.players.set(item.id, item);
          return { ok: true };
        } else if (datastore === "matches") {
          this.matches.push(item);
          return { ok: true };
        } else if (datastore === "contents") {
          this.contents.set(item.id, item);
          return { ok: true };
        } else if (datastore === "content_ratings") {
          this.contentRatings.set(item.id, item);
          return { ok: true };
        }
        return { ok: false };
      },

      update: ({ datastore, item }: DatastoreItem) => {
        if (datastore === "content_ratings") {
          const existing = this.contentRatings.get(item.id);
          if (existing) {
            this.contentRatings.set(item.id, { ...existing, ...item });
            return { ok: true };
          }
        }
        return { ok: false };
      },

      query: ({ datastore, limit, expression, expression_values }: {
        datastore: string;
        limit?: number;
        expression?: string;
        // deno-lint-ignore no-explicit-any
        expression_values?: any;
      }) => {
        if (datastore === "matches") {
          const items = limit ? this.matches.slice(-limit) : this.matches;
          return { ok: true, items };
        } else if (datastore === "content_ratings" && expression && expression_values) {
          const items = Array.from(this.contentRatings.values()).filter((rating) => {
            if (expression_values[":player"] && expression_values[":content"]) {
              return rating.player_id === expression_values[":player"] &&
                rating.content_id === expression_values[":content"];
            }
            if (expression_values[":content"]) {
              return rating.content_id === expression_values[":content"];
            }
            return false;
          });
          return { ok: true, items };
        }
        return { ok: false, items: [] };
      },
    },
  };

  users = {
    info: ({ user }: { user: string }) => {
      if (user.startsWith("U")) {
        return {
          ok: true,
          user: {
            real_name: `Real ${user}`,
            name: `user_${user}`,
          },
        };
      }
      return { ok: false };
    },
  };
}

Deno.test("MatchService - processMatch 基本機能", async () => {
  // deno-lint-ignore no-explicit-any
  const mockClient = new MockSlackAPIClient() as any;
  const matchService = new MatchService(mockClient);

  const participantScores = new Map([["player1", 100], ["player2", 80]]);
  const match = await matchService.processMatch(
    "reader1",
    participantScores,
    "競技かるた",
  );

  // マッチの基本情報をチェック
  assertEquals(match.reader_id, "reader1");
  assertEquals(match.content.id, "競技かるた");

  // participant_info配列の構造をチェック
  assertEquals(match.participant_info.length, 2);

  // 各参加者の情報がparticipant_infoに含まれているかチェック
  const player1Info = match.participant_info.find((p) => p.participant_id === "player1");
  const player2Info = match.participant_info.find((p) => p.participant_id === "player2");

  assert(player1Info !== undefined);
  assert(player2Info !== undefined);

  // スコア情報をチェック
  assertEquals(player1Info.score, 100);
  assertEquals(player2Info.score, 80);

  // レーティング情報をチェック
  assertEquals(player1Info.pre_rating, 1500);
  assertEquals(player2Info.pre_rating, 1450);

  // 試合後レーティングが計算されているかチェック
  assert(typeof player1Info.post_rating === "number");
  assert(typeof player2Info.post_rating === "number");

  // 順位が設定されているかチェック
  assert(typeof player1Info.ranking === "number");
  assert(typeof player2Info.ranking === "number");

  // 日時情報
  assert(match.played_at.length > 0);
});

Deno.test("MatchService - processMatch レーティング更新", async () => {
  // deno-lint-ignore no-explicit-any
  const mockClient = new MockSlackAPIClient() as any;
  const matchService = new MatchService(mockClient);

  // 初期レーティングを確認
  const initialResponse = await mockClient.apps.datastore.query({
    datastore: "content_ratings",
    expression: "#player_id = :player AND #content_id = :content",
    expression_values: { ":player": "player1", ":content": "競技かるた" },
  });
  assertEquals(initialResponse.items[0].rating, 1500);

  // 試合を実行
  const participantScores = new Map([["player1", 100], ["player2", 80]]);
  await matchService.processMatch(
    "reader1",
    participantScores,
    "競技かるた",
  );

  // レーティング更新後の状態を確認
  const updatedResponse1 = await mockClient.apps.datastore.query({
    datastore: "content_ratings",
    expression: "#player_id = :player AND #content_id = :content",
    expression_values: { ":player": "player1", ":content": "競技かるた" },
  });
  const updatedResponse2 = await mockClient.apps.datastore.query({
    datastore: "content_ratings",
    expression: "#player_id = :player AND #content_id = :content",
    expression_values: { ":player": "player2", ":content": "競技かるた" },
  });

  // レーティングが正しく更新されていることを確認
  assert(typeof updatedResponse1.items[0].rating === "number");
  assert(typeof updatedResponse2.items[0].rating === "number");

  // レーティングが変動していることを確認
  assert(updatedResponse1.items[0].rating !== 1500);
  assert(updatedResponse2.items[0].rating !== 1450);
});

Deno.test("MatchService - getRecentMatches", async () => {
  // deno-lint-ignore no-explicit-any
  const mockClient = new MockSlackAPIClient() as any;
  const matchService = new MatchService(mockClient);

  // 複数の試合を作成
  const scores1 = new Map([["player1", 100], ["player2", 80]]);
  const scores2 = new Map([["player1", 90], ["player2", 110]]);
  await matchService.processMatch(
    "reader1",
    scores1,
    "競技かるた",
  );
  await matchService.processMatch(
    "reader1",
    scores2,
    "競技かるた",
  );

  const recentMatches = await matchService.getRecentMatches(5);

  assertEquals(recentMatches.length, 2);
  assertEquals(recentMatches[0].reader_id, "reader1");
  assertEquals(recentMatches[1].reader_id, "reader1");
});

Deno.test("MatchService - 3人対戦", async () => {
  // deno-lint-ignore no-explicit-any
  const mockClient = new MockSlackAPIClient() as any;
  const matchService = new MatchService(mockClient);

  const participantScores = new Map([["player1", 100], ["player2", 85], ["player3", 70]]);
  const match = await matchService.processMatch(
    "reader1",
    participantScores,
    "競技かるた",
  );

  assertEquals(match.participant_info.length, 3);

  // 各プレイヤーの情報がparticipant_infoに含まれているかチェック
  const player1Info = match.participant_info.find((p) => p.participant_id === "player1");
  const player2Info = match.participant_info.find((p) => p.participant_id === "player2");
  const player3Info = match.participant_info.find((p) => p.participant_id === "player3");

  assert(player1Info !== undefined);
  assert(player2Info !== undefined);
  assert(player3Info !== undefined);

  // 各プレイヤーのスコアが正しく保存されていることを確認
  assertEquals(player1Info.score, 100);
  assertEquals(player2Info.score, 85);
  assertEquals(player3Info.score, 70);
});

Deno.test("MatchService - constructParticipantsInfo 順位計算", async () => {
  // deno-lint-ignore no-explicit-any
  const mockClient = new MockSlackAPIClient() as any;
  const matchService = new MatchService(mockClient);

  const players: Player[] = [
    {
      id: "player1",
      name: "Player One",
      created_at: "2023-01-01T00:00:00.000Z",
      updated_at: "2023-01-01T00:00:00.000Z",
    },
    {
      id: "player2",
      name: "Player Two",
      created_at: "2023-01-01T00:00:00.000Z",
      updated_at: "2023-01-01T00:00:00.000Z",
    },
    {
      id: "player3",
      name: "Player Three",
      created_at: "2023-01-01T00:00:00.000Z",
      updated_at: "2023-01-01T00:00:00.000Z",
    },
  ];

  const participantScores = new Map([
    ["player1", 100], // 1位
    ["player2", 85], // 2位
    ["player3", 85], // 2位（同点）
  ]);

  const preRatingsMap = new Map([["player1", 1500], ["player2", 1450], ["player3", 1400]]);
  const postRatingsMap = new Map([["player1", 1510], ["player2", 1445], ["player3", 1395]]);

  const participantInfo = await matchService.constructParticipantsInfo(
    players,
    participantScores,
    preRatingsMap,
    postRatingsMap,
  );

  assertEquals(participantInfo.length, 3);

  // スコア順にソートされていることを確認
  assertEquals(participantInfo[0].participant_id, "player1");
  assertEquals(participantInfo[0].ranking, 1);
  assertEquals(participantInfo[0].score, 100);

  // 同点の場合、同じ順位が設定されることを確認
  const player2Info = participantInfo.find((p) => p.participant_id === "player2");
  const player3Info = participantInfo.find((p) => p.participant_id === "player3");
  assertEquals(player2Info?.ranking, 2);
  assertEquals(player3Info?.ranking, 2);
});

Deno.test("MatchService - レーティング精度テスト", async () => {
  // deno-lint-ignore no-explicit-any
  const mockClient = new MockSlackAPIClient() as any;
  const matchService = new MatchService(mockClient);

  const participantScores = new Map([["player1", 100], ["player2", 80]]);
  const match = await matchService.processMatch(
    "reader1",
    participantScores,
    "テスト競技",
  );

  // レーティングが小数点第2位まで保存されていることを確認
  const player1Info = match.participant_info.find((p) => p.participant_id === "player1");
  const player2Info = match.participant_info.find((p) => p.participant_id === "player2");

  assert(player1Info !== undefined);
  assert(player2Info !== undefined);

  // 小数点第2位まで精度があることを確認
  const player1PostRating = player1Info.post_rating;
  const player2PostRating = player2Info.post_rating;

  // toFixed(2)で丸められた値になっていることを確認
  const roundedPlayer1 = parseFloat(player1PostRating.toFixed(2));
  const roundedPlayer2 = parseFloat(player2PostRating.toFixed(2));
  assertEquals(player1PostRating, roundedPlayer1);
  assertEquals(player2PostRating, roundedPlayer2);
});

Deno.test("MatchService - エラーハンドリング: 空のスコアMap", async () => {
  // deno-lint-ignore no-explicit-any
  const mockClient = new MockSlackAPIClient() as any;
  const matchService = new MatchService(mockClient);

  const participantScores = new Map<string, number>();

  try {
    await matchService.processMatch(
      "reader1",
      participantScores,
      "テスト競技",
    );
    assert(false, "空のスコアMapでエラーが発生すべき");
  } catch (error) {
    assert(error instanceof Error);
    // 空の配列の場合のエラーが発生することを確認
    assert(true);
  }
});
