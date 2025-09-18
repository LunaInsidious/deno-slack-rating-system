import type { Match, Player } from "../schemas/index.ts";
import { formatPlayerMention, formatRatingChange } from "../utils/formatters.ts";

export class MessageFormatter {
  formatMatchResult(match: Match, reader: Player): string {
    const lines: string[] = [];

    lines.push(`🎯 *${match.content.name} 試合結果*`);
    lines.push("");
    lines.push(`読み手: ${formatPlayerMention(reader.id)}`);
    lines.push("");
    lines.push("*順位表:*");

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

      lines.push(
        `${currentRank}位 ${rankEmoji}\n${mention}\nscore: ${participantInfo.score}\nrate: ${participantInfo.post_rating} (${ratingDiff})\n総合順位: ${participantInfo.ranking}位`,
      );
    }

    return lines.join("\n");
  }

  private getRankEmoji(rank: number): string {
    const emojis = ["🥇", "🥈", "🥉"];
    return emojis[rank - 1] || `${rank}`;
  }
}
