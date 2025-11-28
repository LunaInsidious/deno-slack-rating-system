import { SlackAPIClient } from "deno-slack-sdk/types.ts";
import { Player } from "../schemas/index.ts";
import { getCurrentTimestamp } from "../utils/formatters.ts";
import { ContentService } from "./content_service.ts";
import { PlayersDatastore } from "../datastores/players.ts";
import { validatePlayer } from "../schemas/index.ts";

// TODO: 別にslackのUserAPIのみでもいいか
export class PlayerService {
  private client: SlackAPIClient;
  private contentService: ContentService;

  constructor(client: SlackAPIClient) {
    this.client = client;
    this.contentService = new ContentService(client);
  }

  async getOrCreatePlayer(playerId: string): Promise<Player> {
    const response = await this.client.apps.datastore.get<typeof PlayersDatastore.definition>({
      datastore: "players",
      id: playerId,
    });

    // item.idが存在する→datastoreに存在していたものを取得した
    if (response.ok && response.item.id != null) {
      return validatePlayer(response.item);
    }

    const userInfo = await this.getUserInfo(playerId);
    const newPlayer: Player = {
      id: playerId,
      name: userInfo?.real_name || userInfo?.name || playerId,
      created_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp(),
    };

    // Validate the new player before saving
    const validatedPlayer = validatePlayer(newPlayer);

    const putResponse = await this.client.apps.datastore.put({
      datastore: "players",
      item: validatedPlayer,
    });

    if (!putResponse.ok) {
      throw new Error(`Failed to create player: ${putResponse.error}`);
    }

    return validatedPlayer;
  }

  async getPlayers(playerIds: string[]): Promise<Player[]> {
    const players: Player[] = [];

    for (const playerId of playerIds) {
      const player = await this.getOrCreatePlayer(playerId);
      players.push(player);
    }

    return players;
  }

  async updatePlayerRatings(
    newRatings: Map<string, number>,
    contentId: string,
  ): Promise<void> {
    await this.contentService.updatePlayerRatings(newRatings, contentId);
  }

  private async getUserInfo(userId: string): Promise<{ real_name?: string; name?: string } | null> {
    if (!userId.startsWith("U")) {
      return null;
    }

    try {
      const response = await this.client.users.info({
        user: userId,
      });

      if (response.ok) {
        return response.user;
      }
    } catch (error) {
      console.error(`Failed to fetch user info for ${userId}:`, error);
    }

    return null;
  }

  resolvePlayerIds(playerNames: string[]): string[] {
    const resolvedIds: string[] = [];

    for (const name of playerNames) {
      if (name === "読み手なし") {
        continue;
      }
      if (name.startsWith("<@") && name.endsWith(">")) {
        const userId = name.slice(2, -1).split("|")[0];
        resolvedIds.push(userId);
      } else if (name.startsWith("U") && name.length > 8) {
        resolvedIds.push(name);
      } else {
        resolvedIds.push(name);
      }
    }

    return resolvedIds;
  }

  async getPlayerRating(playerId: string, contentId: string): Promise<number> {
    return await this.contentService.getPlayerRating(playerId, contentId);
  }

  async getPlayersWithRatings(
    playerIds: string[],
    contentId: string,
  ): Promise<Map<string, number>> {
    return await this.contentService.getPlayersRatings(playerIds, contentId);
  }
}
