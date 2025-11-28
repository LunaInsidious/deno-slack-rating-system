import { assert, assertThrows } from "@std/assert";
import { validateParticipantsAndReader } from "../../utils/parsers.ts";

Deno.test("validateParticipantsAndReader - 正常な2人の参加者", () => {
  const participants = ["player1", "player2"];
  const reader = "reader1";

  // エラーが発生しないことを確認
  validateParticipantsAndReader(participants, reader);
  assert(true); // 例外が発生しなければテスト成功
});

Deno.test("validateParticipantsAndReader - 正常な4人の参加者", () => {
  const participants = ["alice", "bob", "charlie", "diana"];
  const reader = "reader1";

  // エラーが発生しないことを確認
  validateParticipantsAndReader(participants, reader);
  assert(true); // 例外が発生しなければテスト成功
});

Deno.test("validateParticipantsAndReader - 読み手なし", () => {
  const participants = ["player1", "player2"];

  // 読み手なしでもエラーが発生しないことを確認
  validateParticipantsAndReader(participants);
  assert(true); // 例外が発生しなければテスト成功
});

Deno.test("validateParticipantsAndReader - 読み手なし（参加者内重複）", () => {
  const participants = ["player1", "player1"];

  assertThrows(
    () => validateParticipantsAndReader(participants),
    Error,
    "参加者が重複しています。",
  );
});

Deno.test("validateParticipantsAndReader - エラー: 参加者が1人のみ", () => {
  const participants = ["player1"];
  const reader = "reader1";

  assertThrows(
    () => validateParticipantsAndReader(participants, reader),
    Error,
    "参加者は2名以上必要です。",
  );
});

Deno.test("validateParticipantsAndReader - エラー: 参加者が0人", () => {
  const participants: string[] = [];
  const reader = "reader1";

  assertThrows(
    () => validateParticipantsAndReader(participants, reader),
    Error,
    "参加者は2名以上必要です。",
  );
});

Deno.test("validateParticipantsAndReader - エラー: 参加者内での重複", () => {
  const participants = ["player1", "player1"];
  const reader = "reader1";

  assertThrows(
    () => validateParticipantsAndReader(participants, reader),
    Error,
    "参加者が重複しています。",
  );
});

Deno.test("validateParticipantsAndReader - エラー: 参加者内での重複（3人中2人重複）", () => {
  const participants = ["player1", "player2", "player1"];
  const reader = "reader1";

  assertThrows(
    () => validateParticipantsAndReader(participants, reader),
    Error,
    "参加者が重複しています。",
  );
});

Deno.test("validateParticipantsAndReader - エラー: 読み手が参加者に含まれる", () => {
  const participants = ["player1", "player2", "reader1"];
  const reader = "reader1";

  assertThrows(
    () => validateParticipantsAndReader(participants, reader),
    Error,
    "参加者が重複しています。",
  );
});

Deno.test("validateParticipantsAndReader - 空文字列を含む参加者", () => {
  const participants = ["player1", "", "player2"];
  const reader = "reader1";

  // 空文字列も有効な参加者IDとして扱われる
  validateParticipantsAndReader(participants, reader);
  assert(true); // 例外が発生しなければテスト成功
});

Deno.test("validateParticipantsAndReader - 空文字列の重複", () => {
  const participants = ["player1", "", ""];
  const reader = "reader1";

  assertThrows(
    () => validateParticipantsAndReader(participants, reader),
    Error,
    "参加者が重複しています。",
  );
});
