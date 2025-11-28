import { assertEquals, assertThrows } from "@std/assert";
import {
  NO_READER_ID,
  validateContent,
  validateContentRating,
  validateMatch,
  validatePlayer,
  validatePlayerArray,
} from "../../schemas/index.ts";

Deno.test("PlayerSchema - valid player object", () => {
  const validPlayer = {
    id: "player1",
    name: "Test Player",
    created_at: "2023-01-01T00:00:00.000Z",
    updated_at: "2023-01-01T00:00:00.000Z",
  };

  const result = validatePlayer(validPlayer);
  assertEquals(result, validPlayer);
});

Deno.test("PlayerSchema - invalid player object", () => {
  const invalidPlayer = {
    id: "player1",
    name: "Test Player",
    // missing created_at and updated_at
  };

  assertThrows(
    () => validatePlayer(invalidPlayer),
    Error,
    "Required",
  );
});

Deno.test("ContentSchema - valid content object", () => {
  const validContent = {
    id: "test-content",
    name: "Test Content",
    default_rating: 1500,
    slope: 32,
    temperature: 400,
    created_at: "2023-01-01T00:00:00.000Z",
    updated_at: "2023-01-01T00:00:00.000Z",
  };

  const result = validateContent(validContent);
  assertEquals(result, validContent);
});

Deno.test("ContentSchema - invalid content object", () => {
  const invalidContent = {
    id: "test-content",
    name: "Test Content",
    default_rating: "not a number", // invalid type
    slope: 32,
    temperature: 400,
    created_at: "2023-01-01T00:00:00.000Z",
    updated_at: "2023-01-01T00:00:00.000Z",
  };

  assertThrows(
    () => validateContent(invalidContent),
    Error,
    "Expected number",
  );
});

Deno.test("ContentRatingSchema - valid content rating object", () => {
  const validContentRating = {
    id: "rating1",
    player_id: "player1",
    content_id: "content1",
    rating: 1550,
    updated_at: "2023-01-01T00:00:00.000Z",
  };

  const result = validateContentRating(validContentRating);
  assertEquals(result, validContentRating);
});

Deno.test("ContentRatingSchema - invalid content rating object", () => {
  const invalidContentRating = {
    id: "rating1",
    player_id: "player1",
    content_id: "content1",
    rating: "not a number", // invalid type
    updated_at: "2023-01-01T00:00:00.000Z",
  };

  assertThrows(
    () => validateContentRating(invalidContentRating),
    Error,
    "Expected number",
  );
});

Deno.test("validatePlayerArray - valid array", () => {
  const validPlayers = [
    {
      id: "player1",
      name: "Player One",
      created_at: "2023-01-01T00:00:00.000Z",
      updated_at: "2023-01-01T00:00:00.000Z",
    },
    {
      id: "player2",
      name: "Player Two",
      created_at: "2023-01-01T00:00:00.000Z",
      updated_at: "2023-01-01T00:00:00.000Z",
    },
  ];

  const result = validatePlayerArray(validPlayers);
  assertEquals(result, validPlayers);
});

Deno.test("validatePlayerArray - invalid array", () => {
  const invalidPlayers = [
    {
      id: "player1",
      name: "Player One",
      // missing required fields
    },
  ];

  assertThrows(
    () => validatePlayerArray(invalidPlayers),
    Error,
    "Required",
  );
});

Deno.test("MatchSchema - valid match object", () => {
  const validMatch = {
    id: "match1",
    reader_id: "reader1",
    participant_info: [
      {
        participant_id: "player1",
        score: 100,
        pre_rating: 1500,
        post_rating: 1510,
        ranking: 1,
      },
    ],
    played_at: "2023-01-01T00:00:00.000Z",
    content: "test-content",
  };

  const result = validateMatch(validMatch);
  assertEquals(result, validMatch);
});

Deno.test("MatchSchema - invalid match object", () => {
  const invalidMatch = {
    id: "match1",
    reader_id: "reader1",
    participant_info: "not an array", // invalid type
    played_at: "2023-01-01T00:00:00.000Z",
    content: "test-content",
  };

  assertThrows(
    () => validateMatch(invalidMatch),
    Error,
    "Expected array",
  );
});

Deno.test("MatchSchema - valid match object with NO_READER_ID", () => {
  const validMatch = {
    id: "match1",
    reader_id: NO_READER_ID,
    participant_info: [
      {
        participant_id: "player1",
        score: 100,
        pre_rating: 1500,
        post_rating: 1510,
        ranking: 1,
      },
    ],
    played_at: "2023-01-01T00:00:00.000Z",
    content: "test-content",
  };

  const result = validateMatch(validMatch);
  assertEquals(result.id, validMatch.id);
  assertEquals(result.reader_id, NO_READER_ID);
  assertEquals(result.participant_info, validMatch.participant_info);
});

Deno.test("MatchSchema - invalid match object without reader_id", () => {
  const invalidMatch = {
    id: "match1",
    participant_info: [
      {
        participant_id: "player1",
        score: 100,
        pre_rating: 1500,
        post_rating: 1510,
        ranking: 1,
      },
    ],
    played_at: "2023-01-01T00:00:00.000Z",
    content: "test-content",
  };

  assertThrows(
    () => validateMatch(invalidMatch),
    Error,
    "Required",
  );
});
