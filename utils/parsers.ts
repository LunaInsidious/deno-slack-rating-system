export function validateParticipantsAndReader(participants: string[], reader?: string) {
  if (participants.length < 2) throw new Error("参加者は2名以上必要です。");

  // 重複チェックの対象を準備（読み手が指定されている場合は含める）
  const allMembers = reader ? [...participants, reader] : participants;
  const membersSet = new Set(allMembers);

  if (allMembers.length !== membersSet.size) {
    throw new Error("参加者が重複しています。");
  }
}
