import { SlackAPIClient } from "deno-slack-sdk/types.ts";
import { Match, ParticipantInfo } from "../schemas/index.ts";
import { PlayerService } from "./player_service.ts";
import { ContentService } from "./content_service.ts";
import { RatingCalculator } from "./rating_calculator.ts";
import { Player } from "../schemas/index.ts";
import { generateMatchId, getCurrentTimestamp } from "../utils/formatters.ts";
import { MatchesDatastore } from "../datastores/matches.ts";
import { validateMatch, validateMatchArray } from "../schemas/index.ts";

export class MatchService {
  private client: SlackAPIClient;
  private playerService: PlayerService;
  private contentService: ContentService;
  private ratingCalculator: RatingCalculator;

  constructor(client: SlackAPIClient) {
    this.client = client;
    this.playerService = new PlayerService(client);
    this.contentService = new ContentService(client);
    this.ratingCalculator = new RatingCalculator();
  }

  async processMatch(
    readerId: string | undefined,
    participantScores: Map<string, number>,
    contentId: string,
  ): Promise<Match> {
    const participantIds = participantScores.keys().toArray();

    const content = await this.contentService.getContent(contentId);
    const players = await this.playerService.getPlayers(participantIds);
    const preRatings = await this.playerService.getPlayersWithRatings(participantIds, contentId);

    const ratingDeltas = this.ratingCalculator.calculateRatingChanges(
      participantIds,
      preRatings,
      participantScores,
      content,
    );

    const postRatings: Record<string, number> = {};
    const postRatingsMap = new Map<string, number>();
    for (const playerId of participantIds) {
      const newRating = parseFloat(
        (preRatings.get(playerId)! + ratingDeltas.get(playerId)!).toFixed(2),
      );
      postRatings[playerId] = newRating;
      postRatingsMap.set(playerId, newRating);
    }

    await this.playerService.updatePlayerRatings(
      postRatingsMap,
      contentId,
    );

    // participant_info配列を作成
    const participantInfo = this.constructParticipantsInfo(
      players,
      participantScores,
      preRatings,
      postRatingsMap,
    );

    const match: Match = {
      id: generateMatchId(),
      reader_id: readerId,
      participant_info: participantInfo,
      played_at: getCurrentTimestamp(),
      content: contentId,
    };

    await this.saveMatch(match);

    return match;
  }

  constructParticipantsInfo(
    players: Player[],
    participantScores: Map<string, number>,
    preRatings: Map<string, number>,
    postRatings: Map<string, number>,
  ): ParticipantInfo[] {
    const sorted = [...players].sort((a, b) => {
      const sb = participantScores.get(b.id);
      const sa = participantScores.get(a.id);
      if (sb == null || sa == null) throw new Error(`player not found ${a.id} ${b.id}`);
      if (sb !== sa) return sb - sa;
      // 同点でも一応安定ソートしておく
      return a.id.localeCompare(b.id);
    });

    // ランキング計算（同点は同順位）
    let currentRank = 1;
    let lastScore: number | null = null;
    return sorted.map((p, i) => {
      const score = participantScores.get(p.id);
      if (score == null) {
        throw new Error(`score not found ${p.id}`);
      }
      if (lastScore === null || score < lastScore) {
        currentRank = i + 1;
        lastScore = score;
      }

      const postRating = postRatings.get(p.id);
      if (postRating == null) throw new Error(`post rating not found ${p.id}`);

      const preRating = preRatings.get(p.id);
      if (preRating == null) throw new Error(`pre rating not found ${p.id}`);

      return {
        participant_id: p.id,
        score,
        pre_rating: preRating,
        post_rating: postRating,
        ranking: currentRank,
      };
    });
  }

  private async saveMatch(match: Match): Promise<void> {
    // Validate the match before saving
    const validatedMatch = validateMatch(match);

    const putResponse = await this.client.apps.datastore.put({
      datastore: "matches",
      item: validatedMatch,
    });

    if (!putResponse.ok) {
      throw new Error(`Failed to save match: ${putResponse.error}`);
    }
  }

  async getRecentMatches(limit: number = 10): Promise<Match[]> {
    const response = await this.client.apps.datastore.query<typeof MatchesDatastore.definition>({
      datastore: "matches",
      limit,
    });

    if (response.ok && response.items) {
      return validateMatchArray(response.items);
    }

    return [];
  }
}
