"""Fit norms and reliability for the 50-item IPIP Big Five markers on the open openpsychometrics.org dataset,
and check on held-out people that the app's probability statements are calibrated.

Usage: python3 scripts/fit_ipip.py data/ipip-big5.csv
(The CSV is on the repo's data-ipip branch: git show origin/data-ipip:data/ipip-big5.csv > data/ipip-big5.csv)
Writes src/lib/ipipNorms.json (used by the app), and research/ipip_metrics.json plus a copy in src/lib/ipipMetrics.json (shown in the app)."""
import csv, json, math, random, sys, statistics as st

PATH = sys.argv[1]
REV = {"E": [2, 4, 6, 8, 10], "N": [2, 4], "A": [1, 3, 5, 7], "C": [2, 4, 6, 8], "O": [2, 4, 6]}
TRAITS = "OCEAN"
APP = {"O": "O", "C": "C", "E": "E", "A": "A", "N": "N"}

rows = []
with open(PATH, newline="", encoding="utf-8-sig") as f:
    for r in csv.DictReader(f, delimiter="\t"):
        try:
            age = int(r["age"])
            items = {t: [int(r[f"{t}{i}"]) for i in range(1, 11)] for t in TRAITS}
        except (ValueError, KeyError):
            continue
        if not 13 <= age <= 90 or any(0 in v for v in items.values()):
            continue
        keyed = {t: [6 - x if (i + 1) in REV[t] else x for i, x in enumerate(v)] for t, v in items.items()}
        rows.append({"age": age, "items": keyed})

random.seed(20261114)
random.shuffle(rows)
cut = int(len(rows) * 0.7)
train, test = rows[:cut], rows[cut:]
adult = lambda rs: [r for r in rs if r["age"] >= 18]

def alpha(mat):
    k = len(mat[0])
    item_var = sum(st.pvariance([m[i] for m in mat]) for i in range(k))
    return k / (k - 1) * (1 - item_var / st.pvariance([sum(m) for m in mat]))

def mean_score(r, t, idx=None):
    v = r["items"][t] if idx is None else [r["items"][t][i] for i in idx]
    return sum(v) / len(v)

def auc(scores, labels):
    pos = [s for s, l in zip(scores, labels) if l]
    neg = [s for s, l in zip(scores, labels) if not l]
    allv = sorted((s, l) for s, l in zip(scores, labels))
    # rank-sum with ties averaged
    ranks, i = {}, 0
    vals = [s for s, _ in allv]
    while i < len(vals):
        j = i
        while j + 1 < len(vals) and vals[j + 1] == vals[i]:
            j += 1
        for k in range(i, j + 1):
            ranks.setdefault(vals[k], (i + j) / 2 + 1)
        i = j + 1
    rs = sum(ranks[s] for s in pos)
    return (rs - len(pos) * (len(pos) + 1) / 2) / (len(pos) * len(neg))

phi = lambda x: 0.5 * (1 + math.erf(x / math.sqrt(2)))

norms, metrics = {}, {"n_total": len(rows), "n_train": len(train), "n_test": len(test), "traits": {}}
ODD, EVEN = [0, 2, 4, 6, 8], [1, 3, 5, 7, 9]
for t in TRAITS:
    tr = adult(train)
    sc = [mean_score(r, t) for r in tr]
    mu, sd = st.mean(sc), st.pstdev(sc)
    a_train = alpha([r["items"][t] for r in tr])
    norms[APP[t]] = {"mean": round(mu, 4), "sd": round(sd, 4), "alpha": round(a_train, 4)}

    # Held-out checks on adults in the test split.
    te = adult(test)
    a_test = alpha([r["items"][t] for r in te])
    # Probability engine check: from one half of the scale, predict whether the other half lands above the median.
    # Same maths the app uses for MBTI letters and tracker bands: P = Φ(ρ·z / √(1−ρ²)), ρ fitted on the training split.
    def halves(rs):
        x = [mean_score(r, t, ODD) for r in rs]
        y = [mean_score(r, t, EVEN) for r in rs]
        return x, y
    xtr, ytr = halves(tr)
    mx, sx, my, sy = st.mean(xtr), st.pstdev(xtr), st.mean(ytr), st.pstdev(ytr)
    rho = st.correlation(xtr, ytr)
    med = st.median(ytr)
    zc = (med - my) / sy
    xte, yte = halves(te)
    probs = [phi((rho * (x - mx) / sx - zc) / math.sqrt(1 - rho * rho)) for x in xte]
    labels = [y > med for y in yte]
    brier = st.mean([(p - l) ** 2 for p, l in zip(probs, labels)])
    bins = [[] for _ in range(10)]
    for p, l in zip(probs, labels):
        bins[min(9, int(p * 10))].append((p, l))
    ece = sum(len(b) / len(probs) * abs(st.mean([p for p, _ in b]) - st.mean([l for _, l in b])) for b in bins if b)
    confident = [(p, l) for p, l in zip(probs, labels) if p >= 0.8 or p <= 0.2]
    acc_conf = st.mean([(p >= 0.5) == l for p, l in confident]) if confident else None
    metrics["traits"][APP[t]] = {
        "alpha_train": round(a_train, 3),
        "alpha_test": round(a_test, 3),
        "half_scale_r": round(rho, 3),
        "auc": round(auc(probs, labels), 3),
        "brier": round(brier, 3),
        "ece": round(ece, 3),
        "share_confident": round(len(confident) / len(probs), 3),
        "accuracy_when_confident": round(acc_conf, 3) if acc_conf is not None else None,
        "calibration": [{"bin": i / 10, "n": len(b), "predicted": round(st.mean([p for p, _ in b]), 3), "observed": round(st.mean([l for _, l in b]), 3)} for i, b in enumerate(bins) if len(b) >= 30],
    }

# Age bands, for interest (the app scores everyone on the adult scale so maturation shows up as change).
bands = [(13, 17), (18, 24), (25, 34), (35, 49), (50, 90)]
metrics["age_bands"] = {
    f"{lo}-{hi}": {APP[t]: round((st.mean([mean_score(r, t) for r in rows if lo <= r["age"] <= hi]) - norms[APP[t]]["mean"]) / norms[APP[t]]["sd"], 3) for t in TRAITS}
    | {"n": sum(1 for r in rows if lo <= r["age"] <= hi)}
    for lo, hi in bands
}
metrics["source"] = "openpsychometrics.org IPIP Big Five Factor Markers dataset (BIG5, 2012, public domain); adults 18+ for norms; 70/30 random split, seed 20261114"

json.dump({"source": metrics["source"], "n": len(adult(train)), "traits": norms}, open("src/lib/ipipNorms.json", "w"), indent=1)
json.dump(metrics, open("research/ipip_metrics.json", "w"), indent=1)
json.dump(metrics, open("src/lib/ipipMetrics.json", "w"), indent=1)
for t in "OCEAN":
    m = metrics["traits"][t]
    print(t, norms[t], {k: m[k] for k in ["alpha_test", "half_scale_r", "auc", "brier", "ece", "share_confident", "accuracy_when_confident"]})
print("n", len(rows), "train", len(train), "test", len(test))
print(json.dumps(metrics["age_bands"]))
