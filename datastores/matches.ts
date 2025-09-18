import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";

export const MatchesDatastore = DefineDatastore({
  name: "matches",
  primary_key: "id",
  attributes: {
    id: {
      type: Schema.types.string,
      description: "試合ID（UUID形式）",
    },
    content: {
      type: Schema.types.string,
      description: "試合を行った種目名",
    },
    reader_id: {
      type: Schema.types.string,
      description: "読み手のプレイヤーID",
    },
    participant_info: {
      type: Schema.types.array,
      items: {
        type: Schema.types.object,
        properties: {
          participant_id: {
            type: Schema.types.string,
            description: "参加者ID",
          },
          score: {
            type: Schema.types.number,
            description: "得点",
          },
          pre_rating: {
            type: Schema.types.number,
            description: "試合前レーティング",
          },
          post_rating: {
            type: Schema.types.number,
            description: "試合後レーティング",
          },
          ranking: {
            type: Schema.types.number,
            description: "順位",
          },
        },
        required: [
          "participant_id",
          "score",
          "pre_rating",
          "post_rating",
          "ranking",
        ],
      },
      description: "参加者情報の配列",
    },
    played_at: {
      type: Schema.types.string,
      description: "試合実施日時（ISO 8601形式）",
    },
  },
});
