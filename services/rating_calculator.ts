import { Content } from "../schemas/index.ts";

export class RatingCalculator {
  /**
   * Elo レーティングを参考にした計算
   */
  public calculateRatingChanges(
    participantIds: string[],
    ratings: Map<string, number>,
    scores: Map<string, number>,
    content: Content,
  ): Map<string, number> {
    if (participantIds.length === 0) return new Map();

    // --- 実績側: max(D, ε) ---
    const clampedScoresById = new Map<string, number>();
    let sumClamped = 0;
    for (const id of participantIds) {
      const s = scores.get(id);
      if (s === undefined) {
        throw new Error(`Score not found for participant: ${id}`);
      }
      // 1e-6はゼロ点対策
      const clamped = Math.max(s, 1e-6);
      clampedScoresById.set(id, clamped);
      sumClamped += clamped;
    }

    // --- 期待側: softmax(exp(E/τ)) ---
    const scaledRatings: number[] = [];
    for (const id of participantIds) {
      const r = ratings.get(id);
      if (r === undefined) {
        throw new Error(`Rating not found for participant: ${id}`);
      }
      scaledRatings.push(r / content.temperature);
    }
    const maxScaled = Math.max(...scaledRatings); // 数値安定化
    const expById = new Map<string, number>();
    let sumExps = 0;
    for (let i = 0; i < participantIds.length; i++) {
      const id = participantIds[i];
      const scaled = scaledRatings[i];
      const e = Math.exp(scaled - maxScaled);
      expById.set(id, e);
      sumExps += e;
    }

    // --- Δ計算 ---
    const deltas = new Map<string, number>();
    for (const id of participantIds) {
      const actual = clampedScoresById.get(id)! / sumClamped;
      const expected = expById.get(id)! / sumExps;
      const delta = content.slope * (actual - expected);
      deltas.set(id, delta);
    }

    return deltas;
  }
}
