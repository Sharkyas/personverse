"""The metrics suite: every number the app shows about its own accuracy, computed on an open response file.

Usage: python3 scripts/metrics/metrics_suite.py data/ipip_ffm_sample100k.tsv.gz [--age-file data/ipip-big5.csv] [--export-test out.json]
       (run scripts/metrics/fit_irt.py on the same file first; then `node scripts/run-ts.cjs scripts/metrics/ts_checks.ts out.json`
        adds the checks that run the app's own TypeScript: adaptive test, forecast cross-check, latency)
Writes src/lib/bank/metrics.json (shown in the app), research/metrics_suite.json (same content) and src/lib/bank/qualityCutoffs.json.

What is measured on real, held-out people: reliability, the probability engine (AUC, calibration, Brier skill), agreement of the
type letters between two halves of the test, interval coverage, and how often real people trip the answer-quality checks.
What is simulated (and labelled so): type recovery with direct type statements, whose item parameters are assumed until
response data exists, and detection of careless answering, where the careless respondents are generated."""
import json, math, os, sys
import numpy as np
from scipy.optimize import minimize
from scipy.stats import rankdata
from common import TRAITS, REV, NODES, PRIOR, SEED, load, split, grm_probs, eap, posterior, calibration, phi

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
PATH = sys.argv[1]
EXPORT = sys.argv[sys.argv.index("--export-test") + 1] if "--export-test" in sys.argv else None
rng = np.random.default_rng(SEED)
r3 = lambda x: round(float(x), 3)

X, age, secs = load(PATH)
n_total = len(X["E"])
tr, te = split(n_total, age)
IRT = json.load(open(os.path.join(ROOT, "src/lib/bank/ipip50Irt.json")))
PARAMS = {t: [(v["a"], v["b"]) for v in IRT["traits"][t]["items"].values()] for t in TRAITS}
MBTI = json.load(open(os.path.join(ROOT, "src/lib/mbti.json")))
DIMS = ["EI", "SN", "TF", "JP"]
CUT = {d: MBTI["model"][d]["cut"] for d in DIMS}
# Correlations of each type scale with the Big Five (McCrae & Costa, 1989): the same constants as NEO_W in src/lib/mbti.ts.
NEO_W = {"EI": {"E": -0.72, "N": 0.16}, "SN": {"O": 0.71, "E": 0.15}, "TF": {"A": 0.45, "C": -0.18, "N": 0.15}, "JP": {"C": -0.48, "O": 0.28, "E": 0.17}}
ODD, EVEN = [0, 2, 4, 6, 8], [1, 3, 5, 7, 9]

out = {
    "source": "openpsychometrics.org IPIP Big Five Factor Markers responses" + (" (BIG5, 2012; adults 18+)" if age is not None else " (IPIP-FFM, 2018; one record per IP address; a 100,000-row random sample of the 1,015,341)") + ". 70/30 split, seed 20261114" + ". Everything under `measured` uses the 30% nobody's scoring was fitted on.",
    "n": {"total": int(n_total), "train": int(len(tr)), "test": int(len(te))},
}


def alpha(M):
    k = M.shape[1]
    return k / (k - 1) * (1 - M.var(axis=0).sum() / M.sum(axis=1).var())


def omega(M):
    """McDonald's omega (total) from a one-factor minimum-residual fit to the item correlations."""
    R = np.corrcoef(M.T)
    vals, vecs = np.linalg.eigh(R)
    start = np.abs(vecs[:, -1]) * math.sqrt(max(vals[-1] - 1, 0.1) / max(vals[-1], 1e-9) * vals[-1] / 1)
    start = np.clip(start, 0.2, 0.9)
    off = ~np.eye(len(R), dtype=bool)
    lam = minimize(lambda l: ((R - np.outer(l, l))[off] ** 2).sum(), start, method="L-BFGS-B", bounds=[(0.01, 0.99)] * len(R)).x
    return lam.sum() ** 2 / (lam.sum() ** 2 + (1 - lam**2).sum())


def auc(scores, labels):
    labels = np.asarray(labels, bool)
    r = rankdata(scores)
    npos, nneg = labels.sum(), (~labels).sum()
    return float((r[labels].sum() - npos * (npos + 1) / 2) / (npos * nneg))


def boot_ci(fn, n, reps=200):
    vals = [fn(rng.integers(0, n, n)) for _ in range(reps)]
    return [r3(np.percentile(vals, 2.5)), r3(np.percentile(vals, 97.5))]


def cal_slope(p, y):
    """Calibration slope and intercept: logistic regression of the outcome on logit(p). Slope 1 and intercept 0 = perfectly calibrated."""
    x = np.log(np.clip(p, 1e-4, 1 - 1e-4) / (1 - np.clip(p, 1e-4, 1 - 1e-4)))
    b = np.zeros(2)
    A = np.column_stack([np.ones_like(x), x])
    for _ in range(25):
        mu = 1 / (1 + np.exp(-A @ b))
        b += np.linalg.solve(A.T @ (A * (mu * (1 - mu))[:, None]) + 1e-9 * np.eye(2), A.T @ (y - mu))
    return r3(b[1]), r3(b[0])


# ---------------------------------------------------------------- 1. reliability
rel = {}
for t in TRAITS:
    M = X[t][te].astype(float)
    half_r = np.corrcoef(M[:, ODD].mean(1), M[:, EVEN].mean(1))[0, 1]
    _, se = eap(X[t][te], PARAMS[t])
    rel[t] = {
        "omega": r3(omega(M)),
        "omega_ci": boot_ci(lambda i: omega(M[i]), len(M), 100),
        "alpha": r3(alpha(M)),
        "split_half": r3(2 * half_r / (1 + half_r)),
        "irt_marginal": r3(1 - (se**2).mean()),
        "items": 10,
    }
out["reliability"] = {"traits": rel, "mean_omega": r3(np.mean([v["omega"] for v in rel.values()]))}
print("omega", {t: rel[t]["omega"] for t in TRAITS})

# ---------------------------------------------------------------- 2. probability engine on held-out people
# From one half of a scale, predict whether the other half lands above the median: P = Φ((ρ·z − z_cut) / √(1−ρ²)), ρ fitted on
# the training split. This is the formula behind the app's letter probabilities and tracker bands.
held, pooled_p, pooled_y = {}, [], []
cover_levels = [0.5, 0.8, 0.9, 0.95]
cover = {t: {} for t in TRAITS}
for t in TRAITS:
    xtr, ytr = X[t][tr][:, ODD].mean(1), X[t][tr][:, EVEN].mean(1)
    xte, yte = X[t][te][:, ODD].mean(1), X[t][te][:, EVEN].mean(1)
    mx, sx, my, sy = xtr.mean(), xtr.std(), ytr.mean(), ytr.std()
    rho = np.corrcoef(xtr, ytr)[0, 1]
    med = np.median(ytr)
    p = phi((rho * (xte - mx) / sx - (med - my) / sy) / math.sqrt(1 - rho * rho))
    y = (yte > med).astype(float)
    brier, ece, curve = calibration(p, y)
    base = (ytr > med).mean()
    brier_ref = ((base - y) ** 2).mean()
    conf = (p >= 0.8) | (p <= 0.2)
    slope, intercept = cal_slope(p, y)
    held[t] = {
        "auc": r3(auc(p, y)),
        "auc_ci": boot_ci(lambda i: auc(p[i], y[i]), len(p)),
        "brier": r3(brier),
        "brier_baseline": r3(brier_ref),
        "brier_skill": r3(1 - brier / brier_ref),
        "ece": r3(ece),
        "calibration_slope": slope,
        "calibration_intercept": intercept,
        "share_confident": r3(conf.mean()),
        "accuracy_when_confident": r3(((p[conf] >= 0.5) == (y[conf] > 0.5)).mean()),
        "calibration": curve,
    }
    pooled_p.append(p)
    pooled_y.append(y)
    # Interval coverage with the same engine: the other half's standardised score should fall inside ρ·z ± q·√(1−ρ²).
    zy = (yte - my) / sy
    centre, spread = rho * (xte - mx) / sx, math.sqrt(1 - rho * rho)
    for lv in cover_levels:
        q = {0.5: 0.6745, 0.8: 1.2816, 0.9: 1.6449, 0.95: 1.96}[lv]
        cover[t][str(lv)] = r3((np.abs(zy - centre) <= q * spread).mean())
pp, py = np.concatenate(pooled_p), np.concatenate(pooled_y)
brier, ece, curve = calibration(pp, py)
conf = (pp >= 0.8) | (pp <= 0.2)
slope, intercept = cal_slope(pp, py)
out["heldout"] = {
    "what": "From half of a person's answers on a trait, the probability that the other half lands above the median.",
    "traits": held,
    "pooled": {
        "auc": r3(np.mean([held[t]["auc"] for t in TRAITS])),
        "brier": r3(brier),
        "brier_skill": r3(1 - brier / 0.25),
        "ece": r3(ece),
        "calibration_slope": slope,
        "calibration_intercept": intercept,
        "share_confident": r3(conf.mean()),
        "accuracy_when_confident": r3(((pp[conf] >= 0.5) == (py[conf] > 0.5)).mean()),
        "calibration": curve,
        "n_predictions": int(len(pp)),
    },
}
out["coverage"] = {
    "what": "How often the other half of a person's answers fell inside the interval predicted from the first half. A calibrated 80% interval contains the truth 80% of the time.",
    "traits": cover,
    "pooled": {str(lv): r3(np.mean([cover[t][str(lv)] for t in TRAITS])) for lv in cover_levels},
}
print("heldout", out["heldout"]["pooled"]["auc"], "skill", out["heldout"]["pooled"]["brier_skill"], "coverage", out["coverage"]["pooled"])


# ---------------------------------------------------------------- letter engine (mirror of src/lib/bank/typeEngine.ts)
STEP = NODES[1] - NODES[0]
STEPS = np.array([-1.6, -0.6, 0.6, 1.6])


def letters(z, rel_t, evidence=()):
    """z: {trait: array}; rel_t: {trait: float}; evidence: list of ({dim: n×5 counts of keyed answers}, a).
    Returns per dim: pSecond, call (bool = second letter), p of the call, pSameOnRetest."""
    res = {}
    for d in DIMS:
        w = {t: c * math.sqrt(rel_t[t]) for t, c in NEO_W[d].items()}
        sd0 = math.sqrt(1 - sum(v * v for v in w.values()))
        mu0 = sum(w[t] * z[t] for t in w)
        cut = CUT[d]
        ev = [(c[d], a) for c, a in evidence if d in c]
        if ev:
            logw = -0.5 * ((NODES[None, :] - mu0[:, None]) / sd0) ** 2
            for counts, a in ev:
                logw += counts @ np.log(grm_probs(a, cut + STEPS)).T
            logw -= logw.max(axis=1, keepdims=True)
            wts = np.exp(logw)
            wts /= wts.sum(axis=1, keepdims=True)
            frac = np.clip((NODES + STEP / 2 - cut) / STEP, 0, 1)
            p2 = wts @ frac
            m = wts @ NODES
            s2 = np.maximum(wts @ NODES**2 - m**2, 1e-9)
        else:
            p2, m, s2 = phi((mu0 - cut) / sd0), mu0, np.full_like(mu0, sd0**2)
        mu0r = sum(w[t] * rel_t[t] * z[t] for t in w)
        v0 = sum(w[t] ** 2 * (1 - rel_t[t] ** 2) for t in w)
        tau = np.maximum(0, 1 / s2 - 1 / sd0**2)
        has = tau > 0
        safe = np.where(has, tau, 1)
        e_r = np.where(has, s2 * (mu0r / sd0**2 + tau * m), mu0r)
        v_r = np.where(has, s2**2 * (v0 / sd0**4 + tau**2 * (s2 + 1 / safe)), v0)
        p2r = 1 - phi((cut - e_r) / np.sqrt(np.maximum(v_r, 1e-9)))
        call = p2 >= 0.5
        res[d] = {"p2": p2, "call": call, "p": np.where(call, p2, 1 - p2), "same": np.where(call, p2r, 1 - p2r)}
    return res


def type_of(res):
    return sum(res[d]["call"].astype(int) << (3 - k) for k, d in enumerate(DIMS))


# ---------------------------------------------------------------- 3. letter stability between two halves of the test
norm_half = {t: {h: (X[t][tr][:, idx].mean(1).mean(), X[t][tr][:, idx].mean(1).std()) for h, idx in (("a", ODD), ("b", EVEN))} for t in TRAITS}
rho_half = {t: float(np.corrcoef(X[t][tr][:, ODD].mean(1), X[t][tr][:, EVEN].mean(1))[0, 1]) for t in TRAITS}
zA = {t: (X[t][te][:, ODD].mean(1) - norm_half[t]["a"][0]) / norm_half[t]["a"][1] for t in TRAITS}
zB = {t: (X[t][te][:, EVEN].mean(1) - norm_half[t]["b"][0]) / norm_half[t]["b"][1] for t in TRAITS}
LA, LB = letters(zA, rho_half), letters(zB, rho_half)
agree = {d: LA[d]["call"] == LB[d]["call"] for d in DIMS}
all4 = np.all([agree[d] for d in DIMS], axis=0)
bands = {"clear": (0.85, 1.01), "likely": (0.65, 0.85), "borderline": (0.0, 0.65)}
pa = np.concatenate([LA[d]["p"] for d in DIMS])
sa = np.concatenate([LA[d]["same"] for d in DIMS])
ag = np.concatenate([agree[d] for d in DIMS]).astype(float)
_, stab_ece, stab_curve = calibration(sa, ag)
halves = {
    "per_letter": {d: r3(agree[d].mean()) for d in DIMS},
    "mean_letter": r3(np.mean([agree[d].mean() for d in DIMS])),
    "all_four": r3(all4.mean()),
    "all_four_ci": boot_ci(lambda i: all4[i].mean(), len(all4)),
    "by_band": {b: {"share": r3(((pa >= lo) & (pa < hi)).mean()), "agreement": r3(ag[(pa >= lo) & (pa < hi)].mean())} for b, (lo, hi) in bands.items()},
    "predicted_same_letter": r3(sa.mean()),
    "stability_forecast_ece": r3(stab_ece),
    "stability_forecast_curve": stab_curve,
}

# Projection to the full 50 statements: two parallel full-length forms, each trait correlating at the Spearman–Brown value.
alpha_tr = {t: float(alpha(X[t][tr].astype(float))) for t in TRAITS}
obs_corr = np.corrcoef(np.column_stack([X[t][tr].mean(1) for t in TRAITS]).T)


def true_corr(r):
    C = obs_corr / np.sqrt(np.outer([r[t] for t in TRAITS], [r[t] for t in TRAITS]))
    np.fill_diagonal(C, 1)
    vals, vecs = np.linalg.eigh(C)
    C = (vecs * np.clip(vals, 1e-6, None)) @ vecs.T
    d = np.sqrt(np.diag(C))
    return C / np.outer(d, d)


def parallel_forms(r, n=200_000):
    tau = rng.multivariate_normal(np.zeros(5), true_corr(r), n)
    obs = lambda: {t: math.sqrt(r[t]) * tau[:, i] + math.sqrt(1 - r[t]) * rng.standard_normal(n) for i, t in enumerate(TRAITS)}
    a, b = letters(obs(), r), letters(obs(), r)
    same = {d: a[d]["call"] == b[d]["call"] for d in DIMS}
    return {"per_letter": {d: r3(same[d].mean()) for d in DIMS}, "mean_letter": r3(np.mean([same[d].mean() for d in DIMS])), "all_four": r3(np.all([same[d] for d in DIMS], axis=0).mean())}


rho_full = {t: 2 * rho_half[t] / (1 + rho_half[t]) for t in TRAITS}
check = parallel_forms(rho_half)
out["letter_stability"] = {
    "what": "The four letters worked out twice for each held-out person, from two halves of the test that share no statements (25 each). Agreement between the halves is a floor for the full test.",
    "halves": halves,
    "model_check": {"simulated_all_four_at_half_length": check["all_four"], "observed_all_four": halves["all_four"]},
    "full_length_projection": parallel_forms(rho_full) | {"note": "Two full 50-statement sittings on the same day, projected with the Spearman–Brown formula. Real sittings weeks apart agree a little less."},
    "published_retest": MBTI.get("retest"),
}
print("letter halves", halves["per_letter"], "all4", halves["all_four"], "check", check["all_four"], "full", out["letter_stability"]["full_length_projection"]["all_four"], "stab ece", halves["stability_forecast_ece"])

# ---------------------------------------------------------------- 4. type recovery (simulation)
norm_full = {t: (X[t][tr].mean(1).mean(), X[t][tr].mean(1).std()) for t in TRAITS}
N_SIM = 40_000
C_TRUE = true_corr(alpha_tr)
tau = rng.multivariate_normal(np.zeros(5), C_TRUE, N_SIM)
TAU = {t: tau[:, i] for i, t in enumerate(TRAITS)}
THETA = {}
for d in DIMS:
    lin = sum(c * TAU[t] for t, c in NEO_W[d].items())
    raw = lin + math.sqrt(1 - sum(c * c for c in NEO_W[d].values())) * rng.standard_normal(N_SIM)
    THETA[d] = raw / raw.std()
TRUE_TYPE = sum((THETA[d] > CUT[d]).astype(int) << (3 - k) for k, d in enumerate(DIMS))


def draw(a, b, theta):
    star = 1 / (1 + np.exp(-a * (theta[:, None] - np.asarray(b)[None, :])))
    return 1 + (rng.random(len(theta))[:, None] < star).sum(axis=1)


def sit_big_five():
    resp = {t: np.column_stack([draw(a, b, TAU[t]) for a, b in PARAMS[t]]) for t in TRAITS}
    return {t: (resp[t].mean(1) - norm_full[t][0]) / norm_full[t][1] for t in TRAITS}, resp


def sit_type(k, a):
    """k statements per letter, returned as the answers in asking order (n×k per dim)."""
    return {d: np.column_stack([draw(a, CUT[d] + STEPS, THETA[d]) for _ in range(k)]) for d in DIMS}


counts = lambda ans, k: {d: np.stack([(ans[d][:, :k] == c).sum(1) for c in range(1, 6)], axis=1).astype(float) for d in ans}


def evaluate(res, res2=None):
    acc = {d: r3((res[d]["call"] == (THETA[d] > CUT[d])).mean()) for d in DIMS}
    ty = type_of(res)
    # top-two: the true type is the top type, or the top type with its least certain letter flipped
    weakest = np.argmin(np.column_stack([res[d]["p"] for d in DIMS]), axis=1)
    second = ty ^ (1 << (3 - weakest))
    pl = np.concatenate([res[d]["p"] for d in DIMS])
    hit = np.concatenate([res[d]["call"] == (THETA[d] > CUT[d]) for d in DIMS]).astype(float)
    _, ece, _ = calibration(pl, hit)
    clear = pl >= 0.85
    o = {
        "letter_accuracy": acc,
        "mean_letter_accuracy": r3(np.mean(list(acc.values()))),
        "type_accuracy": r3((ty == TRUE_TYPE).mean()),
        "top_two_accuracy": r3(((ty == TRUE_TYPE) | (second == TRUE_TYPE)).mean()),
        "letter_ece": r3(ece),
        "share_clear": r3(clear.mean()),
        "accuracy_when_clear": r3(hit[clear].mean()) if clear.any() else None,
        "share_borderline": r3((pl < 0.65).mean()),
    }
    if res2 is not None:
        o["retest_same_type"] = r3((ty == type_of(res2)).mean())
        o["retest_same_letter"] = r3(np.mean([(res[d]["call"] == res2[d]["call"]).mean() for d in DIMS]))
        o["predicted_retest_same_letter"] = r3(np.mean([res[d]["same"].mean() for d in DIMS]))
    return o


z1, resp1 = sit_big_five()
z2, _ = sit_big_five()
conditions = []
for label, k, a in [
    ("Big Five only (50 statements)", 0, 1.4),
    ("+ 4 direct statements per letter", 4, 1.4),
    ("+ 8 direct statements per letter", 8, 1.4),
    ("+ 12 direct statements per letter", 12, 1.4),
    ("+ 12 per letter, weaker statements (a = 1.0)", 12, 1.0),
    ("+ 12 per letter, stronger statements (a = 1.8)", 12, 1.8),
]:
    if k:
        t1, t2 = sit_type(k, a), sit_type(k, a)
        res, res2 = letters(z1, alpha_tr, [(counts(t1, k), a)]), letters(z2, alpha_tr, [(counts(t2, k), a)])
    else:
        res, res2 = letters(z1, alpha_tr), letters(z2, alpha_tr)
    conditions.append({"label": label, "direct_per_letter": k, "discrimination": a, "mean_direct_statements": 4 * k} | evaluate(res, res2))
    print(label, conditions[-1]["mean_letter_accuracy"], conditions[-1]["type_accuracy"], conditions[-1]["top_two_accuracy"], conditions[-1].get("retest_same_type"), conditions[-1]["letter_ece"])


def adaptive(ans, zz, a=1.4, lo=4, hi=12, sure=0.85):
    """Follow-up rule of nextTypeItem: at least `lo` per letter, then keep going on a letter until it is `sure` or `hi` are used."""
    used = {d: np.full(N_SIM, hi) for d in DIMS}
    final = None
    for k in range(lo, hi + 1):
        res = letters(zz, alpha_tr, [(counts(ans, k), a)])
        if final is None:
            final = {d: {key: v.copy() for key, v in res[d].items()} for d in DIMS}
            done = {d: np.zeros(N_SIM, bool) for d in DIMS}
        for d in DIMS:
            live = ~done[d]
            for key in res[d]:
                final[d][key][live] = res[d][key][live]
            stop = live & (res[d]["p"] >= sure)
            used[d][stop] = k
            done[d] |= stop
    return final, sum(used[d] for d in DIMS)


t1, t2 = sit_type(12, 1.4), sit_type(12, 1.4)
fa, na = adaptive(t1, z1)
fb, _ = adaptive(t2, z2)
conditions.append({"label": "Adaptive follow-ups (4 to 12 per letter)", "direct_per_letter": "4-12", "discrimination": 1.4, "mean_direct_statements": r3(na.mean())} | evaluate(fa, fb))
print("retest predicted vs simulated", [(c["predicted_retest_same_letter"], c["retest_same_letter"]) for c in conditions])
print("adaptive", conditions[-1]["mean_direct_statements"], conditions[-1]["mean_letter_accuracy"], conditions[-1]["type_accuracy"])

# Simulation-based check of the IRT error bars: does the 80% interval contain the simulated true score 80% of the time?
irt_cover = {}
for t in TRAITS:
    P = posterior(resp1[t][:10_000], PARAMS[t])
    cdf = np.cumsum(P, axis=1)
    lo = NODES[np.argmax(cdf >= 0.1, axis=1)] - STEP / 2
    hi = NODES[np.argmax(cdf >= 0.9, axis=1)] + STEP / 2
    irt_cover[t] = r3(((TAU[t][:10_000] >= lo) & (TAU[t][:10_000] <= hi)).mean())
out["coverage"]["irt_interval_simulated"] = {"level": 0.8, "traits": irt_cover, "mean": r3(np.mean(list(irt_cover.values())))}

out["type_recovery"] = {
    "what": f"Simulation of {N_SIM:,} people with a known type. Big Five answers are generated from the item parameters fitted on real data; direct type statements use assumed parameters (discrimination a) because no response data exists for them yet, so their rows are design targets, not measurements.",
    "status": "simulated",
    "true_type_shares_match_uk": r3(np.mean(THETA["SN"] > CUT["SN"])),
    "conditions": conditions,
}

# ---------------------------------------------------------------- 5. answer-quality checks
ORDER = [(t, i) for i in range(10) for t in "ENACO"]  # the order the statements are asked in (src/lib/questions.ts)
REVMAT = np.array([(i + 1) in REV[t] for t, i in ORDER])
PAIRS = [((p["a"][0], int(p["a"][1:]) - 1), (p["b"][0], int(p["b"][1:]) - 1)) for p in IRT["consistency_pairs"]]
ITEM_MEANS = np.array([IRT["item_means"][f"{t}{i + 1}"] for t, i in ORDER])


def row_corr(a, b):
    a = a - a.mean(1, keepdims=True)
    b = b - b.mean(1, keepdims=True)
    den = np.sqrt((a * a).sum(1) * (b * b).sum(1))
    return np.where(den > 0, (a * b).sum(1) / np.where(den > 0, den, 1), 0)


def keyed_dict(raw):
    """raw answers n×50 in asking order → {trait: n×10 keyed}."""
    k = np.where(REVMAT[None, :], 6 - raw, raw)
    return {t: np.column_stack([k[:, ORDER.index((t, i))] for i in range(10)]) for t in TRAITS}


def raw_matrix(idx):
    return np.column_stack([np.where((i + 1) in REV[t], 6 - X[t][idx][:, i], X[t][idx][:, i]) for t, i in ORDER])


def quality_stats(raw):
    K = keyed_dict(raw)
    kmat = np.where(REVMAT[None, :], 6 - raw, raw).astype(float)
    # Coherence: do the person's answers hang together? Within-person correlation across the near-synonym pairs, plus the
    # correlation of their 50 keyed answers with the average person's.
    pa_ = np.column_stack([K[a[0]][:, a[1]] for a, _ in PAIRS]).astype(float)
    pb_ = np.column_stack([K[b[0]][:, b[1]] for _, b in PAIRS]).astype(float)
    coherence = row_corr(pa_, pb_) + row_corr(kmat, np.tile(ITEM_MEANS, (len(raw), 1)))
    gap = np.mean([np.abs(K[a[0]][:, a[1]].astype(float) - K[b[0]][:, b[1]]) for a, b in PAIRS], axis=0)
    l0 = e = v = 0
    for t in TRAITS:
        th, _ = eap(K[t], PARAMS[t])
        for j, (a, b) in enumerate(PARAMS[t]):
            p = grm_probs(a, b, th)
            lp = np.log(p)
            ex = (p * lp).sum(1)
            l0 = l0 + lp[np.arange(len(th)), K[t][:, j] - 1]
            e = e + ex
            v = v + (p * lp * lp).sum(1) - ex**2
    lz = (l0 - e) / np.sqrt(v)
    same = np.max([(raw == c).mean(1) for c in range(1, 6)], axis=0)
    run = np.ones(len(raw), int)
    longest = np.ones(len(raw), int)
    for j in range(1, raw.shape[1]):
        run = np.where(raw[:, j] == raw[:, j - 1], run + 1, 1)
        longest = np.maximum(longest, run)
    fwd, rev = raw[:, ~REVMAT].mean(1), raw[:, REVMAT].mean(1)
    # Even-odd consistency, as in src/lib/quality.ts: each trait scored from its odd and its even statements, correlated over the five traits.
    even_odd = row_corr(np.column_stack([K[t][:, ODD].mean(1) for t in "OCEAN"]), np.column_stack([K[t][:, EVEN].mean(1) for t in "OCEAN"]))
    return {"gap": gap, "lz": lz, "coherence": coherence, "same": same, "longest": longest, "fwd": fwd, "rev": rev, "even_odd": even_odd}


def flags(s, c):
    basic = (s["same"] >= 0.7) | (s["longest"] >= 12) | ((s["fwd"] >= 4.2) & (s["rev"] >= 4.2)) | ((s["fwd"] <= 1.8) & (s["rev"] <= 1.8)) | ((s["same"] < 0.7) & (s["even_odd"] < 0))
    new = (s["gap"] > c["pair_gap_max"]) | (s["lz"] < c["lz_min"]) | (s["coherence"] < c["coherence_min"])
    return basic, new, basic | new


s_train = quality_stats(raw_matrix(tr))
cut = {"pair_gap_max": r3(np.percentile(s_train["gap"], 99)), "lz_min": r3(np.percentile(s_train["lz"], 1)), "coherence_min": r3(np.percentile(s_train["coherence"], 1)), "longest_run_max": 12, "same_share_max": 0.7, "median_seconds_min": 2, "provisional": False}
real = raw_matrix(te)
s_real = quality_stats(real)
n = len(real)
fakes = {
    "random answers": rng.integers(1, 6, (n, 50)),
    "random answers, avoiding the extremes": rng.integers(2, 5, (n, 50)),
    "same answer throughout, with a few slips": np.where(rng.random((n, 50)) < 0.1, rng.integers(1, 6, (n, 50)), rng.integers(1, 6, (n, 1))),
    "a repeating pattern (1-2-3-4-5-4-3-2…)": np.tile(np.array([1, 2, 3, 4, 5, 4, 3, 2] * 7)[:50], (n, 1)),
    "careful for the first half, random for the second": np.column_stack([real[:, :25], rng.integers(1, 6, (n, 25))]),
}
b_real, n_real, a_real = flags(s_real, cut)
det = {}
for name, raw in fakes.items():
    s = quality_stats(raw)
    b, _, a = flags(s, cut)
    det[name] = {"caught_before": r3(b.mean()), "caught_now": r3(a.mean()), "auc_person_fit": r3(auc(-np.concatenate([s["lz"], s_real["lz"]]), np.r_[np.ones(n), np.zeros(n)])), "auc_pair_gap": r3(auc(np.concatenate([s["gap"], s_real["gap"]]), np.r_[np.ones(n), np.zeros(n)])), "auc_coherence": r3(auc(-np.concatenate([s["coherence"], s_real["coherence"]]), np.r_[np.ones(n), np.zeros(n)]))}
    print(name, det[name])
out["quality"] = {
    "what": "Real held-out people against generated careless respondents. 'Before' is the five checks in quality.ts (same answer, long runs, yes-saying both ways, even-odd consistency); 'now' adds the three here. Cut-offs for the three new checks are set so that each flags 1% of real people in the training split.",
    "status": "careless respondents are simulated; the false-alarm rate is measured on real people",
    "cutoffs": cut,
    "real_people_flagged": {"before": r3(b_real.mean()), "now": r3(a_real.mean())},
    "detection": det,
    "typical": {"pair_gap_median": r3(np.median(s_real["gap"])), "pair_gap_random": r3(np.median(quality_stats(fakes["random answers"])["gap"])), "lz_median": r3(np.median(s_real["lz"])), "coherence_median": r3(np.median(s_real["coherence"]))},
}
json.dump(cut, open(os.path.join(ROOT, "src/lib/bank/qualityCutoffs.json"), "w"), indent=1)

if secs is not None:
    # Speed: a person's median time per statement. The cut-off flags the fastest 1% of real people in the training split.
    cut["median_seconds_min"] = r3(np.percentile(np.median(secs[tr], axis=1), 1))
    med = np.median(secs[te], axis=1)
    out["quality"]["response_time"] = {"median_seconds_per_statement": r3(np.median(med)), "p05": r3(np.percentile(med, 5)), "cutoff_seconds": cut["median_seconds_min"], "share_under_cutoff": r3((med < cut["median_seconds_min"]).mean())}
    out["quality"]["real_people_flagged"]["now_with_speed_check"] = r3((a_real | (med < cut["median_seconds_min"])).mean())
    out["quality"]["cutoffs"] = cut
    json.dump(cut, open(os.path.join(ROOT, "src/lib/bank/qualityCutoffs.json"), "w"), indent=1)

# ---------------------------------------------------------------- age bands (cross-sectional check for the forecast)
if "--age-file" in sys.argv:  # the 2018 file has no age column; the 2012 BIG5 file does
    X, age, _ = load(sys.argv[sys.argv.index("--age-file") + 1])
    tr, _ = split(len(age), age)
    out["age_bands_source"] = "openpsychometrics.org BIG5 (2012) responses, which record age"
if age is not None:
    full_adult = {t: (X[t][tr].mean(1).mean(), X[t][tr].mean(1).std()) for t in TRAITS}
    out["age_bands"] = {
        f"{lo}-{hi}": {t: r3((X[t][(age >= lo) & (age <= hi)].mean(1).mean() - full_adult[t][0]) / full_adult[t][1]) for t in TRAITS} | {"n": int(((age >= lo) & (age <= hi)).sum()), "mid": (lo + min(hi, 65)) / 2}
        for lo, hi in [(18, 24), (25, 34), (35, 49), (50, 90)]
    }

for path in ("src/lib/bank/metrics.json", "research/metrics_suite.json"):
    json.dump(out, open(os.path.join(ROOT, path), "w"), indent=1)
if EXPORT:
    # A sample of held-out answers for scripts/metrics/ts_checks.ts, with this script's own scores for the first 200 people so
    # the TypeScript implementation can be checked against the Python one.
    sub = {k: v[:200] for k, v in s_real.items()}
    K200 = keyed_dict(real[:200])
    json.dump(
        {
            "order": [f"{t}{i + 1}" for t, i in ORDER],
            "answers": real[:3000].tolist(),
            "norms": {t: {"mean": float(norm_full[t][0]), "sd": float(norm_full[t][1]), "alpha": alpha_tr[t]} for t in TRAITS},
            "python": {"theta": {t: eap(K200[t], PARAMS[t])[0].tolist() for t in TRAITS}, "se": {t: eap(K200[t], PARAMS[t])[1].tolist() for t in TRAITS}, "lz": sub["lz"].tolist(), "gap": sub["gap"].tolist(), "coherence": sub["coherence"].tolist()},
        },
        open(EXPORT, "w"),
    )
print("written; real flagged", out["quality"]["real_people_flagged"])
