export function validateParticipantsAndReader(participants: string[], reader?: string) {
  if (participants.length < 2) throw new Error("参加者は2名以上必要です。");

  // 読み手が指定されていない場合は参加者内の重複のみチェック
  if (!reader) {
    const participantsSet = new Set(participants);
    if (participants.length !== participantsSet.size) {
      throw new Error("参加者が重複しています。");
    }
    return;
  }

  // 読み手が指定されている場合は参加者と読み手両方の重複をチェック
  const participantsAndReader = [...participants, reader];
  const participantsAndReaderMap = new Set(participantsAndReader);
  if (participantsAndReader.length !== participantsAndReaderMap.size) {
    throw new Error("参加者が重複しています。");
  }
}
