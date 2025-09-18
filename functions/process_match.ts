import { MessageFormatter } from "../services/message_formatter.ts";
import { MatchService } from "../services/match_service.ts";
import { PlayerService } from "../services/player_service.ts";
import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { EnrichedSlackFunctionHandler } from "deno-slack-sdk/functions/types.ts";
import { ContentService } from "../services/content_service.ts";

export const ProcessMatchFunction = DefineFunction({
  callback_id: "process_match",
  title: "Process Match",
  description: "試合結果を処理してレーティングを更新",
  source_file: "functions/process_match.ts",
  input_parameters: {
    properties: {
      reader: {
        type: Schema.types.string,
        description: "読み手のユーザーIDまたは名前",
      },
      participant_scores: {
        type: Schema.types.object,
        description: "参加者IDをキー、得点を値とするオブジェクト",
      },
      content: {
        type: Schema.types.string,
        description: "試合を行った種目のID",
      },
    },
    required: ["reader", "participant_scores", "content"],
  },
  output_parameters: {
    properties: {
      message: {
        type: Schema.types.string,
        description: "処理結果メッセージ",
      },
    },
    required: ["message"],
  },
});

type ProcessMatchHandler = EnrichedSlackFunctionHandler<
  typeof ProcessMatchFunction.definition
>;

type ProcessMatchHandlerArgs = Parameters<ProcessMatchHandler>[0];
type ProcessMatchHandlerReturn = ReturnType<ProcessMatchHandler>;

export async function processMatch(
  { inputs, client }: Pick<ProcessMatchHandlerArgs, "inputs" | "client">,
): Promise<ProcessMatchHandlerReturn> {
  try {
    const participantScores = new Map<string, number>(Object.entries(inputs.participant_scores));

    if (participantScores.size < 2) {
      throw new Error("参加者は2名以上必要です");
    }

    const playerService = new PlayerService(client);
    const matchService = new MatchService(client);
    const messageFormatter = new MessageFormatter(client);

    const readerId = playerService.resolvePlayerIds([inputs.reader])[0];

    const reader = await playerService.getOrCreatePlayer(readerId);

    const match = await matchService.processMatch(
      readerId,
      participantScores,
      inputs.content,
    );

    const contentService = new ContentService(client);

    const content = await contentService.getContent(inputs.content);

    const message = await messageFormatter.formatMatchResult(match, reader, content.name);

    return {
      outputs: {
        message,
      },
    };
  } catch (error) {
    console.error("Error processing match:", error);

    const errorMessage = error instanceof Error ? error.message : "予期しないエラーが発生しました";

    return {
      outputs: {
        message: errorMessage,
      },
    };
  }
}

export default SlackFunction(
  ProcessMatchFunction,
  async ({ inputs, client }) => await processMatch({ inputs, client }),
);
