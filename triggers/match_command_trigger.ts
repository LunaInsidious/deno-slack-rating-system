import { Trigger } from "deno-slack-api/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import { RatingWorkflow } from "../workflows/rating_workflow.ts";

const matchCommandTrigger: Trigger<typeof RatingWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "/match-result",
  description: "試合結果を記録するスラッシュコマンド",
  workflow: `#/workflows/${RatingWorkflow.definition.callback_id}`,
  inputs: {
    interactivity: {
      value: TriggerContextData.Shortcut.interactivity,
    },
  },
};

export default matchCommandTrigger;
