import { type Match, NO_READER_ID, type Player } from "../schemas/index.ts";
import { formatPlayerMention, formatRatingChange } from "../utils/formatters.ts";
import { SlackAPIClient } from "deno-slack-sdk/types.ts";
import { ContentService } from "./content_service.ts";

export class MessageFormatter {
  private contentService: ContentService;

  constructor(client: SlackAPIClient) {
    this.contentService = new ContentService(client);
  }

  async formatMatchResult(
    match: Match,
    reader: Player | undefined,
    contentName: string,
  ): Promise<string> {
    const lines: string[] = [];

    lines.push(`🎯 *${contentName} 試合結果*`);
    lines.push("");
    if (reader) {
      lines.push(`読み手: ${formatPlayerMention(reader.id)}`);
    } else {
      lines.push(`読み手: ${NO_READER_ID}`);
    }
    lines.push("");
    lines.push("*順位表:*");

    // 全体順位を取得
    const rankings = await this.contentService.getRankingsByContent(match.content);
    const overallRankings = new Map<string, number>();
    rankings.forEach((r, index) => {
      overallRankings.set(r.player_id, index + 1);
    });

    // participant_infoを得点順でソート
    const sortedParticipantInfo = [...match.participant_info].sort((a, b) => b.score - a.score);

    let currentRank = 1;
    for (let i = 0; i < sortedParticipantInfo.length; i++) {
      if (i > 0 && sortedParticipantInfo[i].score < sortedParticipantInfo[i - 1].score) {
        currentRank = i + 1;
      }

      const participantInfo = sortedParticipantInfo[i];
      const rankEmoji = this.getRankEmoji(currentRank);
      const mention = formatPlayerMention(participantInfo.participant_id);
      const ratingDiff = formatRatingChange(
        participantInfo.post_rating - participantInfo.pre_rating,
      );

      // 全体順位を取得
      const overallRank = overallRankings.get(participantInfo.participant_id);
      if (overallRank == null) {
        throw new Error(`overallRank not found: ${participantInfo.participant_id}`);
      }

      lines.push(
        `${currentRank}位 ${rankEmoji}\n${mention}\nscore: ${participantInfo.score}\nrate: ${participantInfo.post_rating} (${ratingDiff})\n総合順位: ${overallRank}位`,
      );
      const isLast = i === sortedParticipantInfo.length - 1;
      if (!isLast) lines.push("");
    }

    return lines.join("\n");
  }

  private getRankEmoji(rank: number): string {
    const emojis = ["🥇", "🥈", "🥉"];
    return emojis[rank - 1] || "";
  }
}
