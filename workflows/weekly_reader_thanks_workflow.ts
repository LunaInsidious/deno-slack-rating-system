import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { PostWeeklyReaderThanksFunction } from "../functions/post_weekly_reader_thanks.ts";
import { ENV } from "../config/env.ts";

export const WeeklyReaderThanksWorkflow = DefineWorkflow({
  callback_id: "weekly_reader_thanks",
  title: "Weekly Reader Appreciation",
  description: "先週の読み手に感謝メッセージを送信",
});

const thanksStep = WeeklyReaderThanksWorkflow.addStep(PostWeeklyReaderThanksFunction, {});

WeeklyReaderThanksWorkflow.addStep(Schema.slack.functions.SendMessage, {
  channel_id: ENV.SLACK_CHANNEL_ID,
  message: thanksStep.outputs.message,
});

export default WeeklyReaderThanksWorkflow;
