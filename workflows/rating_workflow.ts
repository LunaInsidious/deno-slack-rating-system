import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { CollectMatchInfoFunction } from "../functions/collect_match_info.ts";
import { ProcessMatchFunction } from "../functions/process_match.ts";
import { ENV } from "../config/env.ts";

export const RatingWorkflow = DefineWorkflow({
  callback_id: "rating_workflow",
  title: "Rating Calculation Workflow",
  description: "試合結果からレーティングを計算して通知",
  input_parameters: {
    properties: {
      interactivity: { type: Schema.slack.types.interactivity },
    },
    required: ["interactivity"],
  },
});

const collectMatchInfoStep = RatingWorkflow.addStep(CollectMatchInfoFunction, {
  interactivity: RatingWorkflow.inputs.interactivity,
});

const processMatchStep = RatingWorkflow.addStep(ProcessMatchFunction, {
  reader: collectMatchInfoStep.outputs.reader,
  participant_scores: collectMatchInfoStep.outputs.participant_scores,
  content: collectMatchInfoStep.outputs.content,
});

RatingWorkflow.addStep(Schema.slack.functions.SendMessage, {
  channel_id: ENV.SLACK_CHANNEL_ID,
  message: processMatchStep.outputs.message,
});

export default RatingWorkflow;
