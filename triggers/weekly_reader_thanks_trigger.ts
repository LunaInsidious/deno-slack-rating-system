import { Trigger } from "deno-slack-api/types.ts";
import { TriggerTypes } from "deno-slack-api/mod.ts";
import { WeeklyReaderThanksWorkflow } from "../workflows/weekly_reader_thanks_workflow.ts";

const weeklyReaderThanksTrigger: Trigger<typeof WeeklyReaderThanksWorkflow.definition> = {
  type: TriggerTypes.Scheduled,
  name: "週次読み手感謝",
  description: "先週の読み手に感謝メッセージを送信",
  workflow: `#/workflows/${WeeklyReaderThanksWorkflow.definition.callback_id}`,
  inputs: {},
  schedule: {
    start_time: "2024-01-01T01:00:00Z",
    timezone: "Asia/Tokyo",
    frequency: {
      type: "weekly",
      on_days: ["Monday"],
    },
  },
};

export default weeklyReaderThanksTrigger;
