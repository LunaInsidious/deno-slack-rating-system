import "std/dotenv/load.ts";

export const ENV = {
  SLACK_CHANNEL_ID: Deno.env.get("SLACK_CHANNEL_ID"),
} as const;
