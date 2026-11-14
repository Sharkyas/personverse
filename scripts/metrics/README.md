# Metrics scripts

Three steps, run from the repository root. Python needs numpy and scipy.

```
python3 scripts/metrics/fit_irt.py <responses>            # → src/lib/bank/ipip50Irt.json
python3 scripts/metrics/metrics_suite.py <responses> --age-file <BIG5 file> --export-test /tmp/test_sample.json
                                                          # → src/lib/bank/metrics.json, qualityCutoffs.json, research/metrics_suite.json
node scripts/run-ts.cjs scripts/metrics/ts_checks.ts /tmp/test_sample.json
                                                          # adds parity, adaptive, forecast_check and latency to metrics.json
```

`<responses>` is either openpsychometrics release of the 50-statement IPIP test, tab-separated, gzipped or not:

- the 2018 IPIP-FFM file or the 100,000-row sample of it (columns `EXT1`…`OPN10`, response times, no age; only rows with `IPC` = 1 are used);
- the 2012 BIG5 file (columns `E1`…`O10`, with age), which is on the `data-ipip` branch: `git show origin/data-ipip:data/ipip-big5.csv > data/ipip-big5.csv`.

`--age-file` is only needed when the main file has no age column. Splits are 70/30 with seed 20261114, the same as `scripts/fit_ipip.py`.

`scripts/bank/build_neo120.py` rebuilds `src/lib/bank/ipipNeo120.json` from the two open packages named in its header.

What each number means and its caveats: `research/items_metrics.md`.
