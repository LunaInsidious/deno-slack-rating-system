import { assert, assertThrows } from "@std/assert";
import { validateParticipants } from "../../utils/parsers.ts";

Deno.test("validateParticipants - 正常な2人の参加者", () => {
  const participants = ["player1", "player2"];

  // エラーが発生しないことを確認
  validateParticipants(participants);
  assert(true); // 例外が発生しなければテスト成功
});

Deno.test("validateParticipants - 正常な4人の参加者", () => {
  const participants = ["alice", "bob", "charlie", "diana"];

  // エラーが発生しないことを確認
  validateParticipants(participants);
  assert(true); // 例外が発生しなければテスト成功
});

Deno.test("validateParticipants - エラー: 参加者が1人のみ", () => {
  const participants = ["player1"];

  assertThrows(
    () => validateParticipants(participants),
    Error,
    "参加者は2名以上必要です。",
  );
});

Deno.test("validateParticipants - エラー: 参加者が0人", () => {
  const participants: string[] = [];

  assertThrows(
    () => validateParticipants(participants),
    Error,
    "参加者は2名以上必要です。",
  );
});

Deno.test("validateParticipants - エラー: 重複した参加者（2人中2人重複）", () => {
  const participants = ["player1", "player1"];

  assertThrows(
    () => validateParticipants(participants),
    Error,
    "参加者が重複しています。",
  );
});

Deno.test("validateParticipants - エラー: 重複した参加者（3人中2人重複）", () => {
  const participants = ["player1", "player2", "player1"];

  assertThrows(
    () => validateParticipants(participants),
    Error,
    "参加者が重複しています。",
  );
});

Deno.test("validateParticipants - 空文字列を含む参加者", () => {
  const participants = ["player1", "", "player2"];

  // 空文字列も有効な参加者IDとして扱われる
  validateParticipants(participants);
  assert(true); // 例外が発生しなければテスト成功
});

Deno.test("validateParticipants - 空文字列の重複", () => {
  const participants = ["player1", "", ""];

  assertThrows(
    () => validateParticipants(participants),
    Error,
    "参加者が重複しています。",
  );
});
