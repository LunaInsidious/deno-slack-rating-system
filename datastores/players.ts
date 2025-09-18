import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";

export const PlayersDatastore = DefineDatastore({
  name: "players",
  primary_key: "id",
  attributes: {
    id: {
      type: Schema.types.string,
      description: "プレイヤーID（SlackユーザーID or カスタムID）",
    },
    name: {
      type: Schema.types.string,
      description: "プレイヤーの表示名",
    },
    created_at: {
      type: Schema.types.string,
      description: "作成日時（ISO 8601形式）",
    },
    updated_at: {
      type: Schema.types.string,
      description: "最終更新日時（ISO 8601形式）",
    },
  },
});
