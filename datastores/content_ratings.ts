import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";

export const ContentRatingsDatastore = DefineDatastore({
  name: "content_ratings",
  primary_key: "id",
  attributes: {
    id: {
      type: Schema.types.string,
      description: "ユニークID（UUID形式）",
    },
    player_id: {
      type: Schema.types.string,
      description: "プレイヤーID",
    },
    content_id: {
      type: Schema.types.string,
      description: "コンテンツID",
    },
    rating: {
      type: Schema.types.number,
      description: "レーティング値",
    },
    updated_at: {
      type: Schema.types.string,
      description: "最終更新日時（ISO 8601形式）",
    },
  },
});