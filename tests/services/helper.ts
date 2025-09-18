import { Content, ContentRating, Match, Player } from "../../schemas/index.ts";

export type DatastoreItem = {
  datastore: "players";
  item: Player;
} | {
  datastore: "matches";
  item: Match;
} | {
  datastore: "contents";
  item: Content;
} | {
  datastore: "content_ratings";
  item: ContentRating;
};
