export function validateParticipantsAndReader(participants: string[], reader: string) {
  if (participants.length < 2) throw new Error("参加者は2名以上必要です。");
  const participantsAndReader = [...participants, reader];
  const participantsAndReaderMap = new Set(participantsAndReader);
  if (participantsAndReader.length !== participantsAndReaderMap.size) {
    throw new Error("参加者が重複しています。");
  }
}
