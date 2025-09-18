import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { validateParticipants } from "../utils/parsers.ts";
import { PlayerService } from "../services/player_service.ts";
import { ContentsDatastore } from "../datastores/contents.ts";
import { type Content, validateContentArray } from "../schemas/index.ts";

export const CollectMatchInfoFunction = DefineFunction({
  callback_id: "collect_match_info",
  title: "Collect Match Information and Scores",
  description: "試合情報（コンテンツ、読み手、参加者）と得点を収集",
  source_file: "functions/collect_match_info.ts",
  input_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
    },
    required: ["interactivity"],
  },
  output_parameters: {
    properties: {
      content: {
        type: Schema.types.string,
        description: "選択されたコンテンツ名",
      },
      reader: {
        type: Schema.slack.types.user_id,
        description: "読み手のユーザーID",
      },
      participant_scores: {
        type: Schema.types.object,
        description: "参加者IDをキー、得点を値とするオブジェクト",
      },
    },
    required: ["content", "reader", "participant_scores"],
  },
});

export default SlackFunction(
  CollectMatchInfoFunction,
  async ({ inputs, client }) => {
    try {
      // コンテンツ一覧を取得
      const contentsResponse = await client.apps.datastore.query<
        typeof ContentsDatastore.definition
      >({
        datastore: "contents",
      });

      if (!contentsResponse.ok || !contentsResponse.items) {
        return {
          error: "コンテンツの取得に失敗しました",
        };
      }

      const validatedContents = validateContentArray(contentsResponse.items);

      if (validatedContents.length === 0) {
        return {
          error: "利用可能なコンテンツがありません",
        };
      }

      // 基本情報収集のモーダルを表示
      const response = await client.views.open({
        interactivity_pointer: inputs.interactivity.interactivity_pointer,
        view: {
          type: "modal",
          callback_id: "collect-match-info",
          notify_on_close: true,
          title: { type: "plain_text", text: "📝 試合情報入力" },
          submit: { type: "plain_text", text: "次へ" },
          close: { type: "plain_text", text: "キャンセル" },
          // blocks内の要素はblock kit builderで見やすいようにダブルクオーテーションで囲んでいる
          blocks: [
            {
              "type": "input",
              "block_id": "content_block",
              "label": { "type": "plain_text", "text": "種目を選択してください" },
              "element": {
                "type": "static_select",
                "action_id": "content_select",
                "placeholder": { "type": "plain_text", "text": "種目を選択" },
                "options": validatedContents.map((content: Content) => ({
                  "text": { "type": "plain_text", "text": content.name },
                  "value": content.id,
                })),
              },
            },
            {
              "type": "input",
              "block_id": "reader_block",
              "label": { "type": "plain_text", "text": "読み手を選択してください" },
              "element": {
                "type": "users_select",
                "action_id": "reader_select",
                "placeholder": { "type": "plain_text", "text": "読み手を選択" },
              },
            },
            {
              "type": "input",
              "block_id": "participants_block",
              "label": { "type": "plain_text", "text": "参加者を選択してください" },
              "element": {
                "type": "multi_users_select",
                "action_id": "participants_select",
                "placeholder": { "type": "plain_text", "text": "参加者を選択" },
              },
            },
          ],
        },
      });

      if (!response.ok) {
        return {
          error: `モーダルの表示に失敗しました: ${response.error}`,
        };
      }

      return {
        completed: false,
      };
    } catch (error) {
      console.error("Error in CollectScoresFunction:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        error: `エラー: ${errorMessage}`,
      };
    }
  },
).addViewSubmissionHandler(
  ["collect-match-info"],
  async ({ view, client }) => {
    try {
      // 基本情報を取得
      const values = view.state.values;

      let content = "";
      let reader = "";
      let participants: string[] = [];

      // 各セクションから値を抽出
      for (const [_, blockValues] of Object.entries(values)) {
        for (const [actionId, actionValue] of Object.entries(blockValues)) {
          if (actionId === "content_select") {
            // deno-lint-ignore no-explicit-any
            content = (actionValue as any).selected_option?.value || "";
          } else if (actionId === "reader_select") {
            // deno-lint-ignore no-explicit-any
            reader = (actionValue as any).selected_user || "";
          } else if (actionId === "participants_select") {
            // deno-lint-ignore no-explicit-any
            participants = (actionValue as any).selected_users || [];
          }
        }
      }

      // バリデーション
      if (!content) {
        return { error: "種目を選択してください" };
      }
      if (!reader) {
        return { error: "読み手を選択してください" };
      }
      if (participants.length === 0) {
        return { error: "参加者を選択してください" };
      }

      validateParticipants(participants);

      // 参加者情報を取得
      const playerService = new PlayerService(client);
      const players = await playerService.getPlayers(participants);

      // blocks内の要素はblock kit builderで見やすいようにダブルクオーテーションで囲んでいる
      const blocks = players.map((player) => ({
        "type": "input",
        "block_id": `score_${player.id}`,
        "element": {
          "type": "number_input",
          "action_id": `score_${player.id}`,
          "is_decimal_allowed": false,
          "placeholder": { "type": "plain_text", "text": "得点を入力" },
          "min_value": "0",
        },
        "label": { "type": "plain_text", "text": `${player.name} の得点` },
      }));

      return {
        response_action: "update",
        view: {
          type: "modal",
          callback_id: "collect-scores",
          notify_on_close: true,
          title: { type: "plain_text", text: "🏆 得点入力" },
          submit: { type: "plain_text", text: "完了" },
          close: { type: "plain_text", text: "キャンセル" },
          private_metadata: JSON.stringify({ content, reader, participants }),
          blocks,
        },
      };
    } catch (error) {
      console.error("Error processing match info:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { error: `基本情報処理エラー: ${errorMessage}` };
    }
  },
)
  .addViewSubmissionHandler(
    ["collect-scores"],
    async ({ view, client, body }) => {
      try {
        // private_metadataから基本情報を取得
        const metadata = JSON.parse(view.private_metadata || "{}");
        const { content, reader, participants } = metadata;

        if (!content || !reader || !participants) {
          return { error: "基本情報が不足しています" };
        }

        const participantScores: Record<string, number> = {};
        const values = view.state.values;

        // スコアを取得
        for (let i = 0; i < participants.length; i++) {
          const participantId = participants[i];
          const blockId = `score_${participantId}`;
          const actionId = `score_${participantId}`;

          const scoreValue = values[blockId]?.[actionId]?.value;
          const numScore = Number(scoreValue);

          if (!Number.isNaN(numScore) && numScore >= 0) {
            participantScores[participantId] = numScore;
          } else {
            return { error: `参加者 ${i + 1} の得点が正しく入力されていません: ${scoreValue}` };
          }
        }

        console.log("Match info collected:", { content, reader, participantScores });

        await client.functions.completeSuccess({
          function_execution_id: body.function_data.execution_id,
          outputs: {
            content,
            reader,
            participant_scores: participantScores,
          },
        });
      } catch (error) {
        console.error("Error processing scores:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { error: `スコア処理エラー: ${errorMessage}` };
      }
    },
  ).addViewClosedHandler(["collect-match-info", "collect-scores"], ({ view }) => {
    console.log(`view_closed handler called: ${JSON.stringify(view)}`);
    return { completed: true };
  });
