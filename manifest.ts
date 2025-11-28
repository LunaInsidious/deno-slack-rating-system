import { Manifest } from "deno-slack-sdk/mod.ts";
import { PlayersDatastore } from "./datastores/players.ts";
import { MatchesDatastore } from "./datastores/matches.ts";
import { ContentsDatastore } from "./datastores/contents.ts";
import { ContentRatingsDatastore } from "./datastores/content_ratings.ts";
import { RatingWorkflow } from "./workflows/rating_workflow.ts";
import { RankingsWorkflow } from "./workflows/rankings_workflow.ts";
import { WeeklyReaderThanksWorkflow } from "./workflows/weekly_reader_thanks_workflow.ts";
import { CollectMatchInfoFunction } from "./functions/collect_match_info.ts";
import { ProcessMatchFunction } from "./functions/process_match.ts";
import { GetRankingsFunction } from "./functions/get_rankings.ts";
import { SelectContentFunction } from "./functions/select_content.ts";
import { PostWeeklyReaderThanksFunction } from "./functions/post_weekly_reader_thanks.ts";

/**
 * The app manifest contains the app's configuration. This
 * file defines attributes like app name and description.
 * https://api.slack.com/automation/manifest
 */
export default Manifest({
  name: "Rating System",
  description: "Slack連携レーティング計算システム",
  icon: "assets/card_game.png",
  workflows: [RatingWorkflow, RankingsWorkflow, WeeklyReaderThanksWorkflow],
  functions: [
    CollectMatchInfoFunction,
    ProcessMatchFunction,
    GetRankingsFunction,
    SelectContentFunction,
    PostWeeklyReaderThanksFunction,
  ],
  datastores: [PlayersDatastore, MatchesDatastore, ContentsDatastore, ContentRatingsDatastore],
  outgoingDomains: [],
  botScopes: [
    "commands",
    "chat:write",
    "chat:write.public",
    "datastore:read",
    "datastore:write",
    "users:read",
    "users:read.email",
    "channels:read",
    "groups:read",
    "mpim:read",
    "im:read",
  ],
});
