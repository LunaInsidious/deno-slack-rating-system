import { assert, assertEquals } from "@std/assert";
import { PlayerService } from "../../services/player_service.ts";
import type { Content, ContentRating, Player } from "../../schemas/index.ts";
import { DatastoreItem } from "./helper.ts";

// モックSlackAPIClientを作成
class MockSlackAPIClient {
  private players: Map<string, Player> = new Map();
  private contents: Map<string, Content> = new Map();
  private contentRatings: Map<string, ContentRating> = new Map();

  constructor() {
    // テスト用コンテンツを初期化
    this.contents.set("テスト競技", {
      id: "テスト競技",
      name: "テスト競技",
      default_rating: 1500,
      slope: 32,
      temperature: 400,
      created_at: "2023-01-01T00:00:00.000Z",
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

      query: ({ datastore, expression, expression_values }: {
        datastore: string;
        expression?: string;
        // deno-lint-ignore no-explicit-any
        expression_values?: any;
      }) => {
        if (datastore === "content_ratings" && expression && expression_values) {
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

Deno.test("PlayerService - getOrCreatePlayer 新規プレイヤー", async () => {
  // deno-lint-ignore no-explicit-any
  const mockClient = new MockSlackAPIClient() as any;
  const playerService = new PlayerService(mockClient);

  const player = await playerService.getOrCreatePlayer("U1234567890");

  assertEquals(player.id, "U1234567890");
  assertEquals(player.name, "Real U1234567890");
  assert(player.updated_at.length > 0);
  assert(player.created_at.length > 0);
});

Deno.test("PlayerService - getOrCreatePlayer 既存プレイヤー", async () => {
  // deno-lint-ignore no-explicit-any
  const mockClient = new MockSlackAPIClient() as any;
  const playerService = new PlayerService(mockClient);

  // 既存プレイヤーを手動で追加
  const existingPlayer: Player = {
    id: "existing_player",
    name: "Existing Player",
    created_at: "2023-01-01T00:00:00.000Z",
    updated_at: "2023-01-01T00:00:00.000Z",
  };

  await mockClient.apps.datastore.put({
    datastore: "players",
    item: existingPlayer,
  });

  const player = await playerService.getOrCreatePlayer("existing_player");

  assertEquals(player.id, "existing_player");
  assertEquals(player.name, "Existing Player");
  assertEquals(player.created_at, "2023-01-01T00:00:00.000Z");
});

Deno.test("PlayerService - getPlayers 複数プレイヤー取得", async () => {
  // deno-lint-ignore no-explicit-any
  const mockClient = new MockSlackAPIClient() as any;
  const playerService = new PlayerService(mockClient);

  const playerIds = ["player1", "player2", "U1234567890"];
  const players = await playerService.getPlayers(playerIds);

  assertEquals(players.length, 3);
  assertEquals(players[0].id, "player1");
  assertEquals(players[1].id, "player2");
  assertEquals(players[2].id, "U1234567890");

  // プレイヤーオブジェクトの構造を確認
  assert(players[0].created_at.length > 0);
  assert(players[1].created_at.length > 0);
  assert(players[2].created_at.length > 0);
});

Deno.test("PlayerService - updatePlayerRatings", async () => {
  // deno-lint-ignore no-explicit-any
  const mockClient = new MockSlackAPIClient() as any;
  const playerService = new PlayerService(mockClient);

  // プレイヤーを事前に作成
  await playerService.getOrCreatePlayer("player1");
  await playerService.getOrCreatePlayer("player2");

  // レーティングを取得して ContentRating を作成する
  await playerService.getPlayerRating("player1", "テスト競技");
  await playerService.getPlayerRating("player2", "テスト競技");

  const newRatings = new Map([["player1", 1520.5], ["player2", 1485.2]]);

  await playerService.updatePlayerRatings(newRatings, "テスト競技");

  // 更新後の状態を確認（ContentServiceを通してレーティングを確認）
  const updatedRating1 = await playerService.getPlayerRating("player1", "テスト競技");
  const updatedRating2 = await playerService.getPlayerRating("player2", "テスト競技");

  assertEquals(updatedRating1, 1520.5);
  assertEquals(updatedRating2, 1485.2);
});

Deno.test("PlayerService - updatePlayerRatings 同点の場合", async () => {
  // deno-lint-ignore no-explicit-any
  const mockClient = new MockSlackAPIClient() as any;
  const playerService = new PlayerService(mockClient);

  await playerService.getOrCreatePlayer("player1");
  await playerService.getOrCreatePlayer("player2");

  // レーティングを取得して ContentRating を作成する
  await playerService.getPlayerRating("player1", "テスト競技");
  await playerService.getPlayerRating("player2", "テスト競技");

  const newRatings = new Map([["player1", 1505.0], ["player2", 1495.0]]);

  await playerService.updatePlayerRatings(newRatings, "テスト競技");

  // レーティングが正しく更新されているか確認
  const updatedRating1 = await playerService.getPlayerRating("player1", "テスト競技");
  const updatedRating2 = await playerService.getPlayerRating("player2", "テスト競技");

  assertEquals(updatedRating1, 1505.0);
  assertEquals(updatedRating2, 1495.0);
});

Deno.test("PlayerService - resolvePlayerIds", () => {
  // deno-lint-ignore no-explicit-any
  const mockClient = new MockSlackAPIClient() as any;
  const playerService = new PlayerService(mockClient);

  const playerNames = [
    "<@U1234567890|username>",
    "<@U0987654321>",
    "U1111111111",
    "regular_username",
  ];

  const resolvedIds = playerService.resolvePlayerIds(playerNames);

  assertEquals(resolvedIds, [
    "U1234567890", // メンション形式（パイプ付き）
    "U0987654321", // メンション形式（パイプなし）
    "U1111111111", // 直接ユーザーID
    "regular_username", // 通常の文字列
  ]);
});

Deno.test("PlayerService - resolvePlayerIds 空の配列", () => {
  // deno-lint-ignore no-explicit-any
  const mockClient = new MockSlackAPIClient() as any;
  const playerService = new PlayerService(mockClient);

  const resolvedIds = playerService.resolvePlayerIds([]);
  assertEquals(resolvedIds, []);
});

Deno.test("PlayerService - 複数回の試合後のレーティング更新", async () => {
  // deno-lint-ignore no-explicit-any
  const mockClient = new MockSlackAPIClient() as any;
  const playerService = new PlayerService(mockClient);

  // 初期プレイヤー作成
  await playerService.getOrCreatePlayer("player1");

  // レーティングを取得して ContentRating を作成する
  await playerService.getPlayerRating("player1", "テスト競技");

  // 1回目の試合（勝利）
  await playerService.updatePlayerRatings(
    new Map([["player1", 1520]]),
    "テスト競技",
  );

  // 2回目の試合（敗北）
  await playerService.updatePlayerRatings(
    new Map([["player1", 1510]]),
    "テスト競技",
  );

  const finalRating = await playerService.getPlayerRating("player1", "テスト競技");

  assertEquals(finalRating, 1510);
});
