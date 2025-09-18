import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { ContentsDatastore } from "../datastores/contents.ts";
import { validateContentArray } from "../schemas/index.ts";

export const SelectContentFunction = DefineFunction({
  callback_id: "select_content",
  title: "Select Contents",
  description: "コンテンツを1つ選択する",
  source_file: "functions/select_content.ts",
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
      selected_content: {
        type: Schema.types.string,
        description: "選択されたコンテンツの名前",
      },
      selected_content_id: {
        type: Schema.types.string,
        description: "選択されたコンテンツのID",
      },
    },
    required: ["selected_content", "selected_content_id"],
  },
});

export default SlackFunction(
  SelectContentFunction,
  async ({ inputs, client }) => {
    try {
      const response = await client.apps.datastore.query<typeof ContentsDatastore.definition>({
        datastore: "contents",
      });

      if (
        !response.ok || !response.items || response.items.length === 0
      ) {
        return { error: "利用可能なコンテンツがありません" };
      }

      const validatedContents = validateContentArray(response.items);

      const options = validatedContents.map((content) => ({
        "text": { "type": "plain_text", "text": content.name },
        "value": content.id,
      }));

      const modalResponse = await client.views.open({
        interactivity_pointer: inputs.interactivity.interactivity_pointer,
        view: {
          type: "modal",
          callback_id: "select-content-modal",
          notify_on_close: true,
          title: { type: "plain_text", text: "どのランキングを表示しますか？" },
          submit: { type: "plain_text", text: "決定" },
          close: { type: "plain_text", text: "キャンセル" },
          // blocks内の要素はblock kit builderで見やすいようにダブルクオーテーションで囲んでいる
          blocks: [
            {
              "type": "input",
              "block_id": "content_select_block",
              "label": { "type": "plain_text", "text": "コンテンツ" },
              "element": {
                "type": "static_select",
                "action_id": "content_select",
                "placeholder": {
                  "type": "plain_text",
                  "text": "コンテンツを選択",
                },
                "options": options,
              },
            },
          ],
        },
      });

      if (!modalResponse.ok) {
        const error = `モーダルの表示に失敗しました: ${modalResponse.error}`;
        return { error };
      }

      return { completed: false };
    } catch (error) {
      console.error("Error getting contents:", error);

      return {
        error: "コンテンツの取得中にエラーが発生しました",
      };
    }
  },
).addViewSubmissionHandler(
  ["select-content-modal"],
  async ({ view, client, body }) => {
    const state = view?.state?.values ?? {};
    const contentBlock = state.content_select_block ?? {};
    const action = contentBlock.content_select;
    const selectedOption = action?.selected_option;

    const selectedContentId = selectedOption?.value ?? "";
    if (!selectedContentId) {
      return { error: "コンテンツを選択してください" };
    }

    let selectedContentName = "";
    const optionText = selectedOption.text;
    console.log(optionText);
    if (typeof optionText === "string") {
      selectedContentName = optionText;
    } else if (optionText && typeof optionText === "object") {
      selectedContentName = optionText.text ?? "";
    }

    await client.functions.completeSuccess({
      function_execution_id: body.function_data.execution_id,
      outputs: {
        selected_content: selectedContentName,
        selected_content_id: selectedContentId,
      },
    });
  },
).addViewClosedHandler(["select-content-modal"], () => {
  return { error: "ランキング表示がキャンセルされました" };
});
