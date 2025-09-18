import { Trigger } from "deno-slack-api/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import { RankingsWorkflow } from "../workflows/rankings_workflow.ts";

const rankingsTrigger: Trigger<typeof RankingsWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "/ranking",
  description: "現在のレーティングランキングを表示",
  workflow: `#/workflows/${RankingsWorkflow.definition.callback_id}`,
  inputs: {
    interactivity: {
      value: TriggerContextData.Shortcut.interactivity,
    },
    limit: {
      value: "10",
    },
  },
};

export default rankingsTrigger;
