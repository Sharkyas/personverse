"""Write the usable rows of the 2018 IPIP-FFM file (or the 100,000-row sample of it) in the column layout of the 2012 BIG5
file, so the older fitting scripts can read it: scripts/fit_ipip.py, scripts/fit_item_params.py and
scripts/sim/fit_item_model.ts.

Usage: python3 scripts/metrics/to_big5_format.py <IPIP-FFM file, .gz or not> <out.tsv>

Rows and their order are exactly those of common.load (IPC = 1, all 50 answers present, response times readable), so
the 70/30 split of fit_ipip.py picks the same held-out people as the metrics suite. Answers are written as given
(not reverse-keyed). There is no age column, because the 2018 file does not record age."""
import sys
from common import load, REV

SRC, OUT = sys.argv[1], sys.argv[2]
X, age, _ = load(SRC)
if age is not None:
    sys.exit("This file already has the BIG5 layout; use it directly.")
ORDER = "ENACO"
n = len(X["O"])
with open(OUT, "w", encoding="utf-8") as f:
    f.write("\t".join(f"{t}{i}" for t in ORDER for i in range(1, 11)) + "\n")
    for r in range(n):
        f.write("\t".join(str(6 - int(X[t][r][i]) if (i + 1) in REV[t] else int(X[t][r][i])) for t in ORDER for i in range(10)) + "\n")
print(n, "rows written to", OUT)
