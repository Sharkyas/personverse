"""Fit a graded response model (Samejima) to each Big Five scale of the 50-item IPIP test, by marginal maximum likelihood (EM),
on the training split of an open openpsychometrics response file. Also picks the item pairs used by the consistency check.

Usage: python3 scripts/metrics/fit_irt.py data/ipip_ffm_sample100k.tsv.gz [max_rows]
       (either openpsychometrics release works: the 2018 IPIP-FFM file or sample, .gz or not, or the 2012 BIG5 file from the data-ipip branch)
Writes src/lib/bank/ipip50Irt.json. Needs numpy and scipy."""
import json, os, sys
import numpy as np
from scipy.optimize import minimize
from common import TRAITS, REV, NODES, PRIOR, load, split, grm_probs, eap

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
X, age, _ = load(sys.argv[1], limit=int(sys.argv[2]) if len(sys.argv) > 2 else None)
n = len(next(iter(X.values())))
tr, te = split(n, age)


def unpack(v):
    return float(np.exp(v[0])), np.cumsum([v[1], *np.exp(v[2:])])


def fit_scale(R, iters=200, tol=5e-4):
    J = R.shape[1]
    # start: moderate slope, thresholds from the answer shares
    params = []
    for j in range(J):
        cum = np.clip(np.cumsum(np.bincount(R[:, j], minlength=6)[1:5]) / len(R), 0.01, 0.99)
        b = np.log(cum / (1 - cum)) / 1.2
        b = np.maximum.accumulate(b + np.arange(4) * 1e-3)
        params.append(np.array([np.log(1.2), b[0], *np.log(np.maximum(np.diff(b), 0.05))]))
    onehot = [np.eye(5)[R[:, j] - 1] for j in range(J)]  # n×5
    for it in range(iters):
        L = np.zeros((len(R), len(NODES)))
        for j in range(J):
            a, b = unpack(params[j])
            L += np.log(grm_probs(a, b))[:, R[:, j] - 1].T
        L -= L.max(axis=1, keepdims=True)
        post = np.exp(L) * PRIOR
        post /= post.sum(axis=1, keepdims=True)
        delta = 0.0
        for j in range(J):
            counts = post.T @ onehot[j]  # Q×5 expected counts

            def nll(v):
                a, b = unpack(v)
                return -(counts * np.log(grm_probs(a, b))).sum()

            new = minimize(nll, params[j], method="L-BFGS-B").x
            delta = max(delta, float(np.abs(new - params[j]).max()))
            params[j] = new
        if delta < tol:
            break
    return [unpack(p) for p in params], it + 1


out = {
    "model": "graded response model, one factor per trait, standard normal ability; items are keyed so that a high answer is the high end of the trait",
    "source": f"openpsychometrics.org IPIP Big Five Factor Markers responses; training split ({len(tr):,} people" + (", adults 18+" if age is not None else "") + "), same split and seed as scripts/fit_ipip.py",
    "n_train": int(len(tr)),
    "n_test": int(len(te)),
    "traits": {},
}
for t in TRAITS:
    params, its = fit_scale(X[t][tr])
    m, se = eap(X[t][te], params)
    out["traits"][t] = {
        "marginal_reliability_test": round(float(1 - (se**2).mean()), 3),
        "em_iterations": its,
        "items": {f"{t}{j + 1}": {"a": round(a, 3), "b": [round(float(x), 3) for x in b], "reverse": (j + 1) in REV[t]} for j, (a, b) in enumerate(params)},
    }
    print(t, "iters", its, "rel", out["traits"][t]["marginal_reliability_test"], "a", [round(a, 2) for a, _ in params])

# Consistency pairs: within each trait, the pairs of statements that people answer most alike (after keying). Two per trait, no item reused.
pairs = []
for t in TRAITS:
    C = np.corrcoef(X[t][tr].T)
    cand = sorted(((C[i, j], i, j) for i in range(10) for j in range(i + 1, 10)), reverse=True)
    used = set()
    for r, i, j in cand:
        if i in used or j in used:
            continue
        pairs.append({"a": f"{t}{i + 1}", "b": f"{t}{j + 1}", "r": round(float(r), 3)})
        used |= {i, j}
        if len(used) >= 6:
            break
out["consistency_pairs"] = pairs
# Average keyed answer to each statement: the "usual" profile a person's answers are compared with in the coherence check.
out["item_means"] = {f"{t}{j + 1}": round(float(X[t][tr][:, j].mean()), 3) for t in TRAITS for j in range(10)}
json.dump(out, open(os.path.join(ROOT, "src/lib/bank/ipip50Irt.json"), "w"), indent=1)
print(len(pairs), "pairs, r from", min(p["r"] for p in pairs), "to", max(p["r"] for p in pairs))
