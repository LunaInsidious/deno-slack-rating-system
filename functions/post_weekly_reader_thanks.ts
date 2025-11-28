import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { SlackAPIClient } from "deno-slack-sdk/types.ts";
import { MatchesDatastore } from "../datastores/matches.ts";
import { Match, validateMatchArray } from "../schemas/index.ts";
import {
  buildReaderAppreciationMessage,
  calculatePreviousWeekRange,
} from "../utils/weekly_readers.ts";
import { NO_READER_USER_ID } from "../config/constant.ts";

export const PostWeeklyReaderThanksFunction = DefineFunction({
  callback_id: "post_weekly_reader_thanks",
  title: "Post Weekly Reader Thanks",
  description: "先週の試合で読み手をしてくれた人へ感謝メッセージを作成",
  source_file: "functions/post_weekly_reader_thanks.ts",
  output_parameters: {
    properties: {
      message: {
        type: Schema.types.string,
        description: "感謝メッセージ",
      },
    },
    required: ["message"],
  },
});

async function fetchMatchesWithinRange(
  client: SlackAPIClient,
  startUTC: Date,
  endUTC: Date,
): Promise<Match[]> {
  const matches: Match[] = [];
  let cursor: string | undefined;

  do {
    const response = await client.apps.datastore.query<typeof MatchesDatastore.definition>({
      datastore: "matches",
      limit: 100,
      cursor,
    });

    if (!response.ok) {
      throw new Error(`Failed to query matches: ${response.error}`);
    }

    const items = response.items ?? [];
    matches.push(...validateMatchArray(items));

    cursor = response.response_metadata?.next_cursor;
  } while (cursor);

  return matches.filter((match) => {
    const playedAt = Date.parse(match.played_at);
    if (Number.isNaN(playedAt)) return false;
    return playedAt >= startUTC.getTime() && playedAt < endUTC.getTime();
  });
}

function countReaders(matches: Match[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const match of matches) {
    const readerId = match.reader_id;
    if (readerId === NO_READER_USER_ID) continue;

    counts.set(readerId, (counts.get(readerId) ?? 0) + 1);
  }

  return counts;
}

export default SlackFunction(PostWeeklyReaderThanksFunction, async ({ client }) => {
  try {
    const { startUTC, endUTC, label } = calculatePreviousWeekRange();
    const matches = await fetchMatchesWithinRange(client, startUTC, endUTC);
    const readerCounts = countReaders(matches);
    const message = buildReaderAppreciationMessage(readerCounts, label);

    return { outputs: { message } };
  } catch (error) {
    console.error("Failed to build weekly reader thanks message", error);
    return {
      outputs: {
        message: "⚠️ 先週の読み手情報を取得できませんでした。",
      },
    };
  }
});
