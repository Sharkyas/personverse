// The metrics suite as the app shows it: one list of cards, each with a plain-English label, the number, how it was
// obtained (measured on held-out people, simulated, or waiting for the app's own data) and a line saying what it means.
// Display only. The numbers come from metrics.json, written by scripts/metrics/metrics_suite.py and ts_checks.ts.
import metrics from "./metrics.json";
import { TRAITS, type Trait } from "../params";

export type MetricStatus = "measured" | "simulated" | "cross-sectional" | "pending";
export type MetricCard = {
  id: string;
  group: "Scores" | "Probabilities" | "Type letters" | "Answer quality" | "Test length" | "Forecast" | "Speed" | "Live";
  label: string;
  /** formatted for display, e.g. "0.85" or "81%"; null while pending */
  value: string | null;
  status: MetricStatus;
  /** what it means, one sentence, no jargon */
  meaning: string;
  /** how it was worked out, one sentence */
  how: string;
};

const pc = (x: number) => `${Math.round(x * 100)}%`;
const f2 = (x: number) => x.toFixed(2);
const M = metrics;
const cond = (label: string) => M.type_recovery.conditions.find((c) => c.label.startsWith(label))!;
const base = cond("Big Five only");
const direct12 = cond("+ 12 direct statements per letter");
const adaptiveType = cond("Adaptive follow-ups");
const nTest = M.n.test.toLocaleString("en-GB");

export const METRIC_CARDS: MetricCard[] = [
  {
    id: "omega",
    group: "Scores",
    label: "Reliability (omega)",
    value: f2(M.reliability.mean_omega),
    status: "measured",
    meaning: "How much of a trait score is signal rather than noise. 1.00 would be perfect, and 0.80 is the usual bar for a good scale.",
    how: `McDonald's omega for each ten-statement scale, averaged over the five traits, on ${nTest} held-out people.`,
  },
  {
    id: "auc",
    group: "Probabilities",
    label: "Ranking score (AUC)",
    value: f2(M.heldout.pooled.auc),
    status: "measured",
    meaning: "How well the test tells people apart. 0.50 is a coin flip and 1.00 is perfect.",
    how: "Half of each person's answers were used to predict where the other half would land.",
  },
  {
    id: "calibration",
    group: "Probabilities",
    label: "Calibration error",
    value: `${(M.heldout.pooled.ece * 100).toFixed(1)} pts`,
    status: "measured",
    meaning: "When the test says 70%, it should happen about 70% of the time. This is the average gap between what it said and what happened.",
    how: `Expected calibration error over ${M.heldout.pooled.n_predictions.toLocaleString("en-GB")} held-out predictions in ten bands.`,
  },
  {
    id: "brier-skill",
    group: "Probabilities",
    label: "Skill over guessing",
    value: pc(M.heldout.pooled.brier_skill),
    status: "measured",
    meaning: "How much closer its probabilities are to what happened than always saying 50/50. 0% is no better, 100% is perfect.",
    how: "Brier skill score against a constant 50% forecast, on the same held-out predictions.",
  },
  {
    id: "confident",
    group: "Probabilities",
    label: "Right when sure",
    value: pc(M.heldout.pooled.accuracy_when_confident),
    status: "measured",
    meaning: `When the test is at least 80% sure, this is how often it is right. It is that sure in ${pc(M.heldout.pooled.share_confident)} of calls and flags the rest as in between.`,
    how: "Accuracy of held-out predictions at or beyond 80%.",
  },
  {
    id: "coverage",
    group: "Probabilities",
    label: "80% ranges that held the truth",
    value: pc(M.coverage.pooled["0.8"]),
    status: "measured",
    meaning: "A range the test calls 80% should contain the real score 80% of the time. Close to 80% means the error bars are honest.",
    how: "Ranges predicted from half of each person's answers, checked against the other half.",
  },
  {
    id: "letter-halves",
    group: "Type letters",
    label: "Same letter from two halves",
    value: pc(M.letter_stability.halves.mean_letter),
    status: "measured",
    meaning: `The test split into two halves that share no statements gives the same letter this often, and all four letters ${pc(M.letter_stability.halves.all_four)} of the time. Letters marked clear repeat ${pc(M.letter_stability.halves.by_band.clear.agreement)} of the time; borderline ones ${pc(M.letter_stability.halves.by_band.borderline.agreement)}.`,
    how: `Letters worked out twice per person from 25 statements each, for ${nTest} held-out people.`,
  },
  {
    id: "stability-forecast",
    group: "Type letters",
    label: "Retest forecast error",
    value: `${(M.letter_stability.halves.stability_forecast_ece * 100).toFixed(1)} pts`,
    status: "measured",
    meaning: "Each letter comes with a chance that it would repeat on another sitting. This is how far that stated chance is from what happened.",
    how: "Stated chance of the same letter from one half of the test, against whether the other half agreed.",
  },
  {
    id: "type-recovery",
    group: "Type letters",
    label: "Right four-letter type",
    value: `${pc(base.type_accuracy)} → ${pc(direct12.type_accuracy)}`,
    status: "simulated",
    meaning: `From Big Five scores alone the exact type is right ${pc(base.type_accuracy)} of the time, which is why types used to flip. Adding 12 direct statements per letter takes it to ${pc(direct12.type_accuracy)}, and the true type is one of the top two ${pc(direct12.top_two_accuracy)} of the time.`,
    how: "Simulated people with a known type. The direct statements use assumed quality until real answers are collected.",
  },
  {
    id: "letter-recovery",
    group: "Type letters",
    label: "Right letter",
    value: `${pc(base.mean_letter_accuracy)} → ${pc(direct12.mean_letter_accuracy)}`,
    status: "simulated",
    meaning: `Each single letter, before and after the direct statements. With adaptive follow-ups it reaches ${pc(adaptiveType.mean_letter_accuracy)} using about ${Math.round(Number(adaptiveType.mean_direct_statements))} extra statements instead of 48.`,
    how: "Same simulation as above.",
  },
  {
    id: "careless",
    group: "Answer quality",
    label: "Random answering caught",
    value: pc(M.quality.detection["random answers"].caught_now),
    status: "simulated",
    meaning: `Share of made-up random answer sheets the checks reject, up from ${pc(M.quality.detection["random answers"].caught_before)}. They flag ${pc(M.quality.real_people_flagged.now)} of real people.`,
    how: "Generated careless answer sheets mixed with real held-out people. The false-alarm rate is measured on the real people.",
  },
  {
    id: "adaptive",
    group: "Test length",
    label: "Fewer questions, same answer",
    value: pc(M.adaptive.share_saved),
    status: "measured",
    meaning: `The adaptive order needs about ${Math.round(M.adaptive.mean_statements)} statements instead of 50 and its scores correlate ${f2(M.adaptive.mean_correlation_with_full_test)} with the full test.`,
    how: `The app's adaptive code replayed on ${M.adaptive.people.toLocaleString("en-GB")} real people's answers.`,
  },
  {
    id: "forecast-direction",
    group: "Forecast",
    label: "Ageing curve matches real age groups",
    value: M.forecast_check ? pc(M.forecast_check.same_direction) : null,
    status: "cross-sectional",
    meaning: M.forecast_check
      ? `The forecast's expected change with age points the same way as the gap between real age groups this often, and is off by ${f2(M.forecast_check.mean_abs_error_sd)} of a standard deviation on average.`
      : "Needs a response file that records age.",
    how: "Predicted change between age bands against the observed difference in an open dataset. Different age groups are different people, so this checks the curve, not any one forecast.",
  },
  {
    id: "latency",
    group: "Speed",
    label: "Scoring time (p95)",
    value: `${M.latency.new_scoring_ms.p95.toFixed(1)} ms`,
    status: "measured",
    meaning: "95 in 100 results are computed faster than this. It covers the calculation only, not the network.",
    how: "All trait scores, answer checks and letter probabilities for 1,000 real answer sheets on one processor core.",
  },
  {
    id: "completion",
    group: "Live",
    label: "Completion rate",
    value: null,
    status: "pending",
    meaning: "Share of people who start the test and reach their results.",
    how: "completion() in appMetrics.ts over the app's own attempts, once it logs them.",
  },
  {
    id: "retest",
    group: "Live",
    label: "Same type on a real retake",
    value: null,
    status: "pending",
    meaning: "How often people who come back get the same letters. This is the real version of the two-halves check.",
    how: "letterRetest() over pairs of sittings from the tracker.",
  },
  {
    id: "forecast-coverage",
    group: "Live",
    label: "Forecast ranges that held",
    value: null,
    status: "pending",
    meaning: "Share of tracker check-ins that landed inside the range forecast for them, with the Brier skill of each stated chance of change.",
    how: "intervalCoverage() and brierSkill() over tracker check-ins against the forecast stored at baseline.",
  },
  {
    id: "validity",
    group: "Live",
    label: "Agreement with a second measure",
    value: null,
    status: "pending",
    meaning: "Per-trait correlation between the long test and a separate measure of the same person, such as the quick test or a friend's rating.",
    how: "traitAgreement() over people who have both.",
  },
];

/** Per-trait rows for a detail table: reliability, ranking score, calibration and interval coverage. */
export const TRAIT_METRICS = TRAITS.map((t: Trait) => ({
  trait: t,
  omega: M.reliability.traits[t].omega,
  omegaCi: M.reliability.traits[t].omega_ci as [number, number],
  alpha: M.reliability.traits[t].alpha,
  auc: M.heldout.traits[t].auc,
  aucCi: M.heldout.traits[t].auc_ci as [number, number],
  brierSkill: M.heldout.traits[t].brier_skill,
  ece: M.heldout.traits[t].ece,
  coverage80: M.coverage.traits[t]["0.8"],
  adaptiveR: M.adaptive.correlation_with_full_test[t],
}));

/** Points for the pooled calibration plot (predicted against observed, ten bands). */
export const CALIBRATION_CURVE = M.heldout.pooled.calibration;
/** Points for the "will this letter repeat?" calibration plot. */
export const STABILITY_CURVE = M.letter_stability.halves.stability_forecast_curve;
/** Rows for the type-recovery table: what each amount of direct questioning buys. */
export const TYPE_RECOVERY = M.type_recovery.conditions;
export const LETTER_STABILITY = M.letter_stability;
export const QUALITY_DETECTION = M.quality;
export const METRICS_SOURCE = { n: M.n, source: M.source };

export const metricCards = (status?: MetricStatus) => (status ? METRIC_CARDS.filter((c) => c.status === status) : METRIC_CARDS);
