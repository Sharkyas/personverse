"""Shared helpers for the metrics scripts: load an open IPIP-50 response file, split it the same way as scripts/fit_ipip.py,
and score it with the graded response model. numpy only (fit_irt.py also needs scipy)."""
import csv, gzip, math, random
import numpy as np

TRAITS = "OCEAN"
# Reverse-keyed item numbers of the 50-item IPIP Big Five markers (same as scripts/fit_ipip.py and src/lib/questions.ts).
REV = {"E": [2, 4, 6, 8, 10], "N": [2, 4], "A": [1, 3, 5, 7], "C": [2, 4, 6, 8], "O": [2, 4, 6]}
# Column prefixes in the two openpsychometrics releases: BIG5 (2012) and IPIP-FFM-data-8Nov2018.
PREFIX_2018 = {"E": "EXT", "N": "EST", "A": "AGR", "C": "CSN", "O": "OPN"}
SEED = 20261114
NODES = np.linspace(-4, 4, 81)
PRIOR = np.exp(-0.5 * NODES**2)
PRIOR /= PRIOR.sum()


def load(path, limit=None):
    """Rows with all 50 answers, reverse-keyed so 5 is always the high end of the trait.
    Returns (X, age, secs): X is {trait: int array n×10}; age is None for the 2018 file (it has no age); secs is the
    per-item response time in seconds (n×50, in the app's asking order, 2018 file only). Reads .gz directly."""
    X = {t: [] for t in TRAITS}
    ages, secs = [], []
    opener = gzip.open if str(path).endswith(".gz") else open
    with opener(path, "rt", newline="", encoding="utf-8-sig") as f:
        rd = csv.DictReader(f, delimiter="\t")
        new = "EXT1" in rd.fieldnames
        for r in rd:
            if new and r.get("IPC") not in (None, "1"):
                continue  # more than one record from this IP address: openpsychometrics recommends keeping IPC = 1 only
            try:
                items = {t: [int(float(r[f"{PREFIX_2018[t] if new else t}{i}"])) for i in range(1, 11)] for t in TRAITS}
                age = None if new else int(r["age"])
            except (ValueError, KeyError, TypeError):
                continue
            if any(x < 1 or x > 5 for v in items.values() for x in v):
                continue
            if age is not None and not 13 <= age <= 90:
                continue
            if new:
                try:
                    secs.append([float(r[f"{PREFIX_2018[t]}{i}_E"]) / 1000 for i in range(1, 11) for t in "ENACO"])
                except (ValueError, KeyError, TypeError):
                    continue
            for t in TRAITS:
                X[t].append([6 - x if (i + 1) in REV[t] else x for i, x in enumerate(items[t])])
            ages.append(age)
            if limit and len(ages) >= limit:
                break
    return {t: np.array(v, dtype=np.int8) for t, v in X.items()}, (None if new else np.array(ages)), (np.array(secs) if new else None)


def split(n, age):
    """The 70/30 split of scripts/fit_ipip.py (same seed and shuffle), as index arrays; norms and fits use adults (18+) only."""
    idx = list(range(n))
    random.seed(SEED)
    random.shuffle(idx)
    cut = int(n * 0.7)
    tr, te = np.array(idx[:cut]), np.array(idx[cut:])
    if age is not None:
        tr, te = tr[age[tr] >= 18], te[age[te] >= 18]
    return tr, te


# ---------- graded response model ----------
def grm_probs(a, b, theta=NODES):
    """P(answer = k | theta) for k = 1..5: array len(theta)×5. a = discrimination, b = four ordered thresholds."""
    star = 1 / (1 + np.exp(-a * (theta[:, None] - np.asarray(b)[None, :])))
    upper = np.concatenate([np.ones((len(theta), 1)), star], axis=1)
    lower = np.concatenate([star, np.zeros((len(theta), 1))], axis=1)
    return np.clip(upper - lower, 1e-9, 1)


def loglik_grid(resp, params, mask=None):
    """Log-likelihood of each person's answers at every node: n×Q. resp n×J in 1..5; params list of (a, b); mask n×J bool = item used."""
    L = np.zeros((resp.shape[0], len(NODES)))
    for j, (a, b) in enumerate(params):
        lp = np.log(grm_probs(a, b))  # Q×5
        term = lp[:, resp[:, j] - 1].T  # n×Q
        L += term if mask is None else term * mask[:, j][:, None]
    return L


def posterior(resp, params, mask=None, prior=PRIOR):
    L = loglik_grid(resp, params, mask)
    L -= L.max(axis=1, keepdims=True)
    P = np.exp(L) * prior[None, :]
    return P / P.sum(axis=1, keepdims=True)


def eap(resp, params, mask=None):
    """Posterior mean and SD of theta for each person."""
    P = posterior(resp, params, mask)
    m = P @ NODES
    return m, np.sqrt(np.maximum(P @ NODES**2 - m**2, 1e-9))


def item_info(a, b, theta):
    """Fisher information of a graded item at theta (array)."""
    theta = np.atleast_1d(theta).astype(float)
    star = 1 / (1 + np.exp(-a * (theta[:, None] - np.asarray(b)[None, :])))
    cum = np.concatenate([np.ones((len(theta), 1)), star, np.zeros((len(theta), 1))], axis=1)
    d = a * cum * (1 - cum)
    p = np.clip(cum[:, :-1] - cum[:, 1:], 1e-9, 1)
    return ((d[:, :-1] - d[:, 1:]) ** 2 / p).sum(axis=1)


def auc(scores, labels):
    scores, labels = np.asarray(scores, float), np.asarray(labels, bool)
    order = np.argsort(scores, kind="mergesort")
    ranks = np.empty(len(scores))
    s = scores[order]
    i = 0
    while i < len(s):
        j = i
        while j + 1 < len(s) and s[j + 1] == s[i]:
            j += 1
        ranks[order[i : j + 1]] = (i + j) / 2 + 1
        i = j + 1
    npos, nneg = labels.sum(), (~labels).sum()
    return float((ranks[labels].sum() - npos * (npos + 1) / 2) / (npos * nneg))


def calibration(p, y, bins=10, min_n=30):
    """Brier score, expected calibration error and the reliability curve."""
    p, y = np.asarray(p, float), np.asarray(y, float)
    b = np.minimum(bins - 1, (p * bins).astype(int))
    curve, ece = [], 0.0
    for k in range(bins):
        m = b == k
        if not m.any():
            continue
        ece += m.mean() * abs(p[m].mean() - y[m].mean())
        if m.sum() >= min_n:
            curve.append({"bin": k / bins, "n": int(m.sum()), "predicted": round(float(p[m].mean()), 3), "observed": round(float(y[m].mean()), 3)})
    return float(((p - y) ** 2).mean()), float(ece), curve


def phi(x):
    return 0.5 * (1 + np.vectorize(math.erf)(np.asarray(x, float) / math.sqrt(2)))
