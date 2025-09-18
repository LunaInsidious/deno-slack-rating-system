export function validateParticipants(participants: string[]) {
  if (participants.length < 2) throw new Error("参加者は2名以上必要です。");
  const participantMap = new Set(participants);
  if (participants.length !== participantMap.size) throw new Error("参加者が重複しています。");
}
