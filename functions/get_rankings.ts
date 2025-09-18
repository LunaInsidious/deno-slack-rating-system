import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { ContentService } from "../services/content_service.ts";
import { PlayerService } from "../services/player_service.ts";

export const GetRankingsFunction = DefineFunction({
  callback_id: "get_rankings",
  title: "Get Rankings",
  description: "現在のレーティングランキングを取得",
  source_file: "functions/get_rankings.ts",
  input_parameters: {
    properties: {
      limit: {
        type: Schema.types.string,
        description: "表示する順位数（デフォルト: 10）",
        default: "10",
      },
      selected_content: {
        type: Schema.types.string,
        description: "ユーザーが選択したコンテンツの名前",
      },
      selected_content_id: {
        type: Schema.types.string,
        description: "ユーザーが選択したコンテンツのID",
      },
    },
    required: ["selected_content_id", "selected_content"],
  },
  output_parameters: {
    properties: {
      message: {
        type: Schema.slack.types.rich_text,
        description: "ランキング情報",
      },
    },
    required: ["message"],
  },
});

export default SlackFunction(
  GetRankingsFunction,
  async ({ inputs, client }) => {
    try {
      const numberLimit = Number(inputs.limit);
      const limit = Number.isNaN(numberLimit) ? 10 : numberLimit;
      const selectedContentId = inputs.selected_content_id;
      const selectedContent = inputs.selected_content;

      if (!selectedContentId) {
        throw new Error(`Invalid content selection: ${selectedContentId}`);
      }

      const contentService = new ContentService(client);
      const playerService = new PlayerService(client);

      // ContentServiceを使用してランキングを取得
      const rankings = await contentService.getRankingsByContent(selectedContentId, limit);

      if (rankings.length === 0) {
        return {
          outputs: {
            message: `${selectedContentId}のレーティングデータがありません`,
            blocks: [],
          },
        };
      }

      // プレイヤー情報を取得
      const playerIds = rankings.map((r) => r.player_id);
      const players = await playerService.getPlayers(playerIds);
      const playerMap = new Map(players.map((p) => [p.id, p]));

      const lines = [`📊 *${selectedContent} レーティングランキング*`, ""];

      rankings.forEach((ranking, index) => {
        const rank = index + 1;
        const rankEmoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}.`;

        const player = playerMap.get(ranking.player_id);
        const playerName = player?.name || ranking.player_id;
        const playerMention = ranking.player_id.startsWith("U")
          ? `<@${ranking.player_id}>`
          : playerName;

        lines.push(
          `${rankEmoji} ${playerMention} - Rating: ${ranking.rating}`,
        );
      });

      return {
        outputs: {
          message: lines.join("\n"),
        },
      };
    } catch (error) {
      console.error("Error getting rankings:", error);

      return {
        outputs: {
          message: `⚠️ ランキング取得中にエラーが発生しました: ${error}`,
        },
      };
    }
  },
);
