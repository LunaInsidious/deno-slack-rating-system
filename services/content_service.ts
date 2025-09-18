import { SlackAPIClient } from "deno-slack-sdk/types.ts";
import { Content, ContentRating } from "../schemas/index.ts";
import { generateMatchId, getCurrentTimestamp } from "../utils/formatters.ts";
import { ContentsDatastore } from "../datastores/contents.ts";
import { ContentRatingsDatastore } from "../datastores/content_ratings.ts";
import {
  validateContent,
  validateContentRating,
  validateContentRatingArray,
} from "../schemas/index.ts";

export class ContentService {
  private client: SlackAPIClient;

  constructor(client: SlackAPIClient) {
    this.client = client;
  }

  async getContent(contentId: string): Promise<Content> {
    const response = await this.client.apps.datastore.get<typeof ContentsDatastore.definition>({
      datastore: "contents",
      id: contentId,
    });

    // item.idが存在する→datastoreに存在していたものを取得した
    if (!response.ok || response.item.id == null) {
      throw new Error(`Content not found: ${contentId}`);
    }

    // Validate and return the content item
    return validateContent(response.item);
  }

  async getPlayerRating(playerId: string, contentId: string): Promise<number> {
    let rating = await this.findContentRating(playerId, contentId);

    if (!rating) {
      // ContentRatingが存在しない場合はContentを取得してデフォルトレーティングで作成
      const content = await this.getContent(contentId);
      rating = await this.createContentRating(playerId, contentId, content.default_rating);
    }

    return rating.rating;
  }

  async getPlayersRatings(playerIds: string[], contentId: string): Promise<Map<string, number>> {
    const ratings = new Map<string, number>();

    for (const playerId of playerIds) {
      const rating = await this.getPlayerRating(playerId, contentId);
      ratings.set(playerId, rating);
    }

    return ratings;
  }

  async updatePlayerRatings(
    newRatings: Map<string, number>,
    contentId: string,
  ): Promise<void> {
    const timestamp = getCurrentTimestamp();

    for (const [playerId, newRating] of newRatings.entries()) {
      // ContentRatingのIDを特定する必要があるので、まずは検索
      const existingRating = await this.findContentRating(playerId, contentId);
      if (!existingRating) {
        throw new Error(`ContentRating not found for player: ${playerId}, content: ${contentId}`);
      }

      // updateを使用して部分更新
      const updateResponse = await this.client.apps.datastore.update({
        datastore: "content_ratings",
        item: {
          id: existingRating.id,
          rating: newRating,
          updated_at: timestamp,
        },
      });

      if (!updateResponse.ok) {
        throw new Error(
          `Failed to update rating for player: ${playerId}, error: ${updateResponse.error}`,
        );
      }
    }
  }

  private async findContentRating(
    playerId: string,
    contentId: string,
  ): Promise<ContentRating | null> {
    const response = await this.client.apps.datastore.query<
      typeof ContentRatingsDatastore.definition
    >({
      datastore: "content_ratings",
      expression: "#player_id = :player AND #content_id = :content",
      expression_attributes: {
        "#player_id": "player_id",
        "#content_id": "content_id",
      },
      expression_values: {
        ":player": playerId,
        ":content": contentId,
      },
    });

    if (!response.ok || !response.items || response.items.length === 0) {
      return null;
    }

    // Validate and return the first content rating
    return validateContentRating(response.items[0]);
  }

  private async createContentRating(
    playerId: string,
    contentId: string,
    rating: number,
  ): Promise<ContentRating> {
    const newRating: ContentRating = {
      id: generateMatchId(),
      player_id: playerId,
      content_id: contentId,
      rating: rating,
      updated_at: getCurrentTimestamp(),
    };

    // Validate the new rating before saving
    const validatedRating = validateContentRating(newRating);

    const putResponse = await this.client.apps.datastore.put({
      datastore: "content_ratings",
      item: validatedRating,
    });

    if (!putResponse.ok) {
      throw new Error(`Failed to create content rating: ${putResponse.error}`);
    }

    return validatedRating;
  }

  async getRankingsByContent(contentId: string, limit?: number): Promise<
    Array<{
      player_id: string;
      rating: number;
    }>
  > {
    const response = await this.client.apps.datastore.query<
      typeof ContentRatingsDatastore.definition
    >({
      datastore: "content_ratings",
      expression: "#content_id = :content",
      expression_attributes: {
        "#content_id": "content_id",
      },
      expression_values: {
        ":content": contentId,
      },
    });

    if (!response.ok || !response.items) {
      return [];
    }

    // Validate all content ratings
    const validatedContentRatings = validateContentRatingArray(response.items);

    const contentRatings = validatedContentRatings
      .map((item) => ({
        player_id: item.player_id,
        rating: item.rating,
      }))
      .sort((a, b) => b.rating - a.rating);

    return limit ? contentRatings.slice(0, limit) : contentRatings;
  }
}
