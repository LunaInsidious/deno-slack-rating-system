import { z } from "zod";

// Player schema
export const PlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Player = z.infer<typeof PlayerSchema>;

// Content schema
export const ContentSchema = z.object({
  id: z.string(),
  name: z.string(),
  default_rating: z.number(),
  slope: z.number(),
  temperature: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Content = z.infer<typeof ContentSchema>;

// ContentRating schema
export const ContentRatingSchema = z.object({
  id: z.string(),
  player_id: z.string(),
  content_id: z.string(),
  rating: z.number(),
  updated_at: z.string(),
});
export type ContentRating = z.infer<typeof ContentRatingSchema>;

// ParticipantInfo schema
export const ParticipantInfoSchema = z.object({
  participant_id: z.string(),
  score: z.number(),
  pre_rating: z.number(),
  post_rating: z.number(),
  ranking: z.number(),
});
export type ParticipantInfo = z.infer<typeof ParticipantInfoSchema>;

// Match schema
export const MatchSchema = z.object({
  id: z.string(),
  reader_id: z.string(),
  participant_info: z.array(ParticipantInfoSchema),
  played_at: z.string(),
  content: z.string(),
});
export type Match = z.infer<typeof MatchSchema>;

// Validation helpers
export function validatePlayer(data: unknown): Player {
  return PlayerSchema.parse(data);
}

export function validateContent(data: unknown): Content {
  return ContentSchema.parse(data);
}

export function validateContentRating(data: unknown): ContentRating {
  return ContentRatingSchema.parse(data);
}

export function validateMatch(data: unknown): Match {
  return MatchSchema.parse(data);
}

export function validatePlayerArray(data: unknown[]): Player[] {
  return z.array(PlayerSchema).parse(data);
}

export function validateContentArray(data: unknown[]): Content[] {
  return z.array(ContentSchema).parse(data);
}

export function validateContentRatingArray(data: unknown[]): ContentRating[] {
  return z.array(ContentRatingSchema).parse(data);
}

export function validateMatchArray(data: unknown[]): Match[] {
  return z.array(MatchSchema).parse(data);
}
