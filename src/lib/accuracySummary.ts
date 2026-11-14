import metrics from "./ipipMetrics.json";
import { TRAITS, type Trait } from "./params";

/** Display helper: plain-number summary of the held-out check in ipipMetrics.json. No model logic. */
export type CalPoint = { bin: number; n: number; predicted: number; observed: number };
export type TraitAccuracy = {
  trait: Trait;
  alpha: number;
  auc: number;
  brier: number;
  ece: number;
  shareConfident: number;
  accConfident: number;
  calibration: CalPoint[];
};

const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;

export function accuracySummary() {
  const traits: TraitAccuracy[] = TRAITS.map((t) => {
    const m = metrics.traits[t];
    return {
      trait: t,
      alpha: m.alpha_test,
      auc: m.auc,
      brier: m.brier,
      ece: m.ece,
      shareConfident: m.share_confident,
      accConfident: m.accuracy_when_confident,
      calibration: m.calibration,
    };
  });
  return {
    nTotal: metrics.n_total,
    nTrain: metrics.n_train,
    nTest: metrics.n_test,
    traits,
    accConfident: mean(traits.map((t) => t.accConfident)),
    shareConfident: mean(traits.map((t) => t.shareConfident)),
    auc: mean(traits.map((t) => t.auc)),
    ece: mean(traits.map((t) => t.ece)),
    alpha: mean(traits.map((t) => t.alpha)),
  };
}
