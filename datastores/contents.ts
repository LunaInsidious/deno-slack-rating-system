import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";

export const ContentsDatastore = DefineDatastore({
  name: "contents",
  primary_key: "id",
  attributes: {
    id: {
      type: Schema.types.string,
      description: "コンテンツID",
    },
    name: {
      type: Schema.types.string,
      description: "コンテンツ名（種目名）",
    },
    default_rating: {
      type: Schema.types.number,
      description: "初期レーティング値（デフォルト: 1500）",
    },
    slope: {
      type: Schema.types.number,
      description: "K-Factor（レーティング変動の傾き）（デフォルト: 32）",
    },
    temperature: {
      type: Schema.types.number,
      description: "温度パラメータ（ソフトマックスのτ）（デフォルト: 400）",
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