"""Item-level parameters for simulating realistic respondents, fitted on the open openpsychometrics BIG5 data.

For each IPIP item (after reverse-keying): a standardised loading on its trait and the four thresholds that
reproduce the observed answer proportions (a normal-ogive graded model, the usual way to simulate Likert items).
Also the correlation matrix between the five trait scores. Used by tests/simulate.test.ts.

Usage: python3 scripts/fit_item_params.py <responses.tsv>
(the 2012 BIG5 file, adults only, or the 2018 IPIP-FFM release converted with scripts/metrics/to_big5_format.py, which
has no age column and so is used whole; use the same file as scripts/fit_ipip.py so simulated people sit on the norms)
Writes src/lib/ipipItemParams.json.
"""
import csv, json, math, statistics as st, sys
from statistics import NormalDist

PATH = sys.argv[1]
REV = {"E": [2, 4, 6, 8, 10], "N": [2, 4], "A": [1, 3, 5, 7], "C": [2, 4, 6, 8], "O": [2, 4, 6]}
T = "OCEAN"
rows = []
with open(PATH, newline="", encoding="utf-8-sig") as f:
    for r in csv.DictReader(f, delimiter="\t"):
        try:
            age = int(r["age"]) if "age" in r else None
            items = {t: [int(r[f"{t}{i}"]) for i in range(1, 11)] for t in T}
        except (ValueError, KeyError):
            continue
        HAS_AGE = age is not None
        if (HAS_AGE and (age < 18 or age > 90)) or any(0 in v for v in items.values()):
            continue
        rows.append({t: [6 - x if (i + 1) in REV[t] else x for i, x in enumerate(v)] for t, v in items.items()})

def corr(a, b):
    ma, mb = st.fmean(a), st.fmean(b)
    num = sum((x - ma) * (y - mb) for x, y in zip(a, b))
    return num / math.sqrt(sum((x - ma) ** 2 for x in a) * sum((y - mb) ** 2 for y in b))

nd = NormalDist()
scores = {t: [sum(r[t]) / 10 for r in rows] for t in T}
items = {}
for t in T:
    mat = [r[t] for r in rows]
    k = 10
    tot = [sum(m) for m in mat]
    iv = sum(st.pvariance([m[i] for m in mat]) for i in range(k))
    alpha = k / (k - 1) * (1 - iv / st.pvariance(tot))
    for i in range(k):
        col = [m[i] for m in mat]
        rest = [s - c for s, c in zip(tot, col)]
        r_it = corr(col, rest)  # corrected item-total correlation
        # loading on the latent trait: r(item, rest) / sqrt(reliability of the rest-score), capped
        lam = min(0.9, r_it / math.sqrt(alpha))
        n = len(col)
        cum = [sum(1 for x in col if x <= c) / n for c in (1, 2, 3, 4)]
        thr = [nd.inv_cdf(min(max(p, 1e-4), 1 - 1e-4)) for p in cum]
        items[f"{t}{i + 1}"] = {"lambda": round(lam, 3), "thresholds": [round(x, 3) for x in thr]}
R = {a: {b: round(corr(scores[a], scores[b]), 3) for b in T} for a in T}
SOURCE = "openpsychometrics.org BIG5 (adults 18-90)" if HAS_AGE else "openpsychometrics.org IPIP-FFM (2018), 100,000-row sample, one record per IP address, all ages"
out = {"source": f"{SOURCE}, graded normal-ogive approximation", "n": len(rows), "items": items, "traitCorr": R}
json.dump(out, open("src/lib/ipipItemParams.json", "w"), indent=1)
print(len(rows), {k: v for k, v in list(items.items())[:3]}, R["E"])
