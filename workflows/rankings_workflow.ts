import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { GetRankingsFunction } from "../functions/get_rankings.ts";
import { SelectContentFunction } from "../functions/select_content.ts";
import { ENV } from "../config/env.ts";

export const RankingsWorkflow = DefineWorkflow({
  callback_id: "rankings_workflow",
  title: "Get Rankings Workflow",
  description: "現在のレーティングランキングを表示",
  input_parameters: {
    properties: {
      interactivity: { type: Schema.slack.types.interactivity },
      limit: {
        type: Schema.types.string,
        description: "表示する順位数",
        default: "10",
      },
    },
    required: ["interactivity"],
  },
});

// Step 1: 利用可能なコンテンツ一覧を取得
const selectContentsStep = RankingsWorkflow.addStep(SelectContentFunction, {
  interactivity: RankingsWorkflow.inputs.interactivity,
});

// Step 2: 選択されたコンテンツでランキングを取得
const getRankingsStep = RankingsWorkflow.addStep(GetRankingsFunction, {
  selected_content: selectContentsStep.outputs.selected_content,
  selected_content_id: selectContentsStep.outputs.selected_content_id,
  limit: RankingsWorkflow.inputs.limit,
});

RankingsWorkflow.addStep(Schema.slack.functions.SendEphemeralMessage, {
  channel_id: ENV.SLACK_CHANNEL_ID,
  user_id: RankingsWorkflow.inputs.interactivity.interactor.id,
  message: getRankingsStep.outputs.message,
});

export default RankingsWorkflow;
